import React, { useRef, useEffect, useCallback } from 'react';
import { 
  Character, 
  Bullet, 
  BloodParticle, 
  BloodDecal, 
  ShellCasing, 
  RagdollPiece, 
  FloatingText, 
  GroundPickup,
  GameStats,
  WeaponType,
  Weapon,
  GoreSetting,
  BloodAmount,
  GameMode,
  STORY_CHAPTERS
} from '../types/game';
import { createWeaponInstance } from '../utils/weapons';
import { drawGrunt, drawRagdollPiece, spriteManager } from '../utils/sprites';
import { drawChapterEnvironment } from '../utils/environments';
import { soundManager } from '../audio/soundManager';
import { inputController } from '../utils/inputController';
import { GruntAvatarId, MultiplayerServer, RemotePlayerState } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';

interface GameCanvasProps {
  gameMode: GameMode;
  currentChapterId: number;
  gameSessionId: number;
  stats: GameStats;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onPlayerDeath: () => void;
  onPlayerHealthUpdate: (current: number, max: number) => void;
  currentWeaponType: WeaponType;
  onWeaponChange: (weapon: Weapon) => void;
  unlockedWeapons: WeaponType[];
  onUnlockWeapon: (type: WeaponType) => void;
  slowMoActive: boolean;
  onToggleSlowMo: () => void;
  isPaused: boolean;
  goreSetting: GoreSetting;
  bloodAmount: BloodAmount;
  onChapterComplete: () => void;
  playerAvatar?: GruntAvatarId;
  playerName?: string;
  multiplayerServer?: MultiplayerServer | null;
}

const PLAYER_MAX_HEALTH = 250; // Protagonist has 250 HP so they can survive high-action combat

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  currentChapterId,
  gameSessionId,
  stats,
  onUpdateStats,
  onPlayerDeath,
  onPlayerHealthUpdate,
  currentWeaponType,
  onWeaponChange,
  unlockedWeapons,
  onUnlockWeapon,
  slowMoActive,
  onToggleSlowMo,
  isPaused,
  goreSetting,
  bloodAmount,
  onChapterComplete,
  playerAvatar = 'ninja_grunt',
  playerName = 'Hank Wimbleton',
  multiplayerServer = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State
  const playerRef = useRef<Character>({
    id: 'player',
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 20,
    angle: 0,
    facingDirection: 1,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    isPlayer: true,
    walkTimer: 0,
    isMoving: false,
    attackTimer: 0,
    isAttacking: false,
    attackProgress: 0,
    attackHand: 'right',
    hurtTimer: 0,
    isDodging: false,
    dodgeTimer: 0,
    isDead: false,
    weapon: createWeaponInstance(currentWeaponType),
    recoilOffset: 0,
    muzzleFlashTimer: 0,
    bloodStains: [],
    avatarId: playerAvatar,
    playerName: playerName || 'Hank Wimbleton',
  });

  const remotePlayersRef = useRef<Map<string, Character>>(new Map());
  const syncTimerRef = useRef<number>(0);

  const enemiesRef = useRef<Character[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bloodDecalsRef = useRef<BloodDecal[]>([]);
  const bloodParticlesRef = useRef<BloodParticle[]>([]);
  const casingsRef = useRef<ShellCasing[]>([]);
  const ragdollsRef = useRef<RagdollPiece[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const pickupsRef = useRef<GroundPickup[]>([]);
  const floorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Story Mode Tracking
  const storyKillsRef = useRef<number>(0);
  const storySpawnedRef = useRef<number>(0);
  const chapterCompletedRef = useRef<boolean>(false);

  // Input & Visual State
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 500, y: 300 });
  const isMouseDownRef = useRef<boolean>(false);
  const screenShakeRef = useRef<number>(0);
  const isTouchModeRef = useRef<boolean>(false);

  // Timers
  const waveSpawningRef = useRef<boolean>(false);
  const lastAttackTimeRef = useRef<number>(0);

  // Floating text
  const addFloatingText = (text: string, x: number, y: number, color: string = '#f87171', fontSize: number = 16) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      fontSize,
      alpha: 1,
      vy: -1.8,
    });
  };

  // Sync weapon
  useEffect(() => {
    if (playerRef.current && playerRef.current.weapon.type !== currentWeaponType) {
      playerRef.current.weapon = createWeaponInstance(currentWeaponType);
    }
  }, [currentWeaponType]);

  // RESET GAME WHEN gameSessionId, chapter, or gameMode CHANGES
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasWidth = canvas ? canvas.width : 1000;
    const canvasHeight = canvas ? canvas.height : 600;
    const centerX = canvasWidth / 2;
    const hasSky = gameMode === 'story' && (currentChapterId === 1 || currentChapterId === 2);
    const startY = hasSky ? Math.round(canvasHeight * 0.65) : canvasHeight / 2;

    const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
    const initialWeaponType = gameMode === 'story' ? chapter.startingWeapon : currentWeaponType;

    // Reset player completely
    playerRef.current = {
      id: 'player',
      x: centerX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: 20,
      angle: 0,
      facingDirection: 1,
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      isPlayer: true,
      walkTimer: 0,
      isMoving: false,
      attackTimer: 0,
      isAttacking: false,
      attackProgress: 0,
      attackHand: 'right',
      hurtTimer: 0,
      isDodging: false,
      dodgeTimer: 0,
      isDead: false,
      weapon: createWeaponInstance(initialWeaponType),
      recoilOffset: 0,
      muzzleFlashTimer: 0,
      bloodStains: [],
      avatarId: playerAvatar,
      playerName: playerName || 'Hank Wimbleton',
    };

    onPlayerHealthUpdate(PLAYER_MAX_HEALTH, PLAYER_MAX_HEALTH);

    // Clear all game entities
    enemiesRef.current = [];
    bulletsRef.current = [];
    bloodDecalsRef.current = [];
    bloodParticlesRef.current = [];
    casingsRef.current = [];
    ragdollsRef.current = [];
    floatingTextsRef.current = [];
    pickupsRef.current = [];
    waveSpawningRef.current = false;
    screenShakeRef.current = 0;

    storyKillsRef.current = 0;
    storySpawnedRef.current = 0;
    chapterCompletedRef.current = false;

    // Clear floor blood canvas
    if (floorCanvasRef.current) {
      const fctx = floorCanvasRef.current.getContext('2d');
      if (fctx) {
        fctx.clearRect(0, 0, floorCanvasRef.current.width, floorCanvasRef.current.height);
      }
    }

    inputController.resetAll();

    // Spawn initial enemies after short buffer
    const spawnTimer = setTimeout(() => {
      if (canvas) {
        if (gameMode === 'story') {
          addFloatingText(`CHAPTER ${chapter.id}: ${chapter.title.toUpperCase()}`, canvas.width / 2, 75, '#ef4444', 26);
          if (chapter.id === 1) {
            addFloatingText('OBJECTIVE: DEFEAT ALL 30 GRUNTS', canvas.width / 2, 108, '#fbbf24', 16);
          }
          onUpdateStats((prev) => ({
            ...prev,
            storyProgress: {
              chapterId: currentChapterId,
              gruntsKilled: 0,
              gruntsTotal: chapter.totalGrunts,
            },
          }));
          spawnNextStoryEnemy(canvas.width, canvas.height);
        } else {
          spawnEnemyWave(1, canvas.width, canvas.height);
        }
      }
    }, 400);

    return () => clearTimeout(spawnTimer);
  }, [gameSessionId, currentChapterId, gameMode]);

  // Clear floor canvas if goreSetting changed to no_blood
  useEffect(() => {
    if (goreSetting === 'no_blood' && floorCanvasRef.current) {
      const fctx = floorCanvasRef.current.getContext('2d');
      if (fctx) {
        fctx.clearRect(0, 0, floorCanvasRef.current.width, floorCanvasRef.current.height);
      }
    }
  }, [goreSetting]);

  // Add blood stains to clothing and floor
  const addBloodToCharacter = useCallback((char: Character, isHeavy: boolean = false) => {
    if (goreSetting === 'no_blood') return;

    // Respect blood amount setting: 'very_little', 'not_much', 'too_much'
    const maxStains = bloodAmount === 'very_little' ? 3 : bloodAmount === 'not_much' ? 6 : 14;
    if (char.bloodStains.length >= maxStains) return;

    const stainCount = bloodAmount === 'very_little' ? 1 : (isHeavy ? 2 : 1);
    for (let i = 0; i < stainCount; i++) {
      if (char.bloodStains.length >= maxStains) break;
      const isTorso = Math.random() > 0.35;
      const radius = isHeavy 
        ? (bloodAmount === 'very_little' ? 3 : 5 + Math.random() * 4) 
        : (bloodAmount === 'very_little' ? 2 : 3 + Math.random() * 3);
      const color = Math.random() > 0.4 ? '#881337' : '#991b1b';

      if (isTorso) {
        char.bloodStains.push({
          dx: (Math.random() - 0.5) * 20,
          dy: (Math.random() - 0.5) * 26,
          radius,
          color,
          part: 'torso',
        });
      } else {
        char.bloodStains.push({
          dx: (Math.random() - 0.5) * 16,
          dy: (Math.random() - 0.5) * 20,
          radius: radius * 0.75,
          color,
          part: 'head',
        });
      }
    }

    // In Extreme Gore mode, dynamically change character heads to show the photo gore!
    if (goreSetting === 'extreme_gore') {
      const goreHeads = ['goreHead1', 'goreHead2', 'goreHead3', 'goreHead4', 'goreHead5'];
      
      // Assign or upgrade head to one of the 5 gruesome reference heads from the photos
      if (!char.goreHeadSprite) {
        char.goreHeadSprite = goreHeads[Math.floor(Math.random() * goreHeads.length)];
      } else if (isHeavy && Math.random() < 0.55) {
        // Heavy hits (shotgun/knife/crit) upgrade head to blown jaw (goreHead1) or exposed brain (goreHead3)
        char.goreHeadSprite = Math.random() < 0.5 ? 'goreHead1' : 'goreHead3';
      }

      if (!char.isPlayer) {
        if (Math.random() < 0.45 && !char.hasRibWound) {
          char.hasRibWound = true;
        }
        if (Math.random() < 0.45 && !char.hasStabWound) {
          char.hasStabWound = true;
        }
      }
    }
  }, [goreSetting, bloodAmount]);

  // Spawn Blood Splatter on floor and particles (Ultra-fast offscreen canvas)
  const addBloodSplatter = useCallback((x: number, y: number, count: number = 8, spread: number = 1.2) => {
    if (goreSetting === 'no_blood') return;

    // Blood amount multipliers:
    // 'very_little': only 1-2 droplets (just a few drops, zero lag)
    // 'not_much': 2-3 droplets (reduced splatter, smooth 60fps)
    // 'too_much': 6-10 droplets (full carnage)
    const amountMultiplier = bloodAmount === 'very_little' ? 0.25 : bloodAmount === 'not_much' ? 0.45 : 1.2;
    const goreMultiplier = goreSetting === 'extreme_gore' ? 1.3 : 1.0;
    const actualParticleCount = Math.max(1, Math.round(count * amountMultiplier * goreMultiplier));

    // 1. Draw floor decal directly onto offscreen canvas (Fast 1-time drawing, 0 lag per frame!)
    const canvas = canvasRef.current;
    if (canvas) {
      if (!floorCanvasRef.current) {
        floorCanvasRef.current = document.createElement('canvas');
        floorCanvasRef.current.width = canvas.width;
        floorCanvasRef.current.height = canvas.height;
      } else if (floorCanvasRef.current.width !== canvas.width || floorCanvasRef.current.height !== canvas.height) {
        floorCanvasRef.current.width = canvas.width;
        floorCanvasRef.current.height = canvas.height;
      }

      const fctx = floorCanvasRef.current.getContext('2d');
      if (fctx) {
        const bloodColor = goreSetting === 'extreme_gore' ? 'rgba(165, 12, 12, 0.88)' : 'rgba(136, 19, 19, 0.82)';
        fctx.fillStyle = bloodColor;
        fctx.beginPath();

        const baseRadius = bloodAmount === 'very_little' ? 3.5 : bloodAmount === 'not_much' ? 6 : 10;
        fctx.arc(x, y, baseRadius + Math.random() * 2, 0, Math.PI * 2);

        const splatCount = bloodAmount === 'very_little' ? 1 : bloodAmount === 'not_much' ? 2 : 4;
        for (let s = 0; s < splatCount; s++) {
          const sx = x + (Math.random() - 0.5) * (baseRadius * 3);
          const sy = y + (Math.random() - 0.5) * (baseRadius * 3);
          const sr = 1.2 + Math.random() * (bloodAmount === 'too_much' ? 3.5 : 2);
          fctx.moveTo(sx + sr, sy);
          fctx.arc(sx, sy, sr, 0, Math.PI * 2);
        }
        fctx.fill();
      }
    }

    // 2. Flying dynamic blood particles (strictly capped for buttery smooth performance)
    const maxParticles = bloodAmount === 'very_little' ? 20 : bloodAmount === 'not_much' ? 40 : 90;
    if (bloodParticlesRef.current.length < maxParticles) {
      for (let i = 0; i < actualParticleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (2 + Math.random() * 6) * spread;
        bloodParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: bloodAmount === 'very_little' ? 2 : (2.5 + Math.random() * 3),
          alpha: 1,
          color: Math.random() > 0.4 ? '#991b1b' : '#7f1d1d',
        });
      }
    }
  }, [goreSetting, bloodAmount]);

  // Spawn Dismemberment Limbs on Death (Single Torso piece!)
  const spawnDismemberment = useCallback((enemy: Character) => {
    // Select head sprite based on gore setting
    let headKey = 'headFront';
    if (goreSetting === 'extreme_gore') {
      const goreHeads = ['goreHead1', 'goreHead2', 'goreHead3', 'goreHead4', 'goreHead5'];
      headKey = goreHeads[Math.floor(Math.random() * goreHeads.length)];
    }

    // Only ONE single torso limb is spawned!
    const parts: { key: string; w: number; h: number }[] = [
      { key: headKey, w: 32, h: 36 },
      { key: 'torsoRight', w: 28, h: 42 },
      { key: 'footLeft', w: 18, h: 10 },
      { key: 'footRight', w: 18, h: 10 },
      { key: 'handFist', w: 16, h: 14 },
    ];

    parts.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      ragdollsRef.current.push({
        id: Math.random().toString(),
        x: enemy.x + (Math.random() - 0.5) * 16,
        y: enemy.y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed + enemy.vx * 0.4,
        vy: Math.sin(angle) * speed + enemy.vy * 0.4 - 2,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.4,
        spriteKey: p.key,
        width: p.w,
        height: p.h,
        alpha: 1,
        groundY: enemy.y + 20 + Math.random() * 20,
        bounces: 0,
      });
    });

    if (goreSetting !== 'no_blood') {
      soundManager.playBloodSplat();
    }
  }, [goreSetting]);

  // Handle enemy defeat (used by bullets, punches, and slashes)
  const handleEnemyDefeated = useCallback((enemy: Character, enemyIndex: number) => {
    spawnDismemberment(enemy);
    addFloatingText('+100', enemy.x, enemy.y - 45, '#fbbf24', 20);

    // Hank Wimbleton kill heal: reward player with +8 HP on kill!
    const player = playerRef.current;
    if (player.health < player.maxHealth && !player.isDead) {
      player.health = Math.min(player.maxHealth, player.health + 8);
    }

    const canvas = canvasRef.current;
    const canvasHeight = canvas ? canvas.height : 600;
    const hasSky = gameMode === 'story' && (currentChapterId === 1 || currentChapterId === 2);
    const minGroundY = hasSky 
      ? (currentChapterId === 1 ? Math.round(canvasHeight * 0.445) : Math.round(canvasHeight * 0.425)) 
      : 28;
    const dropY = Math.max(minGroundY + 12, enemy.y);

    // Pickups: medkit or ammo
    if (Math.random() < 0.45) {
      pickupsRef.current.push({
        id: Math.random().toString(),
        type: Math.random() < 0.35 ? 'medkit' : 'ammo',
        x: enemy.x,
        y: dropY,
        healthAmount: 40,
        ammoAmount: 24,
        floatTimer: 0,
      });
    }

    // Dropped weapon pickup — strictly ONLY drops in Story Mode! (In normal mode, weapons never drop from enemies)
    if (gameMode === 'story' && enemy.weapon.type !== 'fists') {
      pickupsRef.current.push({
        id: Math.random().toString(),
        type: 'weapon',
        weaponType: enemy.weapon.type,
        x: enemy.x + (Math.random() - 0.5) * 16,
        y: dropY,
        floatTimer: 0,
      });
    }

    if (gameMode === 'story') {
      storyKillsRef.current++;
      const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
      const killsSoFar = storyKillsRef.current;
      
      onUpdateStats((prev) => {
        const newCombo = prev.comboStreak + 1;
        return {
          ...prev,
          kills: prev.kills + 1,
          score: prev.score + 100 * newCombo,
          comboStreak: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          storyProgress: {
            chapterId: currentChapterId,
            gruntsKilled: killsSoFar,
            gruntsTotal: chapter.totalGrunts,
          },
        };
      });

      if (killsSoFar >= chapter.totalGrunts && !chapterCompletedRef.current) {
        chapterCompletedRef.current = true;
        soundManager.playIntroHit();
        addFloatingText('CHAPTER COMPLETE!', canvasRef.current ? canvasRef.current.width / 2 : 400, 90, '#10b981', 32);
        setTimeout(() => {
          onChapterComplete();
        }, 1400);
      }
    } else {
      onUpdateStats((prev) => {
        const newCombo = prev.comboStreak + 1;
        return {
          ...prev,
          kills: prev.kills + 1,
          score: prev.score + 100 * newCombo,
          comboStreak: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      });
    }

    enemiesRef.current.splice(enemyIndex, 1);
  }, [currentChapterId, gameMode, onChapterComplete, onUpdateStats, spawnDismemberment]);

  // Real-time Multiplayer Subscriptions (Only active when in a multiplayer match)
  useEffect(() => {
    if (!multiplayerServer) {
      remotePlayersRef.current.clear();
      return;
    }

    const unregUpdate = multiplayerService.onRemotePlayerUpdate((state: RemotePlayerState) => {
      // Don't update local player from remote
      if (state.id === multiplayerService.getProfile().id) return;

      const existing = remotePlayersRef.current.get(state.id);
      if (existing) {
        existing.x = state.x;
        existing.y = state.y;
        existing.vx = state.vx;
        existing.vy = state.vy;
        existing.angle = state.angle;
        existing.isMoving = state.isMoving;
        existing.health = state.health;
        existing.maxHealth = state.maxHealth;
        existing.isDead = state.isDead;
        existing.isAttacking = state.isAttacking;
        existing.hurtTimer = state.hurtTimer;
        existing.avatarId = state.avatar;
        existing.playerName = state.name;
        if (existing.weapon.type !== state.weaponType) {
          existing.weapon = createWeaponInstance(state.weaponType);
        }
      } else {
        const newRemoteChar: Character = {
          id: state.id,
          x: state.x,
          y: state.y,
          vx: state.vx,
          vy: state.vy,
          radius: 20,
          angle: state.angle,
          facingDirection: Math.cos(state.angle) >= 0 ? 1 : -1,
          health: state.health,
          maxHealth: state.maxHealth,
          isPlayer: false,
          walkTimer: 0,
          isMoving: state.isMoving,
          attackTimer: 0,
          isAttacking: state.isAttacking,
          attackProgress: 0,
          attackHand: 'right',
          hurtTimer: state.hurtTimer,
          isDodging: false,
          dodgeTimer: 0,
          isDead: state.isDead,
          weapon: createWeaponInstance(state.weaponType),
          recoilOffset: 0,
          muzzleFlashTimer: 0,
          bloodStains: [],
          avatarId: state.avatar,
          playerName: state.name,
        };
        remotePlayersRef.current.set(state.id, newRemoteChar);
        addFloatingText(`${state.name} ENTERED COMBAT!`, state.x, state.y - 45, '#38bdf8', 18);
      }
    });

    const unregShoot = multiplayerService.onRemotePlayerShoot((shoot) => {
      if (shoot.playerId === multiplayerService.getProfile().id) return;
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: shoot.x + Math.cos(shoot.angle) * 28,
        y: shoot.y + Math.sin(shoot.angle) * 28,
        vx: Math.cos(shoot.angle) * 16,
        vy: Math.sin(shoot.angle) * 16,
        damage: 22,
        fromPlayer: false,
        distanceTraveled: 0,
        maxDistance: 600,
        color: '#f87171',
        weaponType: shoot.weaponType as WeaponType,
      });

      if (shoot.weaponType === 'pistol') soundManager.playPistol();
      else if (shoot.weaponType === 'shotgun') soundManager.playShotgun();
      else if (shoot.weaponType === 'uzi') soundManager.playUzi();
      else soundManager.playPunch();
    });

    const unregHit = multiplayerService.onRemotePlayerHit((hit) => {
      if (hit.targetPlayerId === multiplayerService.getProfile().id) {
        const player = playerRef.current;
        if (!player.isDead) {
          player.health -= hit.damage;
          player.hurtTimer = 0.35;
          screenShakeRef.current = 6;
          soundManager.playBloodSplat();
          addBloodToCharacter(player, true);
          addBloodSplatter(player.x, player.y, 8, 1.2);
          addFloatingText(`-${Math.round(hit.damage)}`, player.x, player.y - 30, '#ef4444', 20);
          onPlayerHealthUpdate(player.health, player.maxHealth);

          if (player.health <= 0) {
            player.health = 0;
            player.isDead = true;
            spawnDismemberment(player);
            onPlayerDeath();
          }
        }
      }
    });

    return () => {
      unregUpdate();
      unregShoot();
      unregHit();
      remotePlayersRef.current.clear();
    };
  }, [multiplayerServer, onPlayerDeath, onPlayerHealthUpdate, spawnDismemberment, addBloodSplatter, addBloodToCharacter]);

  // Spawn Next Story Grunt (Sequential for Chapter 1: 30 grunts one by one!)
  const spawnNextStoryEnemy = useCallback((canvasWidth: number, canvasHeight: number) => {
    const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
    if (storySpawnedRef.current >= chapter.totalGrunts) return;

    storySpawnedRef.current++;
    const gruntNumber = storySpawnedRef.current;

    // Primarily spawn from left or right edge, strictly on the ground (never in the sky!)
    const hasSky = currentChapterId === 1 || currentChapterId === 2;
    const minGroundY = hasSky 
      ? (currentChapterId === 1 ? Math.round(canvasHeight * 0.445) : Math.round(canvasHeight * 0.425)) 
      : 50;

    let spawnX = 0;
    let spawnY = 0;
    const edge = Math.random() < 0.5 ? 2 : 3;
    if (edge === 2) {
      spawnX = -40;
      spawnY = minGroundY + 15 + Math.random() * (canvasHeight - minGroundY - 45);
    } else {
      spawnX = canvasWidth + 40;
      spawnY = minGroundY + 15 + Math.random() * (canvasHeight - minGroundY - 45);
    }

    let eType: 'grunt' | 'knife_grunt' | 'pistol_grunt' | 'shotgun_grunt' | 'agent' = 'grunt';
    let eWeapon: WeaponType = 'fists';
    let eHealth = 40;

    if (currentChapterId === 1) {
      // 30 GRUNTS ONE BY ONE!
      if (gruntNumber <= 6) {
        eType = 'grunt';
        eWeapon = 'fists';
        eHealth = 40;
      } else if (gruntNumber <= 13) {
        eType = 'knife_grunt';
        eWeapon = 'knife';
        eHealth = 45;
      } else if (gruntNumber <= 22) {
        eType = 'pistol_grunt';
        eWeapon = 'pistol';
        eHealth = 50;
      } else if (gruntNumber <= 28) {
        eType = 'shotgun_grunt';
        eWeapon = 'shotgun';
        eHealth = 60;
      } else {
        eType = 'agent';
        eWeapon = 'uzi';
        eHealth = 80;
      }

      addFloatingText(`GRUNT [${gruntNumber}/30] INCOMING!`, canvasWidth / 2, 70, '#f87171', 18);
    } else if (currentChapterId === 2) {
      const rand = Math.random();
      if (rand < 0.4) {
        eType = 'pistol_grunt';
        eWeapon = 'pistol';
        eHealth = 45;
      } else if (rand < 0.7) {
        eType = 'shotgun_grunt';
        eWeapon = 'shotgun';
        eHealth = 55;
      } else {
        eType = 'knife_grunt';
        eWeapon = 'knife';
        eHealth = 40;
      }
    } else if (currentChapterId === 3) {
      const rand = Math.random();
      if (rand < 0.5) {
        eType = 'shotgun_grunt';
        eWeapon = 'shotgun';
        eHealth = 65;
      } else {
        eType = 'agent';
        eWeapon = 'uzi';
        eHealth = 80;
      }
    } else {
      const rand = Math.random();
      if (rand < 0.4) {
        eType = 'agent';
        eWeapon = 'uzi';
        eHealth = 85;
      } else if (rand < 0.7) {
        eType = 'shotgun_grunt';
        eWeapon = 'shotgun';
        eHealth = 65;
      } else {
        eType = 'pistol_grunt';
        eWeapon = 'pistol';
        eHealth = 55;
      }
    }

    enemiesRef.current.push({
      id: `story-enemy-${Date.now()}-${gruntNumber}`,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      radius: 20,
      angle: 0,
      facingDirection: 1,
      health: eHealth,
      maxHealth: eHealth,
      isPlayer: false,
      enemyType: eType,
      walkTimer: 0,
      isMoving: false,
      attackTimer: 0,
      isAttacking: false,
      attackProgress: 0,
      attackHand: 'right',
      hurtTimer: 0,
      isDodging: false,
      dodgeTimer: 0,
      isDead: false,
      weapon: createWeaponInstance(eWeapon),
      recoilOffset: 0,
      muzzleFlashTimer: 0,
      bloodStains: [],
      goreHeadSprite: undefined,
      hasRibWound: false,
      hasStabWound: false,
      aiState: 'chase',
      aiTimer: Math.random() * 2,
    });
  }, [currentChapterId]);

  // Perform Attack
  const executeAttack = useCallback((type: 'primary' | 'melee') => {
    const player = playerRef.current;
    if (player.isDead || player.isDodging) return;

    const now = Date.now();
    const weapon = type === 'melee' ? createWeaponInstance('fists') : player.weapon;

    if (now - lastAttackTimeRef.current < weapon.fireRate) return;
    lastAttackTimeRef.current = now;

    if (weapon.maxAmmo > 0 && weapon.currentAmmo <= 0) {
      addFloatingText('RELOADING!', player.x, player.y - 40, '#f59e0b', 14);
      return;
    }

    if (weapon.maxAmmo > 0) {
      weapon.currentAmmo--;
      onWeaponChange({ ...weapon });
    }

    player.isAttacking = true;
    player.attackTimer = 0.25;
    player.attackProgress = 0;
    player.attackHand = player.attackHand === 'right' ? 'left' : 'right';
    player.recoilOffset = weapon.recoil;
    player.muzzleFlashTimer = 0.08;

    onUpdateStats((prev) => ({
      ...prev,
      shotsFired: prev.shotsFired + weapon.bulletsPerShot,
    }));

    if (multiplayerServer) {
      multiplayerService.sendPlayerShoot({
        playerId: multiplayerService.getProfile().id,
        x: player.x,
        y: player.y,
        angle: player.angle,
        weaponType: weapon.type,
      });
    }

    if (weapon.type === 'fists') {
      soundManager.playPunch();
      screenShakeRef.current = Math.max(screenShakeRef.current, 3);

      const punchRange = 65;
      if (multiplayerServer) {
        remotePlayersRef.current.forEach((remoteChar) => {
          if (!remoteChar.isDead) {
            const dx = remoteChar.x - player.x;
            const dy = remoteChar.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < punchRange) {
              remoteChar.health -= weapon.damage;
              remoteChar.hurtTimer = 0.2;
              addBloodToCharacter(remoteChar, false);
              addBloodSplatter(remoteChar.x, remoteChar.y, 6, 1.2);
              addFloatingText(`-${weapon.damage}`, remoteChar.x, remoteChar.y - 25, '#fbbf24', 18);
              multiplayerService.sendPlayerHit({
                targetPlayerId: remoteChar.id,
                damage: weapon.damage,
                attackerId: multiplayerService.getProfile().id,
              });
            }
          }
        });
      }
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < punchRange) {
          const enemyAngle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(enemyAngle - player.angle);
          if (angleDiff < 1.0 || angleDiff > Math.PI * 2 - 1.0) {
            enemy.health -= weapon.damage;
            enemy.hurtTimer = 0.15;
            enemy.vx += Math.cos(player.angle) * 12;
            enemy.vy += Math.sin(player.angle) * 12;

            addBloodToCharacter(enemy, false);
            addBloodSplatter(enemy.x, enemy.y, 6, 1.2);
            addFloatingText(`-${weapon.damage}`, enemy.x, enemy.y - 25, '#fbbf24', 18);
            soundManager.playPunch();

            onUpdateStats((prev) => ({
              ...prev,
              shotsHit: prev.shotsHit + 1,
              score: prev.score + 25,
            }));

            if (enemy.health <= 0) {
              handleEnemyDefeated(enemy, i);
            }
          }
        }
      }
    } else if (weapon.type === 'knife') {
      soundManager.playSlash();
      screenShakeRef.current = Math.max(screenShakeRef.current, 4);

      const slashRange = 75;
      if (multiplayerServer) {
        remotePlayersRef.current.forEach((remoteChar) => {
          if (!remoteChar.isDead) {
            const dx = remoteChar.x - player.x;
            const dy = remoteChar.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < slashRange) {
              remoteChar.health -= weapon.damage;
              remoteChar.hurtTimer = 0.2;
              addBloodToCharacter(remoteChar, true);
              addBloodSplatter(remoteChar.x, remoteChar.y, 10, 1.5);
              addFloatingText(`CRIT -${weapon.damage}`, remoteChar.x, remoteChar.y - 30, '#ef4444', 20);
              soundManager.playBloodSplat();
              multiplayerService.sendPlayerHit({
                targetPlayerId: remoteChar.id,
                damage: weapon.damage,
                attackerId: multiplayerService.getProfile().id,
              });
            }
          }
        });
      }
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < slashRange) {
          enemy.health -= weapon.damage;
          enemy.hurtTimer = 0.2;
          enemy.vx += Math.cos(player.angle) * 8;
          enemy.vy += Math.sin(player.angle) * 8;

          addBloodToCharacter(enemy, true);
          addBloodSplatter(enemy.x, enemy.y, 10, 1.5);
          addFloatingText(`CRIT -${weapon.damage}`, enemy.x, enemy.y - 30, '#ef4444', 20);
          soundManager.playBloodSplat();

          onUpdateStats((prev) => ({
            ...prev,
            shotsHit: prev.shotsHit + 1,
            score: prev.score + 50,
          }));

          if (enemy.health <= 0) {
            handleEnemyDefeated(enemy, i);
          }
        }
      }
    } else {
      // Firearms
      if (weapon.type === 'pistol') soundManager.playPistol();
      else if (weapon.type === 'shotgun') soundManager.playShotgun();
      else if (weapon.type === 'uzi') soundManager.playUzi();

      screenShakeRef.current = weapon.type === 'shotgun' ? 9 : (weapon.type === 'pistol' ? 3.5 : 2.5);

      const casingAngle = player.angle + (Math.random() > 0.5 ? -1.6 : 1.6);
      casingsRef.current.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: Math.cos(casingAngle) * (2 + Math.random() * 3),
        vy: Math.sin(casingAngle) * (2 + Math.random() * 3) - 1.5,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.5,
        alpha: 1,
        type: weapon.type === 'shotgun' ? 'red_shell' : 'brass',
      });
      soundManager.playCasingPing();

      for (let i = 0; i < weapon.bulletsPerShot; i++) {
        const spreadOffset = (Math.random() - 0.5) * weapon.spread;
        const bulletAngle = player.angle + spreadOffset;
        bulletsRef.current.push({
          id: Math.random().toString(),
          x: player.x + Math.cos(bulletAngle) * 32,
          y: player.y + Math.sin(bulletAngle) * 32,
          vx: Math.cos(bulletAngle) * weapon.bulletSpeed,
          vy: Math.sin(bulletAngle) * weapon.bulletSpeed,
          damage: weapon.damage,
          fromPlayer: true,
          distanceTraveled: 0,
          maxDistance: weapon.range,
          color: weapon.type === 'shotgun' ? '#fef08a' : '#fb923c',
          weaponType: weapon.type,
        });
      }
    }
  }, [addBloodSplatter, addBloodToCharacter, handleEnemyDefeated, onUpdateStats, onWeaponChange]);

  // Execute Dodge
  const executeDodge = useCallback(() => {
    const player = playerRef.current;
    if (player.isDodging || player.isDead) return;

    player.isDodging = true;
    player.dodgeTimer = 0.35;
    const moveAngle = Math.atan2(player.vy, player.vx) || player.angle;
    player.vx = Math.cos(moveAngle) * 14;
    player.vy = Math.sin(moveAngle) * 14;

    addFloatingText('DODGE!', player.x, player.y - 30, '#60a5fa', 14);
  }, []);

  // Spawn Enemy Wave
  const spawnEnemyWave = useCallback((waveNum: number, canvasWidth: number, canvasHeight: number) => {
    const count = 3 + waveNum * 2;
    addFloatingText(`WAVE ${waveNum} INCOMING!`, canvasWidth / 2, 80, '#ef4444', 28);

    for (let i = 0; i < count; i++) {
      let spawnX = 0;
      let spawnY = 0;
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        spawnX = Math.random() * canvasWidth;
        spawnY = -40;
      } else if (edge === 1) {
        spawnX = Math.random() * canvasWidth;
        spawnY = canvasHeight + 40;
      } else if (edge === 2) {
        spawnX = -40;
        spawnY = Math.random() * canvasHeight;
      } else {
        spawnX = canvasWidth + 40;
        spawnY = Math.random() * canvasHeight;
      }

      let eType: 'grunt' | 'knife_grunt' | 'pistol_grunt' | 'shotgun_grunt' | 'agent' = 'grunt';
      let eHealth = 40 + waveNum * 8;
      let eWeaponType: WeaponType = 'fists';

      const rand = Math.random();
      if (waveNum >= 4 && rand < 0.25) {
        eType = 'agent';
        eWeaponType = 'uzi';
        eHealth = 75;
      } else if (waveNum >= 3 && rand < 0.45) {
        eType = 'shotgun_grunt';
        eWeaponType = 'shotgun';
        eHealth = 55;
      } else if (waveNum >= 2 && rand < 0.65) {
        eType = 'pistol_grunt';
        eWeaponType = 'pistol';
        eHealth = 45;
      } else if (rand < 0.5) {
        eType = 'knife_grunt';
        eWeaponType = 'knife';
        eHealth = 35;
      }

      // All enemies spawn pristine and clean at the beginning — gore ONLY appears when shot!
      enemiesRef.current.push({
        id: `enemy-${Date.now()}-${i}`,
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius: 20,
        angle: 0,
        facingDirection: 1,
        health: eHealth,
        maxHealth: eHealth,
        isPlayer: false,
        enemyType: eType,
        walkTimer: 0,
        isMoving: false,
        attackTimer: 0,
        isAttacking: false,
        attackProgress: 0,
        attackHand: 'right',
        hurtTimer: 0,
        isDodging: false,
        dodgeTimer: 0,
        isDead: false,
        weapon: createWeaponInstance(eWeaponType),
        recoilOffset: 0,
        muzzleFlashTimer: 0,
        bloodStains: [],
        goreHeadSprite: undefined,
        hasRibWound: false,
        hasStabWound: false,
        aiState: 'chase',
        aiTimer: Math.random() * 2,
      });
    }
  }, [goreSetting]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundManager.unlock();
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      if (e.code === 'Space' || e.key === 'Shift') {
        e.preventDefault();
        executeDodge();
      }

      const trySwitchWeapon = (type: WeaponType) => {
        if (gameMode === 'story' && !unlockedWeapons.includes(type)) {
          addFloatingText('LOCKED! PICK UP IN BATTLE', playerRef.current.x, playerRef.current.y - 35, '#ef4444', 14);
          soundManager.playDryFire();
          return;
        }
        onWeaponChange(createWeaponInstance(type));
        soundManager.playPistol();
      };

      if (e.key === '1') trySwitchWeapon('fists');
      if (e.key === '2') trySwitchWeapon('knife');
      if (e.key === '3') trySwitchWeapon('pistol');
      if (e.key === '4') trySwitchWeapon('shotgun');
      if (e.key === '5') trySwitchWeapon('uzi');
      if (e.key.toLowerCase() === 'q') {
        const available: WeaponType[] = gameMode === 'story' ? unlockedWeapons : ['fists', 'knife', 'pistol', 'shotgun', 'uzi'];
        if (available.length > 1) {
          const idx = available.indexOf(playerRef.current.weapon.type);
          const next = available[(idx + 1) % available.length];
          onWeaponChange(createWeaponInstance(next));
          soundManager.playPistol();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onWeaponChange, executeDodge, gameMode, unlockedWeapons]);

  // Mouse Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      isTouchModeRef.current = false;
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      soundManager.unlock();
      if (e.button === 0) {
        isMouseDownRef.current = true;
        executeAttack('primary');
      } else if (e.button === 2) {
        e.preventDefault();
        executeAttack('melee');
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [executeAttack]);

  // 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    spriteManager.loadAll();

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);

      if (isPaused) {
        lastTime = currentTime;
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const timeScale = slowMoActive ? 0.38 : 1.0;
      const effectiveDt = dt * timeScale;

      const width = canvas.width;
      const height = canvas.height;
      const player = playerRef.current;

      // 1. INPUT HANDLING
      let inputX = 0;
      let inputY = 0;

      const keys = keysRef.current;
      if (keys['w'] || keys['arrowup']) inputY -= 1;
      if (keys['s'] || keys['arrowdown']) inputY += 1;
      if (keys['a'] || keys['arrowleft']) inputX -= 1;
      if (keys['d'] || keys['arrowright']) inputX += 1;

      if (Math.abs(inputController.moveX) > 0.05) {
        inputX += inputController.moveX;
        isTouchModeRef.current = true;
      }
      if (Math.abs(inputController.moveY) > 0.05) {
        inputY += inputController.moveY;
        isTouchModeRef.current = true;
      }

      const inputLen = Math.sqrt(inputX * inputX + inputY * inputY);
      if (inputLen > 1) {
        inputX /= inputLen;
        inputY /= inputLen;
      }

      if (inputController.triggerAttackFlag) {
        inputController.triggerAttackFlag = false;
        isTouchModeRef.current = true;
        executeAttack('primary');
      } else if (inputController.isAttackingHeld) {
        isTouchModeRef.current = true;
        executeAttack('primary');
      }

      if (inputController.triggerMeleeFlag) {
        inputController.triggerMeleeFlag = false;
        isTouchModeRef.current = true;
        executeAttack('melee');
      }

      if (inputController.triggerDodgeFlag) {
        inputController.triggerDodgeFlag = false;
        executeDodge();
      }

      // 2. UPDATE PLAYER
      if (!player.isDead) {
        const moveSpeed = player.isDodging ? 380 : 210;
        player.vx = inputX * moveSpeed;
        player.vy = inputY * moveSpeed;

        player.x += player.vx * dt;
        player.y += player.vy * dt;

        const padding = 28;
        const hasSky = gameMode === 'story' && (currentChapterId === 1 || currentChapterId === 2);
        const minGroundY = hasSky 
          ? (currentChapterId === 1 ? Math.round(height * 0.445) : Math.round(height * 0.425)) 
          : padding;

        player.x = Math.max(padding, Math.min(width - padding, player.x));
        player.y = Math.max(minGroundY, Math.min(height - padding, player.y));

        player.isMoving = inputLen > 0.1;
        if (player.isMoving) {
          player.walkTimer += dt;
        }

        // Aim angle
        if (isTouchModeRef.current || inputController.isTouchActive || inputController.isAttackingHeld) {
          let closestDist = Infinity;
          let bestAngle = player.angle;

          enemiesRef.current.forEach((en) => {
            const dx = en.x - player.x;
            const dy = en.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < closestDist && d < 600) {
              closestDist = d;
              bestAngle = Math.atan2(dy, dx);
            }
          });

          if (closestDist < 600) {
            player.angle = bestAngle;
          } else if (inputLen > 0.1) {
            player.angle = Math.atan2(inputY, inputX);
          }
        } else {
          player.angle = Math.atan2(mousePosRef.current.y - player.y, mousePosRef.current.x - player.x);
        }

        if (isMouseDownRef.current && player.weapon.type === 'uzi') {
          executeAttack('primary');
        }

        if (player.isDodging) {
          player.dodgeTimer -= dt;
          if (player.dodgeTimer <= 0) {
            player.isDodging = false;
          }
        }

        if (player.isAttacking) {
          player.attackProgress += dt * 4;
          if (player.attackProgress >= 1) {
            player.isAttacking = false;
            player.attackProgress = 0;
          }
        }

        if (player.recoilOffset > 0) {
          player.recoilOffset = Math.max(0, player.recoilOffset - dt * 45);
        }
        if (player.muzzleFlashTimer > 0) {
          player.muzzleFlashTimer -= dt;
        }
        if (player.hurtTimer > 0) {
          player.hurtTimer -= dt;
        }

        onPlayerHealthUpdate(player.health, player.maxHealth);
      }

      // 3. SPAWN ENEMIES (Story sequential vs Arena wave)
      if (enemiesRef.current.length === 0 && !waveSpawningRef.current && !player.isDead) {
        if (gameMode === 'story') {
          const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];
          if (storySpawnedRef.current < chapter.totalGrunts) {
            waveSpawningRef.current = true;
            setTimeout(() => {
              if (!player.isDead && canvasRef.current) {
                if (chapter.oneByOne) {
                  // Exactly one by one for Chapter 1!
                  spawnNextStoryEnemy(width, height);
                } else {
                  // Squad of up to 3
                  const toSpawn = Math.min(3, chapter.totalGrunts - storySpawnedRef.current);
                  for (let s = 0; s < toSpawn; s++) {
                    spawnNextStoryEnemy(width, height);
                  }
                }
              }
              waveSpawningRef.current = false;
            }, chapter.oneByOne ? 400 : 750);
          }
        } else {
          waveSpawningRef.current = true;
          setTimeout(() => {
            onUpdateStats((prev) => {
              const nextWave = prev.wave + 1;
              spawnEnemyWave(nextWave, width, height);
              return { ...prev, wave: nextWave };
            });
            waveSpawningRef.current = false;
          }, 1200);
        }
      }

      // 4. UPDATE ENEMIES
      enemiesRef.current.forEach((enemy) => {
        if (enemy.isDead) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        enemy.angle = Math.atan2(dy, dx);

        const isArmedGun = enemy.weapon.type === 'pistol' || enemy.weapon.type === 'shotgun' || enemy.weapon.type === 'uzi';
        const desiredDist = isArmedGun ? 220 : 38;

        if (dist > desiredDist) {
          const chaseSpeed = enemy.enemyType === 'agent' ? 160 : 115;
          enemy.vx = Math.cos(enemy.angle) * chaseSpeed;
          enemy.vy = Math.sin(enemy.angle) * chaseSpeed;
          enemy.isMoving = true;
          enemy.walkTimer += effectiveDt;
        } else {
          enemy.vx *= 0.8;
          enemy.vy *= 0.8;
          enemy.isMoving = false;
        }

        enemy.x += enemy.vx * effectiveDt;
        enemy.y += enemy.vy * effectiveDt;

        const hasSky = gameMode === 'story' && (currentChapterId === 1 || currentChapterId === 2);
        const minGroundY = hasSky 
          ? (currentChapterId === 1 ? Math.round(height * 0.445) : Math.round(height * 0.425)) 
          : 28;
        enemy.x = Math.max(28, Math.min(width - 28, enemy.x));
        enemy.y = Math.max(minGroundY, Math.min(height - 28, enemy.y));

        enemy.attackTimer -= effectiveDt;
        if (enemy.attackTimer <= 0 && !player.isDead && !player.isDodging) {
          if (isArmedGun && dist < 420) {
            enemy.attackTimer = enemy.weapon.fireRate / 1000 + 0.35 + Math.random() * 0.4;
            enemy.isAttacking = true;
            enemy.recoilOffset = enemy.weapon.recoil;
            enemy.muzzleFlashTimer = 0.08;

            bulletsRef.current.push({
              id: Math.random().toString(),
              x: enemy.x + Math.cos(enemy.angle) * 32,
              y: enemy.y + Math.sin(enemy.angle) * 32,
              vx: Math.cos(enemy.angle) * enemy.weapon.bulletSpeed * 0.65,
              vy: Math.sin(enemy.angle) * enemy.weapon.bulletSpeed * 0.65,
              damage: enemy.weapon.damage * 0.25, // Balanced enemy bullet damage
              fromPlayer: false,
              distanceTraveled: 0,
              maxDistance: 600,
              color: '#ef4444',
              weaponType: enemy.weapon.type,
            });

            if (enemy.weapon.type === 'pistol') soundManager.playPistol();
            else if (enemy.weapon.type === 'shotgun') soundManager.playShotgun();
            else soundManager.playUzi();

          } else if (!isArmedGun && dist < 65) {
            enemy.attackTimer = 0.9;
            enemy.isAttacking = true;
            enemy.attackProgress = 0;

            // Only damage player if hurtTimer <= 0 (Invulnerability window)
            if (player.hurtTimer <= 0) {
              const damage = Math.round(enemy.weapon.damage * 0.4); // Balanced melee damage
              player.health -= damage;
              player.hurtTimer = 0.35; // 350ms invulnerability window!
              screenShakeRef.current = 6;
              soundManager.playPunch();

              // Persistent blood on protagonist clothing!
              addBloodToCharacter(player, true);
              addBloodSplatter(player.x, player.y, 8, 1);
              addFloatingText(`-${damage}`, player.x, player.y - 30, '#ef4444', 18);

              if (player.health <= 0) {
                player.health = 0;
                player.isDead = true;
                spawnDismemberment(player);
                onPlayerDeath();
              }
            }
          }
        }

        if (enemy.recoilOffset > 0) enemy.recoilOffset = Math.max(0, enemy.recoilOffset - effectiveDt * 30);
        if (enemy.muzzleFlashTimer > 0) enemy.muzzleFlashTimer -= effectiveDt;
        if (enemy.hurtTimer > 0) enemy.hurtTimer -= effectiveDt;
      });

      // 5. UPDATE BULLETS & COLLISION
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx * effectiveDt * 60;
        b.y += b.vy * effectiveDt * 60;
        b.distanceTraveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy) * effectiveDt * 60;

        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height || b.distanceTraveled >= b.maxDistance) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        if (b.fromPlayer) {
          let hit = false;
          for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const enemy = enemiesRef.current[j];
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius + 6) {
              hit = true;
              enemy.health -= b.damage;
              enemy.hurtTimer = 0.18;
              enemy.vx += b.vx * 0.15;
              enemy.vy += b.vy * 0.15;

              // Add persistent blood stain on enemy clothing!
              addBloodToCharacter(enemy, b.weaponType === 'shotgun');
              addBloodSplatter(enemy.x, enemy.y, 8, 1.4);
              soundManager.playBloodSplat();
              addFloatingText(`-${Math.round(b.damage)}`, enemy.x, enemy.y - 25, '#f87171', 16);

              onUpdateStats((prev) => ({
                ...prev,
                shotsHit: prev.shotsHit + 1,
                score: prev.score + 20,
              }));

              if (enemy.health <= 0) {
                handleEnemyDefeated(enemy, j);
              }
              break;
            }
          }

          if (!hit && multiplayerServer) {
            remotePlayersRef.current.forEach((remoteChar) => {
              if (!hit && !remoteChar.isDead) {
                const dx = b.x - remoteChar.x;
                const dy = b.y - remoteChar.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < remoteChar.radius + 6) {
                  hit = true;
                  remoteChar.health -= b.damage;
                  remoteChar.hurtTimer = 0.2;
                  addBloodToCharacter(remoteChar, b.weaponType === 'shotgun');
                  addBloodSplatter(remoteChar.x, remoteChar.y, 8, 1.4);
                  soundManager.playBloodSplat();
                  addFloatingText(`-${Math.round(b.damage)}`, remoteChar.x, remoteChar.y - 25, '#f87171', 16);
                  multiplayerService.sendPlayerHit({
                    targetPlayerId: remoteChar.id,
                    damage: b.damage,
                    attackerId: multiplayerService.getProfile().id,
                  });
                }
              }
            });
          }

          if (hit) {
            bulletsRef.current.splice(i, 1);
          }
        } else {
          // Enemy bullet hitting player
          if (!player.isDead && !player.isDodging) {
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + 4) {
              if (player.hurtTimer <= 0) {
                player.health -= b.damage;
                player.hurtTimer = 0.35; // 350ms invulnerability window!
                screenShakeRef.current = 5;
                soundManager.playBloodSplat();

                // Persistent blood on protagonist clothing!
                addBloodToCharacter(player, true);
                addBloodSplatter(player.x, player.y, 6, 1);
                addFloatingText(`-${Math.round(b.damage)}`, player.x, player.y - 25, '#ef4444', 18);

                onUpdateStats((prev) => ({ ...prev, comboStreak: 0 }));

                if (player.health <= 0) {
                  player.health = 0;
                  player.isDead = true;
                  spawnDismemberment(player);
                  onPlayerDeath();
                }
              }
              bulletsRef.current.splice(i, 1);
            }
          }
        }
      }

      // 6. UPDATE CASINGS
      for (let i = casingsRef.current.length - 1; i >= 0; i--) {
        const c = casingsRef.current[i];
        c.x += c.vx * effectiveDt * 60;
        c.y += c.vy * effectiveDt * 60;
        c.vy += 0.3;
        c.angle += c.vAngle;
        c.alpha -= effectiveDt * 0.2;

        if (c.y > height - 20) {
          c.y = height - 20;
          c.vx *= 0.5;
          c.vy = -c.vy * 0.4;
        }

        if (c.alpha <= 0) {
          casingsRef.current.splice(i, 1);
        }
      }

      // 7. UPDATE RAGDOLLS
      for (let i = ragdollsRef.current.length - 1; i >= 0; i--) {
        const r = ragdollsRef.current[i];
        r.x += r.vx * effectiveDt * 60;
        r.y += r.vy * effectiveDt * 60;
        r.vy += 0.45;
        r.angle += r.vAngle;

        if (r.y >= r.groundY && r.vy > 0) {
          r.y = r.groundY;
          r.vy = -r.vy * 0.3;
          r.vx *= 0.7;
          r.vAngle *= 0.5;
          r.bounces++;
          if (r.bounces === 1 && goreSetting !== 'no_blood') {
            addBloodSplatter(r.x, r.y, 3, 0.5);
          }
        }

        r.alpha -= effectiveDt * 0.08;
        if (r.alpha <= 0) {
          ragdollsRef.current.splice(i, 1);
        }
      }

      // 8. UPDATE BLOOD PARTICLES
      for (let i = bloodParticlesRef.current.length - 1; i >= 0; i--) {
        const p = bloodParticlesRef.current[i];
        p.x += p.vx * effectiveDt * 60;
        p.y += p.vy * effectiveDt * 60;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.alpha -= effectiveDt * 1.5;

        if (p.alpha <= 0) {
          bloodParticlesRef.current.splice(i, 1);
        }
      }

      // 9. UPDATE PICKUPS
      for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
        const p = pickupsRef.current[i];
        p.floatTimer += dt * 3;

        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 32 && !player.isDead) {
          if (p.type === 'weapon' && p.weaponType) {
            const newWep = createWeaponInstance(p.weaponType);
            player.weapon = newWep;
            onWeaponChange(newWep);
            
            if (gameMode === 'story' && !unlockedWeapons.includes(p.weaponType)) {
              onUnlockWeapon(p.weaponType);
              addFloatingText(`★ UNLOCKED ${newWep.name.toUpperCase()}! ★`, player.x, player.y - 45, '#10b981', 22);
              soundManager.playIntroHit();
            } else {
              addFloatingText(`EQUIPPED ${newWep.name.toUpperCase()}!`, player.x, player.y - 30, '#38bdf8', 18);
              soundManager.playPistol();
            }
            pickupsRef.current.splice(i, 1);
            continue;
          } else if (p.type === 'medkit' && player.health < player.maxHealth) {
            player.health = Math.min(player.maxHealth, player.health + (p.healthAmount || 40));
            addFloatingText(`+${p.healthAmount || 40} HP`, player.x, player.y - 30, '#10b981', 18);
            pickupsRef.current.splice(i, 1);
            continue;
          } else if (p.type === 'ammo' && player.weapon.maxAmmo > 0) {
            player.weapon.reserveAmmo += p.ammoAmount || 24;
            onWeaponChange({ ...player.weapon });
            addFloatingText(`+${p.ammoAmount} AMMO`, player.x, player.y - 30, '#f59e0b', 18);
            pickupsRef.current.splice(i, 1);
            continue;
          }
        }
      }

      // 10. UPDATE FLOATING TEXT
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt * 60;
        ft.alpha -= dt * 1.2;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 25);
      }

      // Stream Local Player Real-Time State to Multiplayer Server (~30Hz)
      if (multiplayerServer && !player.isDead) {
        syncTimerRef.current += effectiveDt;
        if (syncTimerRef.current >= 0.033) {
          syncTimerRef.current = 0;
          multiplayerService.sendPlayerState({
            id: multiplayerService.getProfile().id,
            name: playerName || 'Hank Wimbleton',
            avatar: playerAvatar || 'ninja_grunt',
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            angle: player.angle,
            isMoving: player.isMoving,
            weaponType: player.weapon.type,
            health: player.health,
            maxHealth: player.maxHealth,
            isDead: player.isDead,
            isAttacking: player.isAttacking,
            hurtTimer: player.hurtTimer,
            isHost: multiplayerServer.hostId === multiplayerService.getProfile().id,
            lastUpdated: Date.now(),
          });
        }
      }

      // -------------------------------------------------------------
      // RENDERING PIPELINE
      // -------------------------------------------------------------
      ctx.save();

      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 2;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Draw Environment (Story Chapter 1 Field/Tree/Boombox/Dancing Grunt, Chapters 2-4, or Arena Grid)
      drawChapterEnvironment(ctx, width, height, currentTime / 1000, gameMode, currentChapterId);

      // Persistent Floor Blood Decals (Blitted in 1 ultra-fast GPU call!)
      if (goreSetting !== 'no_blood' && floorCanvasRef.current) {
        ctx.drawImage(floorCanvasRef.current, 0, 0);
      }

      // Casings
      casingsRef.current.forEach((c) => {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        if (c.type === 'red_shell') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-4, -2, 8, 4);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-4, -2, 2, 4);
        } else {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-3, -1.5, 6, 3);
        }
        ctx.restore();
      });

      // Pickups
      pickupsRef.current.forEach((p) => {
        const floatY = Math.sin(p.floatTimer) * 4;
        ctx.save();
        ctx.translate(p.x, p.y + floatY);

        if (p.type === 'weapon') {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.fillRect(-14, -8, 28, 16);
          ctx.strokeRect(-14, -8, 28, 16);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.weaponType ? p.weaponType.toUpperCase() : 'GUN', 0, 3);
        } else if (p.type === 'medkit') {
          ctx.fillStyle = '#065f46';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.fillRect(-12, -10, 24, 20);
          ctx.strokeRect(-12, -10, 24, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-3, -7, 6, 14);
          ctx.fillRect(-7, -3, 14, 6);
        } else {
          ctx.fillStyle = '#78350f';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.fillRect(-12, -10, 24, 20);
          ctx.strokeRect(-12, -10, 24, 20);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('AMMO', 0, 3);
        }
        ctx.restore();
      });

      // Ragdoll Limbs
      ragdollsRef.current.forEach((r) => {
        drawRagdollPiece(ctx, r, goreSetting);
      });

      // Dynamic Blood Particles (Batched in single draw call for 0 lag)
      if (goreSetting !== 'no_blood' && bloodParticlesRef.current.length > 0) {
        ctx.save();
        ctx.fillStyle = goreSetting === 'extreme_gore' ? 'rgba(185, 28, 28, 0.9)' : 'rgba(153, 27, 27, 0.85)';
        ctx.beginPath();
        for (let i = 0; i < bloodParticlesRef.current.length; i++) {
          const p = bloodParticlesRef.current[i];
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }

      // Draw Characters (Player, Remote Players, and Enemies sorted by Y)
      const allCharacters: Character[] = [];
      if (!player.isDead) allCharacters.push(player);
      if (multiplayerServer) {
        remotePlayersRef.current.forEach((rp) => {
          if (!rp.isDead) allCharacters.push(rp);
        });
      }
      enemiesRef.current.forEach((e) => {
        if (!e.isDead) allCharacters.push(e);
      });
      allCharacters.sort((a, b) => a.y - b.y);

      allCharacters.forEach((char) => {
        drawGrunt(ctx, char, currentTime / 1000, goreSetting, gameMode === 'story' ? currentChapterId : 0, char.avatarId);
      });

      // Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.weaponType === 'shotgun' ? 3.5 : 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const bulletLength = 12;
        const angle = Math.atan2(b.vy, b.vx);
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - Math.cos(angle) * bulletLength, b.y - Math.sin(angle) * bulletLength);
        ctx.stroke();
        ctx.restore();
      });

      // Floating Texts
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.fontSize}px 'Oswald', sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Crosshair for PC
      if (!player.isDead && !isTouchModeRef.current) {
        ctx.save();
        ctx.translate(mousePosRef.current.x, mousePosRef.current.y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-5, 0);
        ctx.moveTo(5, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(0, -15);
        ctx.lineTo(0, -5);
        ctx.moveTo(0, 5);
        ctx.lineTo(0, 15);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPaused, 
    slowMoActive, 
    goreSetting,
    spawnEnemyWave, 
    executeAttack, 
    executeDodge,
    addBloodSplatter, 
    spawnDismemberment, 
    onPlayerDeath, 
    onPlayerHealthUpdate,
    onUpdateStats, 
    onWeaponChange
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0d0f12] overflow-hidden cursor-crosshair-combat">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

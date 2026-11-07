/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameView, 
  GameStats, 
  WeaponType, 
  Weapon, 
  GoreSetting, 
  BloodAmount, 
  GameMode, 
  STORY_CHAPTERS 
} from './types/game';
import { createWeaponInstance } from './utils/weapons';
import { soundManager } from './audio/soundManager';
import { inputController } from './utils/inputController';
import { IntroScreen } from './components/IntroScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { ChapterVictoryModal } from './components/ChapterVictoryModal';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MultiplayerServer, GruntAvatarId } from './types/multiplayer';
import { multiplayerService } from './services/multiplayerService';

export default function App() {
  const [view, setView] = useState<GameView>('INTRO_NEURON');
  const [gameMode, setGameMode] = useState<GameMode>('story');
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showChapterSelect, setShowChapterSelect] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [multiplayerServer, setMultiplayerServer] = useState<MultiplayerServer | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<GruntAvatarId>(() => multiplayerService.getProfile().avatar);
  const [playerName, setPlayerName] = useState<string>(() => multiplayerService.getProfile().name);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [slowMoActive, setSlowMoActive] = useState<boolean>(false);

  // Highest chapter reached/unlocked
  const [unlockedChapterMax, setUnlockedChapterMax] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mc_unlocked_chapter');
      if (saved) return parseInt(saved, 10) || 1;
    } catch {
      // fallback
    }
    return 4; // Default to allow playing any chapter
  });

  // Session ID to reset the GameCanvas completely when restarting
  const [gameSessionId, setGameSessionId] = useState<number>(0);

  // Gore setting: 'no_blood' | 'default' | 'extreme_gore'
  const [goreSetting, setGoreSetting] = useState<GoreSetting>(() => {
    try {
      const saved = localStorage.getItem('mc_gore_setting');
      if (saved === 'no_blood' || saved === 'default' || saved === 'extreme_gore') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'default';
  });

  // Blood amount setting: 'very_little' | 'not_much' | 'too_much'
  const [bloodAmount, setBloodAmount] = useState<BloodAmount>(() => {
    try {
      const saved = localStorage.getItem('mc_blood_amount');
      if (saved === 'very_little' || saved === 'not_much' || saved === 'too_much') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'not_much';
  });

  // Mobile Controls display state
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);

  // Weapons & Player State (250 HP gives protagonist enough durability)
  const playerMaxHealth = 250;
  const [playerHealth, setPlayerHealth] = useState<number>(250);
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(createWeaponInstance('fists'));
  // Story Mode: weapons start locked (except fists in Ch 1) and unlock upon picking them up
  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponType[]>(['fists']);

  const handleUnlockWeapon = useCallback((weaponType: WeaponType) => {
    setUnlockedWeapons((prev) => {
      if (prev.includes(weaponType)) return prev;
      return [...prev, weaponType];
    });
  }, []);

  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    comboStreak: 0,
    maxCombo: 0,
    timeAlive: 0,
    storyProgress: {
      chapterId: 1,
      gruntsKilled: 0,
      gruntsTotal: 30,
    },
  });

  // Auto detect mobile/touch devices or small screen and detect invite hash links
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 900;
    setShowMobileControls(isTouch);

    const checkHash = () => {
      if (window.location.hash.includes('join=')) {
        setShowMultiplayerModal(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Update and persist gore setting
  const handleSelectGoreSetting = useCallback((setting: GoreSetting) => {
    setGoreSetting(setting);
    try {
      localStorage.setItem('mc_gore_setting', setting);
    } catch {
      // ignore
    }
  }, []);

  // Update and persist blood amount setting
  const handleSelectBloodAmount = useCallback((amount: BloodAmount) => {
    setBloodAmount(amount);
    try {
      localStorage.setItem('mc_blood_amount', amount);
    } catch {
      // ignore
    }
  }, []);

  // Cycle through gore settings from HUD
  const handleCycleGore = useCallback(() => {
    const order: GoreSetting[] = ['no_blood', 'default', 'extreme_gore'];
    const nextIdx = (order.indexOf(goreSetting) + 1) % order.length;
    handleSelectGoreSetting(order[nextIdx]);
  }, [goreSetting, handleSelectGoreSetting]);

  // Cycle through blood amount settings from HUD
  const handleCycleBloodAmount = useCallback(() => {
    const order: BloodAmount[] = ['very_little', 'not_much', 'too_much'];
    const nextIdx = (order.indexOf(bloodAmount) + 1) % order.length;
    handleSelectBloodAmount(order[nextIdx]);
  }, [bloodAmount, handleSelectBloodAmount]);

  // Start Story Mode Campaign (Specific Chapter)
  const startStoryGame = useCallback((chapterId: number = 1) => {
    inputController.resetAll();
    const chapter = STORY_CHAPTERS.find((c) => c.id === chapterId) || STORY_CHAPTERS[0];
    
    setMultiplayerServer(null);
    setGameMode('story');
    setCurrentChapterId(chapter.id);
    setCurrentWeapon(createWeaponInstance(chapter.startingWeapon));
    // In story mode, weapons unlock as picked up from fallen grunts!
    if (chapter.id === 1) {
      setUnlockedWeapons(['fists']);
    } else {
      setUnlockedWeapons((prev) => {
        const set = new Set<WeaponType>(['fists', chapter.startingWeapon, ...prev]);
        return Array.from(set);
      });
    }
    setPlayerHealth(250);
    setGameSessionId((prev) => prev + 1);
    setStats({
      score: 0,
      kills: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      comboStreak: 0,
      maxCombo: 0,
      timeAlive: 0,
      storyProgress: {
        chapterId: chapter.id,
        gruntsKilled: 0,
        gruntsTotal: chapter.totalGrunts,
      },
    });

    setSlowMoActive(false);
    setIsPaused(false);
    setView('PLAYING');

    // Start Appropriate Audio Track
    if (soundEnabled) {
      if (chapter.musicType === 'boombox') {
        soundManager.startBoomboxMusic();
      } else {
        soundManager.startCombatMusic();
      }
    }
  }, [soundEnabled]);

  // Start Survival Arena (Endless Wave Mode / Normal Mode)
  const startArenaGame = useCallback(() => {
    inputController.resetAll();
    setMultiplayerServer(null);
    setGameMode('arena');
    setCurrentWeapon(createWeaponInstance('pistol'));
    // In normal mode, all weapons are unlocked immediately
    setUnlockedWeapons(['fists', 'knife', 'pistol', 'shotgun', 'uzi']);
    setPlayerHealth(250);
    setGameSessionId((prev) => prev + 1);
    setStats({
      score: 0,
      kills: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      comboStreak: 0,
      maxCombo: 0,
      timeAlive: 0,
    });

    setSlowMoActive(false);
    setIsPaused(false);
    setView('PLAYING');

    if (soundEnabled) {
      soundManager.startCombatMusic();
    }
  }, [soundEnabled]);

  // Launch Multiplayer Match (from Lobby or Host)
  const handleLaunchMultiplayerMatch = useCallback((server: MultiplayerServer) => {
    setShowMultiplayerModal(false);
    inputController.resetAll();
    
    const prof = multiplayerService.getProfile();
    setMultiplayerServer(server);
    setPlayerAvatar(prof.avatar);
    setPlayerName(prof.name);

    // Configure environment based on server map
    if (server.map === 'field_tree') {
      setCurrentChapterId(1);
    } else if (server.map === 'desert_sun') {
      setCurrentChapterId(2);
    } else if (server.map === 'bunker') {
      setCurrentChapterId(3);
    } else if (server.map === 'club_m') {
      setCurrentChapterId(4);
    } else {
      setCurrentChapterId(2);
    }

    setGameMode('arena');
    setCurrentWeapon(createWeaponInstance('uzi'));
    setUnlockedWeapons(['fists', 'knife', 'pistol', 'shotgun', 'uzi']);
    setPlayerHealth(250);
    setGameSessionId((prev) => prev + 1);
    setStats({
      score: 0,
      kills: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      comboStreak: 0,
      maxCombo: 0,
      timeAlive: 0,
    });

    setSlowMoActive(false);
    setIsPaused(false);
    setView('PLAYING');

    if (soundEnabled) {
      soundManager.startCombatMusic();
    }
  }, [soundEnabled]);

  // Restart Current Mode/Chapter
  const restartCurrentGame = useCallback(() => {
    if (gameMode === 'story') {
      startStoryGame(currentChapterId);
    } else {
      startArenaGame();
    }
  }, [currentChapterId, gameMode, startArenaGame, startStoryGame]);

  // Handle Chapter Completed Victory
  const handleChapterComplete = useCallback(() => {
    inputController.resetAll();
    soundManager.stopMusic();
    
    // Unlock next chapter in storage
    const nextChapter = currentChapterId + 1;
    setUnlockedChapterMax((prev) => {
      const updated = Math.max(prev, nextChapter);
      try {
        localStorage.setItem('mc_unlocked_chapter', updated.toString());
      } catch {
        // ignore
      }
      return updated;
    });

    setView('CHAPTER_VICTORY');
  }, [currentChapterId]);

  // Handle Player Death
  const handlePlayerDeath = useCallback(() => {
    inputController.resetAll();
    setPlayerHealth(0);
    soundManager.playSlowMo(false);
    setTimeout(() => {
      setView('GAME_OVER');
    }, 1200);
  }, []);

  // Sound Toggle
  const toggleSound = useCallback(() => {
    soundManager.unlock();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.sfxEnabled = next;
    soundManager.musicEnabled = next;
    if (!next) {
      soundManager.stopMusic();
    } else if (view === 'PLAYING') {
      if (gameMode === 'story' && currentChapterId === 1) {
        soundManager.startBoomboxMusic();
      } else {
        soundManager.startCombatMusic();
      }
    }
  }, [currentChapterId, gameMode, soundEnabled, view]);

  // Slow-Mo Toggle
  const toggleSlowMo = useCallback(() => {
    const next = !slowMoActive;
    setSlowMoActive(next);
    soundManager.playSlowMo(next);
  }, [slowMoActive]);

  // Weapon Hotbar Selector
  const handleSelectWeapon = useCallback((type: WeaponType) => {
    if (gameMode === 'story' && !unlockedWeapons.includes(type)) {
      soundManager.playDryFire();
      return;
    }
    const newWeapon = createWeaponInstance(type);
    setCurrentWeapon(newWeapon);
    soundManager.playPistol();
  }, [gameMode, unlockedWeapons]);

  // Cycle Weapon on Mobile
  const handleCycleWeapon = useCallback(() => {
    const types: WeaponType[] = gameMode === 'story'
      ? unlockedWeapons
      : ['fists', 'knife', 'pistol', 'shotgun', 'uzi'];
    if (types.length <= 1) return;
    const currentIndex = types.indexOf(currentWeapon.type);
    const nextType = types[(currentIndex + 1) % types.length];
    handleSelectWeapon(nextType);
  }, [currentWeapon.type, gameMode, handleSelectWeapon, unlockedWeapons]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] select-none text-slate-100">
      
      {/* 1. INTRO / TITLE SCREEN */}
      {view === 'INTRO_NEURON' && (
        <IntroScreen
          onStartStory={(chId) => startStoryGame(chId || 1)}
          onStartArena={startArenaGame}
          onOpenChapterSelect={() => setShowChapterSelect(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          goreSetting={goreSetting}
          onSelectGoreSetting={handleSelectGoreSetting}
          bloodAmount={bloodAmount}
          onSelectBloodAmount={handleSelectBloodAmount}
        />
      )}

      {/* 2. ACTIVE PLAY VIEW */}
      {(view === 'PLAYING' || view === 'PAUSED' || view === 'GAME_OVER' || view === 'CHAPTER_VICTORY') && (
        <div className="relative w-full h-full">
          {/* Main Canvas Engine */}
          <GameCanvas
            gameMode={gameMode}
            currentChapterId={currentChapterId}
            gameSessionId={gameSessionId}
            stats={stats}
            onUpdateStats={setStats}
            onPlayerDeath={handlePlayerDeath}
            onPlayerHealthUpdate={(curr) => setPlayerHealth(curr)}
            currentWeaponType={currentWeapon.type}
            onWeaponChange={setCurrentWeapon}
            unlockedWeapons={unlockedWeapons}
            onUnlockWeapon={handleUnlockWeapon}
            slowMoActive={slowMoActive}
            onToggleSlowMo={toggleSlowMo}
            isPaused={isPaused || view === 'GAME_OVER' || view === 'CHAPTER_VICTORY'}
            goreSetting={goreSetting}
            bloodAmount={bloodAmount}
            onChapterComplete={handleChapterComplete}
            playerAvatar={playerAvatar}
            playerName={playerName}
            multiplayerServer={multiplayerServer}
          />

          {/* In-Game Heads-Up Display */}
          <GameHUD
            gameMode={gameMode}
            currentChapterId={currentChapterId}
            health={playerHealth}
            maxHealth={playerMaxHealth}
            weapon={currentWeapon}
            stats={stats}
            unlockedWeapons={unlockedWeapons}
            slowMoActive={slowMoActive}
            slowMoAvailable={stats.comboStreak >= 3 || slowMoActive}
            soundEnabled={soundEnabled}
            showMobileControls={showMobileControls}
            goreSetting={goreSetting}
            bloodAmount={bloodAmount}
            onToggleSound={toggleSound}
            onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
            onCycleGore={handleCycleGore}
            onCycleBloodAmount={handleCycleBloodAmount}
            onToggleSlowMo={toggleSlowMo}
            onSelectWeapon={handleSelectWeapon}
            onPause={() => setIsPaused(true)}
          />

          {/* On-Screen Mobile Movement Buttons (D-Pad & Stick) & Action Buttons */}
          {showMobileControls && view === 'PLAYING' && !isPaused && (
            <MobileControls
              currentWeaponType={currentWeapon.type}
              onCycleWeapon={handleCycleWeapon}
              isDodging={false}
            />
          )}

          {/* Scanline CRT overlay */}
          <div className="scanlines absolute inset-0 pointer-events-none z-10 opacity-70" />
        </div>
      )}

      {/* 3. CHAPTER VICTORY MODAL */}
      {view === 'CHAPTER_VICTORY' && (
        <ChapterVictoryModal
          currentChapterId={currentChapterId}
          stats={stats}
          onNextChapter={() => {
            const nextCh = currentChapterId + 1;
            if (nextCh <= STORY_CHAPTERS.length) {
              startStoryGame(nextCh);
            }
          }}
          onReplayChapter={restartCurrentGame}
          onChapterSelect={() => setShowChapterSelect(true)}
          onMainMenu={() => {
            soundManager.stopMusic();
            setView('INTRO_NEURON');
          }}
        />
      )}

      {/* 4. PAUSE MENU */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={restartCurrentGame}
          onMainMenu={() => {
            setIsPaused(false);
            soundManager.stopMusic();
            setView('INTRO_NEURON');
          }}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          showMobileControls={showMobileControls}
          onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
          goreSetting={goreSetting}
          onSelectGoreSetting={handleSelectGoreSetting}
          bloodAmount={bloodAmount}
          onSelectBloodAmount={handleSelectBloodAmount}
        />
      )}

      {/* 5. GAME OVER SCREEN */}
      {view === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          onRestart={restartCurrentGame}
          onMainMenu={() => {
            soundManager.stopMusic();
            setView('INTRO_NEURON');
          }}
        />
      )}

      {/* 6. HOW TO PLAY / CONTROLS MODAL */}
      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
          onStartGame={view === 'INTRO_NEURON' ? () => startStoryGame(1) : undefined}
        />
      )}

      {/* 7. CHAPTER SELECT MODAL */}
      {showChapterSelect && (
        <ChapterSelectModal
          onClose={() => setShowChapterSelect(false)}
          onSelectChapter={(chapterId) => {
            setShowChapterSelect(false);
            startStoryGame(chapterId);
          }}
          unlockedChapterMax={unlockedChapterMax}
        />
      )}

      {/* 8. MULTIPLAYER LOBBY & SERVER HUB MODAL */}
      {showMultiplayerModal && (
        <MultiplayerModal
          onClose={() => setShowMultiplayerModal(false)}
          onLaunchMatch={handleLaunchMultiplayerMatch}
        />
      )}

    </div>
  );
}

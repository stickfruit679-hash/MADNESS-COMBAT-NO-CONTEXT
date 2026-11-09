/**
 * Types for Madness Combat: No Context
 */

import { GruntAvatarId } from './multiplayer';

export type WeaponType = 'fists' | 'knife' | 'pistol' | 'shotgun' | 'uzi';

export type GoreSetting = 'no_blood' | 'default' | 'extreme_gore';

export type BloodAmount = 'very_little' | 'not_much' | 'too_much';

export interface BloodStain {
  dx: number;
  dy: number;
  radius: number;
  color: string;
  part: 'torso' | 'head';
}

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  currentAmmo: number;
  maxAmmo: number;
  reserveAmmo: number;
  reloadTime: number;
  spread: number;
  bulletsPerShot: number;
  bulletSpeed: number;
  recoil: number;
  range: number;
  sprite: string;
}

export type EnemyType = 'grunt' | 'knife_grunt' | 'pistol_grunt' | 'shotgun_grunt' | 'agent';

export interface Character {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  facingDirection: 1 | -1;
  health: number;
  maxHealth: number;
  isPlayer: boolean;
  isRemotePlayer?: boolean;
  enemyType?: EnemyType;
  avatarId?: GruntAvatarId;
  playerName?: string;
  
  // Animation state
  walkTimer: number;
  isMoving: boolean;
  attackTimer: number;
  isAttacking: boolean;
  attackProgress: number;
  attackHand: 'left' | 'right';
  hurtTimer: number;
  isDodging: boolean;
  dodgeTimer: number;
  isDead: boolean;

  // Equipment
  weapon: Weapon;
  recoilOffset: number;
  muzzleFlashTimer: number;

  // Persistent blood on clothing and gore features
  bloodStains: BloodStain[];
  goreHeadSprite?: string;
  hasRibWound?: boolean;
  hasStabWound?: boolean;

  // AI fields
  aiState?: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee';
  aiTimer?: number;
  targetX?: number;
  targetY?: number;
}

export interface RagdollPiece {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  spriteKey: string;
  width: number;
  height: number;
  alpha: number;
  groundY: number;
  bounces: number;
  goreType?: 'ribs' | 'jaw' | 'brain' | 'stab';
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  distanceTraveled: number;
  maxDistance: number;
  color: string;
  weaponType: WeaponType;
}

export interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  splats: { dx: number; dy: number; r: number }[];
}

export interface ShellCasing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  alpha: number;
  type: 'brass' | 'red_shell';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
}

export interface GroundPickup {
  id: string;
  type: 'weapon' | 'medkit' | 'ammo';
  weaponType?: WeaponType;
  x: number;
  y: number;
  ammoAmount?: number;
  healthAmount?: number;
  floatTimer: number;
}

export type GameMode = 'story' | 'arena';

export interface StoryChapter {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  totalGrunts: number;
  oneByOne: boolean;
  startingWeapon: WeaponType;
  environment: 'field_tree' | 'desert_sun' | 'bunker' | 'club_m';
  musicType: 'boombox' | 'combat';
  hankOutfit: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: 'Where It All Started',
    subtitle: 'Madness Combat 1 (2002)',
    location: 'Nevada Grasslands · The Lone Tree & Boombox',
    description: 'An altercation breaks out over a boombox playing music. A Grunt dances happily in the background while 30 Grunts appear one by one to take you down.',
    totalGrunts: 30,
    oneByOne: true,
    startingWeapon: 'fists',
    environment: 'field_tree',
    musicType: 'boombox',
    hankOutfit: 'Standard Grunt Hank',
  },
  {
    id: 2,
    title: 'Madness Redeemer',
    subtitle: 'Madness Combat 2 (2003)',
    location: 'The Red Sun Outpost · Nevada Desert',
    description: "Beneath the eerie crimson sun of Nevada, hunt down the Sheriff's perimeter squad across the dust and barbed wire.",
    totalGrunts: 35,
    oneByOne: false,
    startingWeapon: 'pistol',
    environment: 'desert_sun',
    musicType: 'combat',
    hankOutfit: 'Head & Torso Bandages',
  },
  {
    id: 3,
    title: 'Madness Avenger',
    subtitle: 'Madness Combat 3 (2004)',
    location: 'A.A.H.W. Bunker Complex · Blast Core',
    description: 'Breach the fortified underground bunker corridors. Face armed security units with shotguns and reinforced riot body armor.',
    totalGrunts: 40,
    oneByOne: false,
    startingWeapon: 'shotgun',
    environment: 'bunker',
    musicType: 'combat',
    hankOutfit: 'Heavy Medical Gauze Wraps',
  },
  {
    id: 4,
    title: 'Madness Depredation',
    subtitle: 'Madness Combat 4 (2005)',
    location: 'Club M Nightclub · Main Floor',
    description: 'Crash through Club M under pulsating neon strobes and thunderous speakers. Neutralize all nightclub guards and elite agents.',
    totalGrunts: 50,
    oneByOne: false,
    startingWeapon: 'uzi',
    environment: 'club_m',
    musicType: 'combat',
    hankOutfit: 'Black Bandana, Red Goggles & Ninja Outfit',
  },
];

export interface GameStats {
  score: number;
  kills: number;
  wave: number;
  shotsFired: number;
  shotsHit: number;
  comboStreak: number;
  maxCombo: number;
  timeAlive: number;
  storyProgress?: {
    chapterId: number;
    gruntsKilled: number;
    gruntsTotal: number;
  };
}

export type GameView = 
  | 'INTRO_NEURON' 
  | 'INTRO_TITLE' 
  | 'CHAPTER_SELECT'
  | 'PLAYING' 
  | 'CHAPTER_VICTORY'
  | 'PAUSED' 
  | 'GAME_OVER';

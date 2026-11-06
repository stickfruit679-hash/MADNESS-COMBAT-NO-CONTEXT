/**
 * Types for Madness Combat: No Context
 */

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
  enemyType?: EnemyType;
  
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

export interface GameStats {
  score: number;
  kills: number;
  wave: number;
  shotsFired: number;
  shotsHit: number;
  comboStreak: number;
  maxCombo: number;
  timeAlive: number;
}

export type GameView = 
  | 'INTRO_NEURON' 
  | 'INTRO_TITLE' 
  | 'HOW_TO_PLAY' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'GAME_OVER';

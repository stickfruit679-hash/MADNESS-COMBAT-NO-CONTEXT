/**
 * Multiplayer Types for Madness Combat: No Context
 */

import { WeaponType } from './game';

export type GruntAvatarId = 
  | 'classic_grunt'
  | 'bandaged_grunt'
  | 'gauze_grunt'
  | 'ninja_grunt'
  | 'agent_grunt'
  | 'dancing_grunt'
  | 'gore_jaw_grunt'
  | 'gore_brain_grunt'
  | 'gore_split_grunt'
  | 'elite_grunt';

export interface GruntAvatarInfo {
  id: GruntAvatarId;
  name: string;
  tagline: string;
  tier: 'Standard' | 'Story Hank' | 'A.A.H.W.' | 'Extreme Gore';
  accentColor: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: GruntAvatarId;
  isHost: boolean;
  isReady: boolean;
  ping: number;
  kills?: number;
  deaths?: number;
  health?: number;
  score?: number;
}

export type MultiplayerMapId = 
  | 'field_tree' 
  | 'desert_sun' 
  | 'bunker' 
  | 'club_m' 
  | 'arena';

export type MultiplayerModeId = 
  | 'deathmatch' 
  | 'coop_survival' 
  | 'story_rush';

export interface MultiplayerServer {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  map: MultiplayerMapId;
  gameMode: MultiplayerModeId;
  maxPlayers: number;
  players: PlayerProfile[];
  status: 'lobby' | 'in_game';
  createdAt: number;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  killerAvatar: GruntAvatarId;
  victimName: string;
  victimAvatar: GruntAvatarId;
  weaponType: WeaponType;
  timestamp: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  avatar: GruntAvatarId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  isMoving: boolean;
  weaponType: WeaponType;
  health: number;
  maxHealth: number;
  isDead: boolean;
  isAttacking: boolean;
  hurtTimer: number;
  isHost: boolean;
  lastUpdated: number;
}

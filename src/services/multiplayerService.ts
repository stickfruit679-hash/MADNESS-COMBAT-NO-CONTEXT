/**
 * Real-Time Multiplayer Service for Madness Combat: No Context
 * Connects to the authoritative WebSocket server on port 3000 to enable
 * real-time lobbies, chat, server browsing, player kicking, match launching,
 * and in-game combat sync among REAL PLAYERS (NO BOTS).
 */

import { 
  GruntAvatarId, 
  MultiplayerServer, 
  PlayerProfile, 
  MultiplayerMapId, 
  MultiplayerModeId,
  RemotePlayerState
} from '../types/multiplayer';

const STORAGE_KEY_PROFILE = 'mc_player_profile';

export type MultiplayerEvent = 
  | { type: 'SERVER_LIST_UPDATED'; servers: MultiplayerServer[] }
  | { type: 'PLAYER_JOINED'; serverId: string; player: PlayerProfile; server?: MultiplayerServer }
  | { type: 'PLAYER_LEFT'; serverId: string; playerId: string; server?: MultiplayerServer }
  | { type: 'PLAYER_KICKED'; serverId: string; playerId: string; kickerName: string }
  | { type: 'MATCH_STARTED'; serverId: string; map: MultiplayerMapId; gameMode: MultiplayerModeId; server?: MultiplayerServer }
  | { type: 'SERVER_UPDATED'; server: MultiplayerServer }
  | { type: 'WS_STATUS'; connected: boolean };

export type RemotePlayerCallback = (state: RemotePlayerState) => void;
export type RemoteShootCallback = (shoot: { playerId: string; x: number; y: number; angle: number; weaponType: string }) => void;
export type RemoteHitCallback = (hit: { targetPlayerId: string; damage: number; attackerId: string }) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private listeners: ((event: MultiplayerEvent) => void)[] = [];
  private remotePlayerListeners: RemotePlayerCallback[] = [];
  private remoteShootListeners: RemoteShootCallback[] = [];
  private remoteHitListeners: RemoteHitCallback[] = [];

  private currentServer: MultiplayerServer | null = null;
  private localProfile: PlayerProfile;
  private cachedServers: MultiplayerServer[] = [];
  private isConnected = false;
  private reconnectTimer: any = null;

  constructor() {
    this.localProfile = this.loadLocalProfile();
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify({ type: 'WS_STATUS', connected: true });

        // Register client info with server
        this.send({
          type: 'INIT_CLIENT',
          player: this.localProfile,
        });

        // Request latest real servers
        this.send({ type: 'GET_SERVERS' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('Error parsing incoming WS message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify({ type: 'WS_STATUS', connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // ws error
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, 2500);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'SERVER_LIST_UPDATED': {
        this.cachedServers = (msg.servers || []).map((s: any) => ({
          ...s,
          map: s.map as MultiplayerMapId,
          gameMode: s.gameMode as MultiplayerModeId,
        }));
        
        // Update current server if active
        if (this.currentServer) {
          const updated = this.cachedServers.find((s) => s.id === this.currentServer!.id);
          this.currentServer = updated ? { ...updated } : null;
        }

        this.notify({
          type: 'SERVER_LIST_UPDATED',
          servers: this.cachedServers,
        });
        break;
      }

      case 'SERVER_CREATED': {
        this.currentServer = msg.server;
        this.notify({
          type: 'SERVER_UPDATED',
          server: msg.server,
        });
        break;
      }

      case 'JOINED_SERVER': {
        this.currentServer = msg.server;
        this.notify({
          type: 'SERVER_UPDATED',
          server: msg.server,
        });
        break;
      }

      case 'JOIN_ERROR': {
        // Handled via listener or status message
        break;
      }

      case 'PLAYER_JOINED': {
        if (msg.server) {
          this.currentServer = msg.server;
        }
        this.notify({
          type: 'PLAYER_JOINED',
          serverId: msg.serverId,
          player: msg.player,
          server: msg.server,
        });
        break;
      }

      case 'PLAYER_LEFT': {
        if (msg.server) {
          this.currentServer = msg.server;
        }
        this.notify({
          type: 'PLAYER_LEFT',
          serverId: msg.serverId,
          playerId: msg.playerId,
          server: msg.server,
        });
        break;
      }

      case 'PLAYER_KICKED': {
        if (msg.playerId === this.localProfile.id) {
          this.currentServer = null;
        }
        this.notify({
          type: 'PLAYER_KICKED',
          serverId: msg.serverId,
          playerId: msg.playerId,
          kickerName: msg.kickerName,
        });
        break;
      }

      case 'SERVER_UPDATED': {
        if (this.currentServer && this.currentServer.id === msg.server.id) {
          this.currentServer = msg.server;
        }
        this.notify({
          type: 'SERVER_UPDATED',
          server: msg.server,
        });
        break;
      }

      case 'MATCH_STARTED': {
        if (msg.server) {
          this.currentServer = msg.server;
        }
        this.notify({
          type: 'MATCH_STARTED',
          serverId: msg.serverId,
          map: msg.map,
          gameMode: msg.gameMode,
          server: msg.server,
        });
        break;
      }

      // Real-time gameplay events
      case 'REMOTE_PLAYER_UPDATE': {
        this.remotePlayerListeners.forEach((fn) => fn(msg.state));
        break;
      }

      case 'REMOTE_PLAYER_SHOOT': {
        this.remoteShootListeners.forEach((fn) => fn(msg.shoot));
        break;
      }

      case 'REMOTE_PLAYER_HIT': {
        this.remoteHitListeners.forEach((fn) => fn(msg.hit));
        break;
      }
    }
  }

  private notify(event: MultiplayerEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in multiplayer listener', err);
      }
    });
  }

  public subscribe(listener: (event: MultiplayerEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Profile Management
  public getProfile(): PlayerProfile {
    return { ...this.localProfile };
  }

  public updateProfile(name: string, avatar: GruntAvatarId): PlayerProfile {
    const trimmed = name.trim().slice(0, 18) || 'Hank Wimbleton';
    this.localProfile = {
      ...this.localProfile,
      name: trimmed,
      avatar,
    };

    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(this.localProfile));
    } catch {
      // ignore
    }

    // Send update to server so room and server list reflect new name and avatar
    this.send({
      type: 'UPDATE_PROFILE',
      player: this.localProfile,
    });

    return { ...this.localProfile };
  }

  private loadLocalProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.avatar) {
          return {
            id: parsed.id || `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: parsed.name,
            avatar: parsed.avatar,
            isHost: false,
            isReady: true,
            ping: 18,
          };
        }
      }
    } catch {
      // fallback
    }

    const defaultId = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newProfile: PlayerProfile = {
      id: defaultId,
      name: 'Hank Wimbleton',
      avatar: 'ninja_grunt',
      isHost: false,
      isReady: true,
      ping: 18,
    };

    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
    } catch {
      // ignore
    }
    return newProfile;
  }

  // Server List Operations
  public getServers(): MultiplayerServer[] {
    return [...this.cachedServers];
  }

  public refreshServers() {
    this.send({ type: 'GET_SERVERS' });
  }

  // Create Server (REAL PLAYERS ONLY - NO BOTS)
  public createServer(
    name: string,
    map: MultiplayerMapId = 'arena',
    gameMode: MultiplayerModeId = 'deathmatch',
    maxPlayers: number = 4
  ): MultiplayerServer {
    const cleanName = name.trim().slice(0, 24) || `${this.localProfile.name}'s Carnage`;

    const hostProfile: PlayerProfile = {
      ...this.localProfile,
      isHost: true,
      isReady: true,
      ping: 18,
    };

    const tempServer: MultiplayerServer = {
      id: `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      code: `NEV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: cleanName,
      hostId: this.localProfile.id,
      hostName: this.localProfile.name,
      map,
      gameMode,
      maxPlayers,
      players: [hostProfile],
      status: 'lobby',
      createdAt: Date.now(),
    };

    this.currentServer = tempServer;

    this.send({
      type: 'CREATE_SERVER',
      name: cleanName,
      map,
      gameMode,
      maxPlayers,
      player: hostProfile,
    });

    return tempServer;
  }

  // Join Server by ID or Code
  public joinServer(serverIdOrCode: string): { success: boolean; error?: string; server?: MultiplayerServer } {
    const query = serverIdOrCode.trim().toUpperCase();
    const target = this.cachedServers.find(
      (s) => s.id === serverIdOrCode || s.code.toUpperCase() === query
    );

    this.send({
      type: 'JOIN_SERVER',
      serverIdOrCode,
      player: this.localProfile,
    });

    if (target) {
      this.currentServer = target;
      return { success: true, server: target };
    }

    return { success: true };
  }

  // Leave Server
  public leaveServer(): void {
    if (this.currentServer) {
      this.send({
        type: 'LEAVE_SERVER',
        serverId: this.currentServer.id,
      });
      this.currentServer = null;
    }
  }

  // Host Kick Player (Only host can kick)
  public kickPlayer(serverId: string, targetPlayerId: string): boolean {
    if (!this.currentServer || this.currentServer.hostId !== this.localProfile.id) {
      return false;
    }

    this.send({
      type: 'KICK_PLAYER',
      serverId,
      targetPlayerId,
    });

    return true;
  }

  // Host Start Match
  public startMatch(serverId: string): boolean {
    if (!this.currentServer || this.currentServer.hostId !== this.localProfile.id) {
      return false;
    }

    this.send({
      type: 'START_MATCH',
      serverId,
    });

    return true;
  }

  // Get current active server
  public getCurrentServer(): MultiplayerServer | null {
    return this.currentServer;
  }

  // In-Game Real-Time Combat Sync Methods
  public sendPlayerState(state: RemotePlayerState) {
    this.send({
      type: 'PLAYER_STATE',
      state,
    });
  }

  public sendPlayerShoot(shoot: { playerId: string; x: number; y: number; angle: number; weaponType: string }) {
    this.send({
      type: 'PLAYER_SHOOT',
      shoot,
    });
  }

  public sendPlayerHit(hit: { targetPlayerId: string; damage: number; attackerId: string }) {
    this.send({
      type: 'PLAYER_HIT',
      hit,
    });
  }

  public onRemotePlayerUpdate(callback: RemotePlayerCallback): () => void {
    this.remotePlayerListeners.push(callback);
    return () => {
      this.remotePlayerListeners = this.remotePlayerListeners.filter((c) => c !== callback);
    };
  }

  public onRemotePlayerShoot(callback: RemoteShootCallback): () => void {
    this.remoteShootListeners.push(callback);
    return () => {
      this.remoteShootListeners = this.remoteShootListeners.filter((c) => c !== callback);
    };
  }

  public onRemotePlayerHit(callback: RemoteHitCallback): () => void {
    this.remoteHitListeners.push(callback);
    return () => {
      this.remoteHitListeners = this.remoteHitListeners.filter((c) => c !== callback);
    };
  }
}

export const multiplayerService = new MultiplayerService();

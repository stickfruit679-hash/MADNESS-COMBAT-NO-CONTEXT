/**
 * Global Real-Time Multiplayer Service for Madness Combat: No Context
 * Connects across different domains, Cloud Run instances, and devices using
 * public secure MQTT over WebSocket + Local WebSocket + BroadcastChannel.
 * Real human players only (NO BOTS).
 */

import mqtt, { MqttClient } from 'mqtt';
import { 
  GruntAvatarId, 
  MultiplayerServer, 
  PlayerProfile, 
  MultiplayerMapId, 
  MultiplayerModeId,
  RemotePlayerState
} from '../types/multiplayer';

const STORAGE_KEY_PROFILE = 'mc_player_profile';
const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const TOPIC_GLOBAL_ANNOUNCE = 'madness_combat_v2/servers/announce';
const TOPIC_GLOBAL_QUERY = 'madness_combat_v2/servers/query';

export type MultiplayerEvent = 
  | { type: 'SERVER_LIST_UPDATED'; servers: MultiplayerServer[] }
  | { type: 'PLAYER_JOINED'; serverId: string; player: PlayerProfile; server?: MultiplayerServer }
  | { type: 'PLAYER_LEFT'; serverId: string; playerId: string; server?: MultiplayerServer }
  | { type: 'PLAYER_KICKED'; serverId: string; playerId: string; kickerName: string }
  | { type: 'MATCH_STARTED'; serverId: string; map: MultiplayerMapId; gameMode: MultiplayerModeId; server?: MultiplayerServer }
  | { type: 'SERVER_UPDATED'; server: MultiplayerServer }
  | { type: 'NET_STATUS'; connected: boolean };

export type RemotePlayerCallback = (state: RemotePlayerState) => void;
export type RemoteShootCallback = (shoot: { playerId: string; x: number; y: number; angle: number; weaponType: string }) => void;
export type RemoteHitCallback = (hit: { targetPlayerId: string; damage: number; attackerId: string }) => void;

interface TrackedServer extends MultiplayerServer {
  lastSeen: number;
}

class MultiplayerService {
  private mqttClient: MqttClient | null = null;
  private wsLocal: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;

  private listeners: ((event: MultiplayerEvent) => void)[] = [];
  private remotePlayerListeners: RemotePlayerCallback[] = [];
  private remoteShootListeners: RemoteShootCallback[] = [];
  private remoteHitListeners: RemoteHitCallback[] = [];

  private currentServer: MultiplayerServer | null = null;
  private localProfile: PlayerProfile;
  private activeServersMap = new Map<string, TrackedServer>();
  private heartbeatInterval: any = null;
  private cleanupInterval: any = null;
  private isConnected = false;

  constructor() {
    this.localProfile = this.loadLocalProfile();
    this.initMqtt();
    this.initLocalFallback();
    this.startCleanupTimer();
  }

  // 1. MQTT Global Cloud Mesh Connection
  private initMqtt() {
    if (typeof window === 'undefined') return;

    try {
      const clientId = `mc_grunt_${this.localProfile.id}_${Math.floor(Math.random() * 10000)}`;
      this.mqttClient = mqtt.connect(MQTT_BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2500,
      });

      this.mqttClient.on('connect', () => {
        this.isConnected = true;
        this.notify({ type: 'NET_STATUS', connected: true });

        // Subscribe to global server discovery
        this.mqttClient?.subscribe(TOPIC_GLOBAL_ANNOUNCE);
        this.mqttClient?.subscribe(TOPIC_GLOBAL_QUERY);

        // If already in a room, resubscribe to room topics
        if (this.currentServer) {
          this.subscribeToRoom(this.currentServer.code);
        }

        // Query active servers across the globe
        this.queryServers();
      });

      this.mqttClient.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          this.handleMqttMessage(topic, msg);
        } catch (err) {
          // ignore malformed
        }
      });

      this.mqttClient.on('close', () => {
        this.isConnected = false;
        this.notify({ type: 'NET_STATUS', connected: false });
      });

      this.mqttClient.on('error', () => {
        // fallback
      });
    } catch (err) {
      console.warn('MQTT initialization error, relying on local transport', err);
    }
  }

  // 2. Local Fallback (BroadcastChannel + Local ws)
  private initLocalFallback() {
    if (typeof window === 'undefined') return;

    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('madness_combat_local_bus');
        this.channel.onmessage = (e) => {
          this.handleLocalEvent(e.data);
        };
      }
    } catch {
      // ignore
    }

    // Connect to local dev server WebSocket if available
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.wsLocal = new WebSocket(wsUrl);
      this.wsLocal.onopen = () => {
        this.wsLocal?.send(JSON.stringify({
          type: 'INIT_CLIENT',
          player: this.localProfile,
        }));
      };
      this.wsLocal.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SERVER_LIST_UPDATED') {
            (msg.servers || []).forEach((s: MultiplayerServer) => {
              this.activeServersMap.set(s.code, { ...s, lastSeen: Date.now() });
            });
            this.notifyServerList();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }

  private handleLocalEvent(event: any) {
    if (event.type === 'LOCAL_ANNOUNCE' && event.server) {
      this.activeServersMap.set(event.server.code, { ...event.server, lastSeen: Date.now() });
      this.notifyServerList();
    }
  }

  // Handle MQTT Messages across topics
  private handleMqttMessage(topic: string, msg: any) {
    // A. Global Server Announcements
    if (topic === TOPIC_GLOBAL_ANNOUNCE) {
      if (msg.type === 'SERVER_HEARTBEAT' && msg.server) {
        this.activeServersMap.set(msg.server.code, {
          ...msg.server,
          lastSeen: Date.now(),
        });

        // If this is our active server, sync state
        if (this.currentServer && this.currentServer.code === msg.server.code) {
          this.currentServer = msg.server;
          this.notify({ type: 'SERVER_UPDATED', server: msg.server });
        }

        this.notifyServerList();
      } else if (msg.type === 'SERVER_CLOSED' && msg.code) {
        this.activeServersMap.delete(msg.code);
        this.notifyServerList();
      }
      return;
    }

    // B. Global Query from another client looking for active servers
    if (topic === TOPIC_GLOBAL_QUERY) {
      if (this.currentServer && this.currentServer.hostId === this.localProfile.id) {
        this.publishServerHeartbeat();
      }
      return;
    }

    // C. Room-Specific Messages
    const roomPrefix = 'madness_combat_v2/room/';
    if (topic.startsWith(roomPrefix)) {
      const roomCode = topic.replace(roomPrefix, '');

      switch (msg.type) {
        case 'JOIN_REQUEST': {
          // Only the Host handles join requests
          if (this.currentServer && this.currentServer.hostId === this.localProfile.id && this.currentServer.code === roomCode) {
            const joiningPlayer: PlayerProfile = msg.player;
            if (!this.currentServer.players.some((p) => p.id === joiningPlayer.id)) {
              if (this.currentServer.players.length < this.currentServer.maxPlayers) {
                this.currentServer.players.push(joiningPlayer);
                this.publishRoomMessage(roomCode, {
                  type: 'SERVER_STATE',
                  server: this.currentServer,
                });
                this.publishServerHeartbeat();
              }
            }
          }
          break;
        }

        case 'SERVER_STATE': {
          if (this.currentServer && this.currentServer.code === roomCode) {
            this.currentServer = msg.server;
            this.notify({
              type: 'SERVER_UPDATED',
              server: msg.server,
            });
            this.activeServersMap.set(roomCode, { ...msg.server, lastSeen: Date.now() });
            this.notifyServerList();
          }
          break;
        }

        case 'UPDATE_PROFILE': {
          if (this.currentServer && this.currentServer.hostId === this.localProfile.id && this.currentServer.code === roomCode) {
            const updatedPlayer: PlayerProfile = msg.player;
            this.currentServer.players = this.currentServer.players.map((p) =>
              p.id === updatedPlayer.id ? { ...p, name: updatedPlayer.name, avatar: updatedPlayer.avatar } : p
            );
            this.publishRoomMessage(roomCode, {
              type: 'SERVER_STATE',
              server: this.currentServer,
            });
            this.publishServerHeartbeat();
          }
          break;
        }

        case 'PLAYER_KICKED': {
          if (msg.targetPlayerId === this.localProfile.id) {
            this.currentServer = null;
            this.notify({
              type: 'PLAYER_KICKED',
              serverId: msg.serverId || '',
              playerId: msg.targetPlayerId,
              kickerName: msg.kickerName || 'Host',
            });
          }
          break;
        }

        case 'START_MATCH': {
          if (this.currentServer && this.currentServer.code === roomCode) {
            this.currentServer.status = 'in_game';
            this.notify({
              type: 'MATCH_STARTED',
              serverId: this.currentServer.id,
              map: this.currentServer.map,
              gameMode: this.currentServer.gameMode,
              server: this.currentServer,
            });
          }
          break;
        }

        case 'PLAYER_LEFT': {
          if (this.currentServer && this.currentServer.hostId === this.localProfile.id && this.currentServer.code === roomCode) {
            this.currentServer.players = this.currentServer.players.filter((p) => p.id !== msg.playerId);
            if (this.currentServer.players.length === 0) {
              this.closeCurrentServer();
            } else {
              this.publishRoomMessage(roomCode, {
                type: 'SERVER_STATE',
                server: this.currentServer,
              });
              this.publishServerHeartbeat();
            }
          }
          break;
        }
      }
      return;
    }

    // D. In-Game Match Combat Messages
    const matchPrefix = 'madness_combat_v2/match/';
    if (topic.startsWith(matchPrefix)) {
      switch (msg.type) {
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
  }

  // Periodic cleanup of inactive servers (servers that haven't sent a heartbeat in 10s)
  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.activeServersMap.forEach((s, key) => {
        // If server hasn't sent heartbeat in 10s and is not our own local hosted server
        if (now - s.lastSeen > 10000 && (!this.currentServer || this.currentServer.code !== key)) {
          this.activeServersMap.delete(key);
          changed = true;
        }
      });
      if (changed) {
        this.notifyServerList();
      }
    }, 3000);
  }

  private notifyServerList() {
    const list = Array.from(this.activeServersMap.values()).map((ts) => {
      const { lastSeen, ...server } = ts;
      return server;
    });
    this.notify({ type: 'SERVER_LIST_UPDATED', servers: list });
  }

  private notify(event: MultiplayerEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in multiplayer event listener', err);
      }
    });
  }

  public subscribe(listener: (event: MultiplayerEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Query global servers from all active hosts
  public queryServers() {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(TOPIC_GLOBAL_QUERY, JSON.stringify({ type: 'QUERY' }));
    }
    if (this.wsLocal && this.wsLocal.readyState === WebSocket.OPEN) {
      this.wsLocal.send(JSON.stringify({ type: 'GET_SERVERS' }));
    }
  }

  // Room Subscription
  private subscribeToRoom(roomCode: string) {
    if (!this.mqttClient) return;
    const roomTopic = `madness_combat_v2/room/${roomCode}`;
    const matchTopic = `madness_combat_v2/match/${roomCode}`;
    this.mqttClient.subscribe(roomTopic);
    this.mqttClient.subscribe(matchTopic);
  }

  private unsubscribeFromRoom(roomCode: string) {
    if (!this.mqttClient) return;
    const roomTopic = `madness_combat_v2/room/${roomCode}`;
    const matchTopic = `madness_combat_v2/match/${roomCode}`;
    this.mqttClient.unsubscribe(roomTopic);
    this.mqttClient.unsubscribe(matchTopic);
  }

  private publishRoomMessage(roomCode: string, payload: any) {
    const topic = `madness_combat_v2/room/${roomCode}`;
    const data = JSON.stringify(payload);
    this.mqttClient?.publish(topic, data);
    this.channel?.postMessage({ type: 'ROOM_MSG', roomCode, payload });
  }

  private publishServerHeartbeat() {
    if (!this.currentServer) return;
    const payload = JSON.stringify({
      type: 'SERVER_HEARTBEAT',
      server: this.currentServer,
    });
    this.mqttClient?.publish(TOPIC_GLOBAL_ANNOUNCE, payload);
    this.channel?.postMessage({ type: 'LOCAL_ANNOUNCE', server: this.currentServer });
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

    if (this.currentServer) {
      if (this.currentServer.hostId === this.localProfile.id) {
        this.currentServer.players = this.currentServer.players.map((p) =>
          p.id === this.localProfile.id ? { ...p, name: trimmed, avatar } : p
        );
        this.currentServer.hostName = trimmed;
        this.publishRoomMessage(this.currentServer.code, {
          type: 'SERVER_STATE',
          server: this.currentServer,
        });
        this.publishServerHeartbeat();
      } else {
        this.publishRoomMessage(this.currentServer.code, {
          type: 'UPDATE_PROFILE',
          player: this.localProfile,
        });
      }
    }

    return { ...this.localProfile };
  }

  private loadLocalProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.avatar) {
          return {
            id: parsed.id || `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
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

    const defaultId = `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
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
    const list = Array.from(this.activeServersMap.values()).map((ts) => {
      const { lastSeen, ...server } = ts;
      return server;
    });
    return list;
  }

  public refreshServers() {
    this.queryServers();
  }

  // Create Server (REAL HUMANS ONLY - NO BOTS)
  public createServer(
    name: string,
    map: MultiplayerMapId = 'arena',
    gameMode: MultiplayerModeId = 'deathmatch',
    maxPlayers: number = 4
  ): MultiplayerServer {
    const cleanName = name.trim().slice(0, 24) || `${this.localProfile.name}'s Carnage`;
    const code = `NEV-${Math.floor(1000 + Math.random() * 9000)}`;

    const hostProfile: PlayerProfile = {
      ...this.localProfile,
      isHost: true,
      isReady: true,
      ping: 18,
    };

    const newServer: MultiplayerServer = {
      id: `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      code,
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

    this.currentServer = newServer;
    this.activeServersMap.set(code, { ...newServer, lastSeen: Date.now() });

    // Subscribe to room topics
    this.subscribeToRoom(code);

    // Publish initial announcement and start 3s heartbeat
    this.publishServerHeartbeat();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.publishServerHeartbeat();
    }, 3000);

    // Also notify local backend
    this.wsLocal?.send(JSON.stringify({
      type: 'CREATE_SERVER',
      name: cleanName,
      map,
      gameMode,
      maxPlayers,
      player: hostProfile,
    }));

    this.notifyServerList();
    return newServer;
  }

  // Join Server by ID or Code
  public joinServer(serverIdOrCode: string): { success: boolean; error?: string; server?: MultiplayerServer } {
    const query = serverIdOrCode.trim().toUpperCase();

    // Check if server is in active servers map
    let target: TrackedServer | undefined;
    for (const [code, s] of this.activeServersMap.entries()) {
      if (s.id === serverIdOrCode || s.code.toUpperCase() === query || code.toUpperCase() === query) {
        target = s;
        break;
      }
    }

    const roomCode = target ? target.code : query;

    // Set local optimistic state
    if (target) {
      if (target.players.length >= target.maxPlayers) {
        return { success: false, error: 'Server is full!' };
      }
      this.currentServer = { ...target };
    } else {
      // Optimistic connect by code
      this.currentServer = {
        id: `srv_direct_${roomCode}`,
        code: roomCode,
        name: `Server ${roomCode}`,
        hostId: 'remote',
        hostName: 'Host',
        map: 'arena',
        gameMode: 'deathmatch',
        maxPlayers: 4,
        players: [this.localProfile],
        status: 'lobby',
        createdAt: Date.now(),
      };
    }

    // Subscribe to room and send join request
    this.subscribeToRoom(roomCode);
    this.publishRoomMessage(roomCode, {
      type: 'JOIN_REQUEST',
      player: this.localProfile,
    });

    // Also notify local backend
    this.wsLocal?.send(JSON.stringify({
      type: 'JOIN_SERVER',
      serverIdOrCode: roomCode,
      player: this.localProfile,
    }));

    return { success: true, server: this.currentServer };
  }

  // Leave Server
  public leaveServer(): void {
    if (this.currentServer) {
      const roomCode = this.currentServer.code;
      if (this.currentServer.hostId === this.localProfile.id) {
        this.closeCurrentServer();
      } else {
        this.publishRoomMessage(roomCode, {
          type: 'PLAYER_LEFT',
          playerId: this.localProfile.id,
        });
      }
      this.unsubscribeFromRoom(roomCode);
      this.currentServer = null;
    }
  }

  private closeCurrentServer() {
    if (!this.currentServer) return;
    const code = this.currentServer.code;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.mqttClient?.publish(TOPIC_GLOBAL_ANNOUNCE, JSON.stringify({
      type: 'SERVER_CLOSED',
      code,
    }));
    this.activeServersMap.delete(code);
    this.notifyServerList();
  }

  // Host Kick Player (Only host can kick)
  public kickPlayer(serverId: string, targetPlayerId: string): boolean {
    if (!this.currentServer || this.currentServer.hostId !== this.localProfile.id) {
      return false;
    }

    this.currentServer.players = this.currentServer.players.filter((p) => p.id !== targetPlayerId);

    // Notify room and target
    this.publishRoomMessage(this.currentServer.code, {
      type: 'PLAYER_KICKED',
      serverId,
      targetPlayerId,
      kickerName: this.localProfile.name,
    });

    this.publishRoomMessage(this.currentServer.code, {
      type: 'SERVER_STATE',
      server: this.currentServer,
    });

    this.publishServerHeartbeat();
    return true;
  }

  // Host Start Match
  public startMatch(serverId: string): boolean {
    if (!this.currentServer || this.currentServer.hostId !== this.localProfile.id) {
      return false;
    }

    this.currentServer.status = 'in_game';

    this.publishRoomMessage(this.currentServer.code, {
      type: 'START_MATCH',
      serverId,
      server: this.currentServer,
    });

    this.publishServerHeartbeat();
    return true;
  }

  public getCurrentServer(): MultiplayerServer | null {
    return this.currentServer;
  }

  // In-Game Real-Time Combat Synchronization
  public sendPlayerState(state: RemotePlayerState) {
    if (!this.currentServer) return;
    const topic = `madness_combat_v2/match/${this.currentServer.code}`;
    const payload = JSON.stringify({
      type: 'REMOTE_PLAYER_UPDATE',
      state,
    });
    this.mqttClient?.publish(topic, payload);
    this.channel?.postMessage({ type: 'MATCH_STATE', payload: state });
  }

  public sendPlayerShoot(shoot: { playerId: string; x: number; y: number; angle: number; weaponType: string }) {
    if (!this.currentServer) return;
    const topic = `madness_combat_v2/match/${this.currentServer.code}`;
    const payload = JSON.stringify({
      type: 'REMOTE_PLAYER_SHOOT',
      shoot,
    });
    this.mqttClient?.publish(topic, payload);
  }

  public sendPlayerHit(hit: { targetPlayerId: string; damage: number; attackerId: string }) {
    if (!this.currentServer) return;
    const topic = `madness_combat_v2/match/${this.currentServer.code}`;
    const payload = JSON.stringify({
      type: 'REMOTE_PLAYER_HIT',
      hit,
    });
    this.mqttClient?.publish(topic, payload);
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

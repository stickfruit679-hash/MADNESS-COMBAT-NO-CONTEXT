import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  ping: number;
}

interface MultiplayerServer {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  map: string;
  gameMode: string;
  maxPlayers: number;
  players: PlayerProfile[];
  status: 'lobby' | 'in_game';
  createdAt: number;
}

// In-memory real server registry (Real human players only - NO bots)
const activeServers = new Map<string, MultiplayerServer>();

interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  serverId: string | null;
  name: string;
  avatar: string;
}

const clients = new Map<WebSocket, ConnectedClient>();

function broadcastServerList() {
  const serverList = Array.from(activeServers.values());
  const payload = JSON.stringify({
    type: 'SERVER_LIST_UPDATED',
    servers: serverList,
  });

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function broadcastToRoom(serverId: string, message: any, excludeWs?: WebSocket) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  clients.forEach((client) => {
    if (client.serverId === serverId && client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health and API routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      connectedClients: clients.size,
      activeServers: activeServers.size,
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientData: ConnectedClient = {
      ws,
      playerId: `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      serverId: null,
      name: 'Hank Wimbleton',
      avatar: 'ninja_grunt',
    };
    clients.set(ws, clientData);

    // Send initial active real servers list
    ws.send(JSON.stringify({
      type: 'SERVER_LIST_UPDATED',
      servers: Array.from(activeServers.values()),
    }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'INIT_CLIENT': {
            if (msg.player) {
              clientData.playerId = msg.player.id || clientData.playerId;
              clientData.name = msg.player.name || clientData.name;
              clientData.avatar = msg.player.avatar || clientData.avatar;
            }
            break;
          }

          case 'GET_SERVERS': {
            ws.send(JSON.stringify({
              type: 'SERVER_LIST_UPDATED',
              servers: Array.from(activeServers.values()),
            }));
            break;
          }

          case 'CREATE_SERVER': {
            const { name, map, gameMode, maxPlayers, player } = msg;
            const code = `NEV-${Math.floor(1000 + Math.random() * 9000)}`;
            const serverId = `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            const hostPlayer: PlayerProfile = {
              id: player.id || clientData.playerId,
              name: player.name || clientData.name,
              avatar: player.avatar || clientData.avatar,
              isHost: true,
              isReady: true,
              ping: 18,
            };

            const newServer: MultiplayerServer = {
              id: serverId,
              code,
              name: name || `${hostPlayer.name}'s Carnage`,
              hostId: hostPlayer.id,
              hostName: hostPlayer.name,
              map: map || 'arena',
              gameMode: gameMode || 'deathmatch',
              maxPlayers: maxPlayers || 4,
              players: [hostPlayer],
              status: 'lobby',
              createdAt: Date.now(),
            };

            activeServers.set(serverId, newServer);
            clientData.serverId = serverId;
            clientData.playerId = hostPlayer.id;

            ws.send(JSON.stringify({
              type: 'SERVER_CREATED',
              server: newServer,
            }));

            broadcastServerList();
            break;
          }

          case 'JOIN_SERVER': {
            const { serverIdOrCode, player } = msg;
            const query = (serverIdOrCode || '').trim().toUpperCase();

            let targetServer: MultiplayerServer | undefined;
            for (const s of activeServers.values()) {
              if (s.id === serverIdOrCode || s.code.toUpperCase() === query) {
                targetServer = s;
                break;
              }
            }

            if (!targetServer) {
              ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                error: 'Server not found with that Code or ID.',
              }));
              return;
            }

            if (targetServer.players.length >= targetServer.maxPlayers) {
              ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                error: 'This server is already full!',
              }));
              return;
            }

            const pId = player.id || clientData.playerId;
            clientData.serverId = targetServer.id;
            clientData.playerId = pId;
            clientData.name = player.name;
            clientData.avatar = player.avatar;

            // Check if already in roster
            const existingIndex = targetServer.players.findIndex((p) => p.id === pId);
            const joiningProfile: PlayerProfile = {
              id: pId,
              name: player.name || 'Nevada Grunt',
              avatar: player.avatar || 'classic_grunt',
              isHost: false,
              isReady: true,
              ping: Math.floor(20 + Math.random() * 20),
            };

            if (existingIndex === -1) {
              targetServer.players.push(joiningProfile);
            } else {
              targetServer.players[existingIndex] = joiningProfile;
            }

            ws.send(JSON.stringify({
              type: 'JOINED_SERVER',
              server: targetServer,
            }));

            broadcastToRoom(targetServer.id, {
              type: 'PLAYER_JOINED',
              serverId: targetServer.id,
              player: joiningProfile,
              server: targetServer,
            }, ws);

            broadcastServerList();
            break;
          }

          case 'UPDATE_PROFILE': {
            const { player } = msg;
            if (!player) return;
            clientData.name = player.name;
            clientData.avatar = player.avatar;

            if (clientData.serverId && activeServers.has(clientData.serverId)) {
              const server = activeServers.get(clientData.serverId)!;
              server.players = server.players.map((p) =>
                p.id === clientData.playerId ? { ...p, name: player.name, avatar: player.avatar } : p
              );

              if (server.hostId === clientData.playerId) {
                server.hostName = player.name;
              }

              broadcastToRoom(server.id, {
                type: 'SERVER_UPDATED',
                server,
              });
              broadcastServerList();
            }
            break;
          }

          case 'LEAVE_SERVER': {
            if (clientData.serverId && activeServers.has(clientData.serverId)) {
              const server = activeServers.get(clientData.serverId)!;
              server.players = server.players.filter((p) => p.id !== clientData.playerId);

              if (server.players.length === 0) {
                activeServers.delete(server.id);
              } else if (server.hostId === clientData.playerId) {
                // Pass host to next remaining player
                server.players[0].isHost = true;
                server.hostId = server.players[0].id;
                server.hostName = server.players[0].name;
              }

              broadcastToRoom(server.id, {
                type: 'PLAYER_LEFT',
                serverId: server.id,
                playerId: clientData.playerId,
                server,
              });

              clientData.serverId = null;
              broadcastServerList();
            }
            break;
          }

          case 'KICK_PLAYER': {
            const { serverId, targetPlayerId } = msg;
            const server = activeServers.get(serverId);
            if (!server) return;

            // Only the host can kick players
            if (server.hostId !== clientData.playerId) {
              return;
            }

            server.players = server.players.filter((p) => p.id !== targetPlayerId);

            // Notify kicked client
            clients.forEach((c) => {
              if (c.playerId === targetPlayerId && c.serverId === serverId) {
                c.serverId = null;
                if (c.ws.readyState === WebSocket.OPEN) {
                  c.ws.send(JSON.stringify({
                    type: 'PLAYER_KICKED',
                    serverId,
                    playerId: targetPlayerId,
                    kickerName: clientData.name,
                  }));
                }
              }
            });

            // Notify remaining players in the room
            broadcastToRoom(serverId, {
              type: 'SERVER_UPDATED',
              server,
            });

            broadcastServerList();
            break;
          }

          case 'START_MATCH': {
            const { serverId } = msg;
            const server = activeServers.get(serverId);
            if (!server) return;

            // Only the host can start the match
            if (server.hostId !== clientData.playerId) {
              return;
            }

            server.status = 'in_game';

            broadcastToRoom(serverId, {
              type: 'MATCH_STARTED',
              serverId,
              server,
              map: server.map,
              gameMode: server.gameMode,
            });

            broadcastServerList();
            break;
          }

          // Real-time In-Game Synchronization between real players
          case 'PLAYER_STATE': {
            if (clientData.serverId) {
              broadcastToRoom(clientData.serverId, {
                type: 'REMOTE_PLAYER_UPDATE',
                state: msg.state,
              }, ws);
            }
            break;
          }

          case 'PLAYER_SHOOT': {
            if (clientData.serverId) {
              broadcastToRoom(clientData.serverId, {
                type: 'REMOTE_PLAYER_SHOOT',
                shoot: msg.shoot,
              }, ws);
            }
            break;
          }

          case 'PLAYER_HIT': {
            if (clientData.serverId) {
              broadcastToRoom(clientData.serverId, {
                type: 'REMOTE_PLAYER_HIT',
                hit: msg.hit,
              }, ws);
            }
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (clientData.serverId && activeServers.has(clientData.serverId)) {
        const server = activeServers.get(clientData.serverId)!;
        server.players = server.players.filter((p) => p.id !== clientData.playerId);

        if (server.players.length === 0) {
          activeServers.delete(server.id);
        } else if (server.hostId === clientData.playerId) {
          server.players[0].isHost = true;
          server.hostId = server.players[0].id;
          server.hostName = server.players[0].name;
        }

        broadcastToRoom(server.id, {
          type: 'PLAYER_LEFT',
          serverId: server.id,
          playerId: clientData.playerId,
          server,
        });

        broadcastServerList();
      }
      clients.delete(ws);
    });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Madness Combat server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

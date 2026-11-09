import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { CHARACTERS } from '../shared/characterData';
import { CharacterId } from '../shared/types';
import { AuthService } from './auth/AuthService';
import { Database } from './database/Database';
import { Matchmaker, QueueMode } from './matchmaking/Matchmaker';
import { RoomManager } from './rooms/RoomManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);

export function createGoatRampageServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const roomManager = new RoomManager();
  const matchmaker = new Matchmaker(roomManager);

  // Health & Server Status API
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      game: 'GOAT RAMPAGE',
      activeRooms: roomManager.getActiveRoomCount(),
      timestamp: Date.now(),
    });
  });

  // Account Registration (with Guest-to-Member migration)
  app.post('/api/auth/register', (req, res) => {
    const { username, password, guestData } = req.body || {};
    const result = AuthService.register(username, password, guestData);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  // Account Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const result = AuthService.login(username, password);
    if (!result.ok) {
      res.status(401).json(result);
      return;
    }
    res.json(result);
  });

  // Profile Sync for Member Accounts
  app.post('/api/profile/sync', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const user = Database.getUserByToken(token);
    if (!user) {
      res.status(401).json({ ok: false, message: '유효하지 않은 인증 토큰입니다.' });
      return;
    }
    const updated = Database.updateProfile(user.username, req.body?.profile || {});
    res.json({ ok: true, profile: updated });
  });

  // Rankings Leaderboard API
  app.get('/api/rankings', (_req, res) => {
    res.json({
      ok: true,
      rankings: Database.getLeaderboard(20),
    });
  });

  // Serve built static client from ../dist if available
  const distPath = path.resolve(__dirname, '../public');
  app.use(express.static(distPath));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const sanitizeChar = (cid: unknown): CharacterId => {
    const s = String(cid || 'RAM') as CharacterId;
    return CHARACTERS[s] ? s : 'RAM';
  };

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        switch (msg.type) {
          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG', t: msg.t }));
            break;
          }
          case 'JOIN_QUEUE': {
            const mode: QueueMode = ['QUICK', 'RANKED', 'FRIENDLY'].includes(msg.mode)
              ? msg.mode
              : 'QUICK';
            matchmaker.enqueue({
              ws,
              mode,
              characterId: sanitizeChar(msg.characterId),
              username: String(msg.username || 'GOAT_PLAYER').slice(0, 20),
              userId: String(msg.userId || 'guest'),
              rating: Number(msg.rating || 1000),
            });
            break;
          }
          case 'LEAVE_QUEUE': {
            matchmaker.removeFromAllQueues(ws);
            ws.send(JSON.stringify({ type: 'QUEUE_STATUS', message: '매칭 대기가 취소되었습니다.' }));
            break;
          }
          case 'CREATE_PRIVATE_ROOM': {
            matchmaker.removeFromAllQueues(ws);
            const { roomId, roomCode } = roomManager.createPrivateRoom(
              ws,
              String(msg.userId || 'guest'),
              String(msg.username || 'HOST_GOAT').slice(0, 20),
              sanitizeChar(msg.characterId)
            );
            ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomId, roomCode }));
            break;
          }
          case 'JOIN_PRIVATE_ROOM': {
            matchmaker.removeFromAllQueues(ws);
            const res = roomManager.joinPrivateRoomByCode(
              String(msg.roomCode || ''),
              ws,
              String(msg.userId || 'guest'),
              String(msg.username || 'CHALLENGER').slice(0, 20),
              sanitizeChar(msg.characterId)
            );
            if (!res.ok) {
              ws.send(JSON.stringify({ type: 'ERROR', message: res.message }));
            }
            break;
          }
          case 'INPUT': {
            if (msg.roomId && (msg.slot === 1 || msg.slot === 2) && msg.input) {
              roomManager.handlePlayerInput(ws, String(msg.roomId), msg.slot, msg.input);
            }
            break;
          }
          case 'LEAVE_ROOM': {
            roomManager.removeSocketFromCurrentRoom(ws);
            break;
          }
        }
      } catch {
        // ignore invalid JSON packet
      }
    });

    ws.on('close', () => {
      matchmaker.removeFromAllQueues(ws);
      roomManager.removeSocketFromCurrentRoom(ws);
    });
  });

  return { app, server, wss, roomManager, matchmaker };
}

// Start server if executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { server } = createGoatRampageServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[GOAT RAMPAGE] Authoritative Server & Web Host running on http://0.0.0.0:${PORT}`);
  });
}

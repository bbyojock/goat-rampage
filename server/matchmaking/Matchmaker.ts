import { WebSocket } from 'ws';
import { CharacterId } from '../../shared/types';
import { RoomManager } from '../rooms/RoomManager';

export type QueueMode = 'QUICK' | 'RANKED' | 'FRIENDLY';

interface QueuedPlayer {
  ws: WebSocket;
  userId: string;
  username: string;
  characterId: CharacterId;
  rating: number;
  mode: QueueMode;
  joinedAt: number;
}

/**
 * Handles matchmaking queues for QUICK, RANKED, and FRIENDLY online 1v1 modes.
 * Cross-platform compatible (PC & Mobile browsers connect over WebSocket).
 */
export class Matchmaker {
  private queues: Record<QueueMode, QueuedPlayer[]> = {
    QUICK: [],
    RANKED: [],
    FRIENDLY: [],
  };
  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  public enqueue(player: Omit<QueuedPlayer, 'joinedAt'>): void {
    this.removeFromAllQueues(player.ws);

    const queue = this.queues[player.mode];
    const entry: QueuedPlayer = { ...player, joinedAt: Date.now() };

    // Find compatible opponent in same queue (or QUICK queue fallback)
    const opponentIdx = queue.findIndex((other) => other.ws !== player.ws && other.ws.readyState === WebSocket.OPEN);

    if (opponentIdx >= 0) {
      const [opponent] = queue.splice(opponentIdx, 1);
      this.roomManager.createMatchedRoom(player.mode, opponent, entry);
      return;
    }

    queue.push(entry);
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(
        JSON.stringify({
          type: 'QUEUE_STATUS',
          message: `🔍 [${player.mode}] 대전 상대를 탐색 중입니다... (현재 대기열: ${queue.length}명 — 다른 브라우저 탭/기기에서 접속 시 즉시 매칭)`,
        })
      );
    }
  }

  public removeFromAllQueues(ws: WebSocket): void {
    for (const mode of ['QUICK', 'RANKED', 'FRIENDLY'] as QueueMode[]) {
      this.queues[mode] = this.queues[mode].filter((p) => p.ws !== ws);
    }
  }
}

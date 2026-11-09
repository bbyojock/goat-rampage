import crypto from 'crypto';
import { WebSocket } from 'ws';
import { EMPTY_INPUT } from '../../shared/combatRules';
import { CharacterId, MatchType, UnifiedInputState } from '../../shared/types';
import {
  AuthoritativeCombatRoom,
  ConnectedPlayer,
} from '../combat/AuthoritativeCombatRoom';

export class RoomManager {
  private rooms = new Map<string, AuthoritativeCombatRoom>();
  private codeToRoomId = new Map<string, string>();
  private wsToRoomId = new Map<WebSocket, string>();

  public createPrivateRoom(
    ws: WebSocket,
    userId: string,
    username: string,
    characterId: CharacterId
  ): { roomId: string; roomCode: string } {
    this.removeSocketFromCurrentRoom(ws);

    const roomId = `room_${crypto.randomBytes(5).toString('hex')}`;
    const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

    const p1: ConnectedPlayer = {
      ws,
      userId,
      username,
      characterId,
      rating: 1000,
      slot: 1,
      latestInput: { ...EMPTY_INPUT },
    };

    const room = new AuthoritativeCombatRoom(
      roomId,
      'PRIVATE',
      p1,
      (closedId) => this.cleanupRoom(closedId),
      roomCode
    );

    this.rooms.set(roomId, room);
    this.codeToRoomId.set(roomCode, roomId);
    this.wsToRoomId.set(ws, roomId);

    return { roomId, roomCode };
  }

  public joinPrivateRoomByCode(
    roomCode: string,
    ws: WebSocket,
    userId: string,
    username: string,
    characterId: CharacterId
  ): { ok: boolean; message?: string } {
    const cleanCode = roomCode.trim().toUpperCase();
    const roomId = this.codeToRoomId.get(cleanCode);
    if (!roomId) {
      return { ok: false, message: `방 코드 [${cleanCode}]를 찾을 수 없습니다.` };
    }
    const room = this.rooms.get(roomId);
    if (!room || room.p2 !== null) {
      return { ok: false, message: '이미 가득 찼거나 종료된 방입니다.' };
    }
    if (room.p1.ws === ws) {
      return { ok: false, message: '자신이 만든 방에는 이미 입장해 있습니다.' };
    }

    const p2: ConnectedPlayer = {
      ws,
      userId,
      username,
      characterId,
      rating: 1000,
      slot: 2,
      latestInput: { ...EMPTY_INPUT },
    };

    this.codeToRoomId.delete(cleanCode);
    this.wsToRoomId.set(ws, roomId);
    room.addSecondPlayer(p2);
    return { ok: true };
  }

  public createMatchedRoom(
    mode: MatchType,
    p1Info: Omit<ConnectedPlayer, 'slot' | 'latestInput'>,
    p2Info: Omit<ConnectedPlayer, 'slot' | 'latestInput'>
  ): AuthoritativeCombatRoom {
    const roomId = `match_${crypto.randomBytes(6).toString('hex')}`;
    const p1: ConnectedPlayer = {
      ...p1Info,
      slot: 1,
      latestInput: { ...EMPTY_INPUT },
    };
    const p2: ConnectedPlayer = {
      ...p2Info,
      slot: 2,
      latestInput: { ...EMPTY_INPUT },
    };

    const room = new AuthoritativeCombatRoom(roomId, mode, p1, (closedId) =>
      this.cleanupRoom(closedId)
    );
    this.rooms.set(roomId, room);
    this.wsToRoomId.set(p1.ws, roomId);
    this.wsToRoomId.set(p2.ws, roomId);

    room.addSecondPlayer(p2);
    return room;
  }

  public handlePlayerInput(
    ws: WebSocket,
    roomId: string,
    slot: 1 | 2,
    input: Partial<UnifiedInputState>
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if ((slot === 1 && room.p1.ws === ws) || (slot === 2 && room.p2?.ws === ws)) {
      room.updateInput(slot, input);
    }
  }

  public removeSocketFromCurrentRoom(ws: WebSocket): void {
    const roomId = this.wsToRoomId.get(ws);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (room) {
      room.handleDisconnect(ws);
    }
    this.wsToRoomId.delete(ws);
  }

  private cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.roomCode) {
      this.codeToRoomId.delete(room.roomCode);
    }
    this.wsToRoomId.delete(room.p1.ws);
    if (room.p2) {
      this.wsToRoomId.delete(room.p2.ws);
    }
    this.rooms.delete(roomId);
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }
}

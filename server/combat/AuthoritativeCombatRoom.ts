import { WebSocket } from 'ws';
import {
  createInitialMatch,
  EMPTY_INPUT,
  stepMatchSimulation,
} from '../../shared/combatRules';
import { FIXED_DT_MS } from '../../shared/constants';
import {
  CharacterId,
  MatchStateSnapshot,
  MatchType,
  UnifiedInputState,
} from '../../shared/types';
import { Database } from '../database/Database';

export interface ConnectedPlayer {
  ws: WebSocket;
  userId: string;
  username: string;
  characterId: CharacterId;
  rating: number;
  slot: 1 | 2;
  latestInput: UnifiedInputState;
}

/**
 * Server-Authoritative 1v1 Combat Room.
 * Runs fixed 60Hz deterministic simulation on the server, validates inputs,
 * determines hit/knockback/HP/timer/round winners, and broadcasts snapshots to both clients.
 */
export class AuthoritativeCombatRoom {
  public readonly roomId: string;
  public readonly roomCode?: string;
  public readonly mode: MatchType;
  public p1: ConnectedPlayer;
  public p2: ConnectedPlayer | null = null;
  public state: MatchStateSnapshot;
  private tickInterval: NodeJS.Timeout | null = null;
  private onCloseCallback: (roomId: string) => void;
  private matchRecorded = false;

  constructor(
    roomId: string,
    mode: MatchType,
    p1: ConnectedPlayer,
    onClose: (roomId: string) => void,
    roomCode?: string
  ) {
    this.roomId = roomId;
    this.mode = mode;
    this.p1 = p1;
    this.roomCode = roomCode;
    this.onCloseCallback = onClose;
    this.state = createInitialMatch(p1.characterId, 'RAM');
  }

  public addSecondPlayer(p2: ConnectedPlayer): void {
    this.p2 = p2;
    this.state = createInitialMatch(this.p1.characterId, p2.characterId);

    // Notify both players that the authoritative match has started
    this.sendTo(this.p1.ws, {
      type: 'MATCH_START',
      roomId: this.roomId,
      roomCode: this.roomCode,
      slot: 1,
      mode: this.mode,
      playerCharacter: this.p1.characterId,
      opponentCharacter: p2.characterId,
      opponentName: p2.username,
    });

    this.sendTo(p2.ws, {
      type: 'MATCH_START',
      roomId: this.roomId,
      roomCode: this.roomCode,
      slot: 2,
      mode: this.mode,
      playerCharacter: p2.characterId,
      opponentCharacter: this.p1.characterId,
      opponentName: this.p1.username,
    });

    this.startSimulationLoop();
  }

  private startSimulationLoop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.tickInterval = setInterval(() => {
      if (!this.p2) return;

      stepMatchSimulation(this.state, this.p1.latestInput, this.p2.latestInput);

      // Broadcast authoritative snapshot every 2 frames (30Hz) or immediately when combat events occur
      if (this.state.frameCount % 2 === 0 || this.state.events.length > 0 || this.state.phase === 'MATCH_OVER') {
        const payload = {
          type: 'STATE_SNAPSHOT',
          state: this.state,
        };
        this.sendTo(this.p1.ws, payload);
        this.sendTo(this.p2.ws, payload);
      }

      if (this.state.phase === 'MATCH_OVER' && !this.matchRecorded) {
        this.matchRecorded = true;
        Database.recordServerMatch({
          id: this.roomId,
          mode: this.mode,
          p1Name: this.p1.username,
          p2Name: this.p2.username,
          p1Char: this.p1.characterId,
          p2Char: this.p2.characterId,
          winnerSlot: this.state.winnerSlot,
          score: `${this.state.p1RoundsWon}-${this.state.p2RoundsWon}`,
          timestamp: Date.now(),
        });
        setTimeout(() => this.destroy(), 2500);
      }
    }, FIXED_DT_MS);
  }

  public updateInput(slot: 1 | 2, rawInput: Partial<UnifiedInputState>): void {
    const sanitized: UnifiedInputState = {
      moveLeft: Boolean(rawInput?.moveLeft),
      moveRight: Boolean(rawInput?.moveRight),
      crouch: Boolean(rawInput?.crouch),
      jump: Boolean(rawInput?.jump),
      attack: Boolean(rawInput?.attack),
      headbutt: Boolean(rawInput?.headbutt),
      guard: Boolean(rawInput?.guard),
      dodge: Boolean(rawInput?.dodge),
      special: Boolean(rawInput?.special),
    };
    if (slot === 1) {
      this.p1.latestInput = sanitized;
    } else if (this.p2) {
      this.p2.latestInput = sanitized;
    }
  }

  public handleDisconnect(ws: WebSocket): void {
    if (this.p1.ws === ws && this.p2) {
      this.sendTo(this.p2.ws, {
        type: 'OPPONENT_DISCONNECTED',
        message: `${this.p1.username} 님의 연결이 끊어져 승리 처리되었습니다!`,
      });
    } else if (this.p2 && this.p2.ws === ws) {
      this.sendTo(this.p1.ws, {
        type: 'OPPONENT_DISCONNECTED',
        message: `${this.p2.username} 님의 연결이 끊어져 승리 처리되었습니다!`,
      });
    }
    this.destroy();
  }

  public destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.p1.latestInput = { ...EMPTY_INPUT };
    if (this.p2) this.p2.latestInput = { ...EMPTY_INPUT };
    this.onCloseCallback(this.roomId);
  }

  private sendTo(ws: WebSocket, msg: Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}

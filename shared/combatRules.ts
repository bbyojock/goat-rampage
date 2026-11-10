import { CHARACTERS } from './characterData';
import {
  FIXED_FPS,
  FRICTION_AIR,
  FRICTION_GROUND,
  GRAVITY_PER_FRAME,
  GUARD_DAMAGE_MULTIPLIER,
  GUARD_KNOCKBACK_MULTIPLIER,
  MAX_ROUNDS,
  ROUND_TIME_SECONDS,
  ROUNDS_TO_WIN,
  STAGE_GROUND_Y,
  STAGE_LEFT_BOUND,
  STAGE_RIGHT_BOUND,
  STAMINA_REGEN_PER_FRAME,
} from './constants';
import {
  CharacterId,
  CombatEvent,
  FighterSnapshot,
  MatchStateSnapshot,
  MoveSpec,
  RectBox,
  UnifiedInputState,
} from './types';

export const EMPTY_INPUT: UnifiedInputState = {
  moveLeft: false,
  moveRight: false,
  crouch: false,
  jump: false,
  attack: false,
  headbutt: false,
  guard: false,
  dodge: false,
  special: false,
  interact: false,
};

import * as Traits from './traits';

export function createInitialFighter(
  slot: 1 | 2,
  characterId: CharacterId,
  x: number,
  facing: 1 | -1
): FighterSnapshot {
  const def = CHARACTERS[characterId] || CHARACTERS.RAM;
  return {
    slot,
    characterId: def.id,
    x,
    y: STAGE_GROUND_Y,
    vx: 0,
    vy: 0,
    facing,
    hp: def.stats.maxHp,
    maxHp: def.stats.maxHp,
    stamina: def.stats.maxStamina,
    maxStamina: def.stats.maxStamina,
    state: 'IDLE',
    stateFrame: 0,
    hitstunFrames: 0,
    invincibleFrames: 0,
    hitstopFrames: 0,
    comboCount: 0,
    comboTimerFrames: 0,
    cooldowns: {
      attack: 0,
      headbutt: 0,
      special: 0,
      dodge: 0,
    },
    hasHitCurrentMove: false,
    grounded: true,
  };
}

export function createInitialMatch(
  p1Character: CharacterId,
  p2Character: CharacterId
): MatchStateSnapshot {
  return {
    round: 1,
    maxRounds: MAX_ROUNDS,
    p1RoundsWon: 0,
    p2RoundsWon: 0,
    timerSeconds: ROUND_TIME_SECONDS,
    frameCount: 0,
    phase: 'COUNTDOWN',
    phaseTimerFrames: 90, // 1.5s countdown
    winnerSlot: 0,
    fighters: [
      createInitialFighter(1, p1Character, 340, 1),
      createInitialFighter(2, p2Character, 940, -1),
    ],
    events: [],
  };
}

export function resetRoundFighters(match: MatchStateSnapshot): void {
  const p1Char = match.fighters[0].characterId;
  const p2Char = match.fighters[1].characterId;
  match.fighters[0] = createInitialFighter(1, p1Char, 340, 1);
  match.fighters[1] = createInitialFighter(2, p2Char, 940, -1);
  match.timerSeconds = ROUND_TIME_SECONDS;
  match.phase = 'COUNTDOWN';
  match.phaseTimerFrames = 90;
}

export function getWorldBox(x: number, y: number, facing: 1 | -1, box: RectBox) {
  const centerX = x + box.offsetX * facing;
  const centerY = y + box.offsetY;
  return {
    left: centerX - box.width / 2,
    right: centerX + box.width / 2,
    top: centerY - box.height / 2,
    bottom: centerY + box.height / 2,
  };
}

export function boxesOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number }
): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function getActiveMoveSpec(fighter: FighterSnapshot): MoveSpec | null {
  const def = CHARACTERS[fighter.characterId];
  if (fighter.state === 'ATTACK') return def.moves.attack;
  if (fighter.state === 'HEADBUTT') return (fighter.alt === 'headbutt2' && def.moves.headbutt2) || def.moves.headbutt;
  if (fighter.state === 'SPECIAL') return (fighter.alt === 'special2' && def.moves.special2) || def.moves.special;
  return null;
}

export function isMoveInActiveFrames(fighter: FighterSnapshot, move: MoveSpec): boolean {
  return (
    fighter.stateFrame >= move.startupFrames &&
    fighter.stateFrame < move.startupFrames + move.activeFrames
  );
}

export function stepFighterPhysicsAndActions(
  fighter: FighterSnapshot,
  input: UnifiedInputState,
  events: CombatEvent[],
  bounds = { left: STAGE_LEFT_BOUND, right: STAGE_RIGHT_BOUND, groundY: STAGE_GROUND_Y }
): void {
  const def = CHARACTERS[fighter.characterId];

  // Hitstop freezes fighter frame progression and physics briefly on heavy impact
  if (fighter.hitstopFrames > 0) {
    fighter.hitstopFrames--;
    return;
  }

  // Cooldowns & timers
  if (fighter.cooldowns.attack > 0) fighter.cooldowns.attack--;
  if (fighter.cooldowns.headbutt > 0) fighter.cooldowns.headbutt--;
  if (fighter.cooldowns.special > 0) fighter.cooldowns.special--;
  if (fighter.cooldowns.dodge > 0) fighter.cooldowns.dodge--;
  if (fighter.invincibleFrames > 0) fighter.invincibleFrames--;
  Traits.tick(fighter, def);

  if (fighter.comboTimerFrames > 0) {
    fighter.comboTimerFrames--;
    if (fighter.comboTimerFrames === 0) {
      fighter.comboCount = 0;
    }
  }

  // Regenerate stamina when not attacking or guarding
  if (
    fighter.state !== 'ATTACK' &&
    fighter.state !== 'HEADBUTT' &&
    fighter.state !== 'SPECIAL' &&
    fighter.state !== 'GUARD'
  ) {
    fighter.stamina = Math.min(fighter.maxStamina, fighter.stamina + STAMINA_REGEN_PER_FRAME);
  }

  fighter.stateFrame++;

  // Handle terminal states
  if (fighter.state === 'VICTORY' || fighter.state === 'DEFEAT') {
    fighter.vx *= FRICTION_GROUND;
    fighter.vy += GRAVITY_PER_FRAME;
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;
    if (fighter.y >= bounds.groundY) {
      fighter.y = bounds.groundY;
      fighter.vy = 0;
      fighter.grounded = true;
    }
    fighter.x = Math.max(bounds.left, Math.min(bounds.right, fighter.x));
    return;
  }

  // Handle Hitstun / Knockback
  if (fighter.state === 'HIT' || fighter.state === 'KNOCKBACK') {
    if (fighter.hitstunFrames > 0) {
      fighter.hitstunFrames--;
    }
    fighter.vx *= fighter.grounded ? FRICTION_GROUND : FRICTION_AIR;
    fighter.vy += GRAVITY_PER_FRAME;
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;

    if (fighter.y >= bounds.groundY) {
      fighter.y = bounds.groundY;
      fighter.vy = 0;
      fighter.grounded = true;
    }
    fighter.x = Math.max(bounds.left, Math.min(bounds.right, fighter.x));

    if (fighter.hitstunFrames <= 0 && fighter.grounded) {
      fighter.state = 'IDLE';
      fighter.stateFrame = 0;
    }
    return;
  }

  // Handle Dodge
  if (fighter.state === 'DODGE') {
    if (fighter.stateFrame >= def.stats.dodgeDurationFrames) {
      fighter.state = fighter.grounded ? 'IDLE' : 'FALL';
      fighter.stateFrame = 0;
    } else {
      fighter.vx = fighter.facing * def.stats.dodgeSpeed;
      fighter.vy += GRAVITY_PER_FRAME;
      fighter.x += fighter.vx;
      fighter.y += fighter.vy;
      if (fighter.y >= bounds.groundY) {
        fighter.y = bounds.groundY;
        fighter.vy = 0;
        fighter.grounded = true;
      }
      fighter.x = Math.max(bounds.left, Math.min(bounds.right, fighter.x));
      return;
    }
  }

  // Handle Attack / Headbutt / Special state progression
  const currentMove = getActiveMoveSpec(fighter);
  if (currentMove) {
    const totalFrames =
      currentMove.startupFrames + currentMove.activeFrames + currentMove.recoveryFrames;
    if (fighter.stateFrame === currentMove.startupFrames) {
      if (currentMove.teleportOffsetX) {
        fighter.x = Math.max(
          bounds.left,
          Math.min(bounds.right, fighter.x + fighter.facing * currentMove.teleportOffsetX)
        );
      }
      fighter.vx = fighter.facing * currentMove.velocityBoostX;
      if (currentMove.velocityBoostY !== 0) {
        fighter.vy = currentMove.velocityBoostY;
        fighter.grounded = false;
      }
    }
    fighter.vx *= fighter.grounded ? 0.86 : 0.95;
    fighter.vy += GRAVITY_PER_FRAME;
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;
    if (fighter.y >= bounds.groundY) {
      fighter.y = bounds.groundY;
      fighter.vy = 0;
      fighter.grounded = true;
    }
    fighter.x = Math.max(bounds.left, Math.min(bounds.right, fighter.x));

    if (fighter.stateFrame >= totalFrames) {
      fighter.state = fighter.grounded ? 'IDLE' : 'FALL';
      fighter.stateFrame = 0;
      fighter.hasHitCurrentMove = false;
    }
    return;
  }

  // Check action triggers (Dodge, Special, Headbutt, Attack, Guard)
  if (
    input.dodge &&
    fighter.cooldowns.dodge <= 0 &&
    fighter.stamina >= 15
  ) {
    fighter.state = 'DODGE';
    fighter.stateFrame = 0;
    fighter.stamina -= 15;
    fighter.invincibleFrames = Math.max(10, def.stats.dodgeDurationFrames - 2);
    fighter.cooldowns.dodge = 38;
    if (input.moveLeft) fighter.facing = -1;
    else if (input.moveRight) fighter.facing = 1;
    events.push({
      type: 'DODGE',
      attackerSlot: fighter.slot,
      x: fighter.x,
      y: fighter.y,
    });
    return;
  }

  if (input.special && fighter.cooldowns.special <= 0) {
    // ↓ + 버튼 = 추가 스킬 (special2)
    const useAlt = !!(input.crouch && fighter.grounded && def.moves.special2);
    const m = useAlt ? def.moves.special2! : def.moves.special;
    if (fighter.stamina >= m.staminaCost) {
      fighter.alt = useAlt ? 'special2' : '';
      fighter.state = 'SPECIAL';
      fighter.stateFrame = 0;
      fighter.hasHitCurrentMove = false;
      fighter.stamina -= m.staminaCost;
      fighter.cooldowns.special = m.cooldownFrames;
      Traits.start(fighter, m, events);
      events.push({
        type: 'MOVE_START',
        attackerSlot: fighter.slot,
        moveType: 'special',
        x: fighter.x,
        y: fighter.y,
      });
      return;
    }
  }

  if (input.headbutt && fighter.cooldowns.headbutt <= 0) {
    // ↓ + 버튼 = 추가 스킬 (headbutt2)
    const useAlt = !!(input.crouch && fighter.grounded && def.moves.headbutt2);
    const m = useAlt ? def.moves.headbutt2! : def.moves.headbutt;
    if (fighter.stamina >= m.staminaCost) {
      fighter.alt = useAlt ? 'headbutt2' : '';
      fighter.state = 'HEADBUTT';
      fighter.stateFrame = 0;
      fighter.hasHitCurrentMove = false;
      fighter.stamina -= m.staminaCost;
      fighter.cooldowns.headbutt = m.cooldownFrames;
      Traits.start(fighter, m, events);
      events.push({
        type: 'MOVE_START',
        attackerSlot: fighter.slot,
        moveType: 'headbutt',
        x: fighter.x,
        y: fighter.y,
      });
      return;
    }
  }

  if (
    input.attack &&
    fighter.cooldowns.attack <= 0 &&
    fighter.stamina >= def.moves.attack.staminaCost
  ) {
    fighter.state = 'ATTACK';
    fighter.stateFrame = 0;
    fighter.hasHitCurrentMove = false;
    fighter.stamina -= def.moves.attack.staminaCost;
    fighter.cooldowns.attack = def.moves.attack.cooldownFrames;
    events.push({
      type: 'MOVE_START',
      attackerSlot: fighter.slot,
      moveType: 'attack',
      x: fighter.x,
      y: fighter.y,
    });
    return;
  }

  if (input.guard && fighter.grounded && fighter.stamina > 5) {
    if (fighter.state !== 'GUARD') {
      fighter.state = 'GUARD';
      fighter.stateFrame = 0;
    }
    fighter.vx *= 0.6;
  } else {
    // Movement & Jump
    if (input.jump && fighter.grounded) {
      fighter.vy = -def.stats.jumpForce;
      fighter.grounded = false;
      fighter.state = 'JUMP';
      fighter.stateFrame = 0;
      events.push({
        type: 'JUMP',
        attackerSlot: fighter.slot,
        x: fighter.x,
        y: fighter.y,
      });
    }

    if (input.crouch && fighter.grounded) {
      fighter.state = 'CROUCH';
      fighter.vx *= 0.7;
    } else if (input.moveLeft && !input.moveRight) {
      fighter.facing = -1;
      fighter.vx = -def.stats.runSpeed;
      if (fighter.grounded) fighter.state = 'RUN';
    } else if (input.moveRight && !input.moveLeft) {
      fighter.facing = 1;
      fighter.vx = def.stats.runSpeed;
      if (fighter.grounded) fighter.state = 'RUN';
    } else {
      fighter.vx *= fighter.grounded ? FRICTION_GROUND : FRICTION_AIR;
      if (Math.abs(fighter.vx) < 0.2) fighter.vx = 0;
      if (fighter.grounded) {
        fighter.state = 'IDLE';
      }
    }
  }

  // Apply gravity & velocity
  fighter.vy += GRAVITY_PER_FRAME;
  fighter.x += fighter.vx;
  fighter.y += fighter.vy;

  if (
    !fighter.grounded &&
    fighter.vy > 0 &&
    fighter.state !== 'ATTACK' &&
    fighter.state !== 'HEADBUTT' &&
    fighter.state !== 'SPECIAL'
  ) {
    fighter.state = 'FALL';
  }

  if (fighter.y >= bounds.groundY) {
    fighter.y = bounds.groundY;
    fighter.vy = 0;
    if (!fighter.grounded) {
      fighter.grounded = true;
      if (fighter.state === 'FALL' || fighter.state === 'JUMP') {
        fighter.state = 'IDLE';
        fighter.stateFrame = 0;
      }
    }
  }

  fighter.x = Math.max(bounds.left, Math.min(bounds.right, fighter.x));
}

export function resolveFighterCollisionPushbox(f1: FighterSnapshot, f2: FighterSnapshot): void {
  const minDistance = 62;
  const dy = Math.abs(f1.y - f2.y);
  if (dy > 75) return;
  const dx = f2.x - f1.x;
  const absDx = Math.abs(dx);
  if (absDx < minDistance) {
    const push = (minDistance - absDx) / 2;
    const dir = dx >= 0 ? 1 : -1;
    f1.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, f1.x - dir * push));
    f2.x = Math.max(STAGE_LEFT_BOUND, Math.min(STAGE_RIGHT_BOUND, f2.x + dir * push));
  }
}

export function checkAndApplyAttackHit(
  attacker: FighterSnapshot,
  defender: FighterSnapshot,
  events: CombatEvent[]
): void {
  if (attacker.hasHitCurrentMove) return;
  const move = getActiveMoveSpec(attacker);
  if (!move || !isMoveInActiveFrames(attacker, move)) return;
  if (defender.invincibleFrames > 0 || defender.state === 'VICTORY' || defender.state === 'DEFEAT') {
    return;
  }

  const defChar = CHARACTERS[defender.characterId];
  const hurtRect =
    defender.state === 'CROUCH' ? defChar.crouchHurtbox : defChar.hurtbox;

  const hitboxWorld = getWorldBox(attacker.x, attacker.y, attacker.facing, move.hitbox);
  const hurtboxWorld = getWorldBox(defender.x, defender.y, defender.facing, hurtRect);

  if (!boxesOverlap(hitboxWorld, hurtboxWorld)) return;

  attacker.hasHitCurrentMove = true;
  const moveType: 'attack' | 'headbutt' | 'special' =
    attacker.state === 'SPECIAL'
      ? 'special'
      : attacker.state === 'HEADBUTT'
      ? 'headbutt'
      : 'attack';

  const isGuarding =
    defender.state === 'GUARD' && !move.isUnblockable && defender.stamina >= 10;

  const hitX = (attacker.x + defender.x) / 2;
  const hitY = defender.y - 45;

  if (isGuarding) {
    const chipDamage = Math.max(2, Math.round(move.damage * GUARD_DAMAGE_MULTIPLIER * defChar.stats.defense));
    defender.hp = Math.max(1, defender.hp - chipDamage);
    defender.stamina = Math.max(0, defender.stamina - 14);
    defender.vx = attacker.facing * (move.knockbackX * GUARD_KNOCKBACK_MULTIPLIER) / defChar.stats.weight;
    defender.hitstunFrames = move.blockstunFrames;
    attacker.hitstopFrames = Math.max(2, Math.floor(move.hitstopFrames * 0.6));
    defender.hitstopFrames = Math.max(2, Math.floor(move.hitstopFrames * 0.6));

    events.push({
      type: 'BLOCK',
      attackerSlot: attacker.slot,
      defenderSlot: defender.slot,
      moveType,
      damage: chipDamage,
      x: hitX,
      y: hitY,
    });
    return;
  }

  // Combo scaling: prevents infinite 100-0 loops while rewarding combos
  const comboScaling = Math.max(0.55, 1 - defender.comboCount * 0.08);
  const finalDamage = Math.max(
    5,
    Math.round(move.damage * defChar.stats.defense * comboScaling * Traits.mod(attacker, defender, move, events))
  );

  defender.hp = Math.max(0, defender.hp - finalDamage);
  Traits.hit(attacker, defender, move, finalDamage, events);
  if (move.lifesteal) attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(finalDamage * move.lifesteal));
  if (move.staminaDrain) defender.stamina = Math.max(0, defender.stamina - move.staminaDrain);
  defender.comboCount += 1;
  defender.comboTimerFrames = 55;
  defender.hasHitCurrentMove = false;

  const kbX = (move.knockbackX / defChar.stats.weight) * attacker.facing;
  const kbY = move.knockbackY / Math.sqrt(defChar.stats.weight);

  defender.vx = kbX;
  defender.vy = kbY;
  if (kbY < -2) {
    defender.grounded = false;
  }

  defender.hitstunFrames = move.hitstunFrames;
  defender.state = Math.abs(move.knockbackX) >= 12 ? 'KNOCKBACK' : 'HIT';
  defender.stateFrame = 0;

  attacker.hitstopFrames = move.hitstopFrames;
  defender.hitstopFrames = move.hitstopFrames;

  events.push({
    type: 'HIT',
    attackerSlot: attacker.slot,
    defenderSlot: defender.slot,
    moveType,
    damage: finalDamage,
    x: hitX,
    y: hitY,
    heavy: moveType !== 'attack',
    combo: defender.comboCount,
  });

  if (defender.hp <= 0) {
    defender.state = 'DEFEAT';
    defender.stateFrame = 0;
    events.push({
      type: 'KO',
      attackerSlot: attacker.slot,
      defenderSlot: defender.slot,
      x: defender.x,
      y: defender.y,
    });
  }
}

export function stepMatchSimulation(
  match: MatchStateSnapshot,
  p1Input: UnifiedInputState,
  p2Input: UnifiedInputState
): void {
  match.events = [];
  match.frameCount++;

  const [f1, f2] = match.fighters;

  if (match.phase === 'COUNTDOWN') {
    match.phaseTimerFrames--;
    if (match.phaseTimerFrames <= 0) {
      match.phase = 'FIGHTING';
    }
    return;
  }

  if (match.phase === 'ROUND_OVER') {
    stepFighterPhysicsAndActions(f1, EMPTY_INPUT, match.events);
    stepFighterPhysicsAndActions(f2, EMPTY_INPUT, match.events);
    match.phaseTimerFrames--;
    if (match.phaseTimerFrames <= 0) {
      if (match.p1RoundsWon >= ROUNDS_TO_WIN || match.p2RoundsWon >= ROUNDS_TO_WIN || match.round >= match.maxRounds) {
        match.phase = 'MATCH_OVER';
        if (match.p1RoundsWon > match.p2RoundsWon) match.winnerSlot = 1;
        else if (match.p2RoundsWon > match.p1RoundsWon) match.winnerSlot = 2;
        else match.winnerSlot = 0;
      } else {
        match.round++;
        resetRoundFighters(match);
      }
    }
    return;
  }

  if (match.phase === 'MATCH_OVER') {
    stepFighterPhysicsAndActions(f1, EMPTY_INPUT, match.events);
    stepFighterPhysicsAndActions(f2, EMPTY_INPUT, match.events);
    return;
  }

  // Phase === 'FIGHTING'
  if (match.frameCount % FIXED_FPS === 0 && match.timerSeconds > 0) {
    match.timerSeconds--;
  }

  stepFighterPhysicsAndActions(f1, p1Input, match.events);
  stepFighterPhysicsAndActions(f2, p2Input, match.events);

  resolveFighterCollisionPushbox(f1, f2);

  // Auto-face opponent when idle
  if (f1.state === 'IDLE' && f1.grounded) {
    f1.facing = f2.x >= f1.x ? 1 : -1;
  }
  if (f2.state === 'IDLE' && f2.grounded) {
    f2.facing = f1.x >= f2.x ? 1 : -1;
  }

  checkAndApplyAttackHit(f1, f2, match.events);
  checkAndApplyAttackHit(f2, f1, match.events);

  // Check Round End Conditions
  if (f1.hp <= 0 || f2.hp <= 0 || match.timerSeconds <= 0) {
    match.phase = 'ROUND_OVER';
    match.phaseTimerFrames = 130; // ~2.1s round celebration

    const p1Ratio = f1.hp / f1.maxHp;
    const p2Ratio = f2.hp / f2.maxHp;

    if (f1.hp <= 0 && f2.hp <= 0) {
      // Double KO / Draw round
      f1.state = 'DEFEAT';
      f2.state = 'DEFEAT';
      match.p1RoundsWon++;
      match.p2RoundsWon++;
    } else if (f2.hp <= 0 || (match.timerSeconds <= 0 && p1Ratio > p2Ratio)) {
      match.p1RoundsWon++;
      f1.state = 'VICTORY';
      f1.stateFrame = 0;
      if (f2.hp <= 0) f2.state = 'DEFEAT';
    } else if (f1.hp <= 0 || (match.timerSeconds <= 0 && p2Ratio > p1Ratio)) {
      match.p2RoundsWon++;
      f2.state = 'VICTORY';
      f2.stateFrame = 0;
      if (f1.hp <= 0) f1.state = 'DEFEAT';
    } else {
      // Exact tie on timeout
      match.p1RoundsWon++;
      match.p2RoundsWon++;
    }
  }
}

export function computeCpuInput(
  cpu: FighterSnapshot,
  opponent: FighterSnapshot,
  frameCount: number,
  difficulty = 0.72
): UnifiedInputState {
  const input: UnifiedInputState = { ...EMPTY_INPUT };
  const dx = opponent.x - cpu.x;
  const dist = Math.abs(dx);
  const opponentAttacking =
    opponent.state === 'ATTACK' ||
    opponent.state === 'HEADBUTT' ||
    opponent.state === 'SPECIAL';

  // Deterministic pseudo-random signal from frameCount + positions
  const roll = Math.abs(Math.sin(frameCount * 0.19 + cpu.x * 0.03 + opponent.x * 0.01));

  if (dist > 145) {
    if (dx > 0) input.moveRight = true;
    else input.moveLeft = true;

    if (dist > 280 && roll < 0.03 * difficulty && cpu.cooldowns.headbutt <= 0) {
      input.headbutt = true;
    }
    if (roll < 0.015 && cpu.grounded) {
      input.jump = true;
    }
  } else {
    // Close combat range
    if (dx > 0) cpu.facing = 1;
    else cpu.facing = -1;

    if (opponentAttacking && roll < 0.55 * difficulty) {
      if (roll < 0.25 * difficulty && cpu.cooldowns.dodge <= 0) {
        input.dodge = true;
      } else {
        input.guard = true;
      }
      return input;
    }

    if (roll < 0.14 * difficulty && cpu.cooldowns.special <= 0 && cpu.stamina >= 40) {
      input.special = true;
      if (Math.sin(frameCount * 0.37) > 0.1) input.crouch = true;
    } else if (roll < 0.32 * difficulty && cpu.cooldowns.headbutt <= 0) {
      input.headbutt = true;
    } else if (roll < 0.62 * difficulty && cpu.cooldowns.attack <= 0) {
      input.attack = true;
    } else if (roll > 0.88) {
      if (dx > 0) input.moveLeft = true;
      else input.moveRight = true;
    }
  }

  return input;
}

import { PlayerSettings } from './types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const FIXED_FPS = 60;
export const FIXED_DT_MS = 1000 / FIXED_FPS;

export const STAGE_LEFT_BOUND = 90;
export const STAGE_RIGHT_BOUND = 1190;
export const STAGE_GROUND_Y = 580;

export const GRAVITY_PER_FRAME = 0.82;
export const FRICTION_GROUND = 0.82;
export const FRICTION_AIR = 0.94;

export const ROUND_TIME_SECONDS = 99;
export const ROUNDS_TO_WIN = 2;
export const MAX_ROUNDS = 3;

export const STAMINA_REGEN_PER_FRAME = 0.22;
export const GUARD_DAMAGE_MULTIPLIER = 0.2;
export const GUARD_KNOCKBACK_MULTIPLIER = 0.35;

export const DEFAULT_SETTINGS: PlayerSettings = {
  bgmVolume: 0.5,
  sfxVolume: 0.75,
  graphicsQuality: 'HIGH',
  touchControlScale: 1.0,
  touchControlOpacity: 0.82,
  showTouchControls: 'AUTO',
  keyBindings: {
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    crouch: 'KeyS',
    jump: 'Space',
    attack: 'KeyJ',
    headbutt: 'KeyK',
    special: 'KeyL',
    guard: 'KeyI',
    dodge: 'KeyU',
  },
};

export type CharacterId =
  | 'RAM' | 'DASH' | 'BRUTUS' | 'VOLT' | 'TITAN' | 'PHANTOM'
  | 'BLAZE' | 'FROST' | 'SAGE' | 'LANCER';

export type FighterActionState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'CROUCH'
  | 'JUMP'
  | 'FALL'
  | 'ATTACK'
  | 'HEADBUTT'
  | 'SPECIAL'
  | 'GUARD'
  | 'DODGE'
  | 'HIT'
  | 'KNOCKBACK'
  | 'VICTORY'
  | 'DEFEAT';

export interface UnifiedInputState {
  moveLeft: boolean;
  moveRight: boolean;
  crouch: boolean;
  jump: boolean;
  attack: boolean;
  headbutt: boolean;
  guard: boolean;
  dodge: boolean;
  special: boolean;
  interact?: boolean;
}

export interface RectBox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface MoveSpec {
  name: string;
  damage: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  hitstunFrames: number;
  blockstunFrames: number;
  knockbackX: number;
  knockbackY: number;
  hitstopFrames: number;
  cooldownFrames: number;
  staminaCost: number;
  velocityBoostX: number;
  velocityBoostY: number;
  hitbox: RectBox;
  effectColor: number;
  isUnblockable?: boolean;
  teleportOffsetX?: number;
  /** 적중 시 가한 피해의 비율만큼 체력 회복 */
  lifesteal?: number;
  /** 연타 간격(프레임). 활성 프레임 동안 이 간격마다 다시 적중 */
  multiHit?: number;
  /** 적중 시 상대에게 상태이상 */
  status?: { t: 'burn' | 'poison' | 'freeze' | 'shock'; f: number };
  /** 사용 시 자신에게 버프 */
  buff?: { k: 'armor' | 'haste' | 'overdrive'; f: number };
  /** 사용 시 최대 체력 비율 회복 */
  heal?: number;
  /** 적중 시 상대 스태미나 감소량 */
  staminaDrain?: number;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  role: string;
  description: string;
  unlockedByDefault: boolean;
  unlockRegion?: RegionId;
  stats: {
    maxHp: number;
    maxStamina: number;
    walkSpeed: number;
    runSpeed: number;
    jumpForce: number;
    weight: number; // Knockback resistance factor (1.0 = normal, >1 = heavy)
    defense: number; // Damage reduction multiplier (1.0 = normal, 0.8 = 20% less damage)
    dodgeDurationFrames: number;
    dodgeSpeed: number;
  };
  colors: {
    primary: string;
    secondary: string;
    horn: string;
    eye: string;
    accent: string;
  };
  hurtbox: RectBox;
  crouchHurtbox: RectBox;
  moves: {
    attack: MoveSpec;
    headbutt: MoveSpec;
    special: MoveSpec;
    /** ↓ + 박치기 */
    headbutt2?: MoveSpec;
    /** ↓ + 필살기 */
    special2?: MoveSpec;
  };
  /** 스프라이트 체형 */
  body?: 'heavy' | 'slim' | 'normal';
}

export interface FighterSnapshot {
  slot: 1 | 2;
  characterId: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  state: FighterActionState;
  stateFrame: number;
  hitstunFrames: number;
  invincibleFrames: number;
  hitstopFrames: number;
  comboCount: number;
  comboTimerFrames: number;
  cooldowns: {
    attack: number;
    headbutt: number;
    special: number;
    dodge: number;
  };
  hasHitCurrentMove: boolean;
  /** 현재 박치기/필살기가 추가 스킬인지 ('headbutt2' | 'special2' | '') */
  alt?: string;
  grounded: boolean;
}

export interface CombatEvent {
  type: 'HIT' | 'BLOCK' | 'DODGE' | 'JUMP' | 'MOVE_START' | 'KO' | 'CRIT' | 'STATUS' | 'BUFF';
  status?: string;
  buff?: string;
  alt?: string;
  /** 상태이상/버프 (traits.ts) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fx?: any;
  attackerSlot?: 1 | 2;
  defenderSlot?: 1 | 2;
  moveType?: 'attack' | 'headbutt' | 'special';
  damage?: number;
  x: number;
  y: number;
  heavy?: boolean;
  combo?: number;
}

export type MatchType = 'CPU' | 'LOCAL_2P' | 'QUICK' | 'RANKED' | 'FRIENDLY' | 'PRIVATE';

export interface MatchStateSnapshot {
  round: number;
  maxRounds: number;
  p1RoundsWon: number;
  p2RoundsWon: number;
  timerSeconds: number;
  frameCount: number;
  phase: 'COUNTDOWN' | 'FIGHTING' | 'ROUND_OVER' | 'MATCH_OVER';
  phaseTimerFrames: number;
  winnerSlot: 0 | 1 | 2; // 0 = draw/none, 1 = P1, 2 = P2
  fighters: [FighterSnapshot, FighterSnapshot];
  events: CombatEvent[];
}

export type RegionId = 'GREEN_VALLEY' | 'DARK_FOREST' | 'STONE_CITY' | 'IRON_LAND' | 'GOAT_ARENA';

export interface QuestDefinition {
  id: string;
  regionId: RegionId;
  title: string;
  description: string;
  npcName: string;
  objectiveType: 'DEFEAT_WILD' | 'DEFEAT_BOSS' | 'COLLECT_SHARDS';
  targetCount: number;
  rewardCoins: number;
  rewardExp: number;
  unlockCharacter?: CharacterId;
  bossCharacterId?: CharacterId;
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  subtitle: string;
  description: string;
  requiredLevel: number;
  skyColors: [string, string];
  groundColor: string;
  accentColor: string;
  wildEnemyIds: CharacterId[];
  bossId: CharacterId;
  bossName: string;
  npcs: {
    id: string;
    name: string;
    role: string;
    x: number;
    dialogue: string[];
    questId?: string;
  }[];
}

export interface PlayerSettings {
  bgmVolume: number;
  sfxVolume: number;
  graphicsQuality: 'HIGH' | 'LOW';
  touchControlScale: number;
  touchControlOpacity: number;
  showTouchControls: 'AUTO' | 'ALWAYS' | 'NEVER';
  keyBindings: {
    moveLeft: string;
    moveRight: string;
    crouch: string;
    jump: string;
    attack: string;
    headbutt: string;
    guard: string;
    dodge: string;
    special: string;
  };
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: MatchType;
  playerCharacter: CharacterId;
  opponentCharacter: CharacterId;
  opponentName: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  score: string;
}

export interface PlayerSaveData {
  userId: string;
  username: string;
  isGuest: boolean;
  authToken?: string;
  level: number;
  exp: number;
  coins: number;
  rating: number;
  unlockedCharacters: CharacterId[];
  unlockedRegions: RegionId[];
  currentRegion: RegionId;
  completedQuests: string[];
  activeQuestProgress: Record<string, number>;
  settings: PlayerSettings;
  matchHistory: MatchRecord[];
  updatedAt: number;
}

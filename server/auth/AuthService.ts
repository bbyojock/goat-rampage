import crypto from 'crypto';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import { PlayerSaveData } from '../../shared/types';
import { CHARACTERS } from '../../shared/characterData';
import { Database, StoredUserRecord } from '../database/Database';

/**
 * Handles password hashing (scrypt + random salt), token generation,
 * guest-to-member data migration, and account login/sync.
 */
/** 어드민 시크릿 코드: 어떤 닉네임이든 비밀번호를 이 값으로 가입/로그인하면 전부 해금. Render 환경변수 ADMIN_CODE 로 바꿀 수 있음 */
const ADMIN_CODE = process.env.ADMIN_CODE || '6448';
const ALL_REGIONS = ['GREEN_VALLEY', 'DARK_FOREST', 'STONE_CITY', 'IRON_LAND', 'GOAT_ARENA'] as const;

function applyAdmin(p: PlayerSaveData): PlayerSaveData {
  return {
    ...p,
    isAdmin: true,
    level: Math.max(50, p.level),
    coins: Math.max(999999, p.coins),
    unlockedCharacters: Object.keys(CHARACTERS) as PlayerSaveData['unlockedCharacters'],
    unlockedRegions: [...ALL_REGIONS],
  };
}

export class AuthService {
  static hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  static register(
    username: string,
    password: string,
    guestData?: Partial<PlayerSaveData>
  ): { ok: boolean; message?: string; token?: string; profile?: PlayerSaveData } {
    const cleanName = (username || '').trim();
    if (cleanName.length < 3 || cleanName.length > 16) {
      return { ok: false, message: '아이디는 3~16자 사이여야 합니다.' };
    }
    if (!password || password.length < 4) {
      return { ok: false, message: '비밀번호는 4자 이상이어야 합니다.' };
    }
    if (Database.getUserByUsername(cleanName)) {
      return { ok: false, message: '이미 사용 중인 아이디입니다.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const authToken = crypto.randomBytes(24).toString('hex');
    const userId = `user_${crypto.randomBytes(6).toString('hex')}`;

    // Merge guest progress safely when upgrading from Guest to Member
    const mergedProfile: PlayerSaveData = {
      userId,
      username: cleanName,
      isGuest: false,
      authToken,
      level: Math.max(1, guestData?.level || 1),
      exp: Math.max(0, guestData?.exp || 0),
      coins: Math.max(200, guestData?.coins || 200),
      rating: Math.max(1000, guestData?.rating || 1000),
      unlockedCharacters: Array.from(
        new Set(['RAM', 'DASH', 'BRUTUS', ...(guestData?.unlockedCharacters || [])])
      ),
      unlockedRegions: Array.from(
        new Set(['GREEN_VALLEY', ...(guestData?.unlockedRegions || [])])
      ),
      currentRegion: guestData?.currentRegion || 'GREEN_VALLEY',
      completedQuests: guestData?.completedQuests || [],
      activeQuestProgress: guestData?.activeQuestProgress || {},
      settings: {
        ...DEFAULT_SETTINGS,
        ...(guestData?.settings || {}),
      },
      matchHistory: guestData?.matchHistory || [],
      updatedAt: Date.now(),
    };

    const isAdmin = password === ADMIN_CODE;
    const finalProfile = isAdmin ? applyAdmin(mergedProfile) : mergedProfile;

    const record: StoredUserRecord = {
      userId,
      username: cleanName,
      passwordHash,
      salt,
      authToken,
      profile: finalProfile,
      createdAt: Date.now(),
    };

    Database.saveUser(record);
    return { ok: true, token: authToken, profile: finalProfile };
  }

  static login(
    username: string,
    password: string
  ): { ok: boolean; message?: string; token?: string; profile?: PlayerSaveData } {
    const cleanName = (username || '').trim();
    const rec = Database.getUserByUsername(cleanName);
    if (!rec) {
      return { ok: false, message: '존재하지 않는 계정입니다.' };
    }

    const candidateHash = this.hashPassword(password || '', rec.salt);
    if (candidateHash !== rec.passwordHash) {
      return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    const base: PlayerSaveData = { ...rec.profile, isGuest: false, authToken: rec.authToken };
    // 어드민은 로그인할 때마다 새로 추가된 캐릭터까지 전부 해금
    const adminLogin = (password || '') === ADMIN_CODE;
    return { ok: true, token: rec.authToken, profile: adminLogin ? applyAdmin(base) : base };
  }
}

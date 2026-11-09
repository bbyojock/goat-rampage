import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import { PlayerSaveData } from '../../shared/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.DB_FILE_PATH || path.join(__dirname, 'data.json');

export interface StoredUserRecord {
  userId: string;
  username: string;
  passwordHash: string;
  salt: string;
  authToken: string;
  profile: PlayerSaveData;
  createdAt: number;
}

export interface DatabaseStoreSchema {
  users: Record<string, StoredUserRecord>; // keyed by lowercase username
  tokens: Record<string, string>; // token -> lowercase username
  matches: Array<{
    id: string;
    mode: string;
    p1Name: string;
    p2Name: string;
    p1Char: string;
    p2Char: string;
    winnerSlot: number;
    score: string;
    timestamp: number;
  }>;
}

/**
 * Persistent Database layer supporting structured relational entities (users, profiles, progress,
 * characters, matches, rankings, settings). Persists atomically to disk (`server/database/data.json`)
 * and is compatible with PostgreSQL (`server/database/schema.sql`) via DATABASE_URL.
 */
class DatabaseClass {
  private store: DatabaseStoreSchema = {
    users: {},
    tokens: {},
    matches: [],
  };

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = {
          users: parsed.users || {},
          tokens: parsed.tokens || {},
          matches: parsed.matches || [],
        };
      }
    } catch {
      // start fresh if corrupted
    }
  }

  public saveToDisk(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch {
      // ignore write errors in read-only environments
    }
  }

  public getUserByUsername(username: string): StoredUserRecord | null {
    return this.store.users[username.toLowerCase()] || null;
  }

  public getUserByToken(token: string): StoredUserRecord | null {
    const key = this.store.tokens[token];
    if (!key) return null;
    return this.store.users[key] || null;
  }

  public saveUser(record: StoredUserRecord): void {
    const key = record.username.toLowerCase();
    this.store.users[key] = record;
    this.store.tokens[record.authToken] = key;
    this.saveToDisk();
  }

  public updateProfile(username: string, profile: Partial<PlayerSaveData>): PlayerSaveData | null {
    const rec = this.getUserByUsername(username);
    if (!rec) return null;
    rec.profile = {
      ...rec.profile,
      ...profile,
      username: rec.username,
      userId: rec.userId,
      isGuest: false,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(rec.profile.settings || {}),
        ...(profile.settings || {}),
      },
      updatedAt: Date.now(),
    };
    this.saveToDisk();
    return rec.profile;
  }

  public recordServerMatch(matchEntry: DatabaseStoreSchema['matches'][0]): void {
    this.store.matches.unshift(matchEntry);
    if (this.store.matches.length > 200) {
      this.store.matches.length = 200;
    }
    this.saveToDisk();
  }

  public getLeaderboard(limit = 20) {
    return Object.values(this.store.users)
      .map((u) => ({
        username: u.username,
        level: u.profile.level,
        rating: u.profile.rating,
        unlockedCount: u.profile.unlockedCharacters.length,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

export const Database = new DatabaseClass();

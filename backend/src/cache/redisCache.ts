import { Redis } from 'ioredis';
import type { GameSession } from '../types/index.js';

/**
 * RedisCache — wraps ioredis for game session caching.
 *
 * Key format: game:{player_id}:{date}
 * TTL: 48 hours (covers a game started late in the day + next day margin)
 *
 * Redis is OPTIONAL. If REDIS_URL is not set, all methods become no-ops
 * and the system falls back to Postgres for every request.
 * This simplifies local development without Docker.
 */
export class RedisCache {
  private client: Redis | null = null;
  private readonly TTL_SECONDS = 60 * 60 * 48; // 48 h

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });

      this.client.on('error', (err: Error) => {
        // Log but do NOT crash — cache is best-effort
        console.warn('[Redis] Connection error:', err.message);
      });
    }
  }

  private gameKey(playerId: string, date: string): string {
    return `game:${playerId}:${date}`;
  }

  async getGameSession(playerId: string, date: string): Promise<GameSession | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(this.gameKey(playerId, date));
      return raw ? (JSON.parse(raw) as GameSession) : null;
    } catch {
      return null;
    }
  }

  async setGameSession(playerId: string, date: string, session: GameSession): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(
        this.gameKey(playerId, date),
        JSON.stringify(session),
        'EX',
        this.TTL_SECONDS,
      );
    } catch {
      // Swallow — Postgres is the source of truth
    }
  }

  async deleteGameSession(playerId: string, date: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(this.gameKey(playerId, date));
    } catch {
      // no-op
    }
  }

  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

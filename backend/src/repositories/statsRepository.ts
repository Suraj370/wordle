import { Pool } from 'pg';
import type { UserStats } from '../types/index.js';

export class StatsRepository {
  constructor(private readonly db: Pool) {}

  async findByPlayerId(playerId: string): Promise<UserStats | null> {
    const { rows } = await this.db.query<UserStats>(
      'SELECT * FROM user_stats WHERE player_id = $1',
      [playerId],
    );
    return rows[0] ?? null;
  }

  async upsert(stats: UserStats): Promise<void> {
    await this.db.query(
      `INSERT INTO user_stats (player_id, games_played, wins, current_streak, max_streak)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (player_id) DO UPDATE
         SET games_played   = EXCLUDED.games_played,
             wins           = EXCLUDED.wins,
             current_streak = EXCLUDED.current_streak,
             max_streak     = EXCLUDED.max_streak`,
      [stats.player_id, stats.games_played, stats.wins, stats.current_streak, stats.max_streak],
    );
  }

  async ensureExists(playerId: string): Promise<UserStats> {
    const existing = await this.findByPlayerId(playerId);
    if (existing) return existing;

    const fresh: UserStats = {
      player_id: playerId,
      games_played: 0,
      wins: 0,
      current_streak: 0,
      max_streak: 0,
    };
    await this.upsert(fresh);
    return fresh;
  }
}

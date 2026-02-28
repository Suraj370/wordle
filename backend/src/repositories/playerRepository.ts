import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { Player } from '../types/index.js';

export class PlayerRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<Player | null> {
    const { rows } = await this.db.query<Player>(
      'SELECT * FROM players WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async findByUserId(userId: string): Promise<Player | null> {
    const { rows } = await this.db.query<Player>(
      'SELECT * FROM players WHERE user_id = $1 AND type = $2',
      [userId, 'user'],
    );
    return rows[0] ?? null;
  }

  // id is optional — pass the client's UUID to preserve guest identity
  async createGuest(id?: string): Promise<Player> {
    const playerId = id ?? uuidv4();
    const { rows } = await this.db.query<Player>(
      `INSERT INTO players (id, type, user_id)
       VALUES ($1, 'guest', NULL)
       RETURNING *`,
      [playerId],
    );
    return rows[0];
  }

  async createForUser(userId: string): Promise<Player> {
    const id = uuidv4();
    const { rows } = await this.db.query<Player>(
      `INSERT INTO players (id, type, user_id)
       VALUES ($1, 'user', $2)
       RETURNING *`,
      [id, userId],
    );
    return rows[0];
  }

  async mergeGuestIntoUser(guestPlayerId: string, userPlayerId: string): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO games (id, player_id, date, word_id, guesses, status, attempt_count, created_at)
         SELECT id, $2, date, word_id, guesses, status, attempt_count, created_at
         FROM games
         WHERE player_id = $1
         ON CONFLICT (player_id, date) DO NOTHING`,
        [guestPlayerId, userPlayerId],
      );

      await client.query(
        `INSERT INTO user_stats (player_id, games_played, wins, current_streak, max_streak)
         SELECT $2, games_played, wins, current_streak, max_streak
         FROM user_stats
         WHERE player_id = $1
         ON CONFLICT (player_id) DO UPDATE
           SET games_played   = user_stats.games_played + EXCLUDED.games_played,
               wins           = user_stats.wins + EXCLUDED.wins,
               current_streak = GREATEST(user_stats.current_streak, EXCLUDED.current_streak),
               max_streak     = GREATEST(user_stats.max_streak, EXCLUDED.max_streak)`,
        [guestPlayerId, userPlayerId],
      );

      await client.query('DELETE FROM players WHERE id = $1', [guestPlayerId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

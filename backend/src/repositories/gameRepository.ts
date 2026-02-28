import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { Game, GameStatus, GuessRecord } from '../types/index.js';

export class GameRepository {
  constructor(private readonly db: Pool) {}

  async findByPlayerAndDate(playerId: string, date: string): Promise<Game | null> {
    const { rows } = await this.db.query<Game>(
      'SELECT * FROM games WHERE player_id = $1 AND date = $2',
      [playerId, date],
    );
    return rows[0] ?? null;
  }

  async create(playerId: string, date: string, wordId: number): Promise<Game> {
    const id = uuidv4();
    const { rows } = await this.db.query<Game>(
      `INSERT INTO games (id, player_id, date, word_id, guesses, status, attempt_count)
       VALUES ($1, $2, $3, $4, '[]', 'playing', 0)
       RETURNING *`,
      [id, playerId, date, wordId],
    );
    return rows[0];
  }

  async updateGuesses(
    gameId: string,
    guesses: GuessRecord[],
    status: GameStatus,
    attemptCount: number,
  ): Promise<Game> {
    const { rows } = await this.db.query<Game>(
      `UPDATE games
       SET guesses = $2, status = $3, attempt_count = $4
       WHERE id = $1
       RETURNING *`,
      [gameId, JSON.stringify(guesses), status, attemptCount],
    );
    return rows[0];
  }
}

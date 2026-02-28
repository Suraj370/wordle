import type { GameTodayResponse, GuessResult, GameSession, GameStatus } from '../../types/index.js';
import type { GameRepository } from '../../repositories/gameRepository.js';
import type { PlayerRepository } from '../../repositories/playerRepository.js';
import type { StatsRepository } from '../../repositories/statsRepository.js';
import type { RedisCache } from '../../cache/redisCache.js';
import type { WordService } from '../word/wordService.js';
import { evaluateGuess, MAX_ATTEMPTS } from './evaluator.js';
import { getTodayUTC } from '../../utils/date.js';

/**
 * GameService — orchestrates all game lifecycle operations.
 *
 * Responsibilities:
 *  - Load or create today's game for a player.
 *  - Accept and evaluate guesses.
 *  - Manage Redis cache (read-through / write-through).
 *  - Trigger stats updates on game completion.
 *
 * CRITICAL: The answer NEVER leaves this service.
 * All returned objects are safe to send to the client.
 */
export class GameService {
  constructor(
    private readonly gameRepo: GameRepository,
    private readonly playerRepo: PlayerRepository,
    private readonly statsRepo: StatsRepository,
    private readonly cache: RedisCache,
    private readonly wordService: WordService,
  ) {}

  async getTodayGame(playerId: string): Promise<GameTodayResponse> {
    const date = getTodayUTC();
    const daily = this.wordService.getTodayWord();

    // 1. Check Redis first — full cache hit, no DB needed
    const cached = await this.cache.getGameSession(playerId, date);
    if (cached) {
      return this.toResponse(cached.gameId, date, cached);
    }

    // 2. Cache miss → check Postgres
    await this.ensurePlayer(playerId);
    let game = await this.gameRepo.findByPlayerAndDate(playerId, date);

    if (!game) {
      // First visit today — create new game
      game = await this.gameRepo.create(playerId, date, daily.index);
    }

    // 3. Hydrate Redis from Postgres
    const session: GameSession = {
      gameId: game.id,
      guesses: game.guesses,
      status: game.status,
      attempts: game.attempt_count,
    };
    await this.cache.setGameSession(playerId, date, session);

    return this.toResponse(game.id, date, session);
  }

  async submitGuess(playerId: string, guess: string): Promise<GuessResult> {
    const date = getTodayUTC();
    const daily = this.wordService.getTodayWord();
    const normalized = guess.toLowerCase().trim();

    // Validate dictionary word (server-side — client validation is just UX)
    if (!this.wordService.validateDictionaryWord(normalized)) {
      throw new InvalidGuessError(`"${guess}" is not a valid dictionary word.`);
    }

    // Load current game state — prefer cache, fall back to DB
    let session = await this.cache.getGameSession(playerId, date);
    if (!session) {
      const game = await this.gameRepo.findByPlayerAndDate(playerId, date);
      if (!game) {
        throw new GameNotFoundError('No active game found for today. Call GET /game/today first.');
      }
      session = { gameId: game.id, guesses: game.guesses, status: game.status, attempts: game.attempt_count };
    }

    if (session.status !== 'playing') {
      throw new GameAlreadyOverError('This game is already finished.');
    }

    // Evaluate
    const evaluation = evaluateGuess(normalized, daily.word);
    const isWin = evaluation.every((r) => r === 'correct');
    const newAttempts = session.attempts + 1;

    let newStatus: GameStatus = 'playing';
    if (isWin) {
      newStatus = 'won';
    } else if (newAttempts >= MAX_ATTEMPTS) {
      newStatus = 'lost';
    }

    const updatedGuesses = [...session.guesses, { word: normalized, evaluation }];
    const updatedSession: GameSession = {
      gameId: session.gameId,
      guesses: updatedGuesses,
      status: newStatus,
      attempts: newAttempts,
    };

    // Write-through: update Redis and Postgres
    await this.cache.setGameSession(playerId, date, updatedSession);
    await this.gameRepo.updateGuesses(session.gameId, updatedGuesses, newStatus, newAttempts);

    // Update stats when game is over
    if (newStatus !== 'playing') {
      await this.updateStats(playerId, newStatus === 'won');
    }

    return {
      evaluation,
      game_state: {
        guesses: updatedGuesses,
        attempts: newAttempts,
        status: newStatus,
      },
      status: newStatus,
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async ensurePlayer(playerId: string): Promise<void> {
    const player = await this.playerRepo.findById(playerId);
    if (!player) {
      // Auto-create guest player record on first interaction
      // We use the provided UUID so the client's stored identity is preserved.
      // Note: this is a simplified path; in production you'd validate UUID format.
      await this.playerRepo.createGuest(playerId);
    }
  }

  private async updateStats(playerId: string, won: boolean): Promise<void> {
    const stats = await this.statsRepo.ensureExists(playerId);
    const updatedStats = {
      ...stats,
      games_played: stats.games_played + 1,
      wins: won ? stats.wins + 1 : stats.wins,
      current_streak: won ? stats.current_streak + 1 : 0,
      max_streak: won
        ? Math.max(stats.max_streak, stats.current_streak + 1)
        : stats.max_streak,
    };
    await this.statsRepo.upsert(updatedStats);
  }

  private toResponse(
    gameId: string,
    date: string,
    session: GameSession,
  ): GameTodayResponse {
    return {
      game_id: gameId,
      date,
      guesses: session.guesses,
      attempts: session.attempts,
      status: session.status,
      max_attempts: MAX_ATTEMPTS,
    };
  }
}

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class InvalidGuessError extends Error {
  readonly statusCode = 422;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGuessError';
  }
}

export class GameNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'GameNotFoundError';
  }
}

export class GameAlreadyOverError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'GameAlreadyOverError';
  }
}

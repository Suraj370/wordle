// ─── Domain Types ────────────────────────────────────────────────────────────

export type PlayerType = 'guest' | 'user';
export type GameStatus = 'playing' | 'won' | 'lost';
export type TileResult = 'correct' | 'present' | 'absent';

export interface Player {
  id: string;
  type: PlayerType;
  user_id: string | null;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface GuessRecord {
  word: string;
  evaluation: TileResult[];
}

export interface Game {
  id: string;
  player_id: string;
  date: string; // ISO date string YYYY-MM-DD
  word_id: number;
  guesses: GuessRecord[];
  status: GameStatus;
  attempt_count: number;
  created_at: Date;
}

export interface UserStats {
  player_id: string;
  games_played: number;
  wins: number;
  current_streak: number;
  max_streak: number;
}

// ─── Service Layer Types ─────────────────────────────────────────────────────

export interface DailyWord {
  word: string;
  index: number;
}

export interface GameSession {
  guesses: GuessRecord[];
  status: GameStatus;
  attempts: number;
}

export interface GuessResult {
  evaluation: TileResult[];
  game_state: {
    guesses: GuessRecord[];
    attempts: number;
    status: GameStatus;
  };
  status: GameStatus;
}

// ─── API Request / Response Types ───────────────────────────────────────────

export interface GuessRequest {
  guess: string;
}

export interface GameTodayResponse {
  game_id: string;
  date: string;
  guesses: GuessRecord[];
  attempts: number;
  status: GameStatus;
  max_attempts: number;
}

export interface StatsResponse {
  games_played: number;
  wins: number;
  win_percentage: number;
  current_streak: number;
  max_streak: number;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
  guest_player_id?: string; // for merge on login
}

export interface AuthResponse {
  token: string;
  player_id: string;
}

// ─── Fastify Augmentations ───────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    player_id: string;
  }
}

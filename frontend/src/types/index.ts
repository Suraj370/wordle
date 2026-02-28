export type TileResult = 'correct' | 'present' | 'absent' | 'empty' | 'active';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface GuessRecord {
  word: string;
  evaluation: ('correct' | 'present' | 'absent')[];
}

export interface GameState {
  game_id: string;
  date: string;
  guesses: GuessRecord[];
  currentInput: string;
  status: GameStatus;
  max_attempts: number;
  isLoading: boolean;
  errorMessage: string | null;
  isShaking: boolean;
}

export interface GameTodayResponse {
  game_id: string;
  date: string;
  guesses: GuessRecord[];
  attempts: number;
  status: GameStatus;
  max_attempts: number;
}

export interface GuessResponse {
  evaluation: ('correct' | 'present' | 'absent')[];
  game_state: {
    guesses: GuessRecord[];
    attempts: number;
    status: GameStatus;
  };
  status: GameStatus;
}

export interface StatsResponse {
  games_played: number;
  wins: number;
  win_percentage: number;
  current_streak: number;
  max_streak: number;
}

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
] as const;

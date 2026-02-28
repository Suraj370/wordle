import type { TileResult } from '../../types/index.js';

export const MAX_ATTEMPTS = 6;
export const WORD_LENGTH = 5;

/**
 * evaluateGuess — pure function, no side effects.
 *
 * Correctly handles duplicate letters using a two-pass algorithm:
 *
 * PASS 1 — Exact matches (green)
 *   Mark positions where guess[i] === answer[i].
 *   Track which answer positions are already consumed.
 *
 * PASS 2 — Present but wrong position (yellow) vs Absent (gray)
 *   For each non-green position, scan unused answer letters.
 *   If found → yellow, mark that answer position consumed.
 *   Otherwise → gray.
 *
 * This mirrors the official Wordle algorithm and avoids over-crediting
 * duplicate letters (e.g. guessing "SPEED" against "SUPER" gives
 * S=green, P=yellow, E=gray, E=gray, D=gray — not two yellows for E).
 */
export function evaluateGuess(guess: string, answer: string): TileResult[] {
  const g = guess.toLowerCase().split('');
  const a = answer.toLowerCase().split('');

  const result: TileResult[] = new Array(WORD_LENGTH).fill('absent');
  const answerUsed: boolean[] = new Array(WORD_LENGTH).fill(false);

  // PASS 1: greens
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
      answerUsed[i] = true;
    }
  }

  // PASS 2: yellows / grays
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;

    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!answerUsed[j] && g[i] === a[j]) {
        result[i] = 'present';
        answerUsed[j] = true;
        break;
      }
    }
    // 'absent' is already the default
  }

  return result;
}

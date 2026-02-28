import { ANSWER_WORDS, ALL_VALID_WORDS } from '../../data/words.js';
import { getDaysSinceEpoch, getTodayUTC } from '../../utils/date.js';
import type { DailyWord } from '../../types/index.js';

/**
 * WordService
 *
 * Responsibilities:
 *  - Deterministically select today's answer from the static word list.
 *  - Validate that a player's guess is a real dictionary word.
 *
 * The daily word is purely a function of date → no DB round-trip.
 * This guarantees all players see the same word regardless of server instance.
 */
export class WordService {
  /**
   * Returns today's answer word and its index in the word list.
   * The index is stored in the game row so historical games can be
   * reconstructed without encoding the answer in the DB.
   */
  getTodayWord(dateString?: string): DailyWord {
    const date = dateString ?? getTodayUTC();
    const days = getDaysSinceEpoch(date);
    const index = days % ANSWER_WORDS.length;
    return { word: ANSWER_WORDS[index], index };
  }

  /**
   * Returns true if the given word is in the accepted dictionary.
   * Case-insensitive for robustness.
   */
  validateDictionaryWord(word: string): boolean {
    return ALL_VALID_WORDS.has(word.toLowerCase());
  }

  /**
   * Reconstruct the answer word from a stored word_id.
   * Used when loading historical game state.
   */
  getWordByIndex(index: number): string {
    return ANSWER_WORDS[index % ANSWER_WORDS.length];
  }
}

// Singleton — the word list is immutable so this is safe.
export const wordService = new WordService();

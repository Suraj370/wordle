import { describe, it, expect } from 'vitest';
import { WordService } from '../wordService.js';
import { ANSWER_WORDS } from '../../../data/words.js';

describe('WordService', () => {
  const svc = new WordService();

  describe('getTodayWord', () => {
    it('returns a valid 5-letter word', () => {
      const { word } = svc.getTodayWord();
      expect(word).toHaveLength(5);
      expect(ANSWER_WORDS).toContain(word);
    });

    it('is deterministic for the same date', () => {
      const a = svc.getTodayWord('2024-01-15');
      const b = svc.getTodayWord('2024-01-15');
      expect(a.word).toBe(b.word);
      expect(a.index).toBe(b.index);
    });

    it('returns different words for different dates', () => {
      const a = svc.getTodayWord('2024-01-01');
      const b = svc.getTodayWord('2024-01-02');
      // Different days should yield different indices (they could collide if list < 2 words,
      // but our list has hundreds)
      expect(a.index).not.toBe(b.index);
    });

    it('cycles correctly when days exceed word list length', () => {
      // Two dates exactly ANSWER_WORDS.length days apart should yield the same word
      const daysInList = ANSWER_WORDS.length;
      const epoch = new Date(0);
      const dateA = new Date(epoch.getTime() + daysInList * 24 * 60 * 60 * 1000);
      const dateB = new Date(epoch.getTime() + daysInList * 2 * 24 * 60 * 60 * 1000);
      const wA = svc.getTodayWord(dateA.toISOString().slice(0, 10));
      const wB = svc.getTodayWord(dateB.toISOString().slice(0, 10));
      expect(wA.word).toBe(wB.word);
    });
  });

  describe('validateDictionaryWord', () => {
    it('accepts known valid words', () => {
      expect(svc.validateDictionaryWord('crane')).toBe(true);
      expect(svc.validateDictionaryWord('about')).toBe(true);
    });

    it('rejects nonsense strings', () => {
      expect(svc.validateDictionaryWord('zzzzz')).toBe(false);
      expect(svc.validateDictionaryWord('xkqjv')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(svc.validateDictionaryWord('CRANE')).toBe(true);
      expect(svc.validateDictionaryWord('Crane')).toBe(true);
    });
  });

  describe('getWordByIndex', () => {
    it('wraps around correctly', () => {
      const len = ANSWER_WORDS.length;
      expect(svc.getWordByIndex(0)).toBe(svc.getWordByIndex(len));
      expect(svc.getWordByIndex(1)).toBe(svc.getWordByIndex(len + 1));
    });
  });
});

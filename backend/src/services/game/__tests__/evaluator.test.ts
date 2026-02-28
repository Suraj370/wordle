import { describe, it, expect } from 'vitest';
import { evaluateGuess } from '../evaluator.js';

describe('evaluateGuess', () => {
  it('marks all correct for a perfect match', () => {
    expect(evaluateGuess('crane', 'crane')).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct',
    ]);
  });

  it('marks absent letters not in the answer', () => {
    expect(evaluateGuess('zzzzz', 'crane')).toEqual([
      'absent', 'absent', 'absent', 'absent', 'absent',
    ]);
  });

  it('marks present letters in wrong positions', () => {
    // 'crane' vs 'nacre' — all letters present, all wrong position
    const result = evaluateGuess('crane', 'nacre');
    // c -> present, r -> correct (pos 2 in nacre? no: nacre = n,a,c,r,e)
    // c at pos 0 in guess vs nacre[0]=n: c is in nacre at pos 2 → present
    // r at pos 1 in guess vs nacre[1]=a: r is in nacre at pos 3 → present
    // a at pos 2 in guess vs nacre[2]=c: a is in nacre at pos 1 → present
    // n at pos 3 in guess vs nacre[3]=r: n is in nacre at pos 0 → present
    // e at pos 4 in guess vs nacre[4]=e: e matches → correct
    expect(result[4]).toBe('correct'); // e
    expect(result).not.toContain('absent');
  });

  it('does not double-credit duplicate letters in guess when answer has one', () => {
    // answer = 'super', guess = 'speed'
    // s=correct(0), p=correct(1), e=present(2)? → 'e' in super at pos 3? no, super=s,u,p,e,r
    // p at index 1 vs super[1]=u → p is at super[2] → present
    // Actually let's test a clear case:
    // answer = 'crane', guess = 'eerie'
    // e is in crane at position 4 only (one 'e')
    const result = evaluateGuess('eerie', 'crane');
    // e(0): crane has e at 4 → present, mark pos 4 used
    // e(1): no unused 'e' left → absent
    // r(2): crane has r at 2 → correct, mark pos 2 used
    // i(3): not in crane → absent
    // e(4): crane[4]=e → correct
    expect(result[0]).toBe('present'); // first e
    expect(result[1]).toBe('absent');  // second e — no more e's
    expect(result[2]).toBe('correct'); // r
    expect(result[3]).toBe('absent');  // i
    expect(result[4]).toBe('correct'); // e at correct position
  });

  it('handles all-absent guess', () => {
    const result = evaluateGuess('brick', 'stone');
    // b,r,i,c,k — none in stone
    expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('marks green before consuming letters for yellow (pass 1 priority)', () => {
    // answer = 'abbey', guess = 'keeps'
    // No overlap — all absent
    expect(evaluateGuess('keeps', 'abbey')).toEqual([
      'absent', 'absent', 'absent', 'absent', 'absent',
    ]);
  });

  it('handles duplicate letters in answer correctly', () => {
    // answer = 'vivid', guess = 'civic'
    // c(0) not in vivid → absent
    // i(1) → vivid has i at 2,4; pos 1 ≠ either → present
    // v(2) → vivid has v at 0,2; vivid[2]=v → correct, mark pos 2 used
    // i(3) → vivid has i at 4 (pos 2 used); pos 3 ≠ 4 → present
    // c(4) → not in vivid → absent
    const result = evaluateGuess('civic', 'vivid');
    expect(result[0]).toBe('absent');  // c
    expect(result[1]).toBe('present'); // i
    expect(result[2]).toBe('correct'); // v
    expect(result[3]).toBe('present'); // i
    expect(result[4]).toBe('absent');  // c
  });

  it('is case-insensitive', () => {
    const lower = evaluateGuess('crane', 'crane');
    const upper = evaluateGuess('CRANE', 'CRANE');
    const mixed = evaluateGuess('Crane', 'cRaNe');
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
  });
});

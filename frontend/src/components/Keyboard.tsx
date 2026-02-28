'use client';

import type { GuessRecord } from '@/types';
import { KEYBOARD_ROWS } from '@/types';

interface KeyboardProps {
  guesses: GuessRecord[];
  onKey: (key: string) => void;
}

type LetterStatus = 'correct' | 'present' | 'absent' | 'unused';

const keyStatusClasses: Record<LetterStatus, string> = {
  correct: 'bg-correct text-white',
  present: 'bg-present text-white',
  absent:  'bg-absent  text-white',
  unused:  'bg-key-bg  text-white',
};

/** Build a map of letter → best known result from all committed guesses */
function buildLetterStatuses(guesses: GuessRecord[]): Record<string, LetterStatus> {
  const priority: Record<LetterStatus, number> = { correct: 3, present: 2, absent: 1, unused: 0 };
  const map: Record<string, LetterStatus> = {};

  for (const guess of guesses) {
    guess.word.split('').forEach((char, i) => {
      const incoming = guess.evaluation[i] as LetterStatus;
      const existing = map[char] ?? 'unused';
      if ((priority[incoming] ?? 0) > (priority[existing] ?? 0)) {
        map[char] = incoming;
      }
    });
  }
  return map;
}

export function Keyboard({ guesses, onKey }: KeyboardProps) {
  const statuses = buildLetterStatuses(guesses);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-md px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center w-full">
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === '⌫';
            const letter = key.toLowerCase();
            const status: LetterStatus = statuses[letter] ?? 'unused';
            const colorClass = isWide ? 'bg-key-bg text-white' : keyStatusClasses[status];

            return (
              <button
                key={key}
                onClick={() => onKey(key)}
                aria-label={key === '⌫' ? 'Backspace' : key}
                className={`
                  ${colorClass}
                  ${isWide ? 'px-3 min-w-[3.5rem]' : 'w-9'}
                  h-14 rounded font-bold text-sm uppercase
                  flex items-center justify-center
                  cursor-pointer select-none
                  active:scale-95 transition-transform
                `}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

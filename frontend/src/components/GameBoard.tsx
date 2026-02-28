'use client';

import { Tile } from './Tile';
import type { GuessRecord, TileResult } from '@/types';
import { MAX_ATTEMPTS, WORD_LENGTH } from '@/types';

interface GameBoardProps {
  guesses: GuessRecord[];
  currentInput: string;
  isShaking: boolean;
}

export function GameBoard({ guesses, currentInput, isShaking }: GameBoardProps) {
  const rows = Array.from({ length: MAX_ATTEMPTS }, (_, rowIndex) => {
    const committed = guesses[rowIndex];
    const isCurrent = rowIndex === guesses.length;

    return (
      <div
        key={rowIndex}
        className={`flex gap-1.5 ${isCurrent && isShaking ? 'animate-shake' : ''}`}
      >
        {Array.from({ length: WORD_LENGTH }, (_, colIndex) => {
          let letter = '';
          let result: TileResult = 'empty';

          if (committed) {
            letter = committed.word[colIndex] ?? '';
            result = committed.evaluation[colIndex] as TileResult;
          } else if (isCurrent) {
            letter = currentInput[colIndex] ?? '';
            result = letter ? 'active' : 'empty';
          }

          return (
            <Tile
              key={colIndex}
              letter={letter}
              result={result}
              revealDelay={committed ? colIndex * 150 : 0}
              isActive={isCurrent && !!letter}
            />
          );
        })}
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-1.5" role="grid" aria-label="Wordle game board">
      {rows}
    </div>
  );
}

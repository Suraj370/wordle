'use client';

import { useEffect, useState } from 'react';
import type { TileResult } from '@/types';

interface TileProps {
  letter: string;
  result: TileResult;
  revealDelay?: number; // ms — used to stagger the flip animation
  isActive?: boolean;
}

const resultClasses: Record<TileResult, string> = {
  correct: 'bg-correct border-correct text-white',
  present: 'bg-present border-present text-white',
  absent:  'bg-absent  border-absent  text-white',
  empty:   'bg-tile-empty border-tile-border text-white',
  active:  'bg-tile-empty border-gray-400 text-white',
};

export function Tile({ letter, result, revealDelay = 0, isActive = false }: TileProps) {
  const [revealed, setRevealed] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const isEvaluated = result === 'correct' || result === 'present' || result === 'absent';

  useEffect(() => {
    if (!isEvaluated) return;
    const flipTimer = setTimeout(() => setFlipping(true), revealDelay);
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      setFlipping(false);
    }, revealDelay + 250); // halfway through flip

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(revealTimer);
    };
  }, [isEvaluated, revealDelay]);

  const displayResult: TileResult = isEvaluated && revealed ? result : isActive ? 'active' : 'empty';
  const colorClass = resultClasses[displayResult];

  return (
    <div
      className={`
        relative w-14 h-14 flex items-center justify-center
        border-2 rounded-sm font-bold text-2xl uppercase
        select-none transition-transform duration-75
        ${colorClass}
        ${letter && !isEvaluated ? 'animate-pop' : ''}
        ${flipping ? 'animate-flip' : ''}
      `}
      style={{
        perspective: '250px',
        transitionTimingFunction: 'ease',
      }}
    >
      {letter}
    </div>
  );
}

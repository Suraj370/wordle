'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';


const PREVIEW_TILES = [
  { letter: 'W', state: 'correct' },
  { letter: 'O', state: 'absent' },
  { letter: 'R', state: 'present' },
  { letter: 'D', state: 'absent' },
  { letter: 'L', state: 'correct' },
] as const;

const TILE_STYLES: Record<string, string> = {
  correct: 'bg-[#538d4e] border-[#538d4e]',
  present: 'bg-[#b59f3b] border-[#b59f3b]',
  absent:  'bg-zinc-700 border-zinc-700',
};

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();

  function handleAuthSuccess() {
    router.push('/game');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-12">
      {/* Logo + tagline */}
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl sm:text-6xl font-black tracking-widest select-none">
          WORDLE
        </h1>

        {/* Decorative preview tiles */}
        <div className="flex gap-1.5">
          {PREVIEW_TILES.map(({ letter, state }) => (
            <div
              key={letter}
              className={`w-11 h-11 flex items-center justify-center border-2 rounded text-white font-black text-lg select-none ${TILE_STYLES[state]}`}
            >
              {letter}
            </div>
          ))}
        </div>

        <p className="text-zinc-400 text-sm text-center max-w-xs leading-relaxed">
          Guess the hidden 5-letter word in 6 tries. A new puzzle every day.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setAuthOpen(true)}
          className="w-full bg-white text-black font-bold py-3 rounded-full text-sm tracking-wide hover:bg-zinc-200 transition-colors"
        >
          Log In
        </button>

        <button
          onClick={() => router.push('/game')}
          className="w-full bg-transparent text-white font-bold py-3 rounded-full text-sm tracking-wide border border-zinc-600 hover:border-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Play as Guest
        </button>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

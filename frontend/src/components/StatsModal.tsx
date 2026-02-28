'use client';

import { useEffect, useState } from 'react';
import { fetchStats } from '@/lib/api';
import type { StatsResponse } from '@/types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: 'playing' | 'won' | 'lost';
}

export function StatsModal({ isOpen, onClose, gameStatus }: StatsModalProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 text-white rounded-lg p-6 w-80 max-w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-widest">STATISTICS</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {gameStatus === 'won' && (
          <p className="text-correct font-semibold text-center mb-4">Brilliant! You got it!</p>
        )}
        {gameStatus === 'lost' && (
          <p className="text-red-400 font-semibold text-center mb-4">Better luck tomorrow!</p>
        )}

        {loading && <p className="text-center text-gray-400 my-6">Loading…</p>}

        {!loading && stats && (
          <div className="grid grid-cols-4 gap-2 text-center mb-6">
            <StatBox value={stats.games_played} label="Played" />
            <StatBox value={`${stats.win_percentage}%`} label="Win %" />
            <StatBox value={stats.current_streak} label="Current Streak" />
            <StatBox value={stats.max_streak} label="Max Streak" />
          </div>
        )}

        {!loading && !stats && (
          <p className="text-center text-gray-500 my-4 text-sm">Stats unavailable.</p>
        )}

        <button
          onClick={onClose}
          className="w-full bg-correct hover:bg-green-600 text-white font-bold py-2.5 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs text-gray-400 mt-1 leading-tight">{label}</span>
    </div>
  );
}

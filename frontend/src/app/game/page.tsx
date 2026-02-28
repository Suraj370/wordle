"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { Keyboard } from "@/components/Keyboard";
import { StatsModal } from "@/components/StatsModal";
import { useGame } from "@/hooks/useGame";
import { getStoredToken, clearToken } from "@/lib/playerIdentity";

export default function GamePage() {
  const { state, handleKeyPress, clearError } = useGame();
  const [statsOpen, setStatsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(!!getStoredToken());
  }, []);

  // Auto-open stats when game ends
  useEffect(() => {
    if (state.status !== "playing" && !state.isLoading) {
      const timer = setTimeout(() => setStatsOpen(true), 1600);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.isLoading]);

  // Auto-clear error toast after 2s
  useEffect(() => {
    if (!state.errorMessage) return;
    const timer = setTimeout(clearError, 2000);
    return () => clearTimeout(timer);
  }, [state.errorMessage, clearError]);

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 max-w-lg mx-auto w-full">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
          >
            Log out
          </button>
        ) : (
          <></>
        )}

        <h1 className="text-3xl font-black tracking-widest select-none">
          WORDLE
        </h1>

        <button
          onClick={() => setStatsOpen(true)}
          aria-label="Open statistics"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-between py-4 gap-4 max-w-lg mx-auto w-full px-4">
        <div className="h-8 flex items-center justify-center">
          {state.errorMessage && (
            <div
              role="alert"
              className="bg-white text-black font-bold text-sm px-4 py-2 rounded shadow-md"
            >
              {state.errorMessage}
            </div>
          )}
        </div>

        {state.isLoading && state.guesses.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">
              Loading today&apos;s puzzle…
            </div>
          </div>
        )}

        {(!state.isLoading || state.guesses.length > 0) && (
          <div className="flex-1 flex items-center justify-center">
            <GameBoard
              guesses={state.guesses}
              currentInput={state.currentInput}
              isShaking={state.isShaking}
            />
          </div>
        )}

        <Keyboard guesses={state.guesses} onKey={handleKeyPress} />
      </main>

      <StatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        gameStatus={state.status}
      />
    </div>
  );
}

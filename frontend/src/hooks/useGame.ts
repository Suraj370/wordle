'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { fetchTodayGame, submitGuess, ApiError } from '@/lib/api';
import type { GameState, GuessRecord } from '@/types';
import { MAX_ATTEMPTS, WORD_LENGTH } from '@/types';

// ─── State Machine ───────────────────────────────────────────────────────────

type Action =
  | { type: 'GAME_LOADED'; payload: Omit<GameState, 'currentInput' | 'isLoading' | 'errorMessage' | 'isShaking'> }
  | { type: 'KEY_PRESSED'; key: string }
  | { type: 'GUESS_SUBMITTED'; guesses: GuessRecord[]; status: GameState['status'] }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SHAKING'; shaking: boolean };

const initialState: GameState = {
  game_id: '',
  date: '',
  guesses: [],
  currentInput: '',
  status: 'playing',
  max_attempts: MAX_ATTEMPTS,
  isLoading: true,
  errorMessage: null,
  isShaking: false,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'GAME_LOADED':
      return {
        ...state,
        ...action.payload,
        currentInput: '',
        isLoading: false,
        errorMessage: null,
      };

    case 'KEY_PRESSED': {
      if (state.status !== 'playing' || state.isLoading) return state;
      const key = action.key;
      if (key === 'ENTER') return state; // handled separately
      if (key === 'BACKSPACE' || key === '⌫') {
        return { ...state, currentInput: state.currentInput.slice(0, -1) };
      }
      if (/^[A-Za-z]$/.test(key) && state.currentInput.length < WORD_LENGTH) {
        return { ...state, currentInput: state.currentInput + key.toUpperCase() };
      }
      return state;
    }

    case 'GUESS_SUBMITTED':
      return {
        ...state,
        guesses: action.guesses,
        status: action.status,
        currentInput: '',
        isLoading: false,
        errorMessage: null,
        isShaking: false,
      };

    case 'SET_ERROR':
      return { ...state, errorMessage: action.message, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, errorMessage: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_SHAKING':
      return { ...state, isShaking: action.shaking };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load game on mount
  useEffect(() => {
    fetchTodayGame()
      .then((data) => {
        dispatch({
          type: 'GAME_LOADED',
          payload: {
            game_id: data.game_id,
            date: data.date,
            guesses: data.guesses,
            status: data.status,
            max_attempts: data.max_attempts,
          },
        });
      })
      .catch(() => {
        dispatch({ type: 'SET_ERROR', message: 'Failed to load game. Please refresh.' });
      });
  }, []);

  // Keyboard listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      dispatch({ type: 'KEY_PRESSED', key: e.key.toUpperCase() });

      if (e.key === 'Enter') {
        void handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentInput, state.status]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'ENTER') {
      void handleSubmit();
      return;
    }
    dispatch({ type: 'KEY_PRESSED', key });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentInput, state.status]);

  async function handleSubmit() {
    if (state.currentInput.length !== WORD_LENGTH) {
      dispatch({ type: 'SET_SHAKING', shaking: true });
      dispatch({ type: 'SET_ERROR', message: 'Word must be 5 letters.' });
      setTimeout(() => dispatch({ type: 'SET_SHAKING', shaking: false }), 600);
      return;
    }
    if (state.status !== 'playing') return;

    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await submitGuess(state.currentInput);
      dispatch({
        type: 'GUESS_SUBMITTED',
        guesses: result.game_state.guesses,
        status: result.status,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
      dispatch({ type: 'SET_SHAKING', shaking: true });
      dispatch({ type: 'SET_ERROR', message });
      setTimeout(() => dispatch({ type: 'SET_SHAKING', shaking: false }), 600);
    }
  }

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return { state, handleKeyPress, clearError };
}

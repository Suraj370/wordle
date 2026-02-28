import type { GameTodayResponse, GuessResponse, StatsResponse } from '@/types';
import { getOrCreatePlayerId, getStoredToken } from './playerIdentity';

const BASE_URL = '/api';

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const playerId = getOrCreatePlayerId();
    if (playerId) {
      headers['x-player-id'] = playerId;
    }
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? 'Unknown error');
  }
  return res.json() as Promise<T>;
}

export async function fetchTodayGame(): Promise<GameTodayResponse> {
  const res = await fetch(`${BASE_URL}/game/today`, {
    headers: buildHeaders(),
  });
  return handleResponse<GameTodayResponse>(res);
}

export async function submitGuess(guess: string): Promise<GuessResponse> {
  const res = await fetch(`${BASE_URL}/game/guess`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ guess: guess.toLowerCase() }),
  });
  return handleResponse<GuessResponse>(res);
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${BASE_URL}/user/stats`, {
    headers: buildHeaders(),
  });
  return handleResponse<StatsResponse>(res);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

import axios, { AxiosError } from 'axios';
import type { GameTodayResponse, GuessResponse, StatsResponse } from '@/types';
import { getOrCreatePlayerId, getStoredToken } from './playerIdentity';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    const playerId = getOrCreatePlayerId();
    if (playerId) {
      config.headers['x-player-id'] = playerId;
    }
  }
  return config;
});

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data?.error) {
    return err.response.data.error as string;
  }
  return 'Unknown error';
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

function wrapAxios<T>(promise: Promise<{ data: T }>): Promise<T> {
  return promise.then((r) => r.data).catch((err: unknown) => {
    const status = err instanceof AxiosError ? (err.response?.status ?? 0) : 0;
    throw new ApiError(status, extractMessage(err));
  });
}

export async function fetchTodayGame(): Promise<GameTodayResponse> {
  return wrapAxios(client.get<GameTodayResponse>('/game/today'));
}

export async function submitGuess(guess: string): Promise<GuessResponse> {
  return wrapAxios(client.post<GuessResponse>('/game/guess', { guess: guess.toLowerCase() }));
}

export async function fetchStats(): Promise<StatsResponse> {
  return wrapAxios(client.get<StatsResponse>('/user/stats'));
}

export interface AuthResponse {
  token: string;
  player_id: string;
}

export async function login(
  email: string,
  password: string,
  guest_player_id?: string,
): Promise<AuthResponse> {
  return wrapAxios(
    client.post<AuthResponse>('/auth/login', { email, password, guest_player_id }),
  );
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  return wrapAxios(client.post<AuthResponse>('/auth/register', { email, password }));
}

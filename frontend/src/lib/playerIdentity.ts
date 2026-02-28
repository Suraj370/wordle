/**
 * Player Identity
 *
 * Generates and persists a UUID for guest players in localStorage.
 * This UUID is sent as the x-player-id header on every API request.
 * On login, the guest_player_id is passed to the backend for merging.
 */

const STORAGE_KEY = 'wordle_player_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const newId = generateUUID();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wordle_token');
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wordle_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wordle_token');
}

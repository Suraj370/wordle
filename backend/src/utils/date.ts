/**
 * Date utilities for the Wordle application.
 * All dates are treated as UTC to ensure global consistency.
 */

/**
 * Returns today's date string in YYYY-MM-DD format (UTC).
 */
export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the number of days since Unix epoch (UTC).
 * Used to deterministically pick the daily word.
 */
export function getDaysSinceEpoch(dateString?: string): number {
  const date = dateString ? new Date(dateString) : new Date();
  const utcMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor(utcMs / (1000 * 60 * 60 * 24));
}

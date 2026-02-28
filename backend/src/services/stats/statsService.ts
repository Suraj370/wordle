import type { StatsResponse } from '../../types/index.js';
import type { StatsRepository } from '../../repositories/statsRepository.js';

export class StatsService {
  constructor(private readonly statsRepo: StatsRepository) {}

  async getStats(playerId: string): Promise<StatsResponse> {
    const stats = await this.statsRepo.ensureExists(playerId);
    const winPct =
      stats.games_played > 0
        ? Math.round((stats.wins / stats.games_played) * 100)
        : 0;

    return {
      games_played: stats.games_played,
      wins: stats.wins,
      win_percentage: winPct,
      current_streak: stats.current_streak,
      max_streak: stats.max_streak,
    };
  }
}

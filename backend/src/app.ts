import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';

import { getDb, closeDb } from './db/client.js';
import { RedisCache } from './cache/redisCache.js';
import { WordService } from './services/word/wordService.js';
import { GameService } from './services/game/gameService.js';
import { StatsService } from './services/stats/statsService.js';
import { AuthService } from './services/auth/authService.js';
import { PlayerRepository } from './repositories/playerRepository.js';
import { GameRepository } from './repositories/gameRepository.js';
import { StatsRepository } from './repositories/statsRepository.js';
import authPlugin from './plugins/auth.js';
import gameRoutes from './routes/game.js';
import userRoutes from './routes/user.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function buildApp() {
  const app = Fastify({ logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' } });

  // ─── Infrastructure ──────────────────────────────────────────────────────────
  const db = getDb();
  const cache = new RedisCache(process.env.REDIS_URL);

  // ─── Repositories ────────────────────────────────────────────────────────────
  const playerRepo = new PlayerRepository(db);
  const gameRepo = new GameRepository(db);
  const statsRepo = new StatsRepository(db);

  // ─── Services ────────────────────────────────────────────────────────────────
  const wordService = new WordService();
  const gameService = new GameService(gameRepo, playerRepo, statsRepo, cache, wordService);
  const statsService = new StatsService(statsRepo);

  // ─── Plugins ─────────────────────────────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  });

  await app.register(fastifyRateLimit, {
    max: 60,
    timeWindow: '1 minute',
    // Stricter limit on the guess endpoint
    keyGenerator: (request) => request.ip,
  });

  await app.register(authPlugin);

  // ─── Auth Service (needs jwt.sign — registered after jwt plugin) ─────────────
  const authService = new AuthService(db, playerRepo, (payload) =>
    app.jwt.sign(payload as Record<string, unknown>),
  );

  // ─── Routes ──────────────────────────────────────────────────────────────────
  await app.register(gameRoutes, { gameService });
  await app.register(userRoutes, { statsService, authService });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  // ─── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = async () => {
    await app.close();
    await cache.quit();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return app;
}

// Start server when run directly
const app = await buildApp();
await app.listen({ port: PORT, host: HOST });
console.log(`🚀  Wordle API running at http://localhost:${PORT}`);

export { buildApp };

import type { FastifyPluginAsync } from 'fastify';
import type { GameService } from '../services/game/gameService.js';
import {
  InvalidGuessError,
  GameNotFoundError,
  GameAlreadyOverError,
} from '../services/game/gameService.js';
import { requirePlayer } from '../plugins/auth.js';

interface GameRouteOptions {
  gameService: GameService;
}

const gameRoutes: FastifyPluginAsync<GameRouteOptions> = async (fastify, opts) => {
  const { gameService } = opts;

  /**
   * GET /game/today
   * Returns the current player's game state for today.
   * Creates a new game if one doesn't exist yet.
   */
  fastify.get('/game/today', async (request, reply) => {
    requirePlayer(request, reply);
    if (reply.sent) return;

    const response = await gameService.getTodayGame(request.player_id);
    return reply.status(200).send(response);
  });

  /**
   * POST /game/guess
   * Accepts a 5-letter guess, evaluates it, and returns the result.
   */
  fastify.post<{ Body: { guess: string } }>(
    '/game/guess',
    {
      schema: {
        body: {
          type: 'object',
          required: ['guess'],
          properties: {
            guess: { type: 'string', minLength: 5, maxLength: 5 },
          },
        },
      },
    },
    async (request, reply) => {
      requirePlayer(request, reply);
      if (reply.sent) return;

      try {
        const result = await gameService.submitGuess(request.player_id, request.body.guess);
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof InvalidGuessError) {
          return reply.status(422).send({ error: err.message });
        }
        if (err instanceof GameNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof GameAlreadyOverError) {
          return reply.status(409).send({ error: err.message });
        }
        throw err; // Let Fastify's default error handler handle unknown errors
      }
    },
  );
};

export default gameRoutes;

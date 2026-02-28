import type { FastifyPluginAsync } from 'fastify';
import type { StatsService } from '../services/stats/statsService.js';
import type { AuthService } from '../services/auth/authService.js';
import { EmailAlreadyExistsError, InvalidCredentialsError } from '../services/auth/authService.js';
import { requirePlayer } from '../plugins/auth.js';

interface UserRouteOptions {
  statsService: StatsService;
  authService: AuthService;
}

const userRoutes: FastifyPluginAsync<UserRouteOptions> = async (fastify, opts) => {
  const { statsService, authService } = opts;

  /**
   * GET /user/stats
   * Returns aggregate stats for the resolved player.
   */
  fastify.get('/user/stats', async (request, reply) => {
    requirePlayer(request, reply);
    if (reply.sent) return;

    const stats = await statsService.getStats(request.player_id);
    return reply.status(200).send(stats);
  });

  /**
   * POST /auth/register
   */
  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authService.register(request.body.email, request.body.password);
        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof EmailAlreadyExistsError) {
          return reply.status(409).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  /**
   * POST /auth/login
   * Accepts optional guest_player_id to trigger guest → user merge.
   */
  fastify.post<{ Body: { email: string; password: string; guest_player_id?: string } }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            guest_player_id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authService.login(
          request.body.email,
          request.body.password,
          request.body.guest_player_id,
        );
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.status(401).send({ error: err.message });
        }
        throw err;
      }
    },
  );
};

export default userRoutes;

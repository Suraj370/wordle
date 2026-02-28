import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Auth Plugin
 *
 * Decorates every request with `request.player_id` before route handlers run.
 *
 * Resolution order:
 *  1. Valid JWT Bearer token  → player_id = user's player record id
 *  2. x-player-id header      → player_id = guest UUID from client
 *
 * If neither is present the request continues WITHOUT a player_id.
 * Individual routes are responsible for calling `requirePlayer` if they need it.
 */

declare module 'fastify' {
  interface FastifyRequest {
    player_id: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate with empty string as default
  fastify.decorateRequest('player_id', '');

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Try JWT first
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await request.jwtVerify<{ player_id: string }>();
        request.player_id = payload.player_id;
        return;
      } catch {
        // Invalid JWT — fall through to guest check
      }
    }

    // Fall back to guest header
    const guestId = request.headers['x-player-id'];
    if (typeof guestId === 'string' && guestId.length > 0) {
      request.player_id = guestId;
    }
  });
};

export default fp(authPlugin, { name: 'auth' });

/**
 * Route-level guard. Call inside a route handler to reject requests
 * that have no resolved player_id.
 */
export function requirePlayer(request: FastifyRequest, reply: FastifyReply): void {
  if (!request.player_id) {
    reply.status(401).send({
      error: 'Unauthorized',
      message:
        'Provide a Bearer JWT or an x-player-id header to identify yourself.',
    });
  }
}

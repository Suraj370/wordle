import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import type { User, AuthResponse } from '../../types/index.js';
import type { PlayerRepository } from '../../repositories/playerRepository.js';

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(
    private readonly db: Pool,
    private readonly playerRepo: PlayerRepository,
    private readonly jwtSign: (payload: object) => Promise<string>,
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const emailLower = email.toLowerCase().trim();

    // Check if email already exists
    const { rows: existing } = await this.db.query<User>(
      'SELECT id FROM users WHERE email = $1',
      [emailLower],
    );
    if (existing.length > 0) {
      throw new EmailAlreadyExistsError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    // Create user
    await this.db.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [userId, emailLower, passwordHash],
    );

    // Create linked player record
    const player = await this.playerRepo.createForUser(userId);

    const token = await this.jwtSign({ player_id: player.id, user_id: userId, email: emailLower });
    return { token, player_id: player.id };
  }

  async login(
    email: string,
    password: string,
    guestPlayerId?: string,
  ): Promise<AuthResponse> {
    const emailLower = email.toLowerCase().trim();

    const { rows } = await this.db.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [emailLower],
    );
    const user = rows[0];
    if (!user) throw new InvalidCredentialsError('Invalid email or password.');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new InvalidCredentialsError('Invalid email or password.');

    // Get or create player for this user
    let player = await this.playerRepo.findByUserId(user.id);
    if (!player) {
      player = await this.playerRepo.createForUser(user.id);
    }

    // Phase 9 — Merge guest data if provided
    if (guestPlayerId && guestPlayerId !== player.id) {
      try {
        await this.playerRepo.mergeGuestIntoUser(guestPlayerId, player.id);
      } catch {
        // Merge failure is non-fatal — user still logs in
        console.warn(`[Auth] Guest merge failed for guest=${guestPlayerId} user=${player.id}`);
      }
    }

    const token = await this.jwtSign({
      player_id: player.id,
      user_id: user.id,
      email: emailLower,
    });
    return { token, player_id: player.id };
  }
}

export class EmailAlreadyExistsError extends Error {
  readonly statusCode = 409;
  constructor(message: string) { super(message); this.name = 'EmailAlreadyExistsError'; }
}

export class InvalidCredentialsError extends Error {
  readonly statusCode = 401;
  constructor(message: string) { super(message); this.name = 'InvalidCredentialsError'; }
}

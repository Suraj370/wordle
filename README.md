# Wordle — Production-Grade Implementation

A full-stack Wordle clone following clean architecture principles.

## Architecture Overview

```
wordle/
├── backend/          # Fastify + TypeScript API server
│   └── src/
│       ├── app.ts              # Entry point — wires everything
│       ├── plugins/            # auth, CORS, rate-limit
│       ├── routes/             # game.ts, user.ts
│       ├── services/
│       │   ├── game/           # GameService + evaluator (pure fn)
│       │   ├── word/           # WordService — deterministic daily word
│       │   ├── stats/          # StatsService
│       │   └── auth/           # AuthService — register / login / merge
│       ├── repositories/       # Thin DB access layer (pg)
│       ├── cache/              # RedisCache — best-effort session cache
│       ├── data/words.ts       # Static word list (no DB query for daily word)
│       └── types/index.ts      # Shared domain types
└── frontend/         # Next.js 14 App Router + Tailwind CSS
    └── src/
        ├── app/                # layout.tsx, page.tsx, globals.css
        ├── components/         # GameBoard, Tile, Keyboard, StatsModal
        ├── hooks/useGame.ts    # State machine (useReducer)
        └── lib/                # api.ts, playerIdentity.ts
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Answer never sent to client | All evaluation is server-side; only `TileResult[]` is returned |
| Daily word is a pure function | `index = daysSinceEpoch % words.length` — no DB, globally consistent |
| Redis is optional | If `REDIS_URL` is unset, cache is a no-op; Postgres serves every request |
| player_id is universal | Both guests (UUID header) and users (JWT claim) resolve to a `player_id` |
| Two-pass evaluation | Correctly handles duplicate letters per the official Wordle algorithm |

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional — skipped if `REDIS_URL` is not set)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, optionally REDIS_URL, JWT_SECRET

npm install
npm run migrate      # Runs SQL migrations against your Postgres instance
npm run dev          # Starts Fastify on :3001 with hot reload
```

### 2. Frontend

```bash
cd frontend
cp src/app/.env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001 (default)

npm install
npm run dev          # Starts Next.js on :3000
```

### 3. Run tests (backend)

```bash
cd backend
npm test
```

## API Reference

### `GET /game/today`
Returns or creates today's game for the resolved player.

**Headers:** `Authorization: Bearer <jwt>` OR `x-player-id: <uuid>`

**Response:**
```json
{
  "game_id": "uuid",
  "date": "2024-01-15",
  "guesses": [{ "word": "crane", "evaluation": ["correct","absent","present","absent","absent"] }],
  "attempts": 1,
  "status": "playing",
  "max_attempts": 6
}
```

### `POST /game/guess`
Submit a guess.

**Body:** `{ "guess": "crane" }`

**Response:**
```json
{
  "evaluation": ["correct","absent","present","absent","absent"],
  "game_state": { "guesses": [...], "attempts": 1, "status": "playing" },
  "status": "playing"
}
```

### `GET /user/stats`
Returns aggregate stats.

### `POST /auth/register`
**Body:** `{ "email": "...", "password": "..." }`

### `POST /auth/login`
**Body:** `{ "email": "...", "password": "...", "guest_player_id": "uuid" }`

Include `guest_player_id` to merge guest progress into the newly logged-in account.

## Security

- Answer is **never** sent to the client — only `TileResult[]` values
- Rate limiting: 60 req/min per IP globally
- Dictionary validation server-side — client cannot bypass
- JWT secret must be a strong random string in production
- Passwords hashed with bcrypt (12 rounds)

## Guest → User Merge Flow

1. Guest plays as anonymous with UUID stored in `localStorage`
2. Guest clicks "Create Account" or "Login"
3. Frontend sends `guest_player_id` in the login/register body
4. Backend runs `mergeGuestIntoUser()` — transfers games + stats
5. Guest player record is deleted; all data now belongs to the user player

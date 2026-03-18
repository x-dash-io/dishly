# Dishly — Developer Setup

Dishly is an AI-powered meal and recipe sharing platform built with a modern TypeScript monorepo.

## Prerequisites
- **Node.js**: 20+
- **pnpm**: 9+
- **Wrangler CLI**: `pnpm add -g wrangler`
- **Expo CLI**: `pnpm add -g expo`

## First-time setup
1. **Clone the repo**
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure API secrets**:
   Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and fill in the required secrets (Neon, Upstash, Clerk, Gemini, Cloudflare R2).
4. **Configure Mobile environment**:
   Copy `apps/mobile/.env.local.example` to `apps/mobile/.env.local` and fill in the required variables.
5. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```
6. **Start development**:
   ```bash
   pnpm dev
   ```
   This starts the Hono API on port 8787 and the Expo dev server on port 8081 concurrently.

## Services to set up (free tiers suffice for dev)
- **Neon**: [neon.tech](https://neon.tech) — Database (PostgreSQL)
- **Upstash**: [upstash.com](https://upstash.com) — Caching & Rate Limiting (Redis)
- **Clerk**: [clerk.com](https://clerk.com) — Authentication
- **Gemini**: [aistudio.google.com](https://aistudio.google.com) — AI Logic
- **Cloudflare**: [dash.cloudflare.com](https://dash.cloudflare.com) — Image Storage (R2)

## Key commands
| Command | Description |
| --- | --- |
| `pnpm dev` | Start API + Mobile concurrently |
| `pnpm db:generate` | Generate migrations after schema changes |
| `pnpm db:migrate` | Apply migrations to the database |
| `pnpm db:studio` | Open Drizzle Studio to browse data |
| `pnpm typecheck` | Run TypeScript check across the monorepo |
| `pnpm lint` | Run ESLint across the monorepo |
# dishly

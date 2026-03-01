# Kai Intelligence

Private intelligence dashboard — market data, predictions, and cost monitoring.

## Architecture

```
Next.js 16 (App Router) → Vercel
Supabase (Postgres + PostgREST)
OpenClaw cron → local scripts → Supabase
```

## Features

- `/` — Market intelligence dashboard (Gold, Silver, BTC, ETH)
- `/costs` — Cost monitoring per provider (OpenRouter, Anthropic, OpenAI, local usage)
- Daily briefing cron (8AM HKT)
- Prediction market sync (every 3h)
- Manual refresh queue for `/costs` (Vercel enqueues, local worker executes)

## Setup

### Environment Variables

**`.env.local`** (for Next.js / Vercel):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `COST_DASH_PASSWORD` — auth gate for `/costs`

**`~/.openclaw/.env`** (local-only secrets for worker scripts):
- `OPENROUTER_API_KEY` — OpenRouter API key
- `ANTHROPIC_ADMIN_KEY` — (optional) Anthropic admin API key
- `OPENAI_ADMIN_KEY` — (optional) OpenAI admin API key
- `SUPABASE_URL` — fallback Supabase URL for local scripts
- `SUPABASE_SERVICE_ROLE_KEY` — fallback service key for local scripts

⚠️ Security: provider API keys/tokens must stay local (`~/.openclaw/.env`). Do not place provider secrets in Vercel env.

### Database

Run migration:
```bash
node scripts/migrate-supabase.mjs
```

### Development

```bash
npm install
npm run dev
```

### Deployment

Push to `main` → auto-deploys via Vercel.

## Costs Refresh Queue (Secure Manual Mode)

Flow:
1. Web UI calls `POST /api/costs/refresh`
2. Vercel inserts `pending` row into `refresh_requests`
3. Local worker runs provider fetch scripts and writes results
4. UI polls `GET /api/costs/refresh-status?requestId=...`

Manual worker commands:

```bash
# Process one queued request locally
node scripts/process-refresh-queue.mjs

# Enqueue + process once (one-click local refresh)
node scripts/refresh-now-local.mjs
```

## Cost Scripts

| Script | Purpose | Execution |
|--------|---------|-----------|
| `scripts/fetch-openrouter.mjs` | OpenRouter credit/activity | Local worker only |
| `scripts/fetch-provider-apis.mjs` | Anthropic + OpenAI admin APIs | Local worker only |
| `scripts/parse-local-usage.mjs` | Local session JSONL parsing | Local only |
| `scripts/trigger-pull.mjs` | Enqueue refresh request | Local/automation |
| `scripts/process-refresh-queue.mjs` | Claim + execute one refresh job | Local manual run |

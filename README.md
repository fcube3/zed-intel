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
- Cost data sync (API: every 6h, local: every 2h)

## Setup

### Environment Variables

**`.env.local`** (for Next.js / Vercel):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

**`~/.openclaw/.env`** (for cron scripts):
- `OPENROUTER_API_KEY` — OpenRouter API key
- `ANTHROPIC_ADMIN_KEY` — (optional) Anthropic admin API key
- `OPENAI_ADMIN_KEY` — (optional) OpenAI admin API key

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

## Cost Scripts

| Script | Purpose | Cron |
|--------|---------|------|
| `scripts/fetch-openrouter.mjs` | OpenRouter credit/activity | Every 6h |
| `scripts/fetch-provider-apis.mjs` | Anthropic + OpenAI admin APIs | Every 6h |
| `scripts/parse-local-usage.mjs` | Local session JSONL parsing | Every 2h |

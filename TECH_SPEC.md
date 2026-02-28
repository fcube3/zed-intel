# Technical Specification — Cost Dashboard

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                   LOCAL MAC                      │
│                                                  │
│  OpenClaw Cron                                   │
│  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ kai-costs-api    │  │ kai-costs-local      │  │
│  │ (every 6h)       │  │ (every 2h)           │  │
│  │                  │  │                      │  │
│  │ fetch-openrouter │  │ parse-local-usage    │  │
│  │ fetch-provider   │  │ ~/.openclaw/agents/  │  │
│  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                       │              │
│           └───────────┬───────────┘              │
│                       ▼                          │
│              Supabase REST API                   │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│               SUPABASE (Postgres)                │
│                                                  │
│  usage_snapshots   (append-only, one per fetch)  │
│  usage_latest      (view: latest per provider)   │
│  cost_daily        (daily aggregates)            │
│  cost_sync_log     (sync audit trail)            │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                 VERCEL (Next.js)                  │
│                                                  │
│  /costs → reads usage_latest view                │
│  Server component, force-dynamic                 │
│  Per-provider cards with freshness badges        │
└─────────────────────────────────────────────────┘
```

## Supabase Schema

### `usage_snapshots`
Append-only table. One row per provider per fetch cycle.

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | PK |
| provider | text | e.g. 'openrouter', 'claude_local' |
| source | text | 'api', 'admin_api', 'local_session' |
| fetched_at | timestamptz | When data was fetched |
| total_cost_usd | numeric(12,6) | Cost in USD (nullable) |
| input_tokens | bigint | Input token count |
| output_tokens | bigint | Output token count |
| cache_read_tokens | bigint | Cache read tokens |
| total_tokens | bigint | Total tokens |
| model_breakdown | jsonb | Per-model breakdown |
| raw_response | jsonb | Raw API response |

### `usage_latest` (view)
`DISTINCT ON (provider)` over `usage_snapshots ORDER BY fetched_at DESC`.

### `cost_daily`
Daily cost aggregates per provider. `UNIQUE(provider, date)`.

### `cost_sync_log`
Audit trail for sync operations with status and error messages.

## Providers

| Provider Key | Label | Source | API |
|-------------|-------|--------|-----|
| openrouter | OpenRouter | api | `/api/v1/auth/key` + `/api/v1/activity` |
| anthropic_api | Anthropic API | admin_api | `/v1/organization/usage` |
| openai_api | OpenAI API | admin_api | `/v1/organization/costs` |
| claude_local | Claude Max | local_session | JSONL parsing |
| codex_local | Codex | local_session | JSONL parsing |

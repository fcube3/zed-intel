# Runbook — Cost Dashboard Operations

## Manual Refresh Queue (Secure)

```bash
cd /Users/fengshen/.openclaw/workspace/kai-intel

# 1) Enqueue one refresh request
node scripts/trigger-pull.mjs

# 2) Process one queued request locally (runs provider fetches)
node scripts/process-refresh-queue.mjs

# One-click helper: enqueue + process once
node scripts/refresh-now-local.mjs
```

## Queue Status & Debug

1. Check queue state:
   ```sql
   SELECT request_id, status, created_at, started_at, finished_at, error_msg
   FROM refresh_requests
   ORDER BY created_at DESC
   LIMIT 20;
   ```

2. Check `cost_sync_log` for provider script failures:
   ```sql
   SELECT * FROM cost_sync_log ORDER BY synced_at DESC LIMIT 20;
   ```

3. Check `usage_latest` freshness:
   ```sql
   SELECT provider, fetched_at, total_cost_usd FROM usage_latest;
   ```

## Reset Supabase Tables

```bash
# Re-run migration (safe — uses IF NOT EXISTS)
node scripts/migrate-supabase.mjs

# To fully reset (destructive):
# Run in Supabase SQL editor:
# DROP VIEW IF EXISTS usage_latest;
# DROP TABLE IF EXISTS usage_snapshots, cost_daily, cost_sync_log, refresh_requests;
# Then re-run: node scripts/migrate-supabase.mjs
```

## Security Notes

- Vercel routes only enqueue requests in Supabase.
- Provider APIs are called only by local scripts.
- Keep provider/API tokens in `~/.openclaw/.env` only.
- Do not store Claude/Codex/OpenRouter secrets in Vercel env.

## Environment Variables

| Variable | Location | Required |
|----------|----------|----------|
| OPENROUTER_API_KEY | ~/.openclaw/.env | Yes |
| ANTHROPIC_ADMIN_KEY | ~/.openclaw/.env | Optional |
| OPENAI_ADMIN_KEY | ~/.openclaw/.env | Optional |
| SUPABASE_URL | ~/.openclaw/.env (fallback) | Optional |
| SUPABASE_SERVICE_ROLE_KEY | .env.local or ~/.openclaw/.env | Yes |
| NEXT_PUBLIC_SUPABASE_URL | .env.local | Yes |
| COST_DASH_PASSWORD | .env.local / Vercel env | Yes |

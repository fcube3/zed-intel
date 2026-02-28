# Runbook — Cost Dashboard Operations

## Manually Re-run Cost Sync

```bash
cd /Users/fengshen/.openclaw/workspace/kai-intel

# OpenRouter + provider APIs
node scripts/fetch-openrouter.mjs
node scripts/fetch-provider-apis.mjs

# Local session usage
node scripts/parse-local-usage.mjs
```

## Debug Stale Data

1. Check `cost_sync_log` for recent errors:
   ```sql
   SELECT * FROM cost_sync_log ORDER BY synced_at DESC LIMIT 20;
   ```

2. Check `usage_latest` view for freshness:
   ```sql
   SELECT provider, fetched_at, total_cost_usd FROM usage_latest;
   ```

3. Check cron job status:
   ```bash
   cat ~/.openclaw/cron/jobs.json | python3 -c "
   import json,sys
   for j in json.load(sys.stdin)['jobs']:
     if 'cost' in j['name']:
       print(j['name'], j.get('state',{}).get('lastStatus','?'), j.get('state',{}).get('lastRunAtMs','never'))
   "
   ```

## Reset Supabase Tables

```bash
# Re-run migration (safe — uses IF NOT EXISTS)
node scripts/migrate-supabase.mjs

# To fully reset (destructive):
# Run in Supabase SQL editor:
# DROP VIEW IF EXISTS usage_latest;
# DROP TABLE IF EXISTS usage_snapshots, cost_daily, cost_sync_log;
# Then re-run: node scripts/migrate-supabase.mjs
```

## Add a New Provider

1. Create `scripts/fetch-<provider>.mjs`
2. Insert into `usage_snapshots` with appropriate provider key
3. Add provider to `expectedProviders` array in `src/app/costs/page.tsx`
4. Add label in `src/lib/usage-store.ts` `PROVIDER_LABELS`
5. Update cron job to include the new script

## Environment Variables

| Variable | Location | Required |
|----------|----------|----------|
| OPENROUTER_API_KEY | ~/.openclaw/.env | Yes |
| ANTHROPIC_ADMIN_KEY | ~/.openclaw/.env | Optional |
| OPENAI_ADMIN_KEY | ~/.openclaw/.env | Optional |
| SUPABASE_SERVICE_ROLE_KEY | .env.local | Yes |
| NEXT_PUBLIC_SUPABASE_URL | .env.local | Yes |

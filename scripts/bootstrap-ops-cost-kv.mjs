#!/usr/bin/env node
import { buildDashboardPayload } from './build-cost-dashboard-data.mjs';
import { writeDashboardToKv, getKvConfig } from '../src/lib/ops-cost-storage.mjs';

async function main() {
  const cfg = getKvConfig();
  if (!cfg.available) {
    console.error('KV is not configured. Set KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).');
    process.exit(1);
  }

  const payload = await buildDashboardPayload();
  const result = await writeDashboardToKv(payload);
  if (!result.ok) {
    console.error('Failed to write payload to KV:', result.reason || 'unknown');
    process.exit(1);
  }

  console.log(`Bootstrapped KV key ${cfg.key} with generatedAt=${payload.generatedAt}`);
}

main().catch((error) => {
  console.error('[bootstrap-ops-cost-kv] failed', error);
  process.exit(1);
});

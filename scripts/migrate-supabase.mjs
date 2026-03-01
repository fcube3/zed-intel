#!/usr/bin/env node
// Supabase schema migration — runs DDL via direct postgres connection
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

// Read connection string from .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
let connStr;
for (const l of envLines) {
  const m = l.match(/^POSTGRES_URL_NON_POOLING="?([^"]+)"?$/);
  if (m) { connStr = m[1]; break; }
}
if (!connStr) { console.error('POSTGRES_URL_NON_POOLING not found in .env.local'); process.exit(1); }

const sql = postgres(connStr, { ssl: 'require' });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS usage_snapshots (
      id            bigserial PRIMARY KEY,
      provider      text NOT NULL,
      source        text NOT NULL,
      fetched_at    timestamptz NOT NULL DEFAULT now(),
      period_start  timestamptz,
      period_end    timestamptz,
      total_cost_usd numeric(12,6),
      input_tokens    bigint,
      output_tokens   bigint,
      cache_read_tokens bigint,
      total_tokens    bigint,
      model_breakdown jsonb,
      raw_response    jsonb
    )
  `;
  console.log('✓ usage_snapshots');

  await sql`
    CREATE OR REPLACE VIEW usage_latest AS
      SELECT DISTINCT ON (provider) *
      FROM usage_snapshots
      ORDER BY provider, fetched_at DESC
  `;
  console.log('✓ usage_latest view');

  await sql`
    CREATE TABLE IF NOT EXISTS cost_daily (
      id            bigserial PRIMARY KEY,
      provider      text NOT NULL,
      date          date NOT NULL,
      total_cost_usd numeric(12,6),
      input_tokens    bigint,
      output_tokens   bigint,
      total_tokens    bigint,
      UNIQUE(provider, date)
    )
  `;
  console.log('✓ cost_daily');

  await sql`
    CREATE TABLE IF NOT EXISTS cost_sync_log (
      id          bigserial PRIMARY KEY,
      provider    text NOT NULL,
      synced_at   timestamptz NOT NULL DEFAULT now(),
      status      text NOT NULL,
      error_msg   text,
      duration_ms int
    )
  `;
  console.log('✓ cost_sync_log');

  await sql`
    CREATE TABLE IF NOT EXISTS cost_pull_state (
      key   text PRIMARY KEY,
      value text,
      updated_at timestamptz DEFAULT now()
    )
  `;
  console.log('✓ cost_pull_state');

  await sql`
    CREATE TABLE IF NOT EXISTS refresh_requests (
      id               bigserial PRIMARY KEY,
      request_id       text UNIQUE NOT NULL,
      source           text NOT NULL DEFAULT 'web',
      status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'rate_limited')),
      created_at       timestamptz NOT NULL DEFAULT now(),
      started_at       timestamptz,
      finished_at      timestamptz,
      error_msg        text,
      idempotency_key  text,
      requested_by     text
    )
  `;
  console.log('✓ refresh_requests');

  await sql`
    CREATE INDEX IF NOT EXISTS refresh_requests_status_created_idx
    ON refresh_requests(status, created_at)
  `;
  console.log('✓ refresh_requests_status_created_idx');

  console.log('\nMigration complete.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await sql.end();
}

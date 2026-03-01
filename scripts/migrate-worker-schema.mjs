#!/usr/bin/env node
// Add worker columns + claim_refresh_job RPC to Supabase
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

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
  await sql.begin(async (tx) => {
    // Add columns if they don't exist
    await tx`ALTER TABLE refresh_requests ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0`;
    console.log('✓ retry_count column');

    await tx`ALTER TABLE refresh_requests ADD COLUMN IF NOT EXISTS last_error text`;
    console.log('✓ last_error column');

    await tx`ALTER TABLE refresh_requests ADD COLUMN IF NOT EXISTS claimed_at timestamptz`;
    console.log('✓ claimed_at column');

    // Create atomic claim RPC (handles NULL claimed_at)
    await tx`
      CREATE OR REPLACE FUNCTION claim_refresh_job()
      RETURNS SETOF refresh_requests
      LANGUAGE sql
      AS $$
        UPDATE refresh_requests
        SET status = 'running',
            started_at = now(),
            claimed_at = now()
        WHERE id = (
          SELECT id FROM refresh_requests
          WHERE status = 'pending'
             OR (status = 'running' AND (claimed_at IS NULL OR claimed_at < now() - interval '3 minutes'))
          ORDER BY
            CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
            created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *;
      $$
    `;
    console.log('✓ claim_refresh_job RPC');
  });

  console.log('\nWorker migration complete.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await sql.end();
}

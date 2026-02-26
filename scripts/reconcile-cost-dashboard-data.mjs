#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildDashboardPayload } from './build-cost-dashboard-data.mjs';

const dashboardPath = path.join(process.cwd(), 'public', 'data', 'cost-dashboard.json');

function sumRows(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.cost += Number(row.cost || 0);
      acc.estimatedCost += Number(row.estimatedCost || 0);
      acc.inputTokens += Number(row.inputTokens || 0);
      acc.outputTokens += Number(row.outputTokens || 0);
      acc.totalTokens += Number(row.totalTokens || 0);
      acc.cacheReadTokens += Number(row.cacheReadTokens || 0);
      acc.cacheWriteTokens += Number(row.cacheWriteTokens || 0);
      return acc;
    },
    { cost: 0, estimatedCost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
  );
}

function delta(a, b) {
  return {
    cost: (a.cost || 0) - (b.cost || 0),
    estimatedCost: (a.estimatedCost || 0) - (b.estimatedCost || 0),
    inputTokens: (a.inputTokens || 0) - (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) - (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) - (b.totalTokens || 0),
    cacheReadTokens: (a.cacheReadTokens || 0) - (b.cacheReadTokens || 0),
    cacheWriteTokens: (a.cacheWriteTokens || 0) - (b.cacheWriteTokens || 0),
  };
}

function hasDrift(d) {
  return Object.values(d).some((v) => Math.abs(Number(v || 0)) > 0.5);
}

async function main() {
  const raw = await buildDashboardPayload();

  if (!fs.existsSync(dashboardPath)) {
    console.error(`Missing dashboard file: ${dashboardPath}`);
    process.exit(2);
  }

  const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

  const dashboardByProviderTotals = sumRows(dashboard.byProvider || []);
  const dashboardByModelTotals = sumRows(dashboard.byModel || []);

  const driftAgainstRawTotals = delta(dashboard.totals || {}, raw.totals || {});
  const providerVsTotalsDrift = delta(dashboardByProviderTotals, dashboard.totals || {});
  const modelVsTotalsDrift = delta(dashboardByModelTotals, dashboard.totals || {});

  const report = {
    generatedAt: new Date().toISOString(),
    dashboardGeneratedAt: dashboard.generatedAt || null,
    rawGeneratedAt: raw.generatedAt,
    rawSources: raw.sources,
    dashboardSources: dashboard.sources || null,
    driftAgainstRawTotals,
    providerVsTotalsDrift,
    modelVsTotalsDrift,
    ok: !hasDrift(driftAgainstRawTotals) && !hasDrift(providerVsTotalsDrift) && !hasDrift(modelVsTotalsDrift),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[reconcile-cost-dashboard-data] failed', error);
  process.exit(1);
});

import { loadDashboardData } from '@/lib/ops-cost-storage.mjs';

export const dynamic = 'force-dynamic';

type BreakdownRow = {
  provider?: string;
  model?: string;
  date?: string;
  cost: number;
  estimatedCost?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

type CostDashboardData = {
  generatedAt: string;
  pricing?: {
    mode?: string;
    sourceUrl?: string;
    fetchedAt?: string | null;
    staleCache?: boolean;
    note?: string;
  };
  totals: BreakdownRow;
  byProvider: BreakdownRow[];
  byModel: BreakdownRow[];
  byDay: BreakdownRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}


function SummaryCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function BreakdownTable({ title, rows, labelKey }: { title: string; rows: BreakdownRow[]; labelKey: 'provider' | 'model' | 'date' }) {
  const max = rows[0]?.totalTokens || 1;

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="pb-2">{labelKey}</th>
              <th className="pb-2">Estimated cost</th>
              <th className="pb-2">Reported cost</th>
              <th className="pb-2">Input</th>
              <th className="pb-2">Output</th>
              <th className="pb-2">Total tokens</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const label = (row[labelKey] as string) || 'unknown';
              const width = Math.max(4, Math.round((row.totalTokens / max) * 100));
              return (
                <tr key={`${label}-${idx}`} className="border-t border-white/5 align-top text-zinc-300">
                  <td className="py-3 pr-2">
                    <div className="font-medium text-zinc-100">{label}</div>
                    <div className="mt-1 h-1.5 w-28 rounded bg-zinc-800">
                      <div className="h-1.5 rounded bg-cyan-500" style={{ width: `${width}%` }} />
                    </div>
                  </td>
                  <td className="py-3 pr-2 text-zinc-300">
                    {(row.estimatedCost || 0) > 0 ? formatCurrency(row.estimatedCost || 0) : '—'}
                  </td>
                  <td className="py-3 pr-2 text-zinc-400">{row.cost > 0 ? formatCurrency(row.cost) : '—'}</td>
                  <td className="py-3 pr-2">{formatNumber(row.inputTokens)}</td>
                  <td className="py-3 pr-2">{formatNumber(row.outputTokens)}</td>
                  <td className="py-3 pr-2">{formatNumber(row.totalTokens)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function OpsCostPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string; refresh_error?: string };
}) {
  const { data, diagnostics } = await loadDashboardData();

  const prioritizedProviders = [...data.byProvider].sort((a, b) => {
    const score = (name?: string) => {
      if (name === 'google') return 2;
      if (name === 'google-vertex') return 1;
      return 0;
    };
    const scoreDiff = score(b.provider) - score(a.provider);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.estimatedCost || 0) - (a.estimatedCost || 0) || b.totalTokens - a.totalTokens;
  });

  const topProvider = data.byProvider[0]?.provider || 'unknown';
  const topModel = data.byModel[0]?.model || 'unknown';
  const estimatedTotal = data.totals.estimatedCost || 0;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Private · Ops</p>
              <h1 className="mt-2 text-3xl font-bold">Cost Dashboard</h1>
              <p className="mt-2 text-sm text-zinc-400">Generated at {new Date(data.generatedAt).toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Source: {diagnostics.source === 'supabase' ? 'Supabase' : 'Bundled file fallback'}
                {diagnostics.generatedAt ? ` · generatedAt ${new Date(diagnostics.generatedAt).toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <form action="/costs/refresh" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  Refresh now
                </button>
              </form>
              <form action="/costs/logout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>

          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            Estimated costs are shown when exact billed cost is missing. Estimates = token usage × public model pricing. Exact invoice may differ.
          </p>

          {searchParams?.refreshed === '1' ? (
            <p className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Dashboard refreshed successfully and saved to Supabase.
            </p>
          ) : null}

          {searchParams?.refresh_error === '1' ? (
            <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              Refresh failed. Check Supabase connection and try again.
            </p>
          ) : null}

          {diagnostics.warning ? (
            <p className="mt-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">{diagnostics.warning}</p>
          ) : null}

          {data.pricing?.sourceUrl ? (
            <p className="mt-2 text-xs text-zinc-500">
              Pricing source: <a className="underline" href={data.pricing.sourceUrl}>{data.pricing.sourceUrl}</a>
              {data.pricing.fetchedAt ? ` · fetched ${new Date(data.pricing.fetchedAt).toLocaleString()}` : ''}
              {data.pricing.staleCache ? ' · using cached pricing' : ''}
            </p>
          ) : null}
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Estimated total cost" value={estimatedTotal > 0 ? formatCurrency(estimatedTotal) : 'Unavailable'} sub="Estimate based on token usage" />
          <SummaryCard title="Reported total cost" value={data.totals.cost > 0 ? formatCurrency(data.totals.cost) : 'Unavailable'} sub="Directly reported by logs/providers" />
          <SummaryCard title="Total tokens" value={formatNumber(data.totals.totalTokens)} sub={`${formatNumber(data.totals.inputTokens)} in / ${formatNumber(data.totals.outputTokens)} out`} />
          <SummaryCard title="Top model" value={topModel} sub={`Top provider: ${topProvider}`} />
        </section>

        <BreakdownTable title="By provider (includes configured zero-usage providers)" rows={prioritizedProviders} labelKey="provider" />
        <BreakdownTable title="By model (includes configured zero-usage models)" rows={data.byModel} labelKey="model" />
        <BreakdownTable title="By day" rows={data.byDay} labelKey="date" />
      </div>
    </main>
  );
}

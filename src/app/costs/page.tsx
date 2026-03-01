import { loadUsageLatest, getProviderLabel, type UsageSnapshot } from '@/lib/usage-store';
import RefreshButton from './RefreshButton';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);
}

function formatTokens(value: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'now';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type FreshnessLevel = 'green' | 'amber' | 'red';

function getFreshness(fetchedAt: string | null): { level: FreshnessLevel; label: string } {
  if (!fetchedAt) return { level: 'red', label: 'No data' };
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  const ageH = ageMs / 3600000;
  if (ageH < 5) return { level: 'green', label: `${Math.round(ageH * 60)}m ago` };
  if (ageH < 24) return { level: 'amber', label: `${Math.round(ageH)}h ago` };
  return { level: 'red', label: `${Math.round(ageH / 24)}d ago` };
}

const freshnessColors: Record<FreshnessLevel, string> = {
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  red: 'bg-red-500/20 text-red-300 border-red-500/40',
};

function utilizationColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function utilizationTrackColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500/15';
  if (pct >= 50) return 'bg-amber-500/15';
  return 'bg-emerald-500/15';
}

function ProgressBar({ label, pct, sublabel }: { label: string; pct: number; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-sm font-semibold text-zinc-200">{pct}%</span>
      </div>
      <div className={`h-2 w-full rounded-full ${utilizationTrackColor(pct)}`}>
        <div
          className={`h-2 rounded-full transition-all ${utilizationColor(pct)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && <span className="text-[10px] text-zinc-500">{sublabel}</span>}
    </div>
  );
}

function ClaudeOAuthCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const freshness = getFreshness(snapshot.fetched_at);
  const mb = (snapshot.model_breakdown ?? {}) as Record<string, number>;
  const fiveH = mb.five_hour_utilization ?? 0;
  const sevenD = mb.seven_day_utilization ?? 0;
  const sevenDSonnet = mb.seven_day_sonnet_utilization;

  return (
    <div className="rounded-xl border border-[#DA7756]/30 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{getProviderLabel(snapshot.provider)}</h3>
          <p className="text-xs text-zinc-500">{snapshot.source}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${freshnessColors[freshness.level]}`}>
          {freshness.label}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <ProgressBar label="5-hour window" pct={fiveH} />
        <ProgressBar label="7-day window" pct={sevenD} />
        {sevenDSonnet != null && (
          <ProgressBar label="7-day Sonnet" pct={sevenDSonnet} />
        )}
      </div>
    </div>
  );
}

function CodexCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const freshness = getFreshness(snapshot.fetched_at);
  const mb = (snapshot.model_breakdown ?? {}) as Record<string, number | string>;
  const primaryPct = (mb.primary_used_pct as number) ?? 0;
  const secondaryPct = (mb.secondary_used_pct as number) ?? 0;
  const primaryWindowMin = (mb.primary_window_minutes as number) ?? 300;
  const secondaryWindowMin = (mb.secondary_window_minutes as number) ?? 10080;
  const primaryResetSec = (mb.primary_reset_after_seconds as number) ?? 0;
  const secondaryResetSec = (mb.secondary_reset_after_seconds as number) ?? 0;
  const planType = mb.plan_type as string | undefined;

  const primaryLabel = primaryWindowMin === 300 ? '5h' : `${primaryWindowMin}m`;
  const secondaryLabel = secondaryWindowMin === 10080 ? 'Weekly' : `${secondaryWindowMin}m`;

  return (
    <div className="rounded-xl border border-[#DA7756]/30 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{getProviderLabel(snapshot.provider)}</h3>
          <p className="text-xs text-zinc-500">{snapshot.source}{planType ? ` · ${planType}` : ''}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${freshnessColors[freshness.level]}`}>
          {freshness.label}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <ProgressBar
          label={`${primaryLabel} window`}
          pct={primaryPct}
          sublabel={primaryResetSec > 0 ? `Resets in ${formatDuration(primaryResetSec)}` : undefined}
        />
        <ProgressBar
          label={`${secondaryLabel} window`}
          pct={secondaryPct}
          sublabel={secondaryResetSec > 0 ? `Resets in ${formatDuration(secondaryResetSec)}` : undefined}
        />
      </div>
    </div>
  );
}

function ProviderCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const freshness = getFreshness(snapshot.fetched_at);
  const modelCount = snapshot.model_breakdown ? Object.keys(snapshot.model_breakdown).length : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{getProviderLabel(snapshot.provider)}</h3>
          <p className="text-xs text-zinc-500">{snapshot.source}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${freshnessColors[freshness.level]}`}>
          {freshness.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Cost</p>
          <p className="text-xl font-semibold text-zinc-100">{formatCurrency(snapshot.total_cost_usd)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Tokens</p>
          <p className="text-xl font-semibold text-zinc-100">{formatTokens(snapshot.total_tokens)}</p>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-zinc-400">
        <span>{formatTokens(snapshot.input_tokens)} in</span>
        <span>{formatTokens(snapshot.output_tokens)} out</span>
        {snapshot.cache_read_tokens != null ? <span>{formatTokens(snapshot.cache_read_tokens)} cached</span> : null}
      </div>

      {modelCount > 0 && (
        <p className="text-xs text-zinc-500">{modelCount} model{modelCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

function EmptyCard({ provider }: { provider: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 flex flex-col gap-3 opacity-60">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-zinc-300">{getProviderLabel(provider)}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${freshnessColors.red}`}>
          No data
        </span>
      </div>
      <p className="text-sm text-zinc-500">Awaiting first sync</p>
    </div>
  );
}

const UTILIZATION_PROVIDERS = new Set(['claude_oauth', 'codex']);

function renderProviderCard(provider: string, snapshot: UsageSnapshot | undefined) {
  if (!snapshot) return <EmptyCard key={provider} provider={provider} />;
  if (provider === 'claude_oauth') return <ClaudeOAuthCard key={provider} snapshot={snapshot} />;
  if (provider === 'codex') return <CodexCard key={provider} snapshot={snapshot} />;
  return <ProviderCard key={provider} snapshot={snapshot} />;
}

export default async function CostMonitorPage() {
  const { snapshots, error } = await loadUsageLatest();

  const expectedProviders = ['openrouter', 'anthropic_api', 'claude_oauth', 'codex'];
  const snapshotMap = new Map(snapshots.map(s => [s.provider, s]));

  // Total API spend (only cost-based providers)
  const apiProviders = ['openrouter', 'anthropic_api'];
  const totalApiSpend = snapshots
    .filter(s => apiProviders.includes(s.provider) && s.total_cost_usd !== null)
    .reduce((sum, s) => sum + (s.total_cost_usd || 0), 0);
  const hasApiSpend = snapshots.some(s => apiProviders.includes(s.provider) && s.total_cost_usd !== null);

  // Latest update
  const latestFetch = snapshots.length > 0
    ? snapshots.reduce((latest, s) => new Date(s.fetched_at) > new Date(latest.fetched_at) ? s : latest).fetched_at
    : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[#DA7756]">Private · Ops</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold">Cost Monitor</h1>
              {latestFetch && (
                <span className="text-sm text-zinc-500">Updated {formatTime(latestFetch)}</span>
              )}
            </div>
            <RefreshButton />
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              Data source error: {error}
            </p>
          )}
        </header>

        {/* Provider cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {expectedProviders.map(provider => renderProviderCard(provider, snapshotMap.get(provider)))}
          {/* Any unexpected providers */}
          {snapshots
            .filter(s => !expectedProviders.includes(s.provider))
            .map(s => renderProviderCard(s.provider, s))}
        </section>

        {/* Summary */}
        <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Total API Spend</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {hasApiSpend ? formatCurrency(totalApiSpend) : '—'}
              </p>
            </div>
            <div className="text-right text-xs text-zinc-500">
              <p>{snapshots.length} provider{snapshots.length !== 1 ? 's' : ''} reporting</p>
              <p className="mt-1">Unknown ≠ zero</p>
            </div>
          </div>
        </section>

        <footer className="text-xs text-zinc-600">
          <p>Data pushed by OpenClaw cron jobs. Costs are append-only snapshots from provider APIs and local session logs.</p>
        </footer>
      </div>
    </main>
  );
}

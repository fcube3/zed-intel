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

function formatResetCountdown(resetsAt: string | null): string | null {
  if (!resetsAt) return null;
  const diffMs = new Date(resetsAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Resetting now';
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (h > 0) return `Resets in ${h}h ${m}m`;
  return `Resets in ${m}m`;
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

const freshnessDotColors: Record<FreshnessLevel, string> = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

function FreshnessDot({ fetchedAt }: { fetchedAt: string | null }) {
  const f = getFreshness(fetchedAt);
  return (
    <div className="flex items-center gap-1.5" title={fetchedAt ? formatTime(fetchedAt) : 'No data'}>
      <span className={`inline-block h-2 w-2 rounded-full ${freshnessDotColors[f.level]}`} />
      <span className="text-[10px] text-zinc-500">{f.label}</span>
    </div>
  );
}

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

function ProgressBar({ label, pct, sublabel }: { label: string; pct: number; sublabel?: string | null }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-sm font-semibold text-zinc-200">{pct}% used</span>
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

function SectionHeader({ title, accent = 'blue' }: { title: string; accent?: 'blue' | 'green' }) {
  const colors = accent === 'blue'
    ? { text: 'text-blue-400/70', line: 'bg-blue-500/20' }
    : { text: 'text-emerald-400/70', line: 'bg-emerald-500/20' };
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[11px] font-medium uppercase tracking-[0.15em] ${colors.text}`}>{title}</span>
      <div className={`h-px flex-1 ${colors.line}`} />
    </div>
  );
}

function EmptyQuotaCard({ provider }: { provider: string }) {
  return (
    <div className="rounded-xl border-l-[3px] border-l-blue-500/40 border border-white/5 bg-zinc-900/40 p-5 flex flex-col gap-3 opacity-60">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/60">Quota Usage</span>
          <h3 className="text-base font-semibold text-zinc-300 mt-0.5">{getProviderLabel(provider)}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="text-zinc-600">🕐</span>
        <span>Awaiting first sync</span>
      </div>
    </div>
  );
}

function ClaudeOAuthCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const mb = (snapshot.model_breakdown ?? {}) as Record<string, unknown>;
  const fiveH = (mb.five_hour_utilization as number) ?? 0;
  const fiveHReset = mb.five_hour_resets_at as string | null ?? null;
  const sevenD = (mb.seven_day_utilization as number) ?? 0;
  const sevenDReset = mb.seven_day_resets_at as string | null ?? null;
  const sevenDSonnet = mb.seven_day_sonnet_utilization as number | undefined;
  const sevenDSonnetReset = mb.seven_day_sonnet_resets_at as string | null ?? null;

  return (
    <div className="rounded-xl border-l-[3px] border-l-blue-500 border border-white/5 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Quota Usage</span>
            <span className="cursor-help text-zinc-600 text-xs" title="Shows API rate limit usage, not dollar spend. Anthropic tracks usage in rolling time windows.">ⓘ</span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 mt-0.5">{getProviderLabel(snapshot.provider)}</h3>
        </div>
        <FreshnessDot fetchedAt={snapshot.fetched_at} />
      </div>
      <div className="flex flex-col gap-2.5">
        <ProgressBar label="5-hour window" pct={fiveH} sublabel={formatResetCountdown(fiveHReset)} />
        <ProgressBar label="7-day window" pct={sevenD} sublabel={formatResetCountdown(sevenDReset)} />
        {sevenDSonnet != null && (
          <ProgressBar label="7-day Sonnet" pct={sevenDSonnet} sublabel={formatResetCountdown(sevenDSonnetReset)} />
        )}
      </div>
      <div className="border-t border-dashed border-zinc-800 pt-2.5">
        <p className="text-[11px] text-zinc-600">💳 Billing unavailable · Requires admin API key</p>
      </div>
    </div>
  );
}

function CodexCard({ snapshot }: { snapshot: UsageSnapshot }) {
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
    <div className="rounded-xl border-l-[3px] border-l-blue-500 border border-white/5 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Quota Usage</span>
            <span className="cursor-help text-zinc-600 text-xs" title="Shows API rate limit usage, not dollar spend. Anthropic/OpenAI tracks usage in rolling time windows.">ⓘ</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-base font-semibold text-zinc-100">{getProviderLabel(snapshot.provider)}</h3>
            {planType && (
              <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                {planType}
              </span>
            )}
          </div>
        </div>
        <FreshnessDot fetchedAt={snapshot.fetched_at} />
      </div>
      <div className="flex flex-col gap-2.5">
        <ProgressBar
          label={`${primaryLabel} window`}
          pct={primaryPct}
          sublabel={primaryResetSec > 0 ? `Resets in ${formatDuration(primaryResetSec)}` : null}
        />
        <ProgressBar
          label={`${secondaryLabel} window`}
          pct={secondaryPct}
          sublabel={secondaryResetSec > 0 ? `Resets in ${formatDuration(secondaryResetSec)}` : null}
        />
      </div>
    </div>
  );
}

function OpenRouterCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const modelCount = snapshot.model_breakdown ? Object.keys(snapshot.model_breakdown).length : 0;

  return (
    <div className="rounded-xl border-l-[3px] border-l-emerald-500 border border-white/5 bg-zinc-900/80 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Spend</span>
          <h3 className="text-base font-semibold text-zinc-100 mt-0.5">{getProviderLabel(snapshot.provider)}</h3>
        </div>
        <FreshnessDot fetchedAt={snapshot.fetched_at} />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100">{formatCurrency(snapshot.total_cost_usd)}</p>
      </div>
      <div className="flex gap-4 text-xs text-zinc-400">
        <span>{formatTokens(snapshot.input_tokens)} in</span>
        <span>{formatTokens(snapshot.output_tokens)} out</span>
        {snapshot.cache_read_tokens != null && <span>{formatTokens(snapshot.cache_read_tokens)} cached</span>}
      </div>
      {modelCount > 0 && (
        <p className="text-[11px] text-zinc-500">{modelCount} model{modelCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

function EmptySpendCard({ provider }: { provider: string }) {
  return (
    <div className="rounded-xl border-l-[3px] border-l-emerald-500/40 border border-white/5 bg-zinc-900/40 p-5 flex flex-col gap-3 opacity-60">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60">Spend</span>
          <h3 className="text-base font-semibold text-zinc-300 mt-0.5">{getProviderLabel(provider)}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="text-zinc-600">🕐</span>
        <span>Awaiting first sync</span>
      </div>
    </div>
  );
}

export default async function CostMonitorPage() {
  const { snapshots, error } = await loadUsageLatest();

  const snapshotMap = new Map(snapshots.map(s => [s.provider, s]));

  const latestFetch = snapshots.length > 0
    ? snapshots.reduce((latest, s) => new Date(s.fetched_at) > new Date(latest.fetched_at) ? s : latest).fetched_at
    : null;

  const claudeSnap = snapshotMap.get('claude_oauth');
  const codexSnap = snapshotMap.get('codex');
  const orSnap = snapshotMap.get('openrouter');

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
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

        {/* Resource Utilization */}
        <section className="flex flex-col gap-4">
          <SectionHeader title="Resource Utilization" accent="blue" />
          <div className="grid gap-4 sm:grid-cols-2">
            {claudeSnap ? <ClaudeOAuthCard snapshot={claudeSnap} /> : <EmptyQuotaCard provider="claude_oauth" />}
            {codexSnap ? <CodexCard snapshot={codexSnap} /> : <EmptyQuotaCard provider="codex" />}
          </div>
        </section>

        {/* Provider Spend */}
        <section className="flex flex-col gap-4">
          <SectionHeader title="Provider Spend" accent="green" />
          <div className="grid gap-4 sm:grid-cols-2">
            {orSnap ? <OpenRouterCard snapshot={orSnap} /> : <EmptySpendCard provider="openrouter" />}
          </div>
        </section>

        <footer className="text-xs text-zinc-600">
          <p>Data pushed by OpenClaw cron jobs. Costs are append-only snapshots from provider APIs and local session logs.</p>
        </footer>
      </div>
    </main>
  );
}

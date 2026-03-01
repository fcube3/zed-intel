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
  if (!resetsAt) return 'Resets: unknown';
  const target = new Date(resetsAt);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'Resetting now';
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return `Resets in ${countdown}`;
}

function formatResetLabel(resetsAt: string | null): string | null {
  if (!resetsAt) return 'Resets: unknown';
  const target = new Date(resetsAt);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'Resetting now';
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const mon = target.toLocaleString('en-US', { month: 'short' });
  const day = target.getDate();
  const hh = String(target.getHours()).padStart(2, '0');
  const mm = String(target.getMinutes()).padStart(2, '0');
  const yearSuffix = target.getFullYear() !== new Date().getFullYear() ? ` ${target.getFullYear()}` : '';
  return `Resets in ${countdown}, on ${hh}:${mm}, ${mon} ${day}${yearSuffix}`;
}

function formatResetFromSeconds(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return 'Resets: unknown';
  const diffMs = seconds * 1000;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return `Resets in ${countdown}`;
}

function formatResetFromSecondsLong(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return 'Resets: unknown';
  const diffMs = seconds * 1000;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const target = new Date(Date.now() + diffMs);
  const mon = target.toLocaleString('en-US', { month: 'short' });
  const day = target.getDate();
  const hh = String(target.getHours()).padStart(2, '0');
  const mm = String(target.getMinutes()).padStart(2, '0');
  return `Resets in ${countdown}, on ${hh}:${mm}, ${mon} ${day}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'now';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatRelativeTime(iso: string): string {
  const ageMs = Date.now() - new Date(iso).getTime();
  const ageMin = Math.round(ageMs / 60000);
  if (ageMin < 1) return 'less than a minute ago';
  if (ageMin === 1) return '1 minute ago';
  if (ageMin < 60) return `${ageMin} minutes ago`;
  const ageH = Math.round(ageMin / 60);
  if (ageH === 1) return '1 hour ago';
  return `${ageH} hours ago`;
}

function freshnessDotColor(iso: string | null): string {
  if (!iso) return 'bg-[#636366]';
  const ageMin = (Date.now() - new Date(iso).getTime()) / 60000;
  if (ageMin < 10) return 'bg-green-400';
  if (ageMin < 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

function FreshnessDot({ fetchedAt }: { fetchedAt: string | null }) {
  return (
    <span
      className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${freshnessDotColor(fetchedAt)}`}
      title={fetchedAt ? `Fetched ${formatRelativeTime(fetchedAt)}` : 'No data'}
    />
  );
}

function ProgressBar({ label, pct, sublabel }: { label: string; pct: number; sublabel?: string | null }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-sm font-normal text-[#98989D]">{pct}% used</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#3A3A3C]">
        <div
          className="h-2 rounded-full bg-[#3B82F6] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && <span className="text-[10px] text-[#636366]">{sublabel}</span>}
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
    <div className="relative border border-[#3A3A3C] rounded-xl bg-[#242426] p-5 flex flex-col gap-5">
      <FreshnessDot fetchedAt={snapshot.fetched_at} />
      <h3 className="text-sm font-semibold text-[#98989D]">{getProviderLabel(snapshot.provider)}</h3>
      <ProgressBar label="Current session (5h)" pct={fiveH} sublabel={formatResetCountdown(fiveHReset)} />
      <div className="border-t border-[#3A3A3C]" />
      <ProgressBar label="Weekly — All models" pct={sevenD} sublabel={formatResetLabel(sevenDReset)} />
      {sevenDSonnet != null && (
        <>
          <div className="border-t border-[#3A3A3C]" />
          <ProgressBar label="Weekly — Sonnet" pct={sevenDSonnet} sublabel={formatResetLabel(sevenDSonnetReset)} />
        </>
      )}
    </div>
  );
}

function CodexCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const mb = (snapshot.model_breakdown ?? {}) as Record<string, number | string>;
  const primaryPct = (mb.primary_used_pct as number) ?? 0;
  const secondaryPct = (mb.secondary_used_pct as number) ?? 0;
  const primaryWindowMin = (mb.primary_window_minutes as number) ?? 300;
  const primaryResetSec = (mb.primary_reset_after_seconds as number) ?? 0;
  const secondaryResetSec = (mb.secondary_reset_after_seconds as number) ?? 0;
  const secondaryWindowMin = (mb.secondary_window_minutes as number) ?? 10080;
  const primaryLabel = primaryWindowMin === 300 ? '5h' : `${primaryWindowMin}m`;

  return (
    <div className="relative border border-[#3A3A3C] rounded-xl bg-[#242426] p-5 flex flex-col gap-5">
      <FreshnessDot fetchedAt={snapshot.fetched_at} />
      <h3 className="text-sm font-semibold text-[#98989D]">{getProviderLabel(snapshot.provider)}</h3>
      <ProgressBar label={`Current session (${primaryLabel})`} pct={primaryPct} sublabel={formatResetFromSeconds(primaryResetSec)} />
      <div className="border-t border-[#3A3A3C]" />
      <ProgressBar label={secondaryWindowMin === 10080 ? 'Weekly usage' : `${secondaryWindowMin}m window`} pct={secondaryPct} sublabel={formatResetFromSecondsLong(secondaryResetSec)} />
    </div>
  );
}

function OpenRouterCard({ snapshot }: { snapshot: UsageSnapshot }) {
  const freshness = snapshot.fetched_at ? formatRelativeTime(snapshot.fetched_at) : null;

  return (
    <div className="relative border border-[#3A3A3C] rounded-xl bg-[#242426] p-5 flex flex-col gap-3">
      <FreshnessDot fetchedAt={snapshot.fetched_at} />
      <h3 className="text-sm font-semibold text-[#98989D]">{getProviderLabel(snapshot.provider)}</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-[#98989D]">This month</span>
        <span className="text-xl font-semibold text-white">{formatCurrency(snapshot.total_cost_usd)}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-[#98989D]">Tokens used</span>
        <span className="text-sm text-white">
          {formatTokens((snapshot.input_tokens ?? 0) + (snapshot.output_tokens ?? 0))}
        </span>
      </div>
      {freshness && (
        <span className="text-xs text-[#636366]">Last synced {freshness}</span>
      )}
    </div>
  );
}

function EmptyCard({ provider }: { provider: string }) {
  return (
    <div className="relative border border-[#3A3A3C] rounded-xl bg-[#242426] p-5 opacity-60">
      <h3 className="text-sm font-semibold text-[#98989D]">{getProviderLabel(provider)}</h3>
      <p className="mt-2 text-sm text-[#636366] italic">Awaiting first sync</p>
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
    <main className="min-h-screen bg-[#1C1C1E] px-6 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Plan Usage</h1>
          <RefreshButton />
        </header>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            Data source error: {error}
          </p>
        )}

        {/* Resource Utilization */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-[#98989D]">Resource Utilization</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {claudeSnap ? <ClaudeOAuthCard snapshot={claudeSnap} /> : <EmptyCard provider="claude_oauth" />}
            {codexSnap ? <CodexCard snapshot={codexSnap} /> : <EmptyCard provider="codex" />}
          </div>
        </section>

        {/* Provider Spend */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-[#98989D]">Provider Spend</h2>
          {orSnap ? <OpenRouterCard snapshot={orSnap} /> : <EmptyCard provider="openrouter" />}
        </section>

        {/* Footer */}
        {latestFetch && (
          <footer className="text-xs text-[#636366]">
            Last updated: {formatRelativeTime(latestFetch)} ↺
          </footer>
        )}
      </div>
    </main>
  );
}

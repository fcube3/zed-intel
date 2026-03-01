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
  return { level: 'red', label: 'Stale' };
}

const freshnessDotColors: Record<FreshnessLevel, string> = {
  green: 'bg-[#2A9D6E]',
  amber: 'bg-[#D4800A]',
  red: 'bg-[#C93C3C]',
};

function FreshnessDot({ fetchedAt }: { fetchedAt: string | null }) {
  const f = getFreshness(fetchedAt);
  return (
    <div className="flex items-center gap-1.5" title={fetchedAt ? formatTime(fetchedAt) : 'No data'}>
      <span className={`inline-block h-2 w-2 rounded-full ${freshnessDotColors[f.level]}`} />
      <span className="text-xs text-[#9C9086]">{f.label}</span>
    </div>
  );
}

function progressBarFill(pct: number): string {
  if (pct >= 80) return 'bg-[#C93C3C]';
  if (pct >= 50) return 'bg-[#D4800A]';
  return 'bg-[#2A9D6E]';
}

function ProgressBar({ label, pct, sublabel }: { label: string; pct: number; sublabel?: string | null }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-[#9C9086]">{label}</span>
        <span className="text-2xl font-semibold text-[#1A1410]">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#EEF2FF]">
        <div
          className={`h-2 rounded-full transition-all ${progressBarFill(pct)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && <span className="text-xs text-[#6B6157]">{sublabel}</span>}
    </div>
  );
}

function SectionHeader({ title, accent = 'blue' }: { title: string; accent?: 'blue' | 'green' }) {
  const dotColor = accent === 'blue' ? 'bg-[#4F7EF7]' : 'bg-[#2A9D6E]';
  return (
    <div className="flex items-center gap-3 border-t border-[#E8E3D9] pt-6">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-xs font-semibold uppercase tracking-widest text-[#9C9086]">{title}</span>
    </div>
  );
}

const cardBase = "rounded-xl border border-[#E8E3D9] bg-white p-5 shadow-[0_1px_3px_rgba(26,20,16,0.06)] flex flex-col gap-3";

function EmptyQuotaCard({ provider }: { provider: string }) {
  return (
    <div className={`${cardBase} border-l-[3px] border-l-[#4F7EF7] opacity-60`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#4F7EF7]">Quota Usage</span>
        <h3 className="text-base font-semibold text-[#1A1410] mt-0.5">{getProviderLabel(provider)}</h3>
      </div>
      <p className="text-sm text-[#9C9086] italic">Awaiting first sync</p>
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
    <div className={`${cardBase} border-l-[3px] border-l-[#4F7EF7]`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4F7EF7]">Quota Usage</span>
            <span className="cursor-help text-[#9C9086] text-xs hover:text-[#6B6157]" title="Shows API rate limit usage, not dollar spend. Anthropic tracks usage in rolling time windows.">ⓘ</span>
          </div>
          <h3 className="text-base font-semibold text-[#1A1410] mt-0.5">{getProviderLabel(snapshot.provider)}</h3>
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
      <div className="border-t border-dashed border-[#E8E3D9] pt-2.5">
        <p className="text-xs text-[#9C9086]">💳 Billing unavailable · Requires admin API key</p>
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
    <div className={`${cardBase} border-l-[3px] border-l-[#4F7EF7]`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4F7EF7]">Quota Usage</span>
            <span className="cursor-help text-[#9C9086] text-xs hover:text-[#6B6157]" title="Shows API rate limit usage, not dollar spend.">ⓘ</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-base font-semibold text-[#1A1410]">{getProviderLabel(snapshot.provider)}</h3>
            {planType && (
              <span className="rounded-full bg-[#EEF2FF] border border-[#4F7EF7]/30 px-2 py-0.5 text-[10px] font-medium text-[#4F7EF7]">
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
    <div className={`${cardBase} border-l-[3px] border-l-[#2A9D6E]`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#2A9D6E]">Spend</span>
          <h3 className="text-base font-semibold text-[#1A1410] mt-0.5">{getProviderLabel(snapshot.provider)}</h3>
        </div>
        <FreshnessDot fetchedAt={snapshot.fetched_at} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#1A1410]">{formatCurrency(snapshot.total_cost_usd)}</p>
      </div>
      <div className="flex gap-4 text-sm text-[#6B6157]">
        <span>{formatTokens(snapshot.input_tokens)} in</span>
        <span>{formatTokens(snapshot.output_tokens)} out</span>
        {snapshot.cache_read_tokens != null && <span>{formatTokens(snapshot.cache_read_tokens)} cached</span>}
      </div>
      {modelCount > 0 && (
        <p className="text-xs text-[#9C9086]">{modelCount} model{modelCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

function EmptySpendCard({ provider }: { provider: string }) {
  return (
    <div className={`${cardBase} border-l-[3px] border-l-[#2A9D6E] opacity-60`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#2A9D6E]">Spend</span>
        <h3 className="text-base font-semibold text-[#1A1410] mt-0.5">{getProviderLabel(provider)}</h3>
      </div>
      <p className="text-sm text-[#9C9086] italic">Awaiting first sync</p>
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
    <main className="min-h-screen bg-[#FAF9F5] px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1410]">Cost Monitor</h1>
              {latestFetch && (
                <p className="text-sm text-[#9C9086] mt-1">Updated {formatTime(latestFetch)}</p>
              )}
            </div>
            <RefreshButton />
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-[#C93C3C]/40 bg-[#C93C3C]/10 px-3 py-2 text-sm text-[#C93C3C]">
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

        <footer className="text-xs text-[#9C9086]">
          <p>Data pushed by OpenClaw cron jobs. Costs are append-only snapshots from provider APIs and local session logs.</p>
        </footer>
      </div>
    </main>
  );
}

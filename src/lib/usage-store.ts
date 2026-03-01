import { supabase } from './supabase';

export type UsageSnapshot = {
  id: number;
  provider: string;
  source: string;
  fetched_at: string;
  period_start: string | null;
  period_end: string | null;
  total_cost_usd: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_tokens: number | null;
  total_tokens: number | null;
  model_breakdown: Record<string, unknown> | null;
  raw_response: Record<string, unknown> | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: 'OpenRouter',
  claude_oauth: 'Claude · Anthropic',
  codex: 'Codex · OpenAI',
  claude_local: 'Claude (Local)',
  codex_local: 'Codex (Local)',
  other_local: 'Other Local',
};

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider;
}

export async function loadUsageLatest(): Promise<{
  snapshots: UsageSnapshot[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('usage_latest')
    .select('*');

  if (error) {
    console.error('[usage-store] Failed to load usage_latest:', error.message);
    return { snapshots: [], error: error.message };
  }

  return { snapshots: (data || []) as UsageSnapshot[], error: null };
}

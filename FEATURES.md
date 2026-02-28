# Features

## Cost Dashboard (`/costs`)

| Feature | Status |
|---------|--------|
| Per-provider cards (OpenRouter, Anthropic, OpenAI, Claude Max, Codex) | ✅ |
| Freshness badges (green <5h, amber <24h, red ≥24h) | ✅ |
| Total API spend summary | ✅ |
| "Unknown ≠ zero" — show "—" for missing data | ✅ |
| Supabase append-only snapshots | ✅ |
| OpenRouter API fetch (cron) | ✅ |
| Anthropic Admin API fetch | ✅ (requires ANTHROPIC_ADMIN_KEY) |
| OpenAI Admin API fetch | ✅ (requires OPENAI_ADMIN_KEY) |
| Local session JSONL parsing | ✅ |
| Automated cron sync (6h API, 2h local) | ✅ |
| Model breakdown details | 🔜 |
| Daily cost trend chart | 🔜 |
| Cost alerts/thresholds | 🔜 |

## Intelligence Dashboard (`/`)

| Feature | Status |
|---------|--------|
| Multi-asset price tracking (Gold, Silver, BTC, ETH) | ✅ |
| News aggregation | ✅ |
| Institutional forecasts | ✅ |
| Prediction market odds | ✅ |
| Social sentiment | ✅ |
| Daily auto-refresh (8AM HKT) | ✅ |
| Prediction sync (every 3h) | ✅ |

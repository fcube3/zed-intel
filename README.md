# Kai Intelligence Dashboard

A high-depth strategic briefing dashboard for core assets: Gold, Silver, BTC, and ETH.

## Features
- Real-time price tracking via TradingView.
- Institutional research synthesis from top II-rated firms.
- Prediction market intelligence from Polymarket and Kalshi.
- Cross-asset sentiment analysis.

## Private Ops Cost Dashboard

A password-protected internal dashboard is available at `/ops-cost`.

- The route is intentionally **not linked** from public pages.
- Access is protected via HTTP Basic Auth middleware using `COST_DASH_PASSWORD`.

### Set `COST_DASH_PASSWORD` on Vercel
1. In Vercel, open your project → **Settings** → **Environment Variables**.
2. Add key: `COST_DASH_PASSWORD`.
3. Set a strong value for Production (and Preview/Development if needed).
4. Redeploy so middleware reads the new value.

### Generate/update cost data
```bash
npm run cost:build-data
```

This scans local OpenClaw usage artifacts (`~/.openclaw/cron/runs/*.jsonl` and optional CodexBar JSON if present) and writes:

- `public/data/cost-dashboard.json`

You can run local dev with a refresh in one command:

```bash
npm run cost:dashboard
```

## Credits
Engineered by [Kai](https://kai-intel.vercel.app) via [OpenClaw](https://openclaw.ai).

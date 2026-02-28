# API Reference — External APIs

## OpenRouter

### Auth/Key Info
```
GET https://openrouter.ai/api/v1/auth/key
Authorization: Bearer <OPENROUTER_API_KEY>
```
Returns credit balance, usage, rate limits.

### Activity
```
GET https://openrouter.ai/api/v1/activity?limit=1000
Authorization: Bearer <OPENROUTER_API_KEY>
```
Returns per-model usage with token counts and costs.

**Rate limits:** Standard API rate limits apply.

## Anthropic Admin API

### Organization Usage
```
GET https://api.anthropic.com/v1/organization/usage
x-api-key: <ANTHROPIC_ADMIN_KEY>
anthropic-version: 2023-06-01
```
Returns org-level usage: total cost, tokens, per-model breakdown.

**Auth:** Requires admin API key (not regular API key). Generate at console.anthropic.com → Settings → Admin API Keys.

**Rate limits:** Low rate limit, suitable for periodic polling only.

## OpenAI Admin API

### Organization Costs
```
GET https://api.openai.com/v1/organization/costs?days=30
Authorization: Bearer <OPENAI_ADMIN_KEY>
```
Returns cost data for the organization over the specified period.

**Auth:** Requires organization admin API key. Generate at platform.openai.com → Settings → API Keys (with admin scope).

**Rate limits:** Standard admin API limits.

## Supabase

### PostgREST
```
GET/POST https://<project>.supabase.co/rest/v1/<table>
apikey: <SERVICE_ROLE_KEY>
Authorization: Bearer <SERVICE_ROLE_KEY>
```

All table operations use the Supabase JS client which wraps PostgREST.

**Tables:** `usage_snapshots`, `cost_daily`, `cost_sync_log`
**Views:** `usage_latest`

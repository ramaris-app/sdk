# @ramaris/sdk

TypeScript SDK for the [Ramaris](https://www.ramaris.app) REST API. Query on-chain wallet analytics, trading strategies, and performance data on Base.

## Install

```bash
npm install @ramaris/sdk
```

## Quick Start

```typescript
import { RamarisClient } from '@ramaris/sdk';

const client = new RamarisClient({
  apiKey: 'rms_your_api_key',
});

// List top strategies
const strategies = await client.strategies.list({ pageSize: 10 });
console.log(strategies.data);

// Get strategy details
const strategy = await client.strategies.get('abc123def');
console.log(strategy.name, strategy.roiPercent);
```

## Get an API Key

1. Sign up at [ramaris.app](https://www.ramaris.app)
2. Go to [API Access](https://www.ramaris.app/api-access)
3. Create a new API key

**Free tier** gets 1 API key with `strategies:read` scope (100 req/hr). Upgrade to PRO for wallet data and higher limits.

## API Coverage

### Strategies (FREE tier)

```typescript
client.strategies.list({ page, pageSize })   // List strategies
client.strategies.get(shareId)                // Strategy details
client.strategies.watchlist({ page, pageSize }) // Your followed strategies
```

### Wallets (PRO+)

```typescript
client.wallets.list({ page, pageSize })       // List wallets
client.wallets.get(id)                        // Wallet details
```

### User (PRO+)

```typescript
client.me.profile()                           // Your profile
client.me.subscription()                      // Your subscription
```

### Health

```typescript
client.health()                               // API health check
```

## Rate Limits

| Tier | Requests/Hour | Scopes |
|------|---------------|--------|
| FREE | 100 | strategies:read |
| PRO | 1,000 | strategies:read, wallets:read |
| ULTRA | 10,000 | strategies:read, wallets:read |
| ENTERPRISE | 100,000 | strategies:read, wallets:read |

Rate limit info is available after any request:

```typescript
await client.strategies.list();
console.log(client.rateLimit);
// { limit: 100, remaining: 99, reset: 1707667200 }
```

## Error Handling

```typescript
import { RamarisError, RateLimitError } from '@ramaris/sdk';

try {
  await client.wallets.list();
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof RamarisError) {
    console.log(err.code, err.message); // e.g. "INSUFFICIENT_SCOPE"
  }
}
```

## Configuration

```typescript
const client = new RamarisClient({
  apiKey: 'rms_...',          // Required
  baseUrl: 'https://...',     // Optional, defaults to https://www.ramaris.app/api/v1
});
```

## Links

- [API Documentation](https://www.ramaris.app/docs/api/)
- [Interactive API Docs](https://www.ramaris.app/api-docs)
- [OpenAPI Spec](https://www.ramaris.app/api/v1/openapi.yaml)
- [Pricing](https://www.ramaris.app/pricing)

## License

MIT

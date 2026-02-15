import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RamarisClient } from '../src/client.js';
import type {
  StrategyListItem,
  StrategyDetail,
  WatchlistStrategy,
  WalletListItem,
  WalletDetail,
  UserProfile,
  Subscription,
  HealthStatus,
  Pagination,
} from '../src/types.js';

function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '999',
      'x-ratelimit-reset': '1700000000',
      ...headers,
    },
  });
}

const pagination: Pagination = {
  page: 1,
  pageSize: 20,
  totalItems: 100,
  totalPages: 5,
};

describe('RamarisClient', () => {
  let client: RamarisClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    client = new RamarisClient({ apiKey: 'rms_test_key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses default baseUrl', () => {
      const c = new RamarisClient({ apiKey: 'rms_key' });
      expect(c).toBeDefined();
    });

    it('accepts custom baseUrl', () => {
      const c = new RamarisClient({ apiKey: 'rms_key', baseUrl: 'https://custom.api/v1' });
      expect(c).toBeDefined();
    });
  });

  describe('request headers', () => {
    it('sends Authorization header with Bearer token', async () => {
      const strategy: StrategyListItem = {
        id: 1,
        shareId: 'abc',
        name: 'Test',
        description: null,
        roiPercent: null,
        lastActivityAt: null,
        createdAt: '2025-01-01T00:00:00Z',
        creator: { nickname: 'user' },
        stats: { walletsTracked: 0, totalSwaps: 0 },
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [strategy], pagination }));

      await client.strategies.list();

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [, init] = fetchSpy.mock.calls[0]!;
      expect(init.headers['Authorization']).toBe('Bearer rms_test_key');
    });

    it('sends Accept: application/json header', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.strategies.list();

      const [, init] = fetchSpy.mock.calls[0]!;
      expect(init.headers['Accept']).toBe('application/json');
    });
  });

  describe('rate limit tracking', () => {
    it('tracks rate limit from response headers', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse({ data: [], pagination }, 200, {
          'x-ratelimit-limit': '1000',
          'x-ratelimit-remaining': '950',
          'x-ratelimit-reset': '1700000000',
        }),
      );

      await client.strategies.list();

      expect(client.rateLimit).toEqual({
        limit: 1000,
        remaining: 950,
        reset: 1700000000,
      });
    });
  });

  describe('strategies.list', () => {
    it('sends GET to /strategies', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.strategies.list();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/strategies');
    });

    it('sends pagination params as query string', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.strategies.list({ page: 2, pageSize: 50 });

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/strategies?page=2&pageSize=50');
    });

    it('returns paginated strategy list', async () => {
      const strategy: StrategyListItem = {
        id: 1,
        shareId: 'abc123',
        name: 'DeFi Alpha',
        description: 'Top wallets on Base',
        roiPercent: 45.2,
        lastActivityAt: '2026-01-15T10:30:00Z',
        createdAt: '2025-06-01T08:00:00Z',
        creator: { nickname: 'cryptowhale' },
        stats: { walletsTracked: 5, totalSwaps: 847 },
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [strategy], pagination }));

      const result = await client.strategies.list();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(strategy);
      expect(result.pagination).toEqual(pagination);
    });
  });

  describe('strategies.get', () => {
    it('sends GET to /strategies/:shareId', async () => {
      const detail: StrategyDetail = {
        id: 1,
        shareId: 'abc123',
        name: 'DeFi Alpha',
        description: null,
        roiPercent: 45.2,
        lastActivityAt: '2026-01-15T10:30:00Z',
        createdAt: '2025-06-01T08:00:00Z',
        status: 'ACTIVE',
        creator: { nickname: 'cryptowhale' },
        stats: { walletsTracked: 5, totalSwaps: 847, totalNotifications: 234 },
        tags: ['defi', 'base'],
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: detail }));

      const result = await client.strategies.get('abc123');

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/strategies/abc123');
      expect(result).toEqual(detail);
    });
  });

  describe('strategies.watchlist', () => {
    it('sends GET to /me/strategies/watchlist', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.strategies.watchlist();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/me/strategies/watchlist');
    });

    it('sends pagination params', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.strategies.watchlist({ page: 3 });

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/me/strategies/watchlist?page=3');
    });

    it('returns paginated watchlist', async () => {
      const item: WatchlistStrategy = {
        id: 1,
        shareId: 'abc',
        name: 'Test',
        description: null,
        roiPercent: 10.5,
        lastActivityAt: null,
        creator: { nickname: 'user' },
        copiedAt: '2025-12-01T14:00:00Z',
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [item], pagination }));

      const result = await client.strategies.watchlist();

      expect(result.data[0]).toEqual(item);
    });
  });

  describe('wallets.list', () => {
    it('sends GET to /wallets', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.wallets.list();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/wallets');
    });

    it('sends pagination params', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await client.wallets.list({ page: 2, pageSize: 10 });

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/wallets?page=2&pageSize=10');
    });

    it('returns paginated wallet list', async () => {
      const wallet: WalletListItem = {
        id: 456,
        winRate: 0.72,
        realizedPnL: 125000.5,
        createdAt: '2025-03-15T09:00:00Z',
        stats: { totalSwaps: 1234, openPositions: 8 },
        tags: ['whale', 'defi'],
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [wallet], pagination }));

      const result = await client.wallets.list();

      expect(result.data[0]).toEqual(wallet);
    });
  });

  describe('wallets.get', () => {
    it('sends GET to /wallets/:id', async () => {
      const detail: WalletDetail = {
        id: 456,
        winRate: 0.72,
        realizedPnL: 125000.5,
        createdAt: '2025-03-15T09:00:00Z',
        status: 'active',
        stats: { totalSwaps: 1234, openPositions: 8, followers: 42 },
        tags: ['whale'],
        topTokens: [{ symbol: 'USDC', realizedProfitUsd: 45000, tradeCount: 156 }],
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: detail }));

      const result = await client.wallets.get(456);

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/wallets/456');
      expect(result).toEqual(detail);
    });
  });

  describe('me.profile', () => {
    it('sends GET to /me/profile', async () => {
      const profile: UserProfile = {
        id: 'user_abc123',
        nickname: 'cryptotrader',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2025-01-15T10:00:00Z',
        isFounder: false,
        stats: { strategiesCreated: 3, walletsFollowed: 12, strategiesFollowed: 5 },
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: profile }));

      const result = await client.me.profile();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/me/profile');
      expect(result).toEqual(profile);
    });
  });

  describe('me.subscription', () => {
    it('sends GET to /me/subscription', async () => {
      const sub: Subscription = {
        tier: 'PRO',
        status: 'active',
        currentPeriodEnd: '2026-02-15T00:00:00Z',
        cancelAtPeriodEnd: false,
        isFounder: false,
        createdAt: '2025-01-15T10:00:00Z',
      };
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: sub }));

      const result = await client.me.subscription();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/me/subscription');
      expect(result).toEqual(sub);
    });
  });

  describe('health', () => {
    it('sends GET to /health', async () => {
      const health: HealthStatus = {
        status: 'ok',
        version: 'v1',
        timestamp: '2026-01-15T10:30:00Z',
        user: 'user_abc123',
        rateLimit: { limit: 1000, keyPrefix: 'rms_abc1' },
      };
      fetchSpy.mockResolvedValueOnce(mockResponse(health));

      const result = await client.health();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://www.ramaris.app/api/v1/health');
      expect(result).toEqual(health);
    });
  });

  describe('custom baseUrl', () => {
    it('uses custom baseUrl for requests', async () => {
      const customClient = new RamarisClient({
        apiKey: 'rms_key',
        baseUrl: 'https://staging.ramaris.app/api/v1',
      });
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await customClient.strategies.list();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://staging.ramaris.app/api/v1/strategies');
    });

    it('strips trailing slash from baseUrl', async () => {
      const customClient = new RamarisClient({
        apiKey: 'rms_key',
        baseUrl: 'https://staging.ramaris.app/api/v1/',
      });
      fetchSpy.mockResolvedValueOnce(mockResponse({ data: [], pagination }));

      await customClient.strategies.list();

      const [url] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://staging.ramaris.app/api/v1/strategies');
    });
  });
});

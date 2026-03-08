import { RamarisError, RateLimitError } from './errors.js';
import type {
  AggregateStats,
  ClientOptions,
  HealthStatus,
  LeaderboardParams,
  LeaderboardStrategy,
  LeaderboardWallet,
  PaginatedResponse,
  PaginationParams,
  RateLimitInfo,
  StrategyDetail,
  StrategyListItem,
  Subscription,
  TokenDetail,
  TokenListItem,
  TokenListParams,
  UserProfile,
  WalletDetail,
  WalletListItem,
  WalletListParams,
  WatchlistStrategy,
} from './types.js';

const DEFAULT_BASE_URL = 'https://www.ramaris.app/api/v1';

export class RamarisClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  rateLimit: RateLimitInfo | null = null;

  readonly strategies: {
    list: (params?: PaginationParams) => Promise<PaginatedResponse<StrategyListItem>>;
    get: (shareId: string) => Promise<StrategyDetail>;
    watchlist: (params?: PaginationParams) => Promise<PaginatedResponse<WatchlistStrategy>>;
  };

  readonly wallets: {
    list: (params?: WalletListParams) => Promise<PaginatedResponse<WalletListItem>>;
    get: (id: number) => Promise<WalletDetail>;
  };

  readonly me: {
    profile: () => Promise<UserProfile>;
    subscription: () => Promise<Subscription>;
  };

  readonly leaderboard: {
    topWallets: (params?: LeaderboardParams) => Promise<{ wallets: LeaderboardWallet[]; cachedAt: string }>;
    topStrategies: (params?: LeaderboardParams) => Promise<{ strategies: LeaderboardStrategy[]; cachedAt: string }>;
    stats: () => Promise<AggregateStats>;
  };

  readonly tokens: {
    list: (params?: TokenListParams) => Promise<PaginatedResponse<TokenListItem>>;
    get: (contractAddress: string) => Promise<TokenDetail>;
  };

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

    this.strategies = {
      list: (params) => this.getPaginated<StrategyListItem>('/strategies', params),
      get: (shareId) => this.getSingle<StrategyDetail>(`/strategies/${shareId}`),
      watchlist: (params) =>
        this.getPaginated<WatchlistStrategy>('/me/strategies/watchlist', params),
    };

    this.wallets = {
      list: (params) => {
        const extra: Record<string, string> = {};
        if (params?.computed && params.computed.length > 0) {
          extra.computed = params.computed.join(',');
        }
        return this.getPaginated<WalletListItem>('/wallets', params, extra);
      },
      get: (id) => this.getSingle<WalletDetail>(`/wallets/${id}`),
    };

    this.me = {
      profile: () => this.getSingle<UserProfile>('/me/profile'),
      subscription: () => this.getSingle<Subscription>('/me/subscription'),
    };

    this.leaderboard = {
      topWallets: (params) => {
        const extra: Record<string, string> = {};
        if (params?.limit !== undefined) extra.limit = String(params.limit);
        return this.getSingle<{ wallets: LeaderboardWallet[]; cachedAt: string }>(
          '/leaderboard/wallets',
          extra,
        );
      },
      topStrategies: (params) => {
        const extra: Record<string, string> = {};
        if (params?.limit !== undefined) extra.limit = String(params.limit);
        return this.getSingle<{ strategies: LeaderboardStrategy[]; cachedAt: string }>(
          '/leaderboard/strategies',
          extra,
        );
      },
      stats: () => this.getSingle<AggregateStats>('/leaderboard/stats'),
    };

    this.tokens = {
      list: (params) => {
        const extra: Record<string, string> = {};
        if (params?.search) extra.search = params.search;
        if (params?.chain) extra.chain = params.chain;
        return this.getPaginated<TokenListItem>('/tokens', params, extra);
      },
      get: (contractAddress) => this.getSingle<TokenDetail>(`/tokens/${contractAddress}`),
    };
  }

  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  private async getPaginated<T>(
    path: string,
    params?: PaginationParams,
    extraQuery?: Record<string, string>,
  ): Promise<PaginatedResponse<T>> {
    return this.request<PaginatedResponse<T>>(path, params, extraQuery);
  }

  private async getSingle<T>(path: string, extraQuery?: Record<string, string>): Promise<T> {
    const response = await this.request<{ data: T }>(path, undefined, extraQuery);
    return response.data;
  }

  private async request<T>(
    path: string,
    params?: PaginationParams,
    extraQuery?: Record<string, string>,
  ): Promise<T> {
    const url = this.buildUrl(path, params, extraQuery);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new RamarisError(
        err instanceof Error ? err.message : 'Network error',
        'NETWORK_ERROR',
        0,
      );
    }

    this.updateRateLimit(response.headers);

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return (await response.json()) as T;
  }

  private buildUrl(
    path: string,
    params?: PaginationParams,
    extraQuery?: Record<string, string>,
  ): string {
    const url = `${this.baseUrl}${path}`;
    if (!params && !extraQuery) return url;

    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
    if (extraQuery) {
      for (const [k, v] of Object.entries(extraQuery)) {
        searchParams.set(k, v);
      }
    }

    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private updateRateLimit(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      this.rateLimit = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    interface ErrorBody {
      error?: { code?: string; message?: string; retryAfter?: number };
    }
    let body: ErrorBody | null = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = (await response.json()) as ErrorBody;
      }
    } catch {
      // ignore parse errors
    }

    const code = body?.error?.code ?? 'UNKNOWN_ERROR';
    const message = body?.error?.message ?? `HTTP ${response.status}`;

    if (response.status === 429) {
      const retryAfter = body?.error?.retryAfter ?? 0;
      throw new RateLimitError(message, retryAfter);
    }

    throw new RamarisError(message, code, response.status);
  }
}

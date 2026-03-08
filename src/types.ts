export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Valid computed filter values for wallet listing.
 * - Activity: `activeDay`, `activeWeek`, `stale` (OR semantics)
 * - Token quality: `hideMemeOnly` — excludes wallets trading only risky tokens (AND)
 * - Risk: `riskConservative`, `riskBalanced`, `riskHighRisk`, `riskDegen` (AND)
 */
export type WalletComputedFilter =
  | 'activeDay'
  | 'activeWeek'
  | 'stale'
  | 'hideMemeOnly'
  | 'riskConservative'
  | 'riskBalanced'
  | 'riskHighRisk'
  | 'riskDegen';

export interface WalletListParams extends PaginationParams {
  /** Computed filters to apply. Multiple filters can be combined. */
  computed?: WalletComputedFilter[];
}

export interface StrategyListItem {
  id: number;
  shareId: string;
  name: string;
  description: string | null;
  roiPercent: number | null;
  lastActivityAt: string | null;
  createdAt: string;
  creator: { nickname: string };
  stats: { walletsTracked: number; totalSwaps: number };
}

export interface StrategyDetail extends StrategyListItem {
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  stats: { walletsTracked: number; totalSwaps: number; totalNotifications: number };
  tags: string[];
}

export interface WatchlistStrategy {
  id: number;
  shareId: string;
  name: string;
  description: string | null;
  roiPercent: number | null;
  lastActivityAt: string | null;
  creator: { nickname: string };
  copiedAt: string;
}

export interface WalletListItem {
  id: number;
  winRate: number | null;
  realizedPnL: number | null;
  createdAt: string;
  stats: { totalSwaps: number; openPositions: number };
  tags: string[];
}

export interface WalletDetail extends WalletListItem {
  status: string;
  stats: { totalSwaps: number; openPositions: number; followers: number };
  topTokens: { symbol: string; realizedProfitUsd: number; tradeCount: number }[];
}

export interface UserProfile {
  id: string;
  nickname: string | null;
  name: string | null;
  email: string;
  createdAt: string;
  isFounder: boolean;
  stats: {
    strategiesCreated: number;
    walletsFollowed: number;
    strategiesFollowed: number;
  };
}

export interface Subscription {
  tier: 'FREE' | 'PRO' | 'ULTRA' | 'ENTERPRISE';
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isFounder: boolean;
  createdAt: string | null;
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  user: string;
  rateLimit: { limit: number; keyPrefix: string };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// ── Leaderboard ──────────────────────────────────────────────────────

export interface LeaderboardWallet {
  id: number;
  walletAddress: string;
  winRate: number | null;
  realizedPnL: number | null;
  avgProfit7d: number;
  tradeCount7d: number;
}

export interface LeaderboardStrategy {
  id: number;
  name: string;
  shareId: string;
  roiPercentAllTime: number | null;
  creatorNickname: string | null;
  walletCount: number;
  lastActivityAt: number | null;
}

export interface AggregateStats {
  totalSignals7d: number;
  avgRoiPercent: number;
  activeStrategies: number;
  activeWallets: number;
  signalsDelta: number;
  walletsDelta: number;
  cachedAt: string;
}

export interface LeaderboardParams {
  limit?: number;
}

// ── Tokens ───────────────────────────────────────────────────────────

export interface TokenListItem {
  id: number;
  contractAddress: string;
  symbol: string | null;
  name: string | null;
  chain: string | null;
  decimals: number | null;
  honeypotStatus: string | null;
  mcap: number | null;
  priceUsd: number | null;
  fdvUsd: number | null;
  volume24h: number | null;
  riskLabel: string | null;
  fdvRiskLevel: string | null;
  volumeRiskLevel: string | null;
  securityRiskLevel: string | null;
}

export interface TokenDetail extends TokenListItem {
  holders: number | null;
  top10HoldersPercent: number | null;
  goplusRiskReasons: string[];
}

export interface TokenListParams extends PaginationParams {
  search?: string;
  chain?: string;
}

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
}

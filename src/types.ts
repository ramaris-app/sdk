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

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
}

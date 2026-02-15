export class RamarisError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'RamarisError';
    this.code = code;
    this.status = status;
  }
}

export class RateLimitError extends RamarisError {
  readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

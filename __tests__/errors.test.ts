import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RamarisClient } from '../src/client.js';
import { RamarisError, RateLimitError } from '../src/errors.js';

function mockErrorResponse(
  status: number,
  body: { error: { code: string; message: string; retryAfter?: number } },
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

describe('Error handling', () => {
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

  describe('RamarisError', () => {
    it('is thrown on 401 Unauthorized', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(401, {
          error: { code: 'INVALID_API_KEY', message: 'Invalid or expired API key' },
        }),
      );

      await expect(client.strategies.list()).rejects.toThrow(RamarisError);
      await fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(401, {
          error: { code: 'INVALID_API_KEY', message: 'Invalid or expired API key' },
        }),
      );

      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.code).toBe('INVALID_API_KEY');
        expect(e.message).toBe('Invalid or expired API key');
        expect(e.status).toBe(401);
      }
    });

    it('is thrown on 403 Forbidden', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(403, {
          error: { code: 'INSUFFICIENT_SCOPE', message: 'Insufficient permissions' },
        }),
      );

      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.code).toBe('INSUFFICIENT_SCOPE');
        expect(e.status).toBe(403);
      }
    });

    it('is thrown on 404 Not Found', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(404, {
          error: { code: 'NOT_FOUND', message: 'Strategy not found' },
        }),
      );

      try {
        await client.strategies.get('nonexistent');
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.code).toBe('NOT_FOUND');
        expect(e.status).toBe(404);
      }
    });

    it('is thrown on 500 Internal Error', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(500, {
          error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch strategies' },
        }),
      );

      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.code).toBe('INTERNAL_ERROR');
        expect(e.status).toBe(500);
      }
    });

    it('handles non-JSON error responses', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Internal Server Error', {
          status: 502,
          headers: { 'content-type': 'text/plain' },
        }),
      );

      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.status).toBe(502);
        expect(e.code).toBe('UNKNOWN_ERROR');
      }
    });

    it('handles network errors', async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(client.strategies.list()).rejects.toThrow(RamarisError);

      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RamarisError;
        expect(e.code).toBe('NETWORK_ERROR');
        expect(e.status).toBe(0);
      }
    });
  });

  describe('RateLimitError', () => {
    it('is thrown on 429 with retryAfter', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockErrorResponse(
          429,
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Rate limit exceeded',
              retryAfter: 1800,
            },
          },
          {
            'x-ratelimit-limit': '1000',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1700001800',
          },
        ),
      );

      try {
        await client.strategies.list();
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect(err).toBeInstanceOf(RamarisError);
        const e = err as RateLimitError;
        expect(e.code).toBe('RATE_LIMITED');
        expect(e.status).toBe(429);
        expect(e.retryAfter).toBe(1800);
      }
    });

    it('extends RamarisError', () => {
      const err = new RateLimitError('Rate limited', 1800);
      expect(err).toBeInstanceOf(RamarisError);
      expect(err).toBeInstanceOf(Error);
      expect(err.retryAfter).toBe(1800);
    });
  });
});

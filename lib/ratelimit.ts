import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (request: NextRequest, identifier: string) => {
    const key = identifier;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      };
      rateLimitStore.set(key, entry);
      return { allowed: true };
    }

    entry.count++;

    if (entry.count > finalConfig.maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        limit: finalConfig.maxRequests,
      });
      return { allowed: false, resetTime: entry.resetTime };
    }

    return { allowed: true };
  };
}

// Specific rate limiters
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes
});

export const onboardingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 submissions per hour
});

export const verificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 verification sends per hour
});

export function handleRateLimit(resetTime: number): NextResponse {
  const remainingSeconds = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: remainingSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(remainingSeconds),
      },
    }
  );
}

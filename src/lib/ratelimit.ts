import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// General API rate limit: 60 requests per minute per user/IP
let generalLimiter: Ratelimit | null = null;
export function getGeneralRateLimiter() {
  if (!generalLimiter) {
    generalLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "rl:general",
    });
  }
  return generalLimiter;
}

// Strict rate limit: 10 requests per minute (for write operations)
let strictLimiter: Ratelimit | null = null;
export function getStrictRateLimiter() {
  if (!strictLimiter) {
    strictLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "rl:strict",
    });
  }
  return strictLimiter;
}

// Auth rate limit: 5 attempts per minute (for login/signup)
let authLimiter: Ratelimit | null = null;
export function getAuthRateLimiter() {
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "rl:auth",
    });
  }
  return authLimiter;
}

// Bot trigger rate limit: 1 per hour
let botLimiter: Ratelimit | null = null;
export function getBotRateLimiter() {
  if (!botLimiter) {
    botLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(1, "3600 s"),
      prefix: "rl:bot",
    });
  }
  return botLimiter;
}

/**
 * Check rate limit. Returns { success, remaining } or throws with 429 info.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { success: true, remaining: -1, reset: 0 };
  }
}

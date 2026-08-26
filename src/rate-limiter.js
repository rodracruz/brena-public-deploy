"use strict";

function createRateLimiter({ windowMs = 60_000, max = 5, maxBuckets = 10_000 } = {}) {
  const buckets = new Map();

  function cleanup(now) {
    if (buckets.size <= maxBuckets) return;
    for (const [key, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) buckets.delete(key);
      if (buckets.size <= maxBuckets) break;
    }
  }

  return {
    consume(key, now = Date.now()) {
      cleanup(now);
      const bucketKey = String(key || "unknown").slice(0, 128);
      const current = buckets.get(bucketKey);

      if (!current || now - current.startedAt >= windowMs) {
        buckets.set(bucketKey, { startedAt: now, count: 1 });
        return { allowed: true, retryAfter: 0 };
      }

      if (current.count >= max) {
        return {
          allowed: false,
          retryAfter: Math.max(1, Math.ceil((windowMs - (now - current.startedAt)) / 1_000)),
        };
      }

      current.count += 1;
      return { allowed: true, retryAfter: 0 };
    },
  };
}

module.exports = { createRateLimiter };

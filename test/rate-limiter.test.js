const test = require("node:test");
const assert = require("node:assert/strict");

const { createRateLimiter } = require("../src/rate-limiter");

test("allows requests up to the limit and reports retry time after it", () => {
  const limiter = createRateLimiter({ windowMs: 1_000, max: 2 });

  assert.deepEqual(limiter.consume("203.0.113.4", 10_000), { allowed: true, retryAfter: 0 });
  assert.deepEqual(limiter.consume("203.0.113.4", 10_200), { allowed: true, retryAfter: 0 });
  assert.deepEqual(limiter.consume("203.0.113.4", 10_400), { allowed: false, retryAfter: 1 });
});

test("uses independent buckets and resets after the time window", () => {
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1 });

  assert.equal(limiter.consume("first", 5_000).allowed, true);
  assert.equal(limiter.consume("second", 5_100).allowed, true);
  assert.equal(limiter.consume("first", 5_500).allowed, false);
  assert.deepEqual(limiter.consume("first", 6_001), { allowed: true, retryAfter: 0 });
});

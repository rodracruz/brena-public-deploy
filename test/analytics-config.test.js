"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveAnalyticsConfig } = require("../src/analytics-config");
const { contentSecurityPolicy } = require("../src/security-headers");

test("analytics stays disabled when configuration is absent or incomplete", () => {
  assert.deepEqual(resolveAnalyticsConfig({}), {
    enabled: false,
    provider: "none",
    measurementId: "",
  });
  assert.deepEqual(resolveAnalyticsConfig({
    BRENA_ANALYTICS_ENABLED: "1",
  }), {
    enabled: false,
    provider: "none",
    measurementId: "",
  });
  assert.deepEqual(resolveAnalyticsConfig({
    BRENA_ANALYTICS_ENABLED: "1",
    BRENA_GA4_MEASUREMENT_ID: "not-an-id",
  }), {
    enabled: false,
    provider: "none",
    measurementId: "",
  });
});

test("analytics requires explicit enablement and a valid GA4 measurement ID", () => {
  assert.deepEqual(resolveAnalyticsConfig({
    BRENA_ANALYTICS_ENABLED: "0",
    BRENA_GA4_MEASUREMENT_ID: "G-ABC1234567",
  }), {
    enabled: false,
    provider: "none",
    measurementId: "",
  });
  assert.deepEqual(resolveAnalyticsConfig({
    BRENA_ANALYTICS_ENABLED: "1",
    BRENA_GA4_MEASUREMENT_ID: " G-ABC1234567 ",
  }), {
    enabled: true,
    provider: "ga4",
    measurementId: "G-ABC1234567",
  });
});

test("CSP refuses to open for an invalid effective GA4 configuration", () => {
  const csp = contentSecurityPolicy({
    enabled: true,
    provider: "ga4",
    measurementId: "invalid",
  });

  assert.equal(csp.includes("googletagmanager.com"), false);
  assert.equal(csp.includes("google-analytics.com"), false);
});

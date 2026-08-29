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
    attributionAllowlist: {
      utm_source: [],
      utm_medium: [],
      utm_campaign: [],
      utm_content: [],
      utm_term: [],
    },
  });
});

test("attribution requires an exact configured allowlist and rejects malformed configuration", () => {
  const base = {
    BRENA_ANALYTICS_ENABLED: "1",
    BRENA_GA4_MEASUREMENT_ID: "G-ABC1234567",
  };
  const valid = resolveAnalyticsConfig({
    ...base,
    BRENA_ANALYTICS_UTM_ALLOWLIST_JSON: JSON.stringify({
      utm_source: ["google"],
      utm_medium: ["cpc"],
      utm_campaign: ["campaign-sale-2026"],
      utm_content: ["creative-video-01"],
      utm_term: ["keyword-home-01"],
    }),
  });
  assert.deepEqual(valid.attributionAllowlist, {
    utm_source: ["google"],
    utm_medium: ["cpc"],
    utm_campaign: ["campaign-sale-2026"],
    utm_content: ["creative-video-01"],
    utm_term: ["keyword-home-01"],
  });

  for (const unsafe of [
    "not-json",
    JSON.stringify({ utm_campaign: ["cmp_mariaperez"] }),
    JSON.stringify({ utm_source: ["google"], arbitrary: ["value"] }),
  ]) {
    const config = resolveAnalyticsConfig({ ...base, BRENA_ANALYTICS_UTM_ALLOWLIST_JSON: unsafe });
    assert.deepEqual(config.attributionAllowlist, {
      utm_source: [], utm_medium: [], utm_campaign: [], utm_content: [], utm_term: [],
    });
  }
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

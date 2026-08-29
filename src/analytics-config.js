"use strict";

const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{6,20}$/;
const ATTRIBUTION_KEYS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);
const ATTRIBUTION_VALUE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function emptyAttributionAllowlist() {
  return Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, []]));
}

function resolveAttributionAllowlist(raw) {
  if (typeof raw !== "string" || !raw.trim()) return emptyAttributionAllowlist();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid allowlist");
    const keys = Object.keys(parsed);
    if (keys.length !== ATTRIBUTION_KEYS.length || keys.some((key) => !ATTRIBUTION_KEYS.includes(key))) {
      throw new Error("invalid allowlist keys");
    }
    const result = {};
    for (const key of ATTRIBUTION_KEYS) {
      const values = parsed[key];
      if (!Array.isArray(values) || values.length > 100) throw new Error("invalid allowlist values");
      const normalized = [...new Set(values)];
      if (normalized.some((value) => typeof value !== "string" || !ATTRIBUTION_VALUE.test(value))) {
        throw new Error("invalid allowlist token");
      }
      result[key] = normalized;
    }
    return result;
  } catch {
    return emptyAttributionAllowlist();
  }
}

function isValidGa4MeasurementId(value) {
  return typeof value === "string" && GA4_MEASUREMENT_ID.test(value);
}

function isEnabledGa4Config(config) {
  return Boolean(
    config
    && config.enabled === true
    && config.provider === "ga4"
    && isValidGa4MeasurementId(config.measurementId),
  );
}

function disabledAnalyticsConfig() {
  return {
    enabled: false,
    provider: "none",
    measurementId: "",
  };
}

function resolveAnalyticsConfig(env = process.env) {
  const explicitlyEnabled = env.BRENA_ANALYTICS_ENABLED === "1";
  const measurementId = String(env.BRENA_GA4_MEASUREMENT_ID || "").trim();
  if (!explicitlyEnabled || !isValidGa4MeasurementId(measurementId)) {
    return disabledAnalyticsConfig();
  }
  return {
    enabled: true,
    provider: "ga4",
    measurementId,
    attributionAllowlist: resolveAttributionAllowlist(env.BRENA_ANALYTICS_UTM_ALLOWLIST_JSON),
  };
}

module.exports = {
  disabledAnalyticsConfig,
  isEnabledGa4Config,
  isValidGa4MeasurementId,
  resolveAttributionAllowlist,
  resolveAnalyticsConfig,
};

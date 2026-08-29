"use strict";

const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{6,20}$/;

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
  if (!explicitlyEnabled || !GA4_MEASUREMENT_ID.test(measurementId)) {
    return disabledAnalyticsConfig();
  }
  return {
    enabled: true,
    provider: "ga4",
    measurementId,
  };
}

module.exports = { disabledAnalyticsConfig, resolveAnalyticsConfig };

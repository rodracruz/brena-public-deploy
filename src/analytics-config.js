"use strict";

const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{6,20}$/;

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
  };
}

module.exports = {
  disabledAnalyticsConfig,
  isEnabledGa4Config,
  isValidGa4MeasurementId,
  resolveAnalyticsConfig,
};

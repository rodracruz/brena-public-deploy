"use strict";

const path = require("node:path");

const DEFAULT_LEAD_ARCHIVE_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "outputs",
  "01a03663-35f2-70e2-848d-af024af190de",
);

function integer(value, fallback, name, minimum, maximum) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function runtimeConfig(env = process.env) {
  const environment = env.NODE_ENV || "development";
  const isProduction = environment === "production";
  const mode = env.BRENA_LEAD_MODE || (isProduction ? "live" : "preview");
  const endpoint = (env.BRENA_V2_LEADS_URL || "").trim();
  const token = (env.BRENA_V2_API_TOKEN || "").trim();
  const localArchiveEnabled = env.BRENA_LOCAL_EXCEL_ENABLED
    ? env.BRENA_LOCAL_EXCEL_ENABLED === "1"
    : !isProduction;

  if (!["preview", "local", "live"].includes(mode)) {
    throw new Error("BRENA_LEAD_MODE must be preview, local or live");
  }
  if (isProduction && mode === "preview") {
    throw new Error("Production requires BRENA_LEAD_MODE=local or live");
  }
  if (mode === "local" && !localArchiveEnabled) {
    throw new Error("Local mode requires BRENA_LOCAL_EXCEL_ENABLED=1");
  }
  if (mode === "live" && !endpoint) throw new Error("BRENA_V2_LEADS_URL is required in live mode");
  if (isProduction && mode === "live" && !token) {
    throw new Error("BRENA_V2_API_TOKEN is required in production live mode");
  }

  if (endpoint) {
    let url;
    try {
      url = new URL(endpoint);
    } catch {
      throw new Error("BRENA_V2_LEADS_URL must be a valid URL");
    }
    const isLocal = ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(isLocal && !isProduction)) {
      throw new Error("BRENA_V2_LEADS_URL must use HTTPS");
    }
  }

  return {
    environment,
    isProduction,
    mode,
    host: env.HOST || "127.0.0.1",
    port: integer(env.PORT, 3011, "PORT", 1, 65_535),
    endpoint,
    token,
    timeoutMs: integer(env.BRENA_V2_TIMEOUT_MS, 5_000, "BRENA_V2_TIMEOUT_MS", 500, 15_000),
    trustProxy: env.TRUST_PROXY === "1",
    localArchiveEnabled,
    leadArchiveDir: path.resolve(env.BRENA_LOCAL_LEADS_DIR || DEFAULT_LEAD_ARCHIVE_DIR),
    spreadsheetNode: env.BRENA_SPREADSHEET_NODE || process.execPath,
  };
}

module.exports = { runtimeConfig };

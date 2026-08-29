"use strict";

const ATTRIBUTION_KEYS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);
const ATTRIBUTION_STORAGE_KEY = "brena.analytics.attribution.v1";
const SAFE_TOKEN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const EVENT_SCHEMAS = Object.freeze({
  page_view: Object.freeze({ page_type: new Set([
    "homepage",
    "commercial_fast_sale",
    "commercial_debt",
    "commercial_property_condition",
  ]) }),
  cta_click: Object.freeze({ cta_id: SAFE_TOKEN, cta_location: SAFE_TOKEN }),
  form_start: Object.freeze({}),
  form_submit_attempt: Object.freeze({}),
  generate_lead: Object.freeze({ submission_status: new Set(["created"]) }),
  form_error: Object.freeze({ error_type: new Set(["validation", "network", "server"]) }),
});

function allowedAttributionValues(allowlist, key) {
  const values = allowlist?.[key];
  if (!Array.isArray(values)) return new Set();
  return new Set(values.filter((value) => typeof value === "string"));
}

function sanitizeCampaignValue(key, value, allowlist = {}) {
  if (typeof value !== "string") return "";
  const normalized = value.normalize("NFKC").trim();
  return allowedAttributionValues(allowlist, key).has(normalized) ? normalized : "";
}

function collectSafeAttribution(search, allowlist) {
  const params = new URLSearchParams(search || "");
  const attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = sanitizeCampaignValue(key, params.get(key) || "", allowlist);
    if (value) attribution[key] = value;
  }
  return attribution;
}

function readStoredAttribution(storage, allowlist) {
  if (!storage || typeof storage.getItem !== "function") return {};
  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid attribution");
    const keys = Object.keys(parsed);
    if (keys.some((key) => !ATTRIBUTION_KEYS.includes(key))) throw new Error("unknown attribution key");
    const attribution = {};
    for (const key of keys) {
      const value = sanitizeCampaignValue(key, parsed[key], allowlist);
      if (!value || value !== parsed[key]) throw new Error("unsafe attribution value");
      attribution[key] = value;
    }
    return attribution;
  } catch {
    try { storage.removeItem?.(ATTRIBUTION_STORAGE_KEY); } catch { /* storage unavailable */ }
    return {};
  }
}

function resolveSessionAttribution(search, storage, allowlist) {
  const current = collectSafeAttribution(search, allowlist);
  const params = new URLSearchParams(search || "");
  const hasAttributionInput = ATTRIBUTION_KEYS.some((key) => params.has(key));
  if (Object.keys(current).length === 0) {
    if (hasAttributionInput) {
      try { storage?.removeItem?.(ATTRIBUTION_STORAGE_KEY); } catch { /* storage unavailable */ }
      return {};
    }
    return readStoredAttribution(storage, allowlist);
  }
  try { storage?.setItem?.(ATTRIBUTION_STORAGE_KEY, JSON.stringify(current)); } catch { /* storage unavailable */ }
  return current;
}

function safeReferrerDomain(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    if (!new Set(["http:", "https:"]).has(url.protocol)) return "";
    return url.hostname.toLowerCase().replace(/^www\./, "").slice(0, 253);
  } catch {
    return "";
  }
}

function safePathname(value) {
  if (typeof value !== "string" || !value.startsWith("/") || /[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value.slice(0, 256);
}

function validField(value, validator) {
  if (validator instanceof Set) return typeof value === "string" && validator.has(value);
  return typeof value === "string" && validator.test(value);
}

function buildEventPayload(eventName, input, context) {
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema || !input || typeof input !== "object" || Array.isArray(input)) return null;
  const inputKeys = Object.keys(input);
  const schemaKeys = Object.keys(schema);
  if (inputKeys.length !== schemaKeys.length || inputKeys.some((key) => !schemaKeys.includes(key))) return null;

  const payload = { pathname: safePathname(context.pathname) };
  for (const key of schemaKeys) {
    if (!validField(input[key], schema[key])) return null;
    payload[key] = input[key];
  }
  Object.assign(payload, context.attribution);
  if (eventName === "page_view" && context.referrerDomain) {
    payload.referrer_domain = context.referrerDomain;
  }
  return payload;
}

function createAnalytics({
  enabled = false,
  provider,
  storage,
  location = {},
  referrer = "",
  attributionAllowlist = {},
} = {}) {
  const attribution = enabled
    ? resolveSessionAttribution(location.search || "", storage, attributionAllowlist)
    : {};
  const context = {
    pathname: safePathname(location.pathname || "/"),
    attribution,
    referrerDomain: safeReferrerDomain(referrer),
  };

  return Object.freeze({
    attribution: Object.freeze({ ...attribution }),
    track(eventName, payload = {}) {
      const safePayload = buildEventPayload(eventName, payload, context);
      if (!safePayload || !enabled || !provider || typeof provider.track !== "function") return false;
      try {
        const result = provider.track(eventName, safePayload);
        if (result && typeof result.catch === "function") result.catch(() => {});
        return true;
      } catch {
        return false;
      }
    },
  });
}

function validGa4Config(config) {
  return Boolean(
    config
    && config.enabled === true
    && config.provider === "ga4"
    && /^G-[A-Z0-9]{6,20}$/.test(config.measurementId),
  );
}

function canonicalPageLocation(pathname) {
  const url = new URL("https://brena.cl");
  url.pathname = safePathname(pathname);
  return url.toString();
}

function createGa4Provider({
  config,
  windowObject,
  documentObject,
  now = () => new Date(),
  analyticsConsentGranted = false,
} = {}) {
  if (!validGa4Config(config) || analyticsConsentGranted !== true || !windowObject || !documentObject) return null;
  try {
    const script = documentObject.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;

    const dataLayer = Array.isArray(windowObject.dataLayer) ? windowObject.dataLayer : [];
    windowObject.dataLayer = dataLayer;
    const gtag = (...args) => dataLayer.push(args);
    gtag("set", {
      page_location: canonicalPageLocation(windowObject.location?.pathname || "/"),
      page_referrer: "",
    });
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    gtag("js", now());
    gtag("config", config.measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ignore_referrer: true,
      page_location: canonicalPageLocation(windowObject.location?.pathname || "/"),
    });
    documentObject.head.appendChild(script);

    return Object.freeze({
      track(eventName, payload) {
        gtag("event", eventName, payload);
      },
    });
  } catch {
    return null;
  }
}

function bootstrapBrowserAnalytics({ windowObject, documentObject } = {}) {
  const browserWindow = windowObject || (typeof window !== "undefined" ? window : undefined);
  const browserDocument = documentObject || (typeof document !== "undefined" ? document : undefined);
  if (!browserWindow || !browserDocument) return null;
  const config = browserWindow.__BRENA_ANALYTICS_CONFIG__ || {};
  const analyticsConsentGranted = browserWindow.__BRENA_ANALYTICS_CONSENT_GRANTED__ === true;
  const provider = createGa4Provider({
    config,
    windowObject: browserWindow,
    documentObject: browserDocument,
    analyticsConsentGranted,
  });
  let storage;
  try { storage = browserWindow.sessionStorage; } catch { storage = undefined; }
  const analytics = createAnalytics({
    enabled: validGa4Config(config) && Boolean(provider),
    provider,
    storage,
    location: browserWindow.location,
    referrer: browserDocument.referrer,
    attributionAllowlist: config.attributionAllowlist,
  });
  browserWindow.brenaAnalytics = analytics;
  return analytics;
}

const api = {
  ATTRIBUTION_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  EVENT_SCHEMAS,
  bootstrapBrowserAnalytics,
  collectSafeAttribution,
  createAnalytics,
  createGa4Provider,
  resolveSessionAttribution,
  safeReferrerDomain,
  sanitizeCampaignValue,
};

if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") {
  window.BrenaAnalytics = Object.freeze(api);
  bootstrapBrowserAnalytics();
}

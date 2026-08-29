"use strict";

const BASE_DIRECTIVES = [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["connect-src", "'self'"],
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  ["script-src", "'self'"],
  "style-src 'self'",
  "upgrade-insecure-requests",
];

function contentSecurityPolicy(analyticsConfig = {}) {
  const ga4Enabled = analyticsConfig.enabled === true
    && analyticsConfig.provider === "ga4";
  return BASE_DIRECTIVES.map((directive) => {
    if (!Array.isArray(directive)) return directive;
    const [name, value] = directive;
    if (name === "script-src" && ga4Enabled) {
      return `${name} ${value} https://www.googletagmanager.com`;
    }
    if (name === "connect-src" && ga4Enabled) {
      return `${name} ${value} https://www.google-analytics.com https://region1.google-analytics.com`;
    }
    return `${name} ${value}`;
  }).join("; ");
}

const CONTENT_SECURITY_POLICY = contentSecurityPolicy();

const HSTS = "max-age=15552000";

const BASE_SECURITY_HEADERS = Object.freeze({
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
});

function securityHeaders({ secure = false, analyticsConfig } = {}) {
  const headers = {
    ...BASE_SECURITY_HEADERS,
    "content-security-policy": contentSecurityPolicy(analyticsConfig),
  };
  return secure ? { ...headers, "strict-transport-security": HSTS } : headers;
}

module.exports = {
  CONTENT_SECURITY_POLICY,
  HSTS,
  contentSecurityPolicy,
  securityHeaders,
};

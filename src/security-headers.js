"use strict";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const HSTS = "max-age=15552000";

const BASE_SECURITY_HEADERS = Object.freeze({
  "content-security-policy": CONTENT_SECURITY_POLICY,
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
});

function securityHeaders({ secure = false } = {}) {
  return secure
    ? { ...BASE_SECURITY_HEADERS, "strict-transport-security": HSTS }
    : { ...BASE_SECURITY_HEADERS };
}

module.exports = { CONTENT_SECURITY_POLICY, HSTS, securityHeaders };

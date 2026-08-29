# BRENA-WEB-SEO-003 Measurement and Conversions Implementation Plan

> **For Codex:** Execute each task through strict RED → GREEN → regression. Review the diff after every task and keep commits logically scoped.

**Goal:** Add privacy-safe acquisition and conversion measurement with a central analytics API and an optional, disabled-by-default GA4 adapter.

**Architecture:** A browser-safe CommonJS-compatible analytics module owns event schemas, sanitization, session attribution and provider isolation. Runtime server configuration exposes only validated public analytics settings and derives a conditional CSP. Existing page/form code emits semantic events through the central API; conversion is recorded only after an unequivocal backend-created response.

**Tech Stack:** Node.js `node:test`, vanilla browser JavaScript, Node HTTP server, Cloudflare Worker unchanged.

---

### Task 1: Runtime configuration and conditional CSP

**Files:**
- Create: `src/analytics-config.js`
- Modify: `src/config.js`
- Modify: `src/app.js`
- Modify: `src/server.js`
- Modify: `src/security-headers.js`
- Test: `test/analytics-config.test.js`
- Test: `test/server.test.js`
- Test: `test/seo-http-contract.test.js`

- [ ] RED: prove missing, partial and invalid configuration disables analytics safely.
- [ ] RED: prove disabled mode serves same-origin public configuration and unchanged restrictive CSP.
- [ ] RED: prove a valid explicitly enabled GA4 configuration exposes only the public ID and minimally extends CSP.
- [ ] GREEN: implement validated runtime configuration, config endpoint and conditional header derivation.
- [ ] Run focused tests, full regression and inspect diff.

### Task 2: Central analytics contracts and safe attribution

**Files:**
- Create: `frontend/public/analytics.js`
- Create: `test/analytics.test.js`

- [ ] RED: prove disabled tracking is a no-op and provider failures do not escape.
- [ ] RED: prove all six event schemas accept only their approved payloads and reject unknown keys.
- [ ] RED: prove direct PII keys and unsafe values cannot reach the provider.
- [ ] RED: prove only five sanitized UTM values survive and last-touch persists only for the session.
- [ ] RED: prove malformed/contaminated storage is discarded.
- [ ] RED: prove referrer becomes only a safe hostname.
- [ ] GREEN: implement schemas, sanitizers, session attribution and provider-independent `track`.
- [ ] Run focused tests, full regression and inspect diff.

### Task 3: Disabled-by-default GA4 adapter

**Files:**
- Modify: `frontend/public/analytics.js`
- Test: `test/analytics.test.js`

- [ ] RED: prove disabled/invalid config never creates `dataLayer`, loads scripts or emits traffic.
- [ ] RED: prove enabled adapter queues configuration with `send_page_view:false` and loads only the exact GA4 script.
- [ ] RED: prove events are forwarded without extra fields and exceptions are contained.
- [ ] GREEN: implement the adapter and browser bootstrap.
- [ ] Run focused tests, full regression and inspect diff.

### Task 4: Page views and CTA measurement

**Files:**
- Modify: `frontend/public/index.html`
- Modify: `frontend/public/scripts.js`
- Test: `test/frontend-behavior.test.js`
- Test: `test/server.test.js`

- [ ] RED: prove one landing `page_view` uses pathname, page type, safe attribution and referrer hostname.
- [ ] RED: prove marked CTAs emit stable identifiers/location and no DOM text or PII.
- [ ] GREEN: load runtime config/analytics scripts in order and add declarative CTA identifiers/listeners.
- [ ] Run focused tests, full regression and inspect diff.

### Task 5: Form funnel and confirmed conversion

**Files:**
- Modify: `frontend/public/scripts.js`
- Test: `test/frontend-behavior.test.js`

- [ ] RED: prove `form_start` fires once on real interaction, not page load.
- [ ] RED: prove local validation emits validation error and no submit attempt.
- [ ] RED: prove valid submission emits attempt immediately before the request.
- [ ] RED: prove only 2xx plus explicit backend-created confirmation emits `generate_lead` without `submissionId`.
- [ ] RED: prove honeypot-style 2xx, 4xx, 5xx and network failure never emit conversion.
- [ ] GREEN: extract/test submission dataflow and wire it into the existing form without changing UI behavior.
- [ ] Run focused tests, full regression and inspect diff.

### Task 6: HTTP contracts and implementation documentation

**Files:**
- Modify: `test/seo-http-contract.test.js`
- Create: `docs/seo/implementation/2026-08-29-brena-web-seo-003-measurement-conversions.md`

- [ ] RED: prove actual HTTP delivery of config/scripts, disabled CSP and unchanged form/assets contracts.
- [ ] GREEN: make only the minimum integration corrections needed.
- [ ] Document architecture, provider, event payloads, last-touch, privacy, config, Search Console, CSP, tests and manual actions.
- [ ] Run `npm test`, `npm audit --audit-level=low`, inspect complete diff and status.

### Task 7: Independent review and closure

- [ ] Commit the completed implementation in coherent logical commits.
- [ ] Request independent review of the complete base-to-HEAD range for privacy leaks, duplicate counting, premature conversion, unsafe UTM/storage/referrer handling, provider failures, CSP, hardcoded IDs and unrealistic tests.
- [ ] For each valid finding, reproduce with RED, implement minimally, confirm GREEN and rerun regression.
- [ ] Run final `npm test`, `npm audit --audit-level=low`, `git diff`/range review and `git status`.
- [ ] Confirm no push, deploy, BRENA-V2 or SEO-004 changes.

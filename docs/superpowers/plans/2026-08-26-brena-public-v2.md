# Brena Public Web V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete public Brena acquisition site with a secure, configurable BrenaV2 lead handoff and production deployment artifacts.

**Architecture:** A zero-runtime-dependency Node HTTP server serves a static responsive landing page and accepts validated lead submissions. Pure modules own validation, attribution, rate limiting, and the BrenaV2 transport so each boundary can be tested independently.

**Tech Stack:** Node.js 20+, HTML5, CSS, vanilla JavaScript, Node test runner, Docker.

**Spec:** `docs/superpowers/specs/2026-08-26-brena-public-v2-design.md`

## Global Constraints

- Preserve the existing Brena logo and the original ZIP outside the checkout.
- Do not guarantee purchase, price, deadlines, legal outcomes, or avoidance of DICOM.
- A public submission creates a lead; do not invent a separate Project entity.
- Collect no RUT, financial amount, document, or sensitive legal detail in the first form.
- Production must fail closed when the BrenaV2 endpoint is absent.
- Do not load remote fonts, trackers, or third-party scripts.
- All user-facing copy is Chilean Spanish.

---

### Task 1: Lead contract and validation

**Files:**
- Create: `test/lead-contract.test.js`
- Create: `src/lead-contract.js`

**Interfaces:**
- Produces: `validateLeadSubmission(input) -> { ok, data?, errors? }`
- Produces: `toBrenaLead(validated, requestMeta) -> Brena public intake payload`

- [ ] Write tests with literal valid/invalid cases for trimming, required contact, email, phone, enumerations, consent, honeypot, and attribution allowlisting.
- [ ] Run `node --test test/lead-contract.test.js` and confirm failure because the module is absent.
- [ ] Implement the smallest pure validation and mapping module that passes those cases.
- [ ] Re-run the focused test and confirm success.

### Task 2: BrenaV2 transport and abuse controls

**Files:**
- Create: `test/brena-client.test.js`
- Create: `test/rate-limiter.test.js`
- Create: `src/brena-client.js`
- Create: `src/rate-limiter.js`

**Interfaces:**
- Produces: `createBrenaClient(config).submit(payload) -> { id, accepted }`
- Produces: `createRateLimiter({ windowMs, max }).consume(key, now) -> { allowed, retryAfter }`

- [ ] Write focused failing tests against a real local HTTP upstream and deterministic timestamps.
- [ ] Confirm failures caused by missing modules.
- [ ] Implement timeout-safe upstream submission, redacted errors, preview mode, and bounded rate limiting.
- [ ] Re-run focused tests and confirm success.

### Task 3: Public HTTP server

**Files:**
- Create: `test/server.test.js`
- Replace: `src/app.js`
- Create: `src/server.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: validation, mapping, BrenaV2 client, and rate limiter modules.
- Produces: `createServer(options)` plus executable `src/app.js`.

- [ ] Write failing integration tests for healthcheck, static assets, SPA root, security headers, valid lead, invalid lead, honeypot, unsupported media, payload limit, and rate limit.
- [ ] Confirm the tests fail against the current Koa server.
- [ ] Implement the built-in Node server, strict routing, safe file resolution, and consistent JSON errors.
- [ ] Run all server tests and confirm success.

### Task 4: Public experience

**Files:**
- Replace: `frontend/public/index.html`
- Replace: `frontend/public/styles.css`
- Replace: `frontend/public/scripts.js`
- Create: `frontend/public/favicon.svg`
- Create: `frontend/public/social-card.svg`

**Interfaces:**
- Consumes: `POST /api/leads` with the public lead schema.
- Produces: accessible one-page journey and progressive form.

- [ ] Add browser-contract assertions to `test/server.test.js` for required landmarks, metadata, form fields, and local assets; confirm they fail against the old page.
- [ ] Implement semantic content, responsive layout, accessible FAQ, form progression, client validation, attribution capture, error recovery, and success state.
- [ ] Run all automated tests.

### Task 5: Production packaging and operational documentation

**Files:**
- Replace: `.env.template`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Replace: `README.md`
- Create: `docs/BRENA_V2_INTEGRATION.md`
- Create: `scripts/check-production-config.js`
- Create: `test/production-config.test.js`

**Interfaces:**
- Produces: deployable container, explicit environment contract, and a failing-fast production check.

- [ ] Write a failing test proving production refuses preview mode or a missing BrenaV2 URL.
- [ ] Implement the configuration check and package scripts.
- [ ] Add Docker and integration documentation with exact commands and payload/response shapes.
- [ ] Run `npm test` and `npm run check:production` with safe dummy production values.

### Task 6: Browser and delivery verification

**Files:**
- Modify only when a verified defect requires a TDD fix.

**Interfaces:**
- Consumes the complete running application.
- Produces desktop/mobile evidence and a user-facing localhost delivery.

- [ ] Start the real Node server on port 3011 and verify `/healthcheck` plus static assets.
- [ ] Review desktop and mobile screenshots, DOM, overflow, console errors, navigation, FAQ, and form validation.
- [ ] Exercise a valid submission in preview mode without persisting personal data.
- [ ] Run fresh `npm test`, production configuration check, and HTTP smoke checks.
- [ ] Leave the verified localhost tab open for the user.

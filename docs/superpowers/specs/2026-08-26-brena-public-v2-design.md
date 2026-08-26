# Brena Public Web V2 — Design Specification

## Objective

Replace the current brochure page with a production-ready public acquisition site for Brena. The site must retain the brand's visual restraint while becoming clearer, more trustworthy, accessible, measurable, and safely connected to BrenaV2's lead workflow.

## Audience and positioning

The primary audience is a Chilean property owner facing one or more difficult conditions: mortgage arrears, accumulated property expenses, an empty property, inheritance or co-ownership friction, lack of liquidity, or a need to sell quickly. The site must communicate calm competence instead of urgency pressure.

The core promise is: “Tu propiedad puede volver a ser una solución.” Brena will review the situation and explain whether it can help. The site must not guarantee a purchase, a price, a deadline, a financial outcome, or avoidance of DICOM or legal collection.

## Experience

The page is a single, responsive journey:

1. A minimal header with the existing Brena identity and one primary call to action.
2. A high-impact hero with an original property image, a direct value proposition, and trust signals.
3. A situation selector that helps visitors recognize themselves without stigmatizing language.
4. A three-step explanation of Brena's process.
5. A concise explanation of what Brena evaluates and what the first conversation entails.
6. An FAQ covering property condition, mortgages/debts, timing, documents, and obligation.
7. A short progressive lead form with clear validation, consent, and success/error states.
8. A privacy notice and restrained footer.

The design uses warm ivory, ink black, muted clay, and restrained green accents. Typography is system-hosted to remove third-party font dependencies. Motion is subtle and disabled by `prefers-reduced-motion`. The existing logo remains the brand source of truth.

## Lead data contract

The public form collects only what is needed for triage:

- `name`
- `phone`
- `email` (optional if phone is present)
- `region`
- `commune`
- `propertyType`
- `situation`
- `urgency`
- `message` (optional)
- `consent`
- `website` honeypot (must remain empty)
- browser-captured `pageUrl`, `referrer`, and allowlisted UTM values

The public server validates and maps the form to a BrenaV2-oriented payload. A submission represents a new lead; it does not create a separate Project entity. The adapter posts to `BRENA_V2_LEADS_URL` with an optional server-side bearer token. In preview mode, the API validates and acknowledges without persisting personal data. Production startup fails closed unless the BrenaV2 endpoint is configured.

## Security and privacy

- Accept JSON only and reject bodies larger than 16 KiB.
- Validate types, lengths, enumerations, email, and Chilean phone shapes server-side.
- Reject honeypot submissions with a generic accepted response.
- Apply an in-memory per-IP rate limit and return `429` with `Retry-After`.
- Use a bounded upstream timeout; never expose upstream bodies or credentials to clients.
- Set CSP, frame protection, referrer policy, permissions policy, nosniff, and no-store on API responses.
- Do not load trackers, remote fonts, or third-party scripts by default.
- State the purpose of collection and require explicit consent.

## Runtime and deployment

Use Node.js 20+ and only built-in modules. The server serves versioned static assets, exposes `GET /healthcheck`, and handles `POST /api/leads`. It supports `PORT`, `HOST`, `NODE_ENV`, `BRENA_LEAD_MODE`, `BRENA_V2_LEADS_URL`, `BRENA_V2_API_TOKEN`, `BRENA_V2_TIMEOUT_MS`, and `TRUST_PROXY`.

Provide an unprivileged Docker image, `.env.template`, and deployment/integration documentation. Local preview runs on port 3011 because port 3000 is already in use in the workspace.

## Verification

- Node unit tests for normalization, validation, mapping, attribution, rate limiting, and upstream behavior.
- HTTP integration tests for static delivery, healthcheck, security headers, valid submission, invalid submission, oversized payload, honeypot, and rate limiting.
- Browser review at desktop and mobile widths, including navigation, FAQ, form progression, validation, success, focus behavior, overflow, asset loading, and console errors.
- Fresh `npm test`, production configuration check, and HTTP smoke test before completion.

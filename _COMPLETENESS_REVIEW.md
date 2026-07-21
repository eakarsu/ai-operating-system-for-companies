# Completeness Review: ai-operating-system-for-companies

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 115 project files (99 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished application workflow application, not just an empty scaffold. Inspection found 99 source files across `frontend/`, `backend/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Define the primary user and acceptance criteria, then complete one end-to-end workflow against persistent data instead of demo fixtures.
2. Replace mocks, placeholders, and generic AI responses with validated domain services and explicit failure/retry behavior.
3. Implement secure identity, role/tenant boundaries, input validation, secrets handling, and auditable state changes.
4. Add representative automated tests, CI quality gates, environment documentation, migrations, observability, backup, and deployment configuration.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.

## Evidence inspected

- `backend/middleware/auth.js:6`
- `frontend/src/App.tsx:26`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Choose one real application workflow journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

The primary journey is now explicitly an operations requester submitting cross-company work for independent review, typed connector delivery, and evidence-based completion. It is implemented in persistent source at `/api/governed-workflows` and in the production Workflows UI; generated/sample/gap and ungrounded AI surfaces are development-only, absent from production navigation, and cannot be enabled in production.

1. **Primary user and durable acceptance:** Added tenant-scoped workflow records with requester ownership, unique acceptance criteria, immutable event history, optimistic versions, idempotent intake, independent approval, connector delivery state, result/evidence/receipt persistence, list/detail APIs, health metrics, and a real requester/reviewer/operator UI. Completion requires every declared criterion to have explicit true evidence.
2. **Validated domain services and failure:** Replaced generic connector execution with allowlisted schemas for CRM account/opportunity, accounting invoice, ticket creation, calendar event, templated notification, and warehouse record operations. Unknown operations/fields, invalid types/times/currencies, secrets, oversized payloads, changed digests, malformed receipts, and incomplete evidence fail closed. Connector delivery uses recoverable leases, bounded backoff, dead letters, retryable versus permanent failures, and explicit `delivery_failed` recovery.
3. **Identity, boundaries, and audit:** Added tenant identities and least-privileged requester/reviewer/operator/admin roles, strict JWT algorithm/issuer/audience/expiry verification, owner-scoped reads, independent-approval enforcement, tenant-scoped queries, 256 KiB input limits, production CORS requirements, secret-managed connector configuration, HMAC callback verification, event-ID/payload binding, and append-only audit events.
4. **Operations and delivery controls:** Added additive/idempotent migrations, typed authenticated connector workers, queue/error/dead-letter observability, migration-aware health, explicit environment documentation, a nondestructive launcher, and a runbook covering monitoring, worker pause/reconciliation, secret rotation, backups, point-in-time recovery, compatible rollback, and incident handling.
5. **Risk-based verification:** Added unit, contract, migration, and full HTTP/Postgres tests covering typed validation, payload injection/secret rejection, role and tenant denial, self-approval denial, idempotency conflict, versioned transitions, connector claim/digest/receipt validation, signed callback replay/tampering, complete acceptance evidence, permanent delivery failure, dead-letter health, migration idempotence, and destructive-startup regression.

Verification completed: 15/15 tests passed against a disposable real PostgreSQL database; the additive migration passed on a fresh database and a second idempotence run; backend/worker syntax checks and the TypeScript/Vite production build passed; backend and frontend production dependency audits reported zero vulnerabilities. The disposable database was removed. Git history contains no tracked `.env` revision, and current environment files are ignored; their weak local values are rejected by strict startup/auth and must be replaced and rotated if ever shared.

External release gates remain: production SSO/identity provisioning, live connector endpoints/credentials and certification, representative requester/reviewer/operator acceptance, privacy/security/retention approval, monitoring destinations, capacity/load validation, deployed infrastructure, and a witnessed backup restoration exercise.

**Ledger readiness:** Ready to ledger as source-complete for all five reviewed requirements, with only explicitly external identity, connector, governance, infrastructure, and production-validation inputs outstanding.

## Runtime verification (2026-07-20)

`start.sh start` was verified on the exclusively assigned disposable configuration: PostgreSQL `127.0.0.1:55624`, API `127.0.0.1:6062`, and reserved UI port `6063`. The only attempt, at `2026-07-20T20:12:55Z`, recorded `API_VERIFIED/startup_login_session_api`. An acknowledgment-gated provisioning command created the runtime administrator in `company_identities` using the externally supplied password; login returned a signed JWT and authenticated `GET /api/auth/me` reloaded the active tenant identity from PostgreSQL. The launcher now supplies only test-scoped issuer/audience labels, binds the assigned host/port, performs no migration or seed, and embeds no credential.

The maintained suite passed 15/15 with the full PostgreSQL workflow integration enabled on port 55624 and its HTTP listener constrained to port 6062. The frontend production build passed (1,403 modules). Shell/JavaScript syntax and `git diff --check` passed, and all three assigned ports were released.

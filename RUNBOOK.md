# Governed CompanyOS workflow runbook

The primary user is an operations requester handing typed cross-company work to an independent reviewer and a connector operator. Acceptance means a tenant-scoped request with explicit criteria is validated against a connector-specific contract, approved by someone other than its owner, dispatched once with an idempotency key, and completed only when a signed connector callback supplies a stable receipt, a valid result object, and evidence satisfying every criterion. The authoritative API is `/api/governed-workflows`; generated/sample/gap and generic AI features are development-only and cannot be enabled in production.

## Deploy and operate

Install locked dependencies explicitly and replace every `.env.example` placeholder through the deployment secret manager. Provision identities in `company_identities` with bcrypt hashes and the least-privileged requester, reviewer, operator, or administrator role. Production does not fall back to the legacy user table. Run `./start.sh check`, take and verify a PostgreSQL backup, then apply the additive migration with `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`; rerun it to prove idempotence. `./start.sh start` launches only the backend and never installs, seeds, migrates, creates a database, edits configuration, or terminates unrelated processes.

Run a supervised `npm run connector:run` worker for each `CONNECTOR_WORKER_NAME`: `crm`, `accounting`, `ticketing`, `calendar`, `messaging`, or `data_warehouse`. Each endpoint accepts authenticated `/v1/operations` requests containing only its allowlisted operation schema. Workers validate payload digests and receipts, use bounded retry/recoverable leases, and wait for HMAC-signed callbacks. Never replay a dead letter until the remote system has been reconciled by idempotency key.

Alert on `/healthz`, queue age, expired leases, retry/dead-letter counts, connector error rate, signature and event-ID conflicts, authorization denials, optimistic-version conflicts, and acceptance-evidence failures. Pause workers during incidents while preserving the append-only event log. Rotate connector tokens separately from webhook secrets and JWT keys.

Back up before releases and rehearse restore plus point-in-time recovery. Application rollback is allowed only while compatible with the applied schema. For a data rollback, stop workers and API traffic, reconcile remote connector side effects, restore into a new database, verify event/outbox/receipt counts, and switch traffic only after health and a read-only workflow audit pass. Do not run the destructive legacy schema/seed scripts in retained environments.

External gates remain: production SSO/identity provisioning, connector credentials and vendor certification, privacy/security and retention approval, representative requester/reviewer/operator acceptance, capacity/load testing, monitoring destinations, infrastructure deployment, and a witnessed backup restoration exercise.

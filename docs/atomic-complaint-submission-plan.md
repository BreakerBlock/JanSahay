# P0: Make complaint submission atomic (implementation task)

Status: design and acceptance criteria only. No production behavior, schema, or data change.

## Verified source finding (2026-11-18)

In `app/api/complaints/route.ts`, the handler inserts into `complaints`, then inserts two `complaint_events`, then loops through attachments and inserts into `attachments` and additional events. These are separate awaited `sql` calls without a transaction. A later failure can leave a complaint with missing audit events or partially linked evidence while the API returns an error. This is a **code-level failure mode**, not evidence of an incident in production.

Related P0 issue: the endpoint accepts caller-supplied attachment URLs containing `blob.vercel-storage.com` without establishing upload ownership. Fix this separately or jointly before enabling evidence linking; a transaction alone does not establish trust.

## Public-sector design reference

DARPG's *CPGRAMS Annual Report 2024*, including the *Comprehensive Guidelines for Handling Public Grievances, 2024*, describes role-based grievance handling, categorization, and accountable redressal workflows. https://www.darpg.gov.in/static/uploads/2025/10/3ee7b2dd922624371c82df2c1d91e2a5.pdf

DARPG's *Grievance Redressal Assessment and Index 2023* describes unique registration numbers, status tracking, and action-taken reports. https://darpg.gov.in/sites/default/files/GRAI_2023.pdf

These are public-sector design references, **not** a JanSahay integration or a claim that CPGRAMS mandates a particular SQL transaction implementation.

## Proposed scoped implementation

1. Separate pure request validation from database writes; reject invalid attachments and excessive attachment counts **before** creating a complaint. Define a strict maximum count and allowed MIME/size limits aligned with the upload endpoint.
2. Add a single server-side transactional submission operation for the complaint, initial events, verified attachment records, and evidence events. Use a Neon-supported transaction API compatible with the project's `@neondatabase/serverless` version, or a transaction-capable connection, and verify its actual behavior in a disposable database. Do not assume separate HTTP `neon()` calls share a transaction.
3. Preserve the existing response contract and provisional routing semantics; do not change routing or public disclosure as part of this task.
4. Verify every attachment against an authorized, server-recorded upload session and store identity; do not trust URL substring matching. Coordinate this with the attachment-authorization plan before implementation.
5. Distinguish validation errors (4xx) from database failures (5xx); never log access tokens, reporter contact details, or private Blob URLs.
6. Consider an idempotency key or server-side deduplication for retry-after-timeout; design it before changing the database schema.

## Acceptance tests (isolated database only)

- Valid submission commits exactly one complaint, two initial events, and the expected verified attachment/evidence events.
- Inject a failure after complaint insertion: zero complaint/event/attachment rows persist.
- Inject a failure after the first attachment: zero rows persist.
- Invalid attachment ownership and malformed payloads: reject before any write.
- Duplicate retry behavior is specified and tested; do not assume exactly-once semantics.
- Concurrent submissions cannot share a public complaint ID; uniqueness constraints and collision retry behavior are tested.
- No private evidence URL or reporter token appears in public API/log output.
- Run `npm install`, `npx tsc --noEmit`, targeted integration tests, and `npm run build` before considering release. Record actual results.

## Release gate

This task affects citizen privacy and database write behavior. Implement only on a scoped branch; keep the PR draft. **Do not merge, deploy, migrate, or touch production records without explicit approval and a verified rollback plan.**

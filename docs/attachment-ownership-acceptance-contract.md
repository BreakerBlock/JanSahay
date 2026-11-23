# Attachment ownership gate: implementation contract (review only)

## Evidence and boundary

As reviewed on 2026-11-24, `app/api/blob/upload/route.ts` parses untrusted `clientPayload` and checks only that `submissionId` is present and `pathname` begins with `complaints/`. It does not authenticate a reporter or verify that the identifier belongs to that reporter. `app/api/complaints/route.ts` trusts a client-supplied Blob URL if it contains `blob.vercel-storage.com`; it does not verify upload completion, store identity or ownership. The standalone `lib/blob-url.ts` validator in this PR is **not used by either route**, and passing its structural checks is not authorization.

DARPG's 2024 Comprehensive Guidelines for Handling Public Grievances (https://pgportal.gov.in/Home/Preview/Q29tcHJlaGVuc2l2ZUd1aWRlbGluZXNGb3JIYW5kbGluZ1RoZVB1YmxpY0dyaWV2YW5jZXMucGRm), section 7.2, describe requesting additional documentation from a citizen, and section 7.4 addresses relied-upon documents. This is product context, **not** a technical security standard.

## Proposed design (requires security and privacy approval)

1. Define a server-side upload intent bound to an authenticated reporter or unguessable, server-verified pre-submission capability; include an expiry, expected pathname prefix, max file size and allowed MIME types. Never accept `submissionId` alone as proof of authority.
2. In `onBeforeGenerateToken`, verify the capability server-side and derive the storage prefix from the verified intent. Reject mismatched or expired capabilities before issuing a Blob client token.
3. At complaint creation, look up uploaded objects server-side in the configured Blob store; match the authorized intent, exact object identity, owner and expiry. Do not trust client-provided URL, size, filename or MIME metadata.
4. Make evidence consumption single-use and complaint attachment writes atomic with complaint and event creation; define safe retry/idempotency behavior. Expired/unclaimed uploads require a cleanup policy.
5. Do not expose raw private Blob URLs through public complaint views, logs or error messages. Confirm authorization for any download endpoint separately.

## Negative acceptance tests (isolated test store and database)

- Missing, forged, expired or reused upload capability is rejected; no upload token issued.
- A capability issued for reporter A cannot be used by reporter B or attached to B's complaint.
- A syntactically valid URL from a different Blob store, or a public Blob URL, is rejected if the configured store is private.
- URL host spoofing, encoded separators, path traversal and metadata mismatches are rejected.
- An uploaded object not confirmed by the server cannot be linked to a complaint.
- Inject a failure after complaint insert and after attachment insert: neither leaves a partial complaint/event/evidence record.
- Retrying the same submission does not create duplicate complaints or evidence records.
- Anonymous public views and API errors never reveal private evidence URLs or reporter capabilities.

## Release gate

This document is a specification, not an implemented fix. Before merge: execute negative tests against isolated infrastructure; run TypeScript, full build and CI; review capability storage, Blob provider semantics, transaction support and cleanup behavior. **Do not merge or deploy changes affecting authentication, privacy, complaint routing or database writes without explicit approval.**

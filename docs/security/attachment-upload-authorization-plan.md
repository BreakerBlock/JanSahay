# Attachment upload authorization: implementation plan (2026-11-14)

**Status:** review-only; no production behavior change. **Priority:** P0 security/privacy.

## Observed code behavior
- `app/api/blob/upload/route.ts` accepts `clientPayload` JSON and checks only that `submissionId` is truthy and the pathname begins `complaints/`.
- No authenticated reporter identity, complaint ownership, or one-time upload authorization is verified before `handleUpload` generates a Blob upload token.
- `onUploadCompleted` is a no-op.
- `app/api/complaints/route.ts` accepts attachment metadata from the request body and tests `url.includes('blob.vercel-storage.com')`, which is not proof of ownership, existence, or an authorized upload.

**Risk:** callers may be able to request upload tokens without proving they control a complaint, and submit unverified evidence references. The precise exploitability requires integration testing; this is a code-review finding, not a demonstrated exploit.

## Proposed implementation (requires explicit review before merge)
1. Define a server-issued, short-lived, single-use upload intent bound to a specific reporter session or a pre-complaint draft. Do not trust a client-supplied `submissionId` as authorization. Choose a draft workflow that preserves uploads before final complaint creation.
2. Generate a random unguessable intent ID, store only its hash with expiry, reporter/draft binding, and a bounded file count. Use server-side rate limits and abuse controls.
3. In `onBeforeGenerateToken`, validate the intent, allowed pathname prefix bound to the intent, file type, max size, and per-intent upload limit. Deny missing, expired, reused, or mismatched intents.
4. In `onUploadCompleted`, verify the callback's expected store/path and persist verified Blob metadata to a pending-attachment record associated with the intent; handle callback retries idempotently.
5. At complaint creation, attach only server-verified pending records belonging to the same intent and bind them atomically to the complaint. Never accept arbitrary client-provided Blob URLs as authoritative.
6. Define retention/cleanup for abandoned drafts and orphaned objects, with privacy-preserving logs. Avoid exposing private Blob URLs or tokens in public complaint responses.
7. Roll out with feature flag, monitoring, and a documented rollback. Do not alter existing citizen evidence without an explicit migration plan.

## Acceptance tests (not yet executed)
- Reject missing, malformed, expired, reused, and forged intents.
- Reject a valid intent used for another draft/reporter, unexpected pathname, unsupported MIME type, or file larger than 10 MiB.
- Accept authorized JPEG/PNG/WebP uploads up to 10 MiB; assert server-recorded metadata matches the uploaded object.
- Ensure duplicate completion callbacks create at most one pending attachment.
- Ensure complaint creation rejects foreign/unverified Blob URLs and does not create partial complaint/event/attachment state on failure.
- Verify abandoned uploads expire and cleanup does not remove evidence associated with submitted complaints.
- Verify logs, public feeds, and exports do not disclose private evidence URLs or access credentials.

## Public-sector design reference
The Government of India's CPGRAMS portal documents unique grievance registration IDs, status tracking, and a citizen appeal path after unsatisfactory resolution. Its 2024 grievance-handling guidelines emphasize action-taken documentation and supporting documents. These support an auditable evidence lifecycle, but do **not** imply JanSahay is integrated with or officially endorsed by CPGRAMS.

- https://pgportal.gov.in/V7/Home
- https://pgportal.gov.in/Home/Preview/Q29tcHJlaGVuc2l2ZUd1aWRlbGluZXNGb3JIYW5kbGluZ1RoZVB1YmxpY0dyaWV2YW5jZXMucGRm

## Release gate
No merge, deployment, schema change, or production data modification is authorized by this document. Implement on a separate branch with tests; obtain explicit approval before merging any authentication, privacy, or data-handling changes.

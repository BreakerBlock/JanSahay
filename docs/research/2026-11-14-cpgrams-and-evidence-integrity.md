# Research note: grievance tracking, feedback and appeals (2026-11-14)

**Status:** Proposal only — no runtime changes, government integration, routing or schema change authorized.

## Verified government reference

The Government of India's CPGRAMS portal describes a unique grievance registration ID for tracking, post-resolution citizen feedback, and an appeal facility when the citizen is dissatisfied. The portal states that grievances sent by email are not entertained; citizens should lodge them on the official portal. CPGRAMS is a government-operated service, **not** an integration JanSahay can claim merely by linking to it.

Sources (accessed 2026-11-14):
- Official CPGRAMS overview: https://pgportal.gov.in/V7/Home
- Official CPGRAMS FAQ (tracking, feedback, appeal, grievance exclusions): https://pgportal.gov.in/Home/Faq
- DARPG comprehensive grievance-handling guidelines (2024): https://pgportal.gov.in/Home/Preview/Q29tcHJlaGVuc2l2ZUd1aWRlbGluZXNGb3JIYW5kbGluZ1RoZVB1YmxpY0dyaWV2YW5jZXMucGRm

## Observed JanSahay risks

Review of `app/api/complaints/route.ts` and `app/api/blob/upload/route.ts` on `main`:

1. Complaint creation writes the complaint, events, and attachment records in separate SQL calls. A failure after the initial INSERT can leave a partial complaint record.
2. Attachment metadata is accepted when a user-provided URL contains `blob.vercel-storage.com`. This substring check is not evidence that the upload belongs to this complainant or to the configured store.
3. The Blob upload token callback checks for a `submissionId` field but does not authenticate ownership of that submission. A client-provided ID is not sufficient authorization.
4. The project describes provisional routing; do not imply official government acknowledgement or CPGRAMS submission from a JanSahay status.

These are code-review findings, not demonstrated exploits. No production data was inspected for this note.

## Proposed next scoped engineering change (requires review before merge)

**Goal:** Ensure a citizen cannot attach a different person's evidence or leave an incomplete complaint when a write fails.

- Define a server-issued, short-lived upload intent tied to a pending complaint session and expected Blob pathname; never trust an arbitrary client-supplied URL or `submissionId`.
- Verify the completed Blob object's pathname, content type, size, store identity and upload intent server-side before associating it with a complaint.
- Make complaint + initial events + attachment metadata atomic in a single transaction or a well-defined compensating workflow compatible with the Neon driver.
- Add tests for forged Blob URLs, mismatched upload intent, duplicate submissions, interrupted writes, and malformed evidence metadata.
- Preserve private-by-default evidence and do not expose exact citizen coordinates or contact information in public responses.
- Keep JanSahay and CPGRAMS tracking identifiers clearly distinct; never label a JanSahay complaint as officially filed with government without a verified integration.

## Acceptance criteria

- No orphaned complaint/events/attachment rows on simulated transaction failure.
- A mismatched or unverified Blob upload is rejected with no database association.
- Tests cover both successful and denied uploads, with no production credentials or personal data in fixtures.
- A human reviewer approves changes to privacy, auth, complaint handling, or storage before merge/deploy.
- Any future CPGRAMS handoff uses official links and makes clear the user must complete government submission separately unless a formally verified integration exists.

## Deployment decision

**Do not merge this research PR automatically.** It documents the risk and implementation plan only. The follow-on changes require explicit approval because they touch citizen evidence, database writes, and public reporting semantics.

# Current-portal report and replacement scope

## What the earlier static portal demonstrated

The earlier single-page prototype successfully communicated an issue-first approach: a citizen could describe a service failure, add a PIN code and optionally provide a precise location or photo. It also illustrated performance statistics and authority comparisons.

## Why it was not deployable as a public grievance service

- It was a browser-only prototype: submissions had no durable database record, authenticated owner, audit history, or public export.
- Uploaded photos were represented as browser data rather than stored in a private, access-controlled object store.
- It had no distinction between the reporter, an assigned official, and an independent reviewer.
- A claimed fix could not be accepted by the reporter or disputed with a durable public record.
- The concentration display was illustrative and did not enforce geographic privacy thresholds.
- Ministry/leader/MP/MLA/municipality comparison data was demo-only and not backed by an authority, jurisdiction and contact source model.

## Replacement delivered here

The Next.js/Vercel implementation replaces the static portal with a relational database design, private image upload path, complaint event log, dispute record, downloadable public register, and separate citizen and responsible-person portals. It adds the required RTI and official-contact explainers. It keeps real identities, unredacted files and exact reporter locations out of the public log by design.

## Data reporting recommendation

Report performance by the body that can actually act: authority and jurisdiction first, then portfolio/representative area as a clearly labelled accountability lens. Do not imply that a representative personally delivered or blocked an operational action unless a verified event ties that office to it. Publish the source and verification date for every official contact or office assignment.

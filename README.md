# JanSahay — Vercel deployment guide

JanSahay is a Next.js platform for citizen grievances and public-service accountability. It provides:

- complaint filing, PIN- and category-based routing, exact coordinate capture and private photo uploads;
- citizen confirmation of a reported fix or a public dispute of that fix;
- a responsible-person queue for marking work completed;
- citizen, responsible-person, public-log, contacts and RTI explainer pages;
- accountable performance views by ministry, leader/portfolio, MP, MLA and municipality;
- a privacy-safe public CSV export.

## Deploy from GitHub to Vercel

1. Push the contents of this directory to a new GitHub repository.
2. In Vercel, import the repository. It is a Next.js project, so Vercel will configure the build automatically.
3. In **Storage**, install the [Neon Postgres integration](https://vercel.com/marketplace/neon/neon) and connect it to this project. Vercel adds `DATABASE_URL` to the project environment.
4. In **Storage**, create a **private** Vercel Blob store and connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN`.
5. Add a long random `RESPONDER_PORTAL_KEY` in Vercel Project Settings → Environment Variables. This is only for the demo responsible-person portal; do not put it in client code or Git.
6. Pull the configured environment locally and run the schema once:

   ```bash
   npm install
   npx vercel env pull .env.local
   npm run db:migrate
   ```

7. Deploy from the Vercel dashboard or push to your configured production branch.

The schema seed creates common service categories and a small routing example. Import your approved authority directory and PIN-to-authority routing rules before public launch.

## Why Neon + Vercel Blob

Vercel’s current Marketplace provisions a managed Postgres provider such as Neon directly from the Vercel dashboard, including project environment variables. Relational Postgres is the right store for complaints, ownership, public audit events, disputes and performance queries. Images should not go into Postgres: the browser uploads them directly to a **private Vercel Blob** store after a server-authorized token exchange. The database stores only attachment metadata and the private Blob URL/path.

That means images are never included in the public export. A responsible office retrieves them through an authenticated application route to be added during the production authorization phase.

## Database model

This system intentionally uses multiple relational tables. See [`db/schema.sql`](db/schema.sql).

| Table | Purpose |
| --- | --- |
| `complaints` | The current case state, routing, private exact location and service due date. |
| `complaint_events` | Append-only, public/private case timeline and audit history. |
| `disputes` | A separate, reviewable record of a reporter contesting a claimed fix. |
| `attachments` | Private Blob object metadata; no image bytes live in Postgres. |
| `authorities` | Ministries, departments, municipalities and utilities. |
| `representatives` | Ministers, MPs, MLAs and responsible officers, with public office details. |
| `jurisdiction_rules` | PIN-prefix/category-to-authority routing rules. |
| `service_categories` | Taxonomy and default service-level target. |
| `public_contact_publications` | Verified source URL and review date for each published official contact. |

`public_complaint_log` is a database view that excludes private fields by design. The downloadable CSV is generated only from that view.

## Location and concentration privacy model

Exact latitude/longitude is stored privately to route and investigate a case. A separate, rounded ~1 km area cell is used in public aggregate views. Cells with fewer than five reports are suppressed. Do not publish exact coordinates, attachments, identity details, or low-volume cells.

## Before a public launch

This repository is deployable, but authentication is intentionally marked **demo** for the requested prototype. Replace the email-based citizen portal and the environment-key responder portal with government-approved SSO/OIDC, verified official role assignments, rate limiting, CAPTCHA/abuse protection, malware scanning, a redaction workflow, and immutable audit-retention policy. Add a migration runner to the release process and ensure that official contacts and jurisdiction rules are imported only from verified government sources.

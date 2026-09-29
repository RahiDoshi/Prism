# DOGFOOD Portal

[Demo video](https://youtu.be/GHFq7yhqiWE)
Self-hosted hackathon submission and judging portal. Participants form teams and submit
projects; organizers configure events, rubrics, and judges; judges score assigned projects
with weighted criteria and cross-judge normalization. Everything runs offline after images
are built — no cloud APIs, CDNs, or external fonts.

Claimed tiers: **T1** (events, teams, submissions, gallery), **T2** (rubric, judging,
normalization, results, CSV export), **T3** (community voting, comment system, abuse detection), and **T4** (REST API & API Keys, OpenAPI 3.1 & Swagger UI, Bulk Data Import & Export, Verifiable Judge Records & Certificates, Embeddable Gallery Widget, Signed Webhooks with Retries & SSRF defenses).

## One-command start

```bash
docker compose up -d --build --wait
```

Open [http://localhost:8080](http://localhost:8080). On first boot the app runs migrations,
seeds `fixtures.json` plus Demo Open Hack, then serves the API and SPA on port 8080. 
Make sure to run the above command and wait for it to return before running `run.py`.

## Demo accounts

Password for all demo accounts: `dogfood-demo`

| Email | Role |
|---|---|
| `admin@dogfood.local` | Platform ADMIN |
| `organizer@dogfood.local` | Platform ORGANIZER (owns Demo Open Hack + fixture event) |
| Fixture judges 1 & 2 | Event JUDGE on Sample Hack 2026 (`evt_01`) |
| `priya1@example.org` | Fixture participant |
| `voter1@dogfood.local` to `voter5@dogfood.local` | Demo voters (Community Vote Demo event) |

### Demo Bearer tokens (`SEED_DEMO=true`)

```
Authorization: Bearer demo-organizer-token
Authorization: Bearer demo-judge-a-token
Authorization: Bearer demo-judge-b-token
Authorization: Bearer demo-participant-token
```

## Acceptance checker

```bash
python3 run.py .dogfood.toml > acceptance-report.txt
```

(or `python` if that is your interpreter). The official checker exercises **T1 and T2 only**.
The committed `acceptance-report.txt` should show those checks as PASS. T3/T4 may be claimed
in `.dogfood.toml` and implemented in the app, but they are **not** verified by `run.py`.

## Tests

Needs a separate Postgres database. With Docker Compose the DB is also published on host
port **5433** (so it does not collide with a local Postgres on 5432):

```bash
# once
createdb is not needed — Docker already has dogfood_test after:
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -c 'CREATE DATABASE dogfood_test;'
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/dogfood_test \
  npx prisma migrate deploy --schema src/server/prisma/schema.prisma

TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/dogfood_test npm test
```

Vitest defaults `TEST_DATABASE_URL` to that URL when unset. Suites cover unit algorithms and
API permission / deadline / isolation / lifecycle / seed idempotency.

## Features by tier

### T1

- Register / login (Bearer sessions)
- Public event list and detail, gallery with URL filters
- Create/join teams (invite links), submit projects before deadline
- Organizer event create/settings (tracks, prizes, publish)
- Admin user role management
- Server-enforced deadlines via `clock.now()` + `phase.ts`

### T2

- Rubric editor (weights must sum to 100)
- Judge invites (copyable links, no email)
- Auto-assign with conflict-of-interest rules
- Judge scoring workspace; peer scores blocked
- Live organizer dashboard (UI polls every 5s)
- Results with raw + normalized scores; publish to public page
- CSV export (`results` and `scores`) with formula-injection guards
- Event audit log

### T3

- Authenticated community voting per track (1 vote per user)
- Order bias mitigation (deterministic per-voter ballot shuffle)
- Tally peeking mitigation (live results hidden from organizers and public until voting closes)
- Moderated project comments (rate limited, duplicate protected, soft-deleted)
- Organizer abuse dashboard (fraud flagging for new accounts, void/restore capabilities)
- End-to-end audit logging for voting moderation

### T4

- Event-scoped API keys (`dfk_…`) with read/write scopes
- OpenAPI 3.1 spec and Swagger UI (bundled, offline)
- Bulk JSON import/export and judge/project CSV import/export
- Verifiable issued records and participant/judge certificates
- Embeddable public gallery widget (`/embed.js`, `/embed/gallery`, `/api/embed/gallery`)
- Signed webhooks with retries and SSRF defenses (DNS-pinned delivery)

## Build timeline

- The spec the team downloaded on 24–25 Sep listed kickoff as Friday 25 Sep 2026, 18:00 UTC and code freeze as Monday 28 Sep. The team started coding after that published kickoff.
- The live spec now lists kickoff as Saturday 26 Sep 18:00 UTC and freeze as Tuesday 29 Sep.
- Commit list with dates: repo created `429fb3f` (25 Sep, no code); `e51bff9` has a manually set author date and a placeholder report, superseded by the real `acceptance-report.txt`; the T1/T2 build `b35e1de` (26 Sep 09:40 UTC); later work as in git log. No history was rewritten.
- The migration folder `20260325173000_init` has a wrong tool-generated date.

## Honest limitations

- **No email delivery.** Team and judge invites are copy-paste URLs only.
- **Official `run.py` verifies T1 and T2 only.** Claiming T3/T4 in `.dogfood.toml` does not
  mean the checker exercises those features; see `acceptance-report.txt`
  (`verified T1 T2`, `claimed but not verified: T3 T4`).
- **Judging starts only after `submissionsClose`.** Demo Open Hack ships with submissions
  open for 7 days; organizers must close submissions (settings) before judges can submit scores.
- **Sessions are opaque Bearer tokens in `localStorage`**, not HttpOnly cookies — fine for a
  local demo, not a hardened multi-tenant SaaS posture.
- **Auth rate limit** is IP-based on login/register; disabled volume is raised only under
  `NODE_ENV=test`.
- **Normalization is computed on read** and never stored; large events recompute on each
  results/dashboard/CSV request.
- **Duplicate detection** is title/repo heuristics at submit time, not plagiarism analysis.
- **One project per team** (`Project.teamId` unique).
- Offline after build still requires the Postgres + app containers; “no network” means no
  outbound calls from the running portal, not “no Docker host”.
- **Postgres is exposed on host port 5433** for local testing. In production, you should
  remove the `ports: - "5433:5432"` mapping from `docker-compose.yml` to prevent external access.

## Production notes

- Set `SEED_DEMO=false` so demo Bearer tokens are not created.
- Change all demo passwords (or disable demo account seeding) before any shared deployment.
- Take regular Postgres backups of the `pgdata` volume.
- Set a real `PUBLIC_URL` so invite links point at your host.
- Put TLS termination in front of the container; the app itself listens on plain HTTP.
- Do not expose Postgres ports publicly; the compose file publishes 5432/5433 for local dogfooding.

## Repository map

```
.
├── .dogfood.toml           DOGFOOD checker config: claimed tiers, demo auth headers, routes
├── acceptance-report.txt   Output of run.py on the final build
├── docker-compose.yml      One command to a seeded portal (db + app)
├── Dockerfile              Multi-stage build: shared → server → web → runtime
├── fixtures.json           Official DOGFOOD fixture data, loaded by the seed on boot
├── run.py                  Official DOGFOOD acceptance checker (unmodified)
├── README.md               This file
├── ARCHITECTURE.md         System design and rationale
├── DATA-MODEL.md           Schema, fixture mapping, import and export paths
├── JUDGING.md              Assignment, scoring math, normalization, isolation, signed records
├── LICENSE                 MIT
│
├── docs/
│   ├── API.md              REST API guide: auth (sessions, API keys), errors, webhooks
│   ├── THREAT-MODEL.md     Sybil votes, ballot stuffing, collusion, SSRF, import abuse, …
│   └── SPEC.md             Original build plan written before kickoff (see Build timeline)
│
├── src/
│   ├── shared/src/schemas/     Zod request/response schemas used by server and web
│   ├── server/
│   │   ├── prisma/             schema.prisma + migrations
│   │   └── src/
│   │       ├── app.ts          Express app: security headers, routers, SPA fallback
│   │       ├── lib/            prisma, clock, tokens, audit log, CSV, errors, API-key scope
│   │       ├── middleware/     authenticate, authorize (roles), validate, error handler
│   │       ├── seed/           Idempotent, create-only seed (fixtures + demo accounts/tokens)
│   │       └── modules/        One folder per feature (routes + services):
│   │             auth, admin, events, teams, projects        → Tier 1
│   │             judging (rubric, assignment, scoring,
│   │               normalization, results, dashboard, CSV)    → Tier 2
│   │             community (voting, ballots, comments, abuse) → Tier 3
│   │             apikeys, openapi, webhooks, records,
│   │               transfer (import/export), embed           → Tier 4
│   └── web/src/
│       ├── api/                The only fetch client + TanStack Query hooks
│       ├── auth/               Session context and role guards
│       ├── components/         Shared UI components and layout
│       └── pages/              public/ · participant/ · judge/ · organizer/ (tabs) · admin/
│
├── tests/
│   ├── unit/                   Pure functions: normalization, assignment, ballot, abuse, SSRF, …
│   ├── api/                    HTTP tests incl. permission matrix, judge isolation, deadline,
│   │                           full lifecycles for T1–T4
│   └── helpers/                Test app, DB reset, fixed clock, seeded scenarios
│
└── tools/
    └── verify-record.mjs       Offline verifier for signed judge records (Node stdlib only)
```

### Where to find a feature

| Looking for | Go to |
|---|---|
| Login, sessions, roles | `src/server/src/modules/auth`, `middleware/authenticate.ts`, `middleware/authorize.ts` |
| Deadline rules | `src/server/src/modules/events/phase.ts` |
| Judge isolation (peer scores → 403) | `src/server/src/modules/judging` + `tests/api/judge-isolation.test.ts` |
| Normalization math | `src/server/src/modules/judging/normalization.ts` + [JUDGING.md](JUDGING.md) |
| Community voting and hidden results | `src/server/src/modules/community` |
| Signed records and certificates | `src/server/src/modules/records` + `tools/verify-record.mjs` |
| Import / export | `src/server/src/modules/transfer` + [DATA-MODEL.md](DATA-MODEL.md) |
| Every route × role check | `tests/api/permission-matrix.test.ts` |

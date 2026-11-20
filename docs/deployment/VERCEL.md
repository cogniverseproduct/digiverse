# DigiVerse on Vercel — Centralized Publishing

DigiVerse publishes every client website to **one DigiVerse-owned Vercel account/team**.
Clients never need Vercel accounts. The integration is **fully implemented and tested
against a mocked Vercel API, but has never been run against the real Vercel API**,
because no Vercel account is connected yet. Section 9 lists exactly what is verified and
what is not.

## 1. Architecture

```
Publish Website (Publishing Console)
  -> technical preflight (site generated, valid unique site name, bundle built)
  -> snapshot of the active design, sanitised (no private data)
  -> SiteExporter: standalone static site = prebuilt DigiVerse site runtime
                   + this client's index.html with the site data embedded
  -> DeploymentProvider
       VercelProvider  (real, centralized team)  one Vercel PROJECT per client site,
                                                 every publish = new production DEPLOYMENT
       MockProvider    (local simulation only)   never labelled or stored as Vercel
  -> site_deployments row (queued) -> status refreshed on read + signed webhook
  -> READY -> live URL stored on the project, site list and deployment history
```

Why one Vercel project per client: it gives every site independent content and branding,
its own deployment id, live URL, status, history, and its own custom domain, with no
shared build. A client website is a static bundle (no build step on Vercel), so a
deployment is only an upload plus an alias switch.

The standalone site needs **no DigiVerse API** at runtime. This was verified by serving
exported Sports and Event sites from a plain static server that has no `/api` route.

Modes (`getPublishingConfig()` in `server/src/config.ts`):

| Mode | When | Publish does |
|---|---|---|
| `live` | `VERCEL_ENABLED=true` **and** `VERCEL_TOKEN` set | Real Vercel deployment |
| `mock` | `PUBLISH_MOCK_MODE=true`, not on Vercel, `NODE_ENV!=production`, real publishing off | Simulation, labelled **Simulated** everywhere |
| `not_configured` | everything else (the default) | Publishing disabled, console shows "Vercel setup pending" |

`VERCEL_ENABLED=true` without a token is `not_configured`, never a silent fallback to mock.
Mock results are stored with `provider='mock'`, never carry a Vercel deployment id, and
their URL is the local `/live/<slug>` route.

States shown in the Publishing Console: **Not configured, Ready to publish, Queued,
Building, Ready, Failed**, plus "Not ready" when the site itself has a technical problem
(listed in the console). Success is only shown when the deployment is actually READY.

No timers: serverless functions cannot run background loops, so status is refreshed
whenever the console (or an API client) reads it, and optionally by the signed webhook.

## 2. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VERCEL_ENABLED` | `false` | Turns real Vercel publishing on |
| `VERCEL_TOKEN` | empty | Token of the DigiVerse Vercel account/team. **Server only.** |
| `VERCEL_TEAM_ID` | empty | Team id (`team_...`); required when the token belongs to a team |
| `VERCEL_WEBHOOK_SECRET` | empty | Optional. Enables `POST /api/vercel/webhook` |
| `PUBLISH_MOCK_MODE` | unset | Local only. Simulated publishing |
| `PUBLISH_MOCK_STEP_MS` | `1500` | Delay between simulated states (tests use `0`) |
| `PUBLISH_MOCK_OUTCOME` | `ready` | `fail` rehearses a failed deployment |
| `SITE_BUNDLE_DIR` | built-in | Only if the site bundle lives elsewhere |
| `PUBLIC_APP_URL` | auto on Vercel | Needed so uploaded media (`/api/media/...`) gets absolute URLs in exported sites |

Aliases with the same meaning: `DIGIVERSE_VERCEL_ENABLED`, `DIGIVERSE_VERCEL_TOKEN`
(also `DIGIVERSE_VERCEL_API_TOKEN`), `DIGIVERSE_VERCEL_TEAM_ID`,
`DIGIVERSE_VERCEL_WEBHOOK_SECRET`. **Unverified:** whether the Vercel dashboard accepts
custom variable names starting with `VERCEL_` (its own system variables use that prefix).
If it refuses them, use the `DIGIVERSE_VERCEL_*` names; nothing else changes.

Local development with no credentials: leave `VERCEL_ENABLED=false`, `VERCEL_TOKEN=`,
`VERCEL_TEAM_ID=` (these are the defaults in `server/.env.example`). DigiVerse starts
normally, every engine works, and publishing shows "Vercel setup pending". To rehearse
the whole workflow locally add `PUBLISH_MOCK_MODE=true` to `server/.env`
(`.env.example` already has it).

Never put the token in a `VITE_*` variable. The token is read only by the server, is
never returned by any API, never written to the database, audit log or logs (errors are
scrubbed), and `scripts/check-vercel-readiness.mjs` checks the browser bundle for it.

## 3. Activating real publishing [YOU]

Nothing in the code has to change. Check Vercel's current plan terms first: **Hobby is
documented as non-commercial use only; publishing paying clients' websites very likely
needs a Pro plan. Not verified here, check Vercel's Fair Use and Pricing pages.** Also
check the current limits on projects per team, deployments per day and API rate limits.

1. Create the Vercel account and a **team** for DigiVerse (the account that will own all
   client sites). Note the Team ID (Team Settings -> General).
2. Create an **access token** scoped to that team (Account Settings -> Tokens).
3. Create the DigiVerse project from the repository as described in section 4 and set
   its Production environment variables:
   `VERCEL_ENABLED=true`, `VERCEL_TOKEN=<token>`, `VERCEL_TEAM_ID=<team id>`
   (plus the variables from section 4). Optional: `VERCEL_WEBHOOK_SECRET=<random 32+ chars>`.
4. **Deployment Protection:** client sites must be publicly reachable. DigiVerse asks
   Vercel for a public project when it creates one (`ssoProtection: null`), but check the
   team's default Deployment Protection setting after the first publish. If a client site
   asks visitors to log in to Vercel, change the team default to public.
5. Deploy DigiVerse. The build runs `npm run build --prefix server`, the client build and
   `node server/scripts/build-site-bundle.mjs` (configured in `vercel.json`).
6. **Validate** (Super Admin, read-only, publishes nothing):
   `POST /api/publishing/config/verify` with your Super Admin token. It checks the token
   and team with Vercel and reports whether the site bundle is built. Expect
   `{"ok": true, ...}`.
7. Optional webhook: Vercel -> Team Settings -> Webhooks -> add
   `https://<your-app>/api/vercel/webhook`, events *deployment created / ready / error /
   canceled*, with the same secret as `VERCEL_WEBHOOK_SECRET`. Not needed for publishing.
8. Open a client project, **Publish Website**, watch Queued -> Building -> Ready, open
   the live URL (`https://dv-<site>-<id>.vercel.app`), then try Redeploy and Unpublish.
9. Custom domain (optional): Publishing Console -> Custom domain. It is attached to
   that client's own Vercel project and shows the DNS records to add.

If step 6 or 8 fails, the console and `site_deployments.error_code/error_message` show a
safe error (`VERCEL_AUTH`, `VERCEL_PLAN_LIMIT`, `VERCEL_RATE_LIMITED`, ...). Nothing is
reported as live unless Vercel reports READY.

## 4. Deploying DigiVerse itself

1. Push the code to a repository you control (`server/.env` and `server/data/` are
   git-ignored).
2. Vercel -> import the repository. Root directory = repository root, framework **Other**
   (`vercel.json` supplies install/build commands).
3. Database: Vercel Marketplace -> **Neon** -> connect (adds `DATABASE_URL`, use the
   pooled string). Optional Blob store for uploads (adds `BLOB_READ_WRITE_TOKEN`).
4. Environment variables: `JWT_SECRET` (32+ random chars), `SETUP_KEY` (once, remove after
   the first Super Admin exists), the publishing variables from section 2.
5. Optional: copy local data with `npm run db:migrate:postgres` (see `server/scripts`).
6. Deploy. Check `https://<app>/api/health`.

| Variable | Needed | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | 32+ random characters |
| `DATABASE_URL` | Yes on Vercel | Neon pooled connection string |
| `SETUP_KEY` | First run | Remove afterwards |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Added by the Blob store |
| `PUBLIC_APP_URL` | Recommended | Needed for absolute media URLs in exported sites |
| `SITES_ROOT_DOMAIN`, `VITE_SITES_ROOT_DOMAIN`, `VITE_APP_HOSTNAMES` | Later | Only for the legacy shared-host routing |
| Publishing variables | For real publishing | Section 2 |

Vercel runtime notes: the function file system is read-only (SQLite and local uploads are
refused there), request bodies are limited (~4.5 MB), `maxDuration` is 60 s. A first
publish of a site uploads the shared runtime files (about 10 MB, 200 files, 8 in
parallel) and fits that limit; later deployments reuse files already stored by Vercel by
SHA-1 so almost nothing is uploaded.

## 5. API reference

All routes need `Authorization: Bearer <admin token>` and the Admin or Super Admin role.
Per-project routes only reach projects the caller owns (Super Admin: all); anything else
answers **404**.

| Method and path | Purpose |
|---|---|
| `GET /api/publishing/config` | Mode and readiness booleans. No secrets. |
| `POST /api/publishing/config/verify` | Super Admin. Read-only token and team check. |
| `GET /api/projects/:id/publishing/status` | State, preflight, live URL, latest deployment |
| `POST /api/projects/:id/publishing/publish` | Body `{siteSlug?, seo?, customDomain?}`. Creates a deployment and returns at once |
| `POST /api/projects/:id/publishing/redeploy` | Deploy the current content again (needs an existing publication) |
| `POST /api/projects/:id/publishing/unpublish` | Deploys an "offline" page; history is kept |
| `GET /api/projects/:id/publishing/deployments` | History (newest first) |
| `GET /api/projects/:id/publishing/deployments/:deploymentId` | One deployment (refreshed) |
| `GET /api/projects/:id/publishing/deployments/:deploymentId/logs` | Logs (scrubbed; synthetic and labelled for simulated runs) |
| `POST /api/vercel/webhook` | Public, HMAC-SHA1 verified (`x-vercel-signature`); 404 until a secret is set |
| `GET /api/projects/:id/publishing/preflight` | Technical checks only |
| `POST /api/projects/:id/publish`, `/deploy`, `/unpublish` | Older paths, now aliases of the routes above |

Errors: `409 NOT_CONFIGURED`, `400 PREFLIGHT_FAILED` (with `blockers`), `409 IN_PROGRESS`,
`409 NOT_PUBLISHED`, `502`-class provider failures (a failed deployment record is
written). Only one deployment per site can be in progress at a time (a stuck one stops
blocking after 10 minutes).

**Removed:** `POST /api/projects/:id/approve`, `POST /api/preview/:token/approve`, the
`bypassCommercialGate` flag, and the approval / revision-lock / payment preflight checks.
Publishing now depends only on technical checks. Commercial and billing **routes and
tables are kept** (no records lost) but gate nothing; their studio UI was removed.

## 6. Database changes

`SCHEMA_VERSION` 2 -> 3, additive only (`CREATE TABLE IF NOT EXISTS`); no existing table or
row is touched, no manual migration is needed.

- `site_hosting` (one row per project): `project_id` PK, `provider` (`vercel`|`mock`),
  `provider_project_id`, `provider_project_name`, `production_url`, timestamps.
- `site_deployments`: `id`, `project_id`, `provider`, `kind` (`publish`|`offline`),
  `provider_deployment_id`, `status` (`queued`|`building`|`ready`|`failed`|`canceled`),
  `url`, `inspector_url`, `revision_id`, `site_slug`, `bundle_hash`, `file_count`,
  `error_code`, `error_message`, `triggered_by_admin_id`, `created_at`, `ready_at`,
  `updated_at`. Indexes on `(project_id, created_at DESC)` and `provider_deployment_id`.

Deleting a DigiVerse project deletes its rows here and makes a best-effort call to delete
the client's Vercel project (the outcome is written to the audit log). Existing sites that
were published to the shared `/live/<slug>` runtime keep working unchanged.

## 7. Files

Created: `server/src/services/publishing/{deploymentService,siteExporter,vercelClient}.ts`,
`.../providers/{types,vercelProvider,mockProvider}.ts`, `server/src/db/siteDeploymentRepository.ts`,
`server/src/routes/{publishing,vercelWebhook}.ts`, `server/scripts/build-site-bundle.mjs`,
`client/site.html`, `client/src/site/main.tsx`, `client/src/lib/publicSiteRequirements.ts`,
`client/src/components/admin/PublishingConsole.tsx`, tests `server/test/unit/publishingUnits.test.ts`
and a rewritten `server/test/publishing.test.ts`.
Modified: `server/src/{config.ts,app.ts,db/schema.ts,db/repository.ts,types/index.ts}`,
`services/{publishingService,vercelDomainsService}.ts`, `routes/{projects,preview,sites}.ts`,
`server/.env.example`, `vercel.json`, root `package.json`, `scripts/check-vercel-readiness.mjs`,
`client/vite.config.ts`, `client/src/lib/api.ts`, `types/admin.ts`, `AIGenerationStudio.tsx`,
`ClientPreviewPortal.tsx`, `PublishedSitesPanel.tsx`, `LiveWebsitePortal.tsx`, `AdminOverview.tsx`, and the
engine test suites.
Removed: `PublishingModal.tsx`, `ClientApprovalModal.tsx`, `CommercialBillingStudio.tsx`,
`server/src/services/vercelDeployer.ts`.

## 8. Rollback

Vercel keeps every deployment (Instant Rollback). Each client site has its own history in
DigiVerse; **Redeploy** republishes the current design, **Unpublish** deploys the offline
page. Schema changes are additive, so rolling the DigiVerse code back leaves the two new
tables unused but harmless. Local data in `server/data/` is never touched by Vercel.

## 9. Verification status and known limitations

**Implemented and tested locally (no Vercel account):** configuration detection and mode
matrix; VercelClient request shapes, auth, retries, error mapping and token redaction
against a mocked `fetch`; the project/file-upload/missing-files/recreate-project flow
against the mock; site export (escaping, media URL rewrite, path whitelist, size caps,
private-data removal); authentication, authorization and cross-admin isolation; simulated
publish -> status -> ready -> URL persisted -> redeploy -> history -> unpublish; failed
deployments; credential-leak scans; webhook signatures; the removed approval/payment
gates for all engines; the Publishing Console in a real browser (not configured,
simulated, failed; 1440 and 390 px); exported Sports and Event sites rendered from a
plain static server; the Vercel readiness simulation.

**Not tested against real Vercel (needs an account and token):** project creation, file
upload, deployment creation and polling, deployment logs, webhooks, domain attach, plan
limits, Deployment Protection defaults, whether the `VERCEL_` variable names are accepted.
The request shapes follow Vercel's REST documentation but must be confirmed by step 6/8
of section 3.

Known limitations:
- Visitor forms (RSVP, volunteer sign-up, donation enquiry) on an exported site need a
  DigiVerse API and are not available on standalone Vercel sites in this release; they
  keep working on sites served from the shared `/live/<slug>` runtime.
- Uploaded images stay on DigiVerse storage (Blob) and are referenced by absolute URL, so
  `PUBLIC_APP_URL` must be set; exports fail with a clear error otherwise.
- Status updates arrive when someone reads the console (or via the webhook), not in the
  background.
- One Vercel project per client counts against Vercel's per-team project limit.
- The page title and meta tags of an exported site come from the saved SEO settings;
  changing content requires a Redeploy.
- Marketing copy that still mentions approval or payment (for example
  `components/sections/HowItWorks.tsx`, `Workflow.tsx`) was not changed.
- Setup and reset links are shown to the Super Admin, never emailed (unchanged).

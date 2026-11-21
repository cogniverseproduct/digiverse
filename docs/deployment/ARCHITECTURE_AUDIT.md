# DigiVerse architecture audit (single Vercel project)

Audit date: 2026-11-21. Method: source reading plus local builds/tests. **Nothing here was
verified on real Vercel** - the repository has never been deployed; see "Not verified".

## 1. Architecture

```
GitHub repo (ONE)                         Vercel project (ONE, Root Directory = ./)
├── vercel.json        ───────────────►  install: npm ci --prefix client && npm ci --prefix server
├── client/  (React 19 + Vite)           build:   server tsc  ->  server/dist
│     └─ vite build ─────────────────►           client vite  ->  client/dist  (outputDirectory)
│          ├─ index.html (admin SPA)              build-site-bundle.mjs -> server/dist/site-bundle
│          └─ site.html  (standalone site runtime)
├── server/  (Express 5, TypeScript)     runtime
│     └─ tsc ─► server/dist/app.js  ◄──  api/index.js  (the ONE Vercel Function, maxDuration 60)
├── api/index.js  (re-exports the app)
└── .vercelignore / .gitignore           static  : client/dist/**  (CDN, wins over rewrites)
                                         function: /api/*  and  /live/:slug  (rewrites -> /api)
```

Browser request path:

| Request | Handled by |
|---|---|
| `/`, `/admin`, `/preview/<token>`, any deep link | static `client/dist/index.html` (SPA fallback, `/(.*)`) |
| `/assets/<hash>.js` | static file; if it no longer exists -> rewrite to the function -> JSON/text **404, `no-store`** (new) |
| `/ngo-templates/*`, `/event-templates/*`, `/images/*` | static files from `client/public` |
| `/api/*` | rewrite `/api/(.*)` -> `/api` -> `api/index.js` -> Express (original path preserved) |
| `/live/<slug>` | rewrite -> `api/index.js` -> `routes/render.ts` (SEO shell + embedded site data) |
| `/live/<slug>/<sub>`, `/live` | no rewrite matches -> SPA shell (works client-side; no SEO tags) |

Rewrites are evaluated after the filesystem, in this order: `/api/(.*)`, `/live/:slug`,
`/assets/(.*)`, `/(.*)`. No two rules overlap for the same URL.

## 2. File-by-file report

| File | Role | Finding |
|---|---|---|
| `vercel.json` | Single source of build/route config; `framework: null` | Correct for one project. Added `/assets/(.*)` rewrite so a missing hashed chunk is a real 404 instead of the SPA shell cached for a year. |
| root `package.json` | Scripts + `engines.node 22.x` (Vercel reads only this one) | No dependencies by design; the function's packages come from `server/node_modules` via file tracing (see Not verified). |
| `api/index.js` | `export default app` from `../server/dist/app.js` | No `listen()` at import; ESM/NodeNext imports resolve. |
| `client/package.json`, `client/vite.config.ts` | Builds `index.html` **and** `site.html` | OK. `client/vite.config.js/.d.ts` and `tsbuildinfo` are tracked build outputs that can shadow the `.ts` config - cosmetic, recommend untracking. |
| `client/src/lib/api.ts` | Same-origin `/api` calls; JWT kept in `localStorage` | OK; no secret in the client. XSS would expose the token (no CSP yet). |
| `server/package.json`, `tsconfig.json` | `tsc` -> `dist`, `rootDir src` | `scripts/` are not compiled (run with `tsx`), so they are never in the function. |
| `server/src/app.ts` | Express app, no side effects at import except config logging | Health no longer exposes DB path/host; unknown `/assets/*` 404; boot-time config warnings. |
| `server/src/server.ts` | Local `listen()` only | Not used on Vercel. |
| `server/src/config.ts` | Env access | Driver selection hardened (see DATABASE.md). |
| `server/scripts/build-site-bundle.mjs` | Copies `client/dist` (minus admin shell) to `server/dist/site-bundle` + manifest | Validated filenames and size limits. |
| `scripts/check-vercel-readiness.mjs` | Local simulation | Extended (see below); still a simulation. |
| `.gitignore` / `.vercelignore` | Keep data/secrets out | Hardened (env variants, `.vercel/`, `server/data/*`, journals, dumps). |
| `docs/deployment/*` | Operator docs | VERCEL.md updated; ENVIRONMENT, DATABASE, MIGRATION_RUNBOOK added. |

How the pieces are produced:
- **Frontend**: `npm run build --prefix client` (`tsc -b && vite build`) -> `client/dist`.
- **Backend**: `npm run build --prefix server` (`tsc`) -> `server/dist`.
- **Standalone client-site bundle**: `node server/scripts/build-site-bundle.mjs` -> `server/dist/site-bundle`
  (`site.html`, `manifest.json`, `files/**`), read at runtime by `siteExporter.ts` and shipped in the
  function via `includeFiles`.

## 3. Why Vercel asked for separate deployments

Inferred from the repository (Vercel's import UI is not available to this audit):
`client/` (Vite) and `server/` (Express) each contain a `package.json`, and the root `package.json`
has no framework or dependencies. Vercel's import screen treats that as a monorepo and offers one
project per detected app (or "Services"). `vercel.json` cannot influence that screen; it only
applies once a project exists. It is a UI suggestion, not a requirement: import once with Root
Directory `./` and Framework **Other**, as documented in VERCEL.md. A second way to end up with the
wrong shape is a project whose Root Directory was set to `client` or `server`, because then
`vercel.json` and `api/` are never seen.

Separate from this, the **Publishing** feature (off by default) creates one Vercel project per
client website through the Vercel API when `VERCEL_ENABLED=true`. That is intentional product
behaviour and is not a second DigiVerse deployment. If you want literally one project in total,
leave publishing in simulated/`/live/<slug>` mode.

## 4. Dashboard settings that could override `vercel.json`

| Setting | Required | Why |
|---|---|---|
| Root Directory | `./` | otherwise `vercel.json` and `api/` are invisible |
| Framework Preset | Other | `framework: null` already wins; auto-detecting Vite would drop `/api` |
| Build/Install/Output overrides | off | `vercel.json` values win, but stale dashboard values confuse debugging |
| `NODE_ENV=production` project variable | do not set | `npm ci` would skip the TypeScript/Vite devDependencies |
| Node.js version | 22.x | root `engines` |

## 5. Changes made for the single-project goal

`vercel.json` (+1 rewrite); `server/src/app.ts` (assets 404, health, boot warnings);
`scripts/check-vercel-readiness.mjs` (checks: one-project shape, no sub-directory `vercel.json`,
`.vercel/project.json` not pinned to a sub-directory, lockfiles match `package.json`, `includeFiles`
targets exist, Node pin, ignore rules, `/assets` 404, health leak, explicit "NOT VERIFIED" list);
`.gitignore`, `.vercelignore`, docs.

## 6. Not verified (needs a real Vercel build/deploy)

1. That Vercel's file tracing includes `server/node_modules` (express, pg, ...) in the function.
   Mitigation if it fails: add `server/node_modules/**` to `includeFiles` (size ~80 MB, within the
   250 MB limit) or add the server dependencies to the root `package.json`.
2. Rewrite precedence and that `/assets/(.*)` -> function does not shadow existing static assets
   (documented behaviour: filesystem first).
3. Whether `Cache-Control` from `vercel.json` headers is applied over the function's `no-store` for the
   rewritten 404 (worst case equals the previous behaviour for that URL).
4. Dashboard settings, Deployment Protection, Neon `DATABASE_URL` connectivity, Blob uploads, Drive,
   webhooks and real publishing.

# Social & NGO engine: implementation status

Status date: 2026-11-19 (library extended with Kilnfield). See `NGO_TEMPLATE_SOURCES.md` for the template audit and `LICENSES.md` for licences.

## Headline

The engine is complete and verified end to end with **three** admitted templates. The 7-per-archetype minimum was withdrawn by the owner on 2026-11-18, so the library is the number of qualifying templates found: Grassroots 2 (Folder Tabs, Kilnfield), Institutional 0, Cause Charity 1 (Open Rivers).

## Architecture

- Each template is a static third-party bundle in `client/public/ngo-templates/<id>/` (`index.html`, `LICENSE`, `CREDITS.md`, `mapping.json`).
- A TypeScript binder (`engine/mapping.ts`) fetches the page and its mapping, parses with `DOMParser`, applies the mapping **before the page runs**, neutralises everything unmapped (forms, third-party scripts, structured data, unmapped photographs, links to removed sections), and serialises the result into a sandboxed `srcdoc` iframe (`sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`, no same-origin access, no referrer).
- Three render modes: `original` (upstream unchanged, labelled), `sample` (fictional "Riverbend Community Trust" on `.example` domains, labelled) and `live` (the client's real data only).
- Client text only ever reaches the page through `textContent` and checked attributes (`http`, `https`, `mailto`, `tel`, `#anchor`); the engine has no `innerHTML`. A unit test enforces this.
- The same frame serves the library preview, Studio, Client Preview and `/live/<slug>`.
- Mapping rule types: text, literal, attr, image, remove (ifEmpty), lenVar, logo, repeat; plus `emptyRemove`, `pruneIfNoLinks`, `pruneEmpty`, brand colour variables. Interpolated values drop dangling separators when a part is blank.
- Templates that need a build step (Astro, Gatsby, ...) are built once in an isolated scratch copy and only the static output is shipped.

Deviation from the first plan: the plan proposed an in-iframe `dv-binder.js` driven by `postMessage`. The shipped design binds in the parent before the frame loads, which keeps the sandbox free of same-origin access and means no template ever sees unbound sample content. `SOURCE.json` per bundle was replaced by the typed `source` entry in `registry.ts` plus `CREDITS.md`.

## What was built

- **Client:** `templates/ngo/*`, library (`NgoTemplateLibrary`, `NgoTemplateCard`, `NgoDemoModal`: search, source/licence line, original/sample toggle, desktop/tablet/mobile), archetype selector (honest counts, no real-organisation references, no donation promises), ten-step intake (`ngo-intake/`, `NgoIntakeWizard`) with validation, drafts and resume, Studio "Change template", Client Preview and live rendering, `?template-preview=<id>` route.
- **Server:** `ngoCatalog.ts` (ids per archetype, archetype/template consistency, legacy ids still accepted), `mediaPolicy.ts` (no mock Drive media or stock thumbnails for NGO), strict non-fabricating normaliser, PATCH that cannot add payment data, `POST /:id/donation-enquiry` returns 410 (stored data kept), public sanitiser (submissions, PAN, Drive file ids, and for library sites stored bank/UPI/80G/donation link).
- **Publishing:** updated 2026-11-19: no category needs client approval, a revision lock, or payment any more; only technical checks apply (see `docs/deployment/VERCEL.md`).
- **Vercel prep:** cache headers for `/ngo-templates/*` and `/images/ngo-templates/*` in `vercel.json`. No deployment was performed.

## Verification (isolated stack: API :3101, Vite :5273, scratch SQLite)

| Area | Result |
| --- | --- |
| Server API suites (`test/*.test.ts`) | 313 / 313 pass (2026-11-19, all engines) |
| Unit suites (`npm run test:unit`) | 203 / 203 pass (all engines; `ngoTemplateLibrary.test.ts` runs its per-template gate for each of the three templates, and `mappingEngine.test.ts` covers the shared binder) |
| `tsc` client and server, `vite build` | clean |
| Per-template unit gate | bundle self-contained, no tracker or external script, mapping selectors valid, no upstream sample words in live mode with rich **and** minimal data, no forms, no payment wording, markup typed into fields is escaped |
| Browser, templates 1 and 3 | preview at 1440 / 820 / 390, original (with and without its photographs) and sample modes, zero exceptions including inside the sandboxed frame, no failed requests (only Google Fonts hosts); Kilnfield's bundle page checked directly at 1440 / 820 / 390 for sideways scroll (none) |
| Browser journey | archetype -> library -> preview -> select -> ten-step intake (validation blocks missing email) -> create -> Studio -> approval -> publish without payment -> `/live/<slug>` renders the chosen template |
| Regression smoke | a Portfolio, two Cultural, two Sports and both NGO templates render with zero exceptions; the full API suites cover their flows |

## Bugs found and fixed on 2026-11-19

- A phone number containing spaces (for example `+44 20 7946 0000`) made the `tel:` link fail the engine's safe-link check, so the whole phone line was silently dropped on Folder Tabs and Kilnfield. The NGO view now carries a normalised `tel` (digits and a leading +) and the mappings use it; covered by a unit test.
- Kilnfield's relabelled heading "programmes" was clipped at 390 px; it now reads "Our work".
- Published rich and minimal sites for all three templates were opened at `/live/<slug>` at 1440, 820 and 390 with no script errors and no failed requests.

## Not done / limits (stated plainly)

- Library size is 2 / 0 / 1. The Institutional archetype has no qualifying template, so its card is greyed out, marked unavailable and cannot be selected.
- No integrated template currently needs a visible credit. A future credit-based template (for example CC BY) must keep its credit in the bound footer: add it to `mapping.json` as a kept element and to `source` in the registry before admitting it.
- A framed site has weaker SEO than the SPA shell (`routes/render.ts` still injects meta tags) and internal pages are not deep-linkable.
- The "Original sample" preview hotlinks Unsplash photographs (not MIT-covered); live sites never load them.
- Existing (legacy) NGO projects keep the old inline renderer; their stored data was not rewritten or deleted.
- `NGODataManager` cannot edit the new `updates` and `supportInfo` fields except through its raw JSON tab.
- Full browser journeys (intake to `/live/<slug>`) were run for Folder Tabs (Grassroots) and Open Rivers (Cause Charity); Kilnfield was verified by the unit gate, the API e2e (which runs every id) and the browser render checks above, but its intake-to-publish journey was not clicked through; the Institutional archetype has no template to run. The unit gate and the API e2e (`ngoEngine.e2e.test.ts`) run for every id in the registry.
- No real Vercel deployment was made, no account was created and no external credential was used.

## Adding a template

1. Clone the upstream into an isolated directory; read its `LICENSE`; list external requests, trackers and image provenance.
2. Put a self-contained `index.html` (CSS inlined, fonts from Google Fonts only or inlined), `LICENSE`, `CREDITS.md` and `mapping.json` in `client/public/ngo-templates/<id>/`.
3. Add the id to `client/src/templates/ngo/ids.ts` **and** `server/src/services/ngoCatalog.ts`, and a `make({...})` entry with `source` and `sampleTokens` to `registry.ts`.
4. Capture the card image from `?template-preview=<id>&view=sample` into `client/public/images/ngo-templates/<id>.jpg`.
5. Run `npm run test:unit` in `server`; the library test checks all of it.

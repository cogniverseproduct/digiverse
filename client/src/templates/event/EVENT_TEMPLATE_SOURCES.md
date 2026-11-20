# Event template sources and sourcing decisions

The Event library holds only real, third-party website templates. DigiVerse does not design them. Each template's code is kept as its author published it; only the sample content is replaced by the client's data through a `mapping.json` file.

All candidates below were downloaded into isolated folders, never executed outside a browser sandbox, and their `LICENSE` file was read. Every one carried an MIT licence file. Admission was therefore decided by design fit, asset ownership and library policy, not by the code licence alone.

## Admitted (7)

| Template id | Category | Upstream | Commit | Licence | Retrieved |
| --- | --- | --- | --- | --- | --- |
| `conference-shift26` (SHIFT/26) | Conference & Seminar | https://github.com/Novpix/free-html-templates, `templates/event-conference` | `9765e79` | MIT, (c) 2026 Novpix LLC (ZumaTools) | 2026-11-19 |
| `wedding-evermore` (Evermore) | Wedding & Private | https://github.com/Novpix/free-html-templates, `templates/wedding` | `9765e79` | MIT, (c) 2026 Novpix LLC (ZumaTools) | 2026-11-19 |
| `launch-aube` (Aube) | Launch & Product Reveal | https://github.com/Novpix/free-html-templates, `templates/coming-soon` | `9765e79` | MIT, (c) 2026 Novpix LLC (ZumaTools) | 2026-11-19 |
| `festival-ondo` (ONDO, native build) | Festival & Concert | https://github.com/8bsite/event-website-template, `index.html` | `690d121` | MIT, (c) 2026 8B (https://8b.com) | 2026-11-19 |
| `festival-cutshort` (Cut Short, native build) | Festival & Concert | https://github.com/8bsite/film-festival-website-template, `index.html` | `ebc5b7e` | MIT, (c) 2026 8B (https://8b.com) | 2026-11-19 |
| `exhibition-nocturna` (Nocturna, native build) | Exhibition & Trade Fair | https://github.com/8bsite/art-gallery-website-template, `index.html` | `6e42c9d` | MIT, (c) 2026 8B (https://8b.com) | 2026-11-19 |
| `exhibition-wrenfield` (Wrenfield, native build) | Exhibition & Trade Fair | https://github.com/8bsite/museum-website-template, `index.html` | `8a523f4` | MIT, (c) 2026 8B (https://8b.com) | 2026-11-19 |

Each bundle lives in `client/public/event-templates/<id>/` with the upstream `LICENSE`, a `CREDITS.md` (what is third-party, what DigiVerse changed), `mapping.json` and a self-contained `index.html`. Their only outside requests are Google Fonts (SIL Open Font License). They contain no photographs, no JavaScript libraries and no analytics; artwork is original vector art released under the same MIT licence.

ONDO is the exception to "no photographs": its upstream page uses 29 Unsplash photographs that its author says are not covered by the MIT licence. They are never copied into the repository and never loaded on a client site; only the labelled "Original template sample" preview loads them from Unsplash. On a client site the opening picture, line-up portraits and photo wall show the organiser's own photographs, or are left out. ONDO's font (Asta Sans) loads from Google Fonts (SIL Open Font License) and its "Design: 8B" footer credit is kept. Only its native build is used; the GSAP variant is excluded by policy.

Cut Short, Nocturna and Wrenfield follow the same rules as ONDO: they are 8B's native builds (the GSAP variants are not used), their Unsplash photographs (15, 19 and 24; every author is listed as "(unknown)" upstream) are never shipped or loaded on a client site, the "Design: 8B" credit is kept, and every change DigiVerse made is listed in each bundle's `CREDITS.md`. Those changes are small: one header comment, and one-line guards in scripts that assume a section always exists (Cut Short: 1 script, Nocturna: 4, Wrenfield: 1) plus, for Nocturna, one CSS property that removes a 1px sideways scroll in the original preview. Sections that only make sense for the sample (film submissions, midnight screening, drawers, fieldwork) are removed on client sites; everything else is filled with the organiser's data, and headings that named sample things are relabelled.

## Category coverage

| Category | Templates | Status |
| --- | --- | --- |
| Conference & Seminar | 1 | Available |
| Wedding & Private | 1 | Available |
| Launch & Product Reveal | 1 | Available |
| Festival & Concert | 2 | Available |
| Corporate & Business | 0 | No qualifying template found; shown as unavailable |
| Exhibition & Trade Fair | 2 | Available |
| Award Ceremony & Special | 0 | No qualifying template found; shown as unavailable |

A category with no template is not padded with a generic or invented layout.

## Evaluated and not admitted

| Candidate | Why it is not in the library |
| --- | --- |
| Novpix `app-landing` (Sprout), `saas-landing` (Pulse) | Software marketing sites (app-store buttons, subscription pricing and trial buttons), not launch-event designs. |
| Novpix other templates (agency, business, restaurant, ...) | Not event designs. |
| 8bsite `event-website-template` GSAP variant (`index.gsap.html`) | Excluded by policy (GSAP's licence restricts use in website-builder products). The native build of the same template is admitted as `festival-ondo`. |
| 8bsite `product-landing-page-template` (Hushkey) | Evaluated and rejected as a launch template: a single-product page whose hero panel and four interactive sections (states, modes, dimmer, chords) are demos of that device's own keys. Stripped of them little of the design remains; kept, they would show a keypad that has nothing to do with the client's launch. |
| 8bsite `app-landing-page-template` (Linea) | Evaluated and rejected for the same reason: a captioning app whose hero, phone mock-up and demo sections are specific to that product. |
| mmrahmanbappi `100-free-html-templates` (Buildwell Summit, Night Market Live, The Low Tides, Amara & Theo, Lumo, Nookery, Shopkeeper School, plus the NGO pages Clearwater Fund and Maple Street) | MIT, and admitted in principle by the owner (decision D6). Verified individually and **none passes**: each page builds its speakers, agenda, tickets, gigs, gallery or donation amounts at run time from JavaScript data arrays inside the page (measured: 500 to 2,000 characters of static text against 2,000 to 5,400 of script), so the static binder cannot reach the content without rewriting each template's own scripts. Several also carry a ticket cart ("Continue to payment"), a donation widget or a form backend, which the no-payments rule forbids. Authorship of the repository is also unverifiable. |
| jonathanrao99 `ForumX-Conference-Template`, ikasu-io `template-next-festival` (Kweldertij) | Next.js static exports. The page is a React application: when it starts it re-renders over the page and would discard the client's data, and without its scripts the animations do not run. They build (ForumX only after three route patches) but cannot be bound faithfully. ForumX's hero is also a real, identifiable photograph, and Kweldertij's photographs are AI-generated. Not admitted. |
| Rainier-PS `Invitation-Template` | MIT with a required author credit, and its page renders from a JSON data file at run time (a different mechanism from the static binder). Not integrated; a data-injection path would be needed. |
| pinylabs `halftone`, `common-room`; smart-developer1791 `astro-synthwave-festival-landing`; wpinfusion `pawstronaut` | Could not be built on this machine (Node 22.17.1 is below Astro 7's minimum of 22.23.4; a `@tailwindcss/vite` version mismatch for the other two). Unverified, not rejected: recorded as blocked by the environment. |
| TemplateMo, uiCookies, Tooplate | Their terms restrict redistribution or use inside a builder. Not integrated. Draft permission-request emails exist (never sent) for the owner to review. |
| walice `wedding-template`, dewanakl `undangan` | Hotjar and Google Tag Manager trackers and a comment backend. Not admitted. |
| karunkumarjha `wedding-card-template` | Bundles a 1937 recording with a doubtful public-domain claim and gates its content behind a click. Not admitted. |
| MiddleSugar7000 `volt-arc-landing-page-template` | Needs GSAP ScrollTrigger and Three.js from CDNs. GSAP's licence restricts use in website-builder products, so it is not admitted. |
| ColorlibHQ `bootstrap-templates` (e.g. `summit-conf`, `marigold`) | Excluded by the owner's decision D2 (no Bootstrap 6 alpha). |
| Astroyo `event-landing-template` | Rendered an empty page in an isolated browser test (a script or asset failed). Not admitted. |
| statpio `statpio-template-event` | A plain wedding page whose bundled photographs have no stated provenance. Not admitted. |
| Stephen-Adom `rockfest` | Dated jQuery page that shows third-party company logos and real people's photographs. Not admitted. |
| oxcdx `expoWebsiteTemplate` | 2018 page that failed 53 requests (dead remote services and libraries) in the isolated test. Not admitted. |
| themefisher `eventre-bootstrap` | Rejected: a 2017 Bootstrap 4 page that repeats the same four faces and ships 246 files of demo photographs with no stated licence. |
| i-am-fran `wedding-website-template` | Downloaded; not evaluated further. |

## Rules for adding a template

1. Read the real `LICENSE` file in a fresh clone. Accept MIT, Apache-2.0, BSD, ISC, CC0. Credit-required licences only with the credit kept visible.
2. Check every asset (fonts, icons, images, videos, libraries). Photographs not covered by the code licence are never shipped or loaded on a client site.
3. Reject anything that needs GSAP, a tracker, or an external script on the client's site.
4. Add the id to `ids.ts` and to `server/src/services/eventCatalog.ts` (a unit test fails if they drift), the entry to `registry.ts`, fictional demo data, a preview image captured from the real preview, and the bundle folder.
5. The unit test `server/test/unit/eventTemplateLibrary.test.ts` must pass, including the live-mode check that no upstream sample text, form, payment wording or stock photograph survives.

# Sports Engine implementation status

Updated after each milestone. "Verified" means it was run and the result inspected. A file existing is not counted as done.

Last updated: 2026-11-17 (after library, intake, E2E and docs milestones)

## Checkpoint summary (final pass, 2026-11-17)

| Area | State | Evidence |
| --- | --- | --- |
| 24 original templates (8 Club, 8 Tournament, 8 Academy) | Verified | Headless Chrome on the isolated Vite server: 24 templates x desktop 1440 / tablet 820 / mobile 390 = 72 renders plus 24 reduced-motion renders. 0 px horizontal overflow (`scrollWidth - target`), 0 console errors, 0 broken images, 0 elements stuck hidden under reduced motion |
| Distinct designs | Verified | Unit test: unique palette and font pair inside each category, and unique font + primary + accent across all 24. `championship-portal` was restyled (charcoal and copper, Oswald) because it shared fonts and palette with `premier-elite-club`; its card screenshot was regenerated |
| Library, full-page preview, device toggle, Select | Verified in browser | Tablet iframe 800 px content, mobile 382 px, desktop full width; Select hands the template to the intake |
| Intake wizards (3 categories, 12 steps each) | Verified in browser | Club, Tournament and Academy each driven from library to "Preview ready". Empty required fields block Next; invalid email and invalid media links are refused; Back/Next keeps data; Save draft, reload, Resume restores the form |
| Drive and YouTube links in the gallery step | Verified | Links added in the UI persist in the project's requirements and turn the gallery page on |
| Same design in preview and generated site | Verified | e2e test (all 24) and browser: the template id chosen is the id in `generatedWebsite.selectedTemplate`, the Studio, Client Preview and the published `/live/<slug>` page |
| Studio controls | Verified | Library projects show a brand panel (primary colour, accent colour, hero line). Saving writes `sportsData.club` and the live iframe updates. Studio and Client Preview tablet/mobile now resize a real iframe, so responsive CSS responds |
| Studio hero leak | Fixed | The Studio used to inject the festival photo `durga-hero.jpg` into every project without a cover image. Library sports projects now show only the client's own cover image |
| Publishing (local only, no Vercel) | Verified | Updated 2026-11-19: publishing no longer needs client approval or payment (technical checks only). Locally it publishes in simulated mode (see `docs/deployment/VERCEL.md`); earlier verification was against the shared `digiverse_shared` route; `/live/<slug>` renders without overflow at 3 widths and without the sample-content badge |
| Uploads | Verified in browser and API | The real file input in the intake accepted a PNG (previewed from `/api/media/uploads/...`, stored and served 200 `image/png`) and refused an SVG with "Unsupported image format. Allowed formats: PNG, JPG/JPEG, WebP, GIF." API tests also cover 401 without a token and the logo on the generated site. The OS-native picker dialog itself is not shown in headless Chrome; the input was driven directly |
| Project ownership isolation (all engines) | Fixed and verified | An Admin sees and changes only organisations assigned to them; Super Admin sees all; denied access answers 404. 15 routes checked with a second Admin; org-name takeover answers 409; the tenant cannot be reassigned by an Admin |
| API integration suites | 258/258 pass | All 19 suites under `server/test/*.test.ts` run in-process on a temp SQLite DB (`test/helpers/`). Never against `:3001` |
| Unit tests | 66/66 pass | `npm run test:unit` |
| Type checks and builds | Pass | server `tsc --noEmit` 0; client `tsc -b && vite build` 0 (the owner has fixed `HowItWorks.tsx`) |
| Regression: Cultural, Puja, Event, NGO, Portfolio | Passed | Create, generate and open the Studio on the isolated stack: 201 / 200 / no console errors; the API suites for these engines pass |
| Font licences | Verified | All 28 families are `license: OFL` in `google/fonts` (see `LICENSES.md`) |
| Third-party template sources | Researched | No candidate had a clearly reusable licence; nothing reused (see `SPORTS_TEMPLATE_SOURCES.md`) |

## Why Sports felt weaker than Portfolio, and what changed

The structure was already the same as Portfolio's (registry, lazy designs, dispatcher, library, intake). The real gaps were: Studio and Client Preview "tablet/mobile" were only width wrappers; Studio colour/headline controls did nothing for library templates; the Studio leaked a festival photo; two templates shared fonts and palette; the gallery step had no Drive/YouTube links; project ownership was not enforced; and the API test suites could not log in. All are addressed above.

## Test changes made to match current behaviour (not to hide failures)

Seven older suites asserted behaviour the product no longer has, and were updated: Admin creation is an invitation plus the Admin setting their own password; the platform seeds no projects; delivery platform name is `digiverse_shared`; `registerGoogleDriveVideoLink` is async; `resolveProxyFilePath` returns `publicPath`; the hero banner is deliberately never taken from Drive (gallery only); Cultural and NGO content lives in `culturalData` / `ngoData`. Authentication and role checks were not weakened.

## Known limits

- Git `user.name` / `user.email` are empty and nothing is committed. Waiting for the owner.
- Existing projects whose organisation has no assigned Admin are visible to the Super Admin only.
- Uploads are not tied to a project at upload time (platform design, unchanged).
- Fonts load from Google Fonts at runtime (a visitor's browser contacts Google). Same as the Portfolio library.
- The platform fonts in `client/index.html` (marketing site) were not licence-checked.
- The tablet preview uses 820 px (content 800 px inside its border).
- Not done: a real Vercel deployment (not requested), a legal review of any third-party template (none used), a real phone/tablet device test. A separate server-side-render smoke test was not added: the 24-template browser sweep renders every design in a real browser, which covers more.
- `SportsRequirementWizard.tsx` (old 15-step wizard) was deleted with the owner's approval; `SportsDataManager.tsx` is kept.

## Isolated test stack

API `:3101` and Vite `:5273` with a scratch DB under the session scratchpad (never the owner's `:3001` / `:5173` or `server/data`). Both were stopped and the scratch DB deleted afterwards.

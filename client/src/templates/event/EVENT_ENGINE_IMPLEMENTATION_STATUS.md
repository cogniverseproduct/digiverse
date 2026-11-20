# Event Website Creation Engine: implementation status

Last updated 2026-11-19. Seven real third-party templates are integrated: Conference 1 (SHIFT/26), Festival 2 (ONDO, Cut Short), Exhibition 2 (Nocturna, Wrenfield), Wedding 1 (Evermore), Launch 1 (Aube). Two of the seven categories (Corporate, Award) have no qualifying template and are shown as unavailable. Nothing was committed, deployed or published to a real host.

## How it works

- Library: `client/src/templates/event/registry.ts` (identity, version, source repo and commit, licence, attribution, pages, features, preview image). Bundles are in `client/public/event-templates/<id>/`.
- One implementation drives the library preview, Studio, client preview link and `/live/<slug>`: the page and its `mapping.json` are fetched, the client's data is bound before the page runs, and the result is shown in a sandboxed frame (`allow-scripts allow-popups`, no same-origin access). The binding engine is shared with the Social & NGO engine (`templates/ngo/engine/mapping.ts`), extended with a prototype-based repeater, text-node targeting, cycling values and safe link targets.
- Preview route: `/?template-preview=<id>` (original upstream sample, fictional sample, or live data).
- Intake: `components/admin/event-intake/` builds a different step sequence per category, all fields start empty, drafts save per admin, category and template, and review lists what will and will not appear.
- Server: `services/eventCatalog.ts` (ids per category, validation, no silent category fallback), `normalizeEventDataStrict` (no invented data, http(s)-only links, hex-only colours, payment-like extras dropped), publishing exemption for Event sites ("Not required for Event websites."), public sanitiser (RSVP replies and Drive ids never public), hardened `POST /api/projects/:id/rsvp`.
- No payment of any kind: no card, UPI, gateway or checkout. Ticket buttons only link to the organiser's own external booking link.
- Legacy event projects keep the inline renderer; their stored data is untouched.

## Completed and verified

- Registry, client ids and server catalog agree; ids are unique and disjoint from the other engines (unit test).
- Each template ships LICENSE (matching its declared licence), CREDITS.md, mapping.json and a preview image; bundles have no external scripts or trackers; every mapping selector resolves (unit test).
- Live mode with rich and with minimal data leaves no upstream sample text, form, payment wording or stock photograph, shows the organiser's name and email, escapes markup typed into any field, and drops unsafe links (unit tests, 4 templates).
- Test totals on this machine (after the library expansion): server unit suite 203/203 (includes the new `mappingEngine.test.ts`, 12 tests: engine tidying of dangling separators and empty brackets, `venueFull`, person name split, NGO `tel` link); full server API suite 313/313 (all engines); Event e2e 20/20; server `tsc --noEmit` and client `tsc -b` clean; `vite build` succeeds and ships the bundles.
- End to end through the real HTTP API (`eventEngine.e2e.test.ts`, 17/17): create from the real intake output, persist, generate, preview link, client approval, publish with no payment, public site carries the same template; unknown or cross-category templates rejected; other engines still need payment; RSVP validation, rate limit and privacy; ownership isolation.
- Browser (headless Chrome, isolated stack): library and category selector (4 available, 3 shown as "No qualifying template available yet", greyed cards do nothing; the Festival library page shows the ONDO card); intake validation, save and resume; a Launch project created through the UI opens in the Studio with the Aube design and the client's data; published rich and minimal live pages for all four templates at 1440 and 390 (ONDO: rich at 1440, 820 and 390, minimal at 1440 only) with no script errors, no failed requests and only Google Fonts requested; sample previews at 1440 and 820 for all three (390 as well for SHIFT/26 and Aube; Evermore's phone layout was checked on its live page); original-mode previews of SHIFT/26 and Evermore match the upstream design.
- Regression smoke on the isolated stack: Cultural, Puja, legacy Event, Social & NGO and Portfolio projects still create, generate and open; the Sports, Cultural, NGO and Portfolio preview routes still render.

- Published through the real API (create, generate, approve, publish) and opened at `/live/<slug>` at 1440, 820 and 390 with a rich and a minimal dataset for Cut Short, Nocturna and Wrenfield: zero script exceptions, zero failed requests, only Google Fonts requested outside the app. This run found one real defect (Cut Short's ticket-tier script threw on a site with no tickets because its section is removed); fixed with a one-line guard logged in its `CREDITS.md`, and re-checked at all three widths. The unit gate does not execute template scripts, so this class of defect is only caught by browser runs.

## Implemented, not fully verified

- Live pages at 820 px were captured without errors; for SHIFT/26, Evermore and Aube they were only inspected visually in sample mode. ONDO's minimal live page was checked at 1440 only (not at 820 or 390), and its sample preview at 1440 only.
- The three new Event templates were verified by the unit gate, the API e2e (all ids), original, no-photo and sample browser renders and the published-page runs above; their wizards were not clicked through in the browser (the Launch wizard was; the others share the same intake model).
- ONDO has no photographs on client sites by design: with no photo supplied, its opening is a plain dark panel under the huge title. Its look with the organiser's own photographs was not tested (no real client photographs were available); the original-template preview shows the upstream design with Unsplash photographs.
- The Festival wizard was not driven in the browser (only the e2e test exercises the Festival intake output).
- Only the Launch (Aube) wizard was driven through to project creation in the browser. The Wedding wizard was exercised to step 2 plus resume; the Conference wizard was not driven in the browser. All three are covered by the e2e test through the same intake model.
- Client preview link, approval, and publish were exercised through the API (e2e) and by loading the published `/live/<slug>` pages, not by clicking those buttons.
- "Event data" editor (`EventDataManager`) for library projects: type-checked and its fabricated defaults removed; not exercised in the browser.
- Google Drive gallery links go through the existing media component; the sanitiser strips Drive ids (unit tested), but nothing was run against a real Drive.
- Chrome only. Firefox and Safari were not tested.

## Not implemented

- No qualifying template yet for Corporate & Business or Award Ceremony & Special (no purpose-built design was found, and designs made for other purposes are not adapted). See `EVENT_TEMPLATE_SOURCES.md` for what was evaluated and why it was not admitted.
- RSVP on Evermore is email-only: its demo form is replaced by buttons that open an email to the organiser. The hardened server RSVP route exists and is tested but no integrated template posts to it.
- Upstream photographs are never shipped, so live sites show the client's own photographs or have those sections removed.

## Known limitations

- Framed sites have weaker SEO and no deep links (page meta tags are still injected by the server).
- The shared Gallery & Video component keeps numbered labels ("4.", "5.", "6.") from its older use; it is shared with other engines and was left unchanged.
- In Evermore, a long hotel name beside a booking code can wrap onto two lines in narrow columns (the original column widths are kept).
- `EventRequirementWizard.tsx` (legacy 15-step form) is no longer used for creation but remains in the codebase.

## Blocked

- A real Vercel deployment needs the owner's account, project and domain. Only preparation is done: per-site slug isolation, cache headers for `/event-templates/*` and `/images/event-templates/*` in `vercel.json`, and a passing production build. No deployment was made or claimed.

> Update 2026-11-19: client approval and payment no longer gate publishing for any engine. Where this file mentions approval or payment-free publishing, publishing now needs only technical checks and runs through the centralized publishing system (`docs/deployment/VERCEL.md`).

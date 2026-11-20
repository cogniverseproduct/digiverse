# Social & NGO template sources

Audit trail for the Social & NGO Website Creation Engine. Audit date: 2026-11-18; extended 2026-11-19 (Kilnfield admitted, mmrahmanbappi templates and others evaluated).

**Admission rule (updated by the owner on 2026-11-18).** The minimum of 7 templates per archetype is no longer mandatory; only genuinely high-quality templates are admitted, in whatever number exists. Licence type is no longer restricted: a template is admitted when its **actual usage terms** allow DigiVerse to use, adapt and ship it, and every required credit is kept. All of these must hold:

1. It is a pre-existing third-party website template, not a DigiVerse-invented design.
2. Its real licence terms (the `LICENSE` file, or the publisher's licence page for credit-based sources) were read and permit commercial use, modification and inclusion in a template library. Required credits and notices are kept visible and never removed.
3. It carries no unlicensed or privacy-sensitive material that has to ship with it (photographs of identifiable people, private embeds) and needs no dependency whose own licence adds a duty we cannot meet.
4. It is a genuine fit for a non-profit website and of professional quality: complete, visually strong, free of placeholder or broken copy, and not a generic layout or a colour variation of another entry.
5. It can be obtained without creating an account, paying, or circumventing a download gate.

Nothing is padded.

## Result

| Archetype | Admitted | Required minimum |
| --- | --- | --- |
| Grassroots Impact & Community NGO (`grassroots_ngo`) | **2** | 7 |
| Institutional Foundation & Trust (`institutional_foundation`) | **0** | 7 |
| Visual Storytelling & Cause Charity (`cause_charity`) | **1** | 7 |
| **Total** | **3** | 21 |

The 7-per-archetype and 21-total targets are **not met**. The shortfall is a sourcing result (see the rejected list), not an engineering limit: the engine, library, intake, backend and publishing path are complete, and every further admitted template is one bundle, one `mapping.json` and one registry entry.

## Admitted

### 1. `grassroots-folder-tabs` ("Folder Tabs"), Grassroots Impact & Community NGO
- Upstream: `8bsite/nonprofit-website-template` ("Spare Hour"), https://github.com/8bsite/nonprofit-website-template, commit `eb0188a`, retrieved 2026-11-18.
- Licence: MIT, `Copyright (c) 2026 8B (https://8b.com)`. LICENSE read in the clone and copied to `client/public/ngo-templates/grassroots-folder-tabs/LICENSE`.
- Fonts: Host Grotesk and Playwrite (SIL OFL 1.1), loaded from Google Fonts, as upstream does.
- Photographs: upstream loads 24 photographs from `images.unsplash.com` under the Unsplash License and states they are **not covered by the MIT licence** (its `CREDITS.md`, copied beside the bundle). DigiVerse never ships them and a live client site never loads them: image slots show the client's own images, or are removed. Only the library's "Original sample" preview hotlinks them, and that is labelled.
- Changes: client data mapped through `mapping.json` (76 rules); forms, donation cards, third-party scripts, structured data and unmapped photographs removed; page runs in a sandboxed frame. Design, layout, type and motion are unchanged.
- Suitability: designed for a community-volunteering charity, which is the archetype it serves.

### 2. `cause-open-rivers` ("Open Rivers"), Visual Storytelling & Cause Charity
- Upstream: `pinylabs/open-rivers`, https://github.com/pinylabs/open-rivers, commit `85ccddd`, retrieved 2026-11-18.
- Licence: MIT, `Copyright (c) 2026 pinylabs`. LICENSE read in the clone and copied to `client/public/ngo-templates/cause-open-rivers/LICENSE`.
- Source form: an Astro 7 + Tailwind 4 project. It was built once in an isolated scratch copy (`npm install --ignore-scripts`, then `astro build`; the build tool's Node-version gate was relaxed in that scratch copy only, because the machine runs Node 22.17.1 and Astro 7.4.7 asks for 22.23.4). Only the static output (one HTML page, one stylesheet inlined) is shipped. No upstream source was edited.
- Not shipped: the "Piny Studio" mark, which the upstream README says is not covered by the MIT licence.
- Fonts: Epilogue and Literata (SIL OFL 1.1), from Google Fonts. Photographs: four Unsplash hotlinks (Unsplash License, not MIT-covered); never shipped, never loaded on a live site.
- Changes: client data mapped through `mapping.json`; the donate band (amount picker, payment link) replaced by an information-only "how to support" band; header Donate button, forms, third-party scripts and unmapped photographs removed.
- Content coverage: programmes (as chapters), impact figures, mission, support text and contact. This design has no slots for leadership, volunteer roles, news or FAQs, so those intake answers are stored but not shown by this template.

### 3. `grassroots-kilnfield` ("Kilnfield"), Grassroots Impact & Community NGO
- Upstream: `8bsite/football-club-website-template` ("Kilnfield Colts", a volunteer-run youth football club), https://github.com/8bsite/football-club-website-template, commit `8d8c79c` (2026-11-03), retrieved 2026-11-19. The native build (`index.html`) is used; the GSAP variant is not.
- Licence: MIT, `Copyright (c) 2026 8B (https://8b.com)`. LICENSE copied to `client/public/ngo-templates/grassroots-kilnfield/LICENSE`.
- Photographs: 16 Unsplash photographs (every author "(unknown)" upstream, not MIT-covered); never shipped, never loaded on a live site.
- Changes (listed in the bundle's `CREDITS.md`): one header comment; four one-line `if (!x) return;` guards in scene and form scripts so they do nothing when a section is removed; the weekly calendar, fixtures and fees sections are removed on client sites. Programmes (its "squads"), values ("promises"), team ("coaches"), volunteer roles ("how to join"), stories ("voices"), questions, contact and footer are filled with the organisation's data. Design, layout, type and motion are unchanged.
- Suitability: a community club run by volunteers for young people is a grassroots community organisation; its structure (programmes, values, people, volunteers, stories) matches the NGO data model.

## Credit-based sources (checked after the owner lifted the licence restriction)

| Source | Actual terms read | Outcome |
| --- | --- | --- |
| Colorlib templates (https://colorlib.com/wp/licence/) | Commercial products. Reselling or sharing a template, or publishing its source files where others can download them, is not allowed without a paid licence ($129 per year or $349 lifetime); even the free download needs an email sign-up. | **Blocked**: needs a paid licence and an account, which were not authorised. |
| W3Layouts (https://w3layouts.com/license/) | Back-link may not be removed; no redistribution "as is" without permission; downloads sit behind sign-in. | Not pursued: sign-in required and redistribution terms unclear for a library. |
| html.design (https://html.design/license/) | CC BY 3.0: client projects, modification, bundling and redistributing modified versions are allowed; a "free template via html.design" footer line must stay. | Terms are suitable, but only two NGO designs exist there (Charo, Givelife). Charo is donation-centred (raised/goal bars, money-bag icons, donation form), uses photographs of identifiable children, has Lorem Ipsum and visible typos; rejected on quality. Givelife's demo returns 404 so it could not be evaluated. The zip download host also refuses non-browser clients (HTTP 403); that gate was not circumvented. |
| HTML5 UP (https://html5up.net/license) | CC BY 3.0 with credit to HTML5 UP. | Terms are suitable but the templates are generic portfolio and landing layouts, not non-profit designs; not admitted. |
| StyleShout | CC BY 3.0 with visible credit. | No non-profit template in the current catalogue. |

## Surveyed and rejected

About 300 repositories and vendor listings were examined in two sweeps (GitHub search by topic, by licence for MIT, Apache-2.0, BSD, ISC, CC0 and Unlicense, and by theme name across Astro, Hugo, Jekyll, Eleventy, Gatsby, Next, Vite, Svelte, Tailwind and Bootstrap; the full 8B and pinylabs families; vendor free-template pages). Most hits were a real organisation's own site, a student project, an application, or an awesome-list, not a reusable template. Every repository below was cloned shallowly into an isolated directory and read, not executed.

| Candidate | Licence read | Why it was not admitted |
| --- | --- | --- |
| `atikurrahmanxm/Website-Project` ("One Truth Foundation") | MIT | Needs Font Awesome icons (icons are CC BY 4.0, attribution carried in a file comment) plus a font-subsetting step; five pages switched by inline JS and donation-centred. Rejected under the "no attribution grey areas" rule. |
| `website-templates/charity_responsive-template` ("My Charity") | MIT | A 5 KB 2013 skeleton: Lorem Ipsum, Google+ icons, "Designed by cssauthor.com" credit in the footer, 29 photographs of unknown origin. Not product quality. |
| `anik511/Charity-Website-Template-` | Apache-2.0 | Embeds a private YouTube video and photographs of identifiable children, 18 MB of bundled framework files, dated design. |
| `saditrahman/stop-hunger` | MIT | Hotlinked Facebook-CDN photographs of children; no usable image provenance. |
| `nkrgupta999/NGO-Volunteer` ("Eco-Warriors") | MIT | Placeholder content (repeated person, unfinished sections). Not product quality. |
| `vxlrubel/kinen-html` | MIT | A general multi-page HTML kit, not a non-profit design. |
| `vicainelli/charity-tailwindcss-theme` | MIT | 2018 Pug/Tailwind v1/gulp source with one image and no finished design to preserve. |
| `anzulaqeel-anunzio/*` (charity, charity-trust, doni, foundation) | MIT label | Re-uploads of what look like commercial themes, advertising paid development work; provenance cannot be established. Excluded. |
| `8bsite/museum-website-template` (Wrenfield) | MIT | A natural-history museum (halls, specimen drawers, late-night events). It is admitted in the **Event** library as an Exhibition template (its content matches exhibitions), but its structure does not match NGO content, and one bundle is not published under two ids, so it is not offered for the Institutional archetype. |
| `mmrahmanbappi/100-free-html-templates` (`nonprofit-charity` "Clearwater Fund", `community-center` "Maple Street") | MIT | Admitted in principle by the owner (D6), verified individually and **not passing**: both pages build their programmes, events, donation amounts and meetings at run time from JavaScript data arrays inside the page (the static binder cannot reach that content without rewriting their scripts), the charity page carries a donation widget and a form backend (Formspree), and the repository's authorship is unverifiable. |
| `cncf/dot-org-hugo-theme` | Apache-2.0 | Hugo theme that needs a Hugo build with extended features; not buildable on this machine within the isolated procedure. Unverified, not rejected: blocked by the environment. This is why the Institutional archetype still has no template. |
| `8bsite/*` community ("softlife"), art gallery, film festival, planetarium, daycare, birth centre, farm delivery, genealogy, language and coding schools, running race, landscaping, pet boarding | MIT | Single-sector commercial or lifestyle designs (a women's members' club with a shop, a gallery, a race, and so on), not NGO designs. |
| `shivamvishwanaath/scholify` | MIT | Genuine NGO template but low quality: grey placeholder slider, "[insert mission statement]" copy, three loose pages with separate CSS. |
| `krisztin/ngosby` (Gatsby) | MIT | Build needs Gatsby's native `sharp` install scripts; not run on untrusted code. Not evaluated visually. |
| `roicort/NGOStarter` | MIT | A PayloadCMS application, not a website design. |
| `design-sparx/crowdup` | MIT | Crowdfunding application centred on payments. |
| `VishwaGauravIn/hunger-no-more`, `skia-dac/association`, `elikia-ya-kongo/elikia.ch`, `oleg-darkdev/*` landing pages, `lesangesdelarue.org`, Kulturverein Trier site, `nashrfoundation.github.io` | MIT / Apache-2.0 / ISC | A specific real organisation's own site (its name, logos and photographs) or an application with an admin portal, not a reusable template. Several also need CMS or framework builds. |
| other `pinylabs` templates (common-room, plinth, halftone, saltwater, keyring, kiln, field-supply, brew-guide, morning-table, the-pinies) | MIT | Not NGO designs (members' club, studio, festival, blog, shop, portfolio). |
| `jaimepaezv/zenith-html-template` | **none** | No LICENSE file (README claim only). |
| `smartergiving/foundation-website-template` | CPAL | Reciprocal licence with attribution link. |
| HTML5 UP | CC BY 3.0 | Visible credit required. |
| html.design, Colorlib "free" templates | paid or unclear | Terms not open or require credit. |
| freestacktemplates, WrapPixel Endeavor, FreeForCharity | vendor claim | Zip-only, "All rights reserved" footer, no LICENSE in the repository, or a permanent footer attribution. Not verifiable. |

If more qualifying templates are found later, or the owner downloads a template manually where a site gates automated downloads,, add them with the procedure in `NGO_ENGINE_IMPLEMENTATION_STATUS.md`.

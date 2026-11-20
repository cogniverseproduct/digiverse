# Portfolio template library: sources & licences

Applies to the v2 library in `src/templates/portfolio/designs/` (10 templates). Last reviewed 2026-11-16.

## Summary

| Question | Answer |
| --- | --- |
| Is any third-party template **code** included? | **No.** All ten templates are original implementations written for DigiVerse. |
| Is any third-party template **artwork / photography** included? | **No.** Demo imagery is generated in code (`kit/art.ts`, procedural SVG). Nothing is hotlinked. |
| Is attribution required for anything shipped? | Only for the optional demo video (see below). Fonts and icons need none. |
| May the templates be reused for clients / commercially? | Yes. They are DigiVerse's own code. Fonts are SIL OFL 1.1 (commercial use and embedding allowed). |

## Research performed (Phase 2)

Free / open-source portfolio templates were searched for as *references*. Findings, and what was done with each:

| Candidate | Licence evidence | Decision |
| --- | --- | --- |
| `saqibbedar/reactfolio` (React + Vite + Tailwind) | `LICENSE` fetched directly from the repository: **MIT**, © 2024 Saqib Bedar. | MIT permits modification, commercial/client use and redistribution **if the copyright and licence notice are kept**. **Not used**: no code was copied. Listed for transparency only. |
| `MohammadrezaAmani/mora_portfoliotemplate`, `seraprogrammer/portfolio` | Search results *claimed* MIT, but the `LICENSE` file could **not** be retrieved at the standard path (HTTP 404), so the licence was **not verified**. | **Not used.** Unverified licence ⇒ treated as all-rights-reserved. |
| HTML5 UP templates (e.g. "Lens") | Published as **CC BY 3.0** (requires visible attribution to the author). Some demo images in such packs come from Unsplash under separate terms. | **Not used.** Would add an attribution obligation to every client site. |
| html.design free templates ("Clean", "Lenslight") | CC BY 3.0 per the publisher's licence page. | **Not used**, for the same reason. |
| Paid / marketplace templates (e.g. TemplateMonster) | Proprietary. | **Not used or copied in any form.** |

Where reuse was not clearly permitted, the work was treated as **inspiration only**. The design decisions below come from general, unprotectable conventions (ideas, not expression):

- terminal / README aesthetics for developer portfolios,
- print-editorial typography for designer portfolios,
- masonry grid + lightbox for photographers,
- neo-brutalist colour blocking,
- CSS 3D carousels (a standard CSS technique),
- link-in-bio pages,
- academic lab-site structure (publications, abstracts, BibTeX),
- architecture-studio index + full-bleed imagery.

No layout, copy, image, CSS or markup from any of the above was reproduced.

## Third-party material that *is* referenced at runtime

| Item | Licence | Notes |
| --- | --- | --- |
| Google Fonts: Inter, Space Grotesk, JetBrains Mono, Fraunces, Cormorant Garamond, Jost, Unbounded, Syne, Manrope, Plus Jakarta Sans, Outfit, IBM Plex Sans / Mono / Serif, Barlow, Barlow Condensed, Sora | **SIL Open Font License 1.1** | Loaded on demand from Google Fonts by `kit/ui.tsx → useFonts`, per template. Commercial and client use permitted; no attribution required. |
| `lucide-react` icons | ISC | Already a dependency of DigiVerse. |
| Demo showreel link in two demo profiles (`demos/demoData.ts`) | *Big Buck Bunny*, © Blender Foundation, **CC BY 3.0** (https://peach.blender.org) | Embedded via youtube-nocookie only inside the **demo preview**; it is never included in a client's site unless the admin adds their own link. If the demo is shown publicly, credit: "Big Buck Bunny © Blender Foundation | bigbuckbunny.org, CC BY 3.0". The video ID should be re-confirmed against the official Blender Foundation channel before any public demo. |

## Demo content

All demo people, companies, e-mail addresses (`example.*`), URLs and numbers are fictional. Demo images are procedurally generated vector art (`kit/art.ts`) and are original to this project.

## Maintenance rules

1. Adding a template that derives from any external source requires a row in the table above with the **verified** licence text, the repository/URL and the date checked, plus the required notice.
2. Never add a package, font or image whose licence forbids client/commercial redistribution.
3. Each template's `source` field in `registry.ts` records its provenance (`kind: 'original'` plus the conventions it draws on).

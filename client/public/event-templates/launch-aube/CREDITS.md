# Aube (coming soon page), used as the Launch & Product Reveal template

- **Author:** Novpix LLC (ZumaTools)
- **Source:** https://github.com/Novpix/free-html-templates (folder `templates/coming-soon`)
- **Commit:** `9765e791bf4033c41a9c9a6bff817cae7363befa`
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 Novpix LLC (ZumaTools)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (inlined into `index.html`) | Novpix LLC (ZumaTools) | MIT |
| Botanical line art, logo mark and film grain (inline SVG) | Novpix LLC (ZumaTools), original vector art | MIT |
| Fonts: Cormorant Garamond, Manrope (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 |

No photographs, videos, icon packs, JavaScript libraries or analytics are included.

## What DigiVerse changed

- `index.html` is the upstream `index.html` with its stylesheet and script inlined.
- The waitlist form (which only showed a demo message upstream) is replaced by one button styled like the original submit button. On a client site it links to the organiser's own booking or product link, or opens an email to them.
- The launch date is read from `data-date` on the countdown instead of a hard-coded script constant, so each site shows its own date. A start at exactly 00:00 (what the engine passes when the organiser gave no time) is shown as a date only.
- `mapping.json` swaps the sample content for the organiser's data. Layout, typography, colours and motion are unchanged.
- The upstream "dawn" light variant (`dawn.html`) is a colour variant of the same page and is not included.

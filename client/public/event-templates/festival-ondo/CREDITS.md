# ONDO (event website template, native build), used as the Festival & Concert template

- **Author:** 8B (https://8b.com)
- **Source:** https://github.com/8bsite/event-website-template (file `index.html`, the native build with no libraries)
- **Commit:** `690d121da6b94082eb6f42729bf3e0070309487a` (2026-11-01)
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 8B (https://8b.com)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (inlined into `index.html`) | 8B | MIT |
| Font: Asta Sans (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 |
| 29 photographs in the upstream page (Unsplash) | Unsplash contributors | Unsplash License, **not** covered by the MIT licence |

No videos, icon packs, JavaScript libraries or analytics are included.

The Unsplash photographs are never copied into this repository and are never loaded on a client's site. Only the labelled "Original template sample" preview in the DigiVerse library loads them straight from Unsplash. On a client site the opening picture, line-up portraits and photo wall show the organiser's own photographs, or are left out.

The page's footer credit "Design: 8B" (a link to https://8b.com/) is kept on every client site.

## What DigiVerse changed

- `index.html` is the upstream native build (`index.html`) with its stylesheet and scripts inlined. The GSAP variant (`index.gsap.html`) is not used.
- The sections for the dance battle, venue zones, make-up looks, food street and audience columns are removed on client sites. The opening, schedule ring, line-up, photo wall, passes, questions, contact and footer are filled with the organiser's data.
- The opening scene script for the removed "looks" section is guarded so it does nothing when that section is missing.
- The schedule rings and the matching holes in the opening veil repeat once per set time (up to nine) and stay centred; CSS counts the rings for this.
- A line-up row without a portrait gives its full width to the name.
- Without a schedule the opening's scroll-driven scene is switched off, so the title is shown still instead of stopping half-way.
- A small script makes the title estimate a little larger if wide letters would run past the edge.
- `mapping.json` swaps the sample content for the organiser's data. Layout, typography, colours and motion are otherwise unchanged.

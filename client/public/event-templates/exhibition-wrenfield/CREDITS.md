# Wrenfield (museum website template, native build), used as an Exhibition & Trade Fair template

- **Author:** 8B (https://8b.com)
- **Source:** https://github.com/8bsite/museum-website-template (file `index.html`, the native build with no libraries)
- **Commit:** `8a523f4` (2026-11-03)
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 8B (https://8b.com)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (one file) | 8B | MIT |
| Fonts (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 (as stated in the upstream `CREDITS.md`) |
| 24 photographs in the upstream page (Unsplash) | Unsplash contributors | Unsplash License, **not** covered by the MIT licence. The upstream `CREDITS.md` lists every author as "(unknown)", so no per-photo provenance exists |

No videos, icon packs, JavaScript libraries or analytics are included.

The Unsplash photographs are never copied into this repository and are never loaded on a client's site. Only the labelled "Original template sample" preview in the DigiVerse library loads them straight from Unsplash. On a client site the pictures show the organiser's own photographs, or are left out.

The page's footer credit "Design: 8B" (a link to https://8b.com/) is kept on every client site.

## What DigiVerse changed

- `index.html` is the upstream native build unchanged except (a) one header comment: the sentence that points to the author's GSAP variant was removed, and (b) the `halls` scene script got a one-line guard (`if (!section) return;`). Upstream assumes that section always exists; on a client site it is removed when the organiser has no exhibitors, and without the guard the script would throw. The GSAP variant (`index.gsap.html`) is not used.
- The collection-drawers, fieldwork, learning-sessions sections and the two forms (message, newsletter) are removed on client sites. The opening, exhibitors (the template's "halls"), the featured exhibition (the event itself), programme (the template's "Lates"), tickets (its "membership" cards), visit information, questions, contact and footer are filled with the organiser's data.
- `mapping.json` swaps the sample content for the organiser's data. Layout, typography, colours and motion are otherwise unchanged.
- Section labels that named museum things are relabelled ("Halls" becomes "Exhibitors", "Lates" "Programme", "Membership" "Tickets") so they match the organiser's own content.

# Kilnfield Colts (football club website template, native build), used as a Grassroots NGO template

- **Author:** 8B (https://8b.com)
- **Source:** https://github.com/8bsite/football-club-website-template (file `index.html`, the native build with no libraries)
- **Commit:** `8d8c79c` (2026-11-03)
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 8B (https://8b.com)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (one file) | 8B | MIT |
| Fonts (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 (as stated in the upstream `CREDITS.md`) |
| 16 photographs in the upstream page (Unsplash) | Unsplash contributors | Unsplash License, **not** covered by the MIT licence. The upstream `CREDITS.md` lists every author as "(unknown)", so no per-photo provenance exists |

No videos, icon packs, JavaScript libraries or analytics are included.

The Unsplash photographs are never copied into this repository and are never loaded on a client's site. Only the labelled "Original template sample" preview in the DigiVerse library loads them straight from Unsplash. On a client site the pictures show the organisation's own photographs, or are left out.

The page's footer credit "Design: 8B" (a link to https://8b.com/) is kept on every client site.

## What DigiVerse changed

- `index.html` is the upstream native build unchanged except (a) one header comment: the sentence that points to the author's GSAP variant was removed, and (b) four scripts (the `squads`, `week` and `join` scenes and the contact-form handler) got a one-line `if (!x) return;` guard. Upstream assumes those sections and the form always exist; on a client site a section the organisation has no content for, and the form (DigiVerse stores no form submissions), are removed, and without the guards the scripts would throw. The GSAP variant (`index.gsap.html`) is not used.
- The "seven days" calendar, fixtures table and fees columns are removed on client sites. Programmes (the template's "squads"), values ("promises"), team ("coaches"), volunteer roles ("how to join"), stories ("voices"), questions, contact and footer are filled with the organisation's data.
- `mapping.json` swaps the sample content for the organisation's data. Layout, typography, colours and motion are otherwise unchanged.
- Section labels that named football things are relabelled ("Find your squad" becomes "Our programmes", "The coaches" "Our team") so they match the organisation's own content.

# Cut Short (film festival website template, native build), used as a Festival & Concert template

- **Author:** 8B (https://8b.com)
- **Source:** https://github.com/8bsite/film-festival-website-template (file `index.html`, the native build with no libraries)
- **Commit:** `ebc5b7e` (2026-11-03)
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 8B (https://8b.com)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (one file) | 8B | MIT |
| Fonts: Stack Sans Headline, Stack Sans Notch, Stack Sans Text (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 (as stated in the upstream `CREDITS.md`) |
| 15 photographs in the upstream page (Unsplash) | Unsplash contributors | Unsplash License, **not** covered by the MIT licence. The upstream `CREDITS.md` lists every author as "(unknown)", so no per-photo provenance exists |

No videos, icon packs, JavaScript libraries or analytics are included.

The Unsplash photographs are never copied into this repository and are never loaded on a client's site. Only the labelled "Original template sample" preview in the DigiVerse library loads them straight from Unsplash. On a client site the title picture and guest portraits show the organiser's own photographs, or are left out and the design shows its plain type-only look.

The page's footer credit "Design: 8B" (a link to https://8b.com/) is kept on every client site.

## What DigiVerse changed

- `index.html` is the upstream native build (`index.html`) unchanged except (1) one header comment: the sentence that points to the author's GSAP variant was shortened, and (2) one line added to the ticket-tier switcher script (`if (!section) return;`) so it does nothing when the Passes section is removed because the organiser has no tickets (without it the script threw an error on such sites). The GSAP variant (`index.gsap.html`) is not used.
- The opening-night feature, film-submission section and three-venue track are removed on client sites; the manifesto statement, programme list, tracks, guests, questions, passes, contact and footer are filled with the organiser's data.
- `mapping.json` swaps the sample content for the organiser's data. Layout, typography, colours and motion are otherwise unchanged.
- Section headings that named films ("In competition", "Strands", "The jury") are relabelled "The programme", "Tracks" and "Speakers" so they match the organiser's own content.

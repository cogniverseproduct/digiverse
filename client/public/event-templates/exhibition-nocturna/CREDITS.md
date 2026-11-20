# Nocturna (art gallery website template, native build), used as an Exhibition & Trade Fair template

- **Author:** 8B (https://8b.com)
- **Source:** https://github.com/8bsite/art-gallery-website-template (file `index.html`, the native build with no libraries)
- **Commit:** `6e42c9d` (2026-11-03)
- **Retrieved:** 2026-11-19
- **Licence:** MIT, `Copyright (c) 2026 8B (https://8b.com)` (full text in `LICENSE` beside this file)

## What is third-party here

| Item | Origin | Licence |
| --- | --- | --- |
| HTML, CSS, JavaScript (one file) | 8B | MIT |
| Fonts: Host Grotesk, Pliant (Google Fonts, loaded at run time) | Google Fonts | SIL Open Font License 1.1 (as stated in the upstream `CREDITS.md`) |
| 19 photographs in the upstream page (Unsplash) | Unsplash contributors | Unsplash License, **not** covered by the MIT licence. The upstream `CREDITS.md` lists every author as "(unknown)", so no per-photo provenance exists |

No videos, icon packs, JavaScript libraries or analytics are included.

The Unsplash photographs are never copied into this repository and are never loaded on a client's site. Only the labelled "Original template sample" preview in the DigiVerse library loads them straight from Unsplash. On a client site the pictures show the organiser's own photographs, or are left out.

The page's footer credit "Design: 8B" (a link to https://8b.com/) is kept on every client site.

## What DigiVerse changed

- `index.html` is the upstream native build unchanged except one header comment: the sentence that points to the author's GSAP variant was removed. The GSAP variant (`index.gsap.html`) is not used.
- The midnight-screening, "eight midnights" relay and journal sections, and the contact form, are removed on client sites; the programme, exhibitors (the "rooms"), speakers (the "artists"), passes, questions, contact and footer are filled with the organiser's data.
- Four scripts (the `rooms`, `screening` and `pass` scenes and the contact-form handler) got a one-line guard (`if (!section) return;`, `if (!cards.length) return;`, `if (!form) return;`). Upstream assumes those sections and the form always exist; on a client site a section the organiser has no content for, and the form (DigiVerse stores no form submissions), are removed, and without the guard the script would throw. Nothing else in the page's code is changed.
- One CSS property, `overflow-x: clip`, was added to the `#relay` rule. At widths of about 820px or less the relay's sweeping line sticks out 1px on each side and made the original preview scroll sideways. Client sites do not include that section.
- `mapping.json` swaps the sample content for the organiser's data. Layout, typography, colours and motion are otherwise unchanged.
- Section labels that named gallery things ("Rooms", "Artists") are relabelled "Exhibitors" and "Speakers" so they match the organiser's own content.

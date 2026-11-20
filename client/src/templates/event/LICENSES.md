# Third-party licences in the Event library

Each template's upstream licence text is copied unchanged beside its bundle in `client/public/event-templates/<template-id>/LICENSE`, with a `CREDITS.md` that lists what is third-party and what DigiVerse changed. They ship with the site.

| Template id | Upstream | Licence | Copyright holder |
| --- | --- | --- | --- |
| `conference-shift26` | Novpix/free-html-templates @ 9765e79 (`templates/event-conference`) | MIT | Novpix LLC (ZumaTools), 2026 |
| `wedding-evermore` | Novpix/free-html-templates @ 9765e79 (`templates/wedding`) | MIT | Novpix LLC (ZumaTools), 2026 |
| `launch-aube` | Novpix/free-html-templates @ 9765e79 (`templates/coming-soon`) | MIT | Novpix LLC (ZumaTools), 2026 |
| `festival-ondo` | 8bsite/event-website-template @ 690d121 (`index.html`, native build) | MIT | 8B (https://8b.com), 2026 |
| `festival-cutshort` | 8bsite/film-festival-website-template @ ebc5b7e (`index.html`, native build) | MIT | 8B (https://8b.com), 2026 |
| `exhibition-nocturna` | 8bsite/art-gallery-website-template @ 6e42c9d (`index.html`, native build) | MIT | 8B (https://8b.com), 2026 |
| `exhibition-wrenfield` | 8bsite/museum-website-template @ 8a523f4 (`index.html`, native build) | MIT | 8B (https://8b.com), 2026 |

## What the licences cover

- **Code, markup, styles, scripts**: MIT. Free to use, modify and use for clients provided the licence text stays with the copy (it does).
- **Artwork** (hero illustration, avatars, florals, botanical line art, venue map): original vector art released with the code under the same MIT licence.
- **Fonts**: loaded from Google Fonts at run time, SIL Open Font License 1.1 (SHIFT/26: the families named in its page; Evermore: Cormorant Garamond, Pinyon Script, Jost; Aube: Cormorant Garamond, Manrope; ONDO: Asta Sans; Cut Short: Stack Sans Headline, Notch and Text; Nocturna: Host Grotesk and Pliant; Wrenfield: the families named in its page). For the 8B templates this is the authors' statement in their upstream CREDITS.md; it was not independently confirmed for every family.
- **Photographs, videos, icon packs, JavaScript libraries, analytics**: none are included. The upstream pages of ONDO, Cut Short, Nocturna and Wrenfield reference 29, 15, 19 and 24 Unsplash photographs (Unsplash License, not MIT; every author is listed as "(unknown)" upstream, so no per-photo provenance exists); they are not shipped and not loaded on client sites, and only the labelled original-template previews load them from Unsplash.
- **Attribution**: Evermore's footer line "Template by ZumaTools" and the 8B templates' footer line "Design: 8B" (a link to https://8b.com/) are kept on client sites. No template requires any other visible credit.

## Not covered

The names, people, venues, dates and copy shown in the "Original template sample" previews belong to the fictional sample content. DigiVerse's own fictional "Sample content" previews use invented names on reserved `.example` domains and no photographs.

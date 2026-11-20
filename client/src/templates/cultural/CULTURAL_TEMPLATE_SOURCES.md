# Cultural template library: sources and originality

## Result

All ten templates are `source.kind: 'original'` in `registry.ts`. Nothing was taken from any external template.

## What was reviewed

A web search for free, openly licensed cultural-association or festival website templates found:

| Candidate | Licence as listed | Decision |
| --- | --- | --- |
| Music-festival repositories on GitHub (`hossainaraf/classical-music-festival`, `hammadsiddique/music-fest`, `dansantander/html-capstone`) | MIT (per their READMEs); the first two also credit an original designer under a Creative Commons licence | Not used. They are music-festival pages, not cultural-association or puja-committee sites, and carry design-credit conditions. |
| "Event Website Template" single-file HTML listing (21st.dev) | MIT (per the listing) | Not used. Music/convention oriented. |
| Themewagon "Art Museum" | "Open source" (licence type not stated) | Not used. Licence unclear. |
| uiCookies "Reel" / "Reverb" | uiCookies licence, not MIT | Not used. |
| Webflow "Tradica", "Culture Exchange", "Sonorous" | Proprietary | Not used. |

No candidate fit the two categories with a clear licence, so the library was written from scratch. The licences above were read
from search listings and were not audited against each repository's `LICENSE` file, because nothing was reused.

## How each design was made

Each design takes only a general *type of website* as inspiration (a layout idea such as "a society journal masthead"), which is not
copyrightable. Layout, copy, art and code are written for this project. See `inspiration` and `note` for each entry in `registry.ts`.

| Template | General inspiration |
| --- | --- |
| cultural-heritage | Society journals and club nameplates |
| arts-literature-society | Independent arts magazines and gallery sites |
| dance-music-association | Theatre and concert-hall programme sites |
| community-cultural-association | Community centre and neighbourhood association sites |
| modern-festival-organization | Music-festival and arts-festival sites |
| traditional-durga-puja | Community Durga Puja committee pages |
| premium-modern-durga-puja | Luxury event and cultural-institution sites |
| community-puja-committee | Neighbourhood festival committees |
| heritage-traditional-puja | Heritage trusts and family-history sites |
| festival-experience-celebration | Large city festival sites |

## Rules for adding a template later

1. Write it from scratch or record the exact licence and attribution here before reusing anything.
2. Use only fonts whose `METADATA.pb` reports an open licence, and add them to `LICENSES.md`.
3. Use procedural art or images the owner can license. Never hotlink.
4. Keep the entry's `source.kind` truthful (`original`, or a different kind with the licence stated).

# Licences: Sports template library

Scope: everything under `client/src/templates/sports/` and `client/public/images/sports-templates/`.

## Summary

| Material | Licence / ownership | Notes |
| --- | --- | --- |
| The 24 template designs, the shared kit, the registry and the demo content | Original work for DigiVerse. Same terms as the rest of this repository. | No third-party code, markup, CSS or copy. See SPORTS_TEMPLATE_SOURCES.md. |
| Procedural SVG artwork (`kit/art.ts`) | Original work for DigiVerse. | Generated in code. No image files. |
| Card screenshots (`client/public/images/sports-templates/*.jpg`) | Original work for DigiVerse. | Screenshots of the templates showing fictional content. |
| Web fonts | Open-source families served by Google Fonts. See below. | Loaded by the visitor's browser at runtime, not bundled. |
| `lucide-react` icons | ISC licence (already a project dependency). | Used for admin UI and a few template icons. |
| `react`, `tailwindcss` | MIT (already project dependencies). | |

No attribution notice is required on a generated client website for any of the above.

## Fonts

Families used across the 24 templates (28): Anton, Archivo, Archivo Black, Barlow, Barlow Condensed, Bebas Neue,
Chakra Petch, Cormorant Garamond, DM Sans, DM Serif Display, Fraunces, Fredoka, IBM Plex Mono, IBM Plex Sans,
Inter, Libre Baskerville, Merriweather, Nunito, Oswald, Outfit, Playfair Display, Poppins, Rajdhani, Roboto Condensed,
Sora, Source Serif 4, Space Grotesk, Work Sans.

**Verified 2026-11-17.** The `METADATA.pb` of every family was read from the public `google/fonts` repository
(`ofl/<family>/METADATA.pb`). All 28 are in the `ofl/` folder and declare `license: OFL` (SIL Open Font License 1.1),
which allows use on websites, including commercial client sites, and bundling or self-hosting. Designers on record:
Anton, Oswald, Nunito (Vernon Adams and others); Archivo and Archivo Black (Omnibus-Type); Barlow and Barlow Condensed
(Jeremy Tribby); Bebas Neue (Ryoichi Tsunekawa); Chakra Petch (Cadson Demak); Cormorant Garamond (Christian Thalmann);
DM Sans and DM Serif Display (Colophon Foundry); Fraunces (Undercase Type and others); Fredoka (Milena Brandão,
Hafontia); IBM Plex Mono and Sans (Mike Abbink, Bold Monday); Inter (Rasmus Andersson); Libre Baskerville (Impallari
Type); Merriweather (Sorkin Type); Outfit (Smartsheet, Rodrigo Fuenzalida); Playfair Display (Claus Eggers Sørensen);
Poppins and Rajdhani (Indian Type Foundry); Roboto Condensed (Christian Robertson); Sora (Jonathan Barnbrook, Julián
Moncada); Source Serif 4 (Frank Grießhammer); Space Grotesk (Florian Karsten); Work Sans (Wei Huang).

Conditions that apply: the OFL forbids selling the font files on their own and forbids reusing a *Reserved Font Name*
for a modified font. The templates load the fonts unmodified, so neither applies. Roboto Condensed is listed under
`ofl/` today (older releases used Apache-2.0; both allow this use). Attribution is not required on a client site.

Not covered by this check: the full `OFL.txt` text of each family was not read, only the repository metadata.
The platform fonts in `client/index.html` (Bricolage Grotesque, Instrument Serif, Hind Siliguri, Noto Serif Bengali)
belong to the DigiVerse marketing site, not to these templates, and were not part of this verification.

**Privacy note:** the templates load fonts from `fonts.googleapis.com`, so a visitor's browser contacts Google when
a site opens. This is the same approach the Portfolio library uses. A site that must avoid that request should
self-host the fonts.

## Third-party templates

None are used. Candidates found during research were **not** downloaded or used, and none was found to be clearly
reusable (see SPORTS_TEMPLATE_SOURCES.md).

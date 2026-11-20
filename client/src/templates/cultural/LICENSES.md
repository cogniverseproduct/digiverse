# Cultural template library: licences

Every one of the ten designs in `designs/` is **original code and layout written for DigiVerse**. No third-party template, theme,
component or stylesheet was copied, adapted or bundled. The only third-party material loaded at run time is Google Fonts.

## Fonts (20 families, all SIL Open Font License 1.1)

Each family was checked against `METADATA.pb` in the public `google/fonts` repository (`ofl/<family>/METADATA.pb` reports
`license: "OFL"`). The OFL permits use, embedding and commercial use, including on client websites. The fonts are served by
Google Fonts at run time and are not redistributed in this repository.

| Template | Heading face | Body face |
| --- | --- | --- |
| cultural-heritage | Cormorant Garamond | Lora |
| arts-literature-society | DM Serif Display | DM Sans |
| dance-music-association | Marcellus | Nunito Sans |
| community-cultural-association | Fredoka | Quicksand |
| modern-festival-organization | Space Grotesk | Inter |
| traditional-durga-puja | Yatra One | Hind Siliguri (Bengali) |
| premium-modern-durga-puja | Bodoni Moda | Manrope |
| community-puja-committee | Baloo Da 2 | Mukta |
| heritage-traditional-puja | Tiro Bangla (Bengali) | Spectral |
| festival-experience-celebration | Rubik | Work Sans |

`server/test/unit/culturalTemplateLibrary.test.ts` checks that every design file loads exactly the families its tokens declare.

## Imagery

- Demo and card imagery is **generated in code** (`kit/art.ts`, procedural SVG). No stock photographs, no hotlinked images.
- Card screenshots in `client/public/images/cultural-templates/` are screenshots of these original designs.
- The older photographs in `client/public/images/festivals/` have unknown provenance and are **not** used by any template.
- Demo organisations, people, dates and contact details are fictional; e-mail and web addresses use the reserved `.example` domain.
  Demo pages always show a "Sample content" badge.

## Icons

Icons come from `lucide-react` (ISC licence), already a dependency of the platform.

## Not verified here

Fonts are served by Google Fonts. Reviewing Google's own terms for the owner's deployment and any privacy requirements for
loading third-party fonts in specific regions is for the owner to confirm.

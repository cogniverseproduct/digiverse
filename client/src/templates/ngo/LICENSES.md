# Third-party licences in the Social & NGO library

Each template's upstream licence text is copied unchanged beside its bundle, in `client/public/ngo-templates/<template-id>/LICENSE`, together with the upstream's own `CREDITS.md`. They are shipped with the site files so the licence travels with the code.

| Template id | Upstream | Licence | Copyright holder |
| --- | --- | --- | --- |
| `grassroots-folder-tabs` | 8bsite/nonprofit-website-template @ eb0188a | MIT | 8B (https://8b.com), 2026 |
| `cause-open-rivers` | pinylabs/open-rivers @ 85ccddd | MIT | pinylabs, 2026 |
| `grassroots-kilnfield` | 8bsite/football-club-website-template @ 8d8c79c (`index.html`, native build) | MIT | 8B (https://8b.com), 2026 |

## What the licence does and does not cover

- **Code, markup, styles**: MIT. Free to use, modify and sell, including for clients, provided the licence text stays with the copy (it does).
- **Fonts**: Host Grotesk and Playwrite (Folder Tabs), Epilogue and Literata (Open Rivers), the families named in Kilnfield's page: SIL Open Font License 1.1, loaded from Google Fonts as upstream does (for the 8B templates this is the authors' statement in their upstream CREDITS.md).
- **Marks**: the "Piny Studio" mark in Open Rivers is not MIT-covered and is not shipped.
- **Photographs**: the 8B templates and Open Rivers load Unsplash photographs under the Unsplash License and state they are **not** covered by the MIT licence. DigiVerse does not ship or load them on client sites. They appear only in the library's clearly labelled "Original sample" preview, which hotlinks them from Unsplash.

## Rule for adding a template

Read the actual `LICENSE` file in a clone before integrating. Accept MIT, Apache-2.0, BSD, ISC, CC0. Reject anything needing visible credit, a reciprocal licence, or whose assets are unlicensed. Record the commit and date in `registry.ts` and `NGO_TEMPLATE_SOURCES.md`. A unit test (`server/test/unit/ngoTemplateLibrary.test.ts`) fails if a template lacks a LICENSE copy that matches its declared licence and copyright line.

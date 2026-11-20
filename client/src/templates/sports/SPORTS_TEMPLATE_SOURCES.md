# Sports template library: sources and provenance

This file records where every one of the 24 Sports templates comes from. It is kept next to the code so it
changes with it. The legal summary is in [LICENSES.md](./LICENSES.md).

## Position

**All 24 templates are original implementations written for DigiVerse.** No third-party template, theme,
markup, CSS, copy, icon set, photograph or logo was copied, adapted or bundled. The layouts, section
structures, components, procedural artwork and demo content were written from scratch in this repository.

The design directions were set by the project brief (for example "premium cricket club", "dark stadium",
"bracket dashboard"). The "Design conventions" column below names the *genre* of website that informed each
direction. These are general conventions (a crest masthead, a bracket tree, a weekly timetable matrix), not
specific sites. Nothing was traced from a particular website.

## Second research pass (2026-11-17)

Three web searches (sports club, football tournament/league, sports academy templates) were made to look for
legally reusable designs. Listings only: **no page was downloaded, no code was copied, nothing is bundled.**
What the listings say, and what that means for reuse:

| Candidate | Category | What the listing says | Reuse decision |
| --- | --- | --- | --- |
| uiCookies "Arena" | Club | "Free for personal and commercial use" (not an OSI licence); redistribution terms not stated | **Not reusable.** DigiVerse would be redistributing it inside a product. Inspiration only. |
| ThemeWagon "Soccer" | Club | Free Bootstrap HTML5 theme; licence not named in the listing | **Not used.** Licence unverified. |
| html.design "Sportpar" and "Yogast" | Club | Creative Commons 3.0 (attribution) | **Not used.** CC-BY needs visible credit on every client site; not acceptable for white-label delivery. |
| prince-noman/club_website, ubeevn/soccer-club-sports-club-html-template (GitHub) | Club | No licence shown in the listing | **Not used.** A repository without a licence grants no reuse rights. |
| farida-hamid/football-capstone (GitHub) | Tournament | MIT (the only one that stated a licence) | **Not used.** A student capstone, not a template; nothing worth adapting. |
| DL-Cup/website-upgrade, skdrh/ftms-frontend, brainconnect93/football-leagues-project, ekremgunes/reactgoalzone (GitHub) | Tournament | No licence shown | **Not used.** No reuse rights shown; reactgoalzone also needs a third-party API key. |
| Skoodel (Webflow) | Academy | Free to use, but cannot be resold, redistributed or licensed | **Rejected.** Redistribution is prohibited. |
| Framer "Sprintelle", Webflow "Ballor", "Sportans", "Tenica", others | Academy / Club | Paid marketplace items, single-use licences | **Rejected.** |
| WordPress "Soccer Academy" theme | Academy | Licence not stated in the listing | **Not used.** WordPress theme, wrong stack. |

Result: no candidate combines a verified permissive licence, redistribution rights and client-site usage rights, so
the position above stands. All 24 templates stay original implementations. If a design is ever adopted from a source
above, its `LICENSE` file must be read first and the result recorded here.

## Candidate sources that were considered

A web search for open-source sports website templates surfaced the repositories below. They were recorded as
possible *inspiration* only.

| Candidate | What it is | Reported licence | Status |
| --- | --- | --- | --- |
| parthamk/hexleap-assignment | React/Vite/Tailwind sports template | MIT (search-result claim) | **Not opened, not used.** Licence not verified. |
| gboigwe/football-hub | Football information platform | MIT (search-result claim) | **Not opened, not used.** Licence not verified. |
| liuyuelintop/melb-uni-ultimate | Next.js club site | MIT (search-result claim) | **Not opened, not used.** Licence not verified. |
| korbinjoe/free.website.templates | Collection of free templates | MIT (search-result claim) | **Not opened, not used.** Licence not verified. |
| Marketplace sports themes (for example VictoryClub) | Commercial themes | Proprietary | **Rejected.** Not free to embed or redistribute. |

"Reported licence" is what a search listing said. It is **not** evidence. None of these licences has been
verified from the repository's own LICENSE file, and none of the repositories' code or assets is in this project.

## Rule for any future reuse of third-party material

1. Read the repository's own LICENSE file. A listing or README badge is not enough.
2. Record source URL, licence, copyright holder, modification and commercial-use rights, attribution duty and
   any separate licence for images, fonts or icons, in this file and in LICENSES.md, before the code lands.
3. Reuse code only under MIT, Apache-2.0 or BSD, and only if the licence notice can ship with generated client
   sites. Reject licences that need attribution on every client website (for example CC-BY), "free to download"
   without a licence, and premium or marketplace themes.
4. Never reuse bundled photography, logos or player images.
5. Otherwise treat the source as inspiration: ideas only, no markup, copy, CSS or imagery.

## Templates

| Id | Name | Category | Fonts (heading / body) | Design conventions that informed it |
| --- | --- | --- | --- | --- |
| premier-elite-club | Premier Elite Club | Sports Club | Playfair Display / Inter | Top-flight club website conventions (crest masthead, next-match hero) |
| matchday-modern | Matchday Modern | Sports Club | Barlow Condensed / Barlow | Contemporary football-club and sports-brand layouts |
| willow-and-wicket | Willow & Wicket | Sports Club | Cormorant Garamond / Work Sans | Traditional county-cricket-club print and signage |
| floodlight-night | Floodlight Night | Sports Club | Bebas Neue / Inter | Night-match stadium photography conventions |
| club-journal | The Club Journal | Sports Club | Fraunces / Source Serif 4 | Newspaper front-page and matchday-programme layout |
| clean-sheet | Clean Sheet | Sports Club | DM Sans / DM Sans | Swiss-style minimal layouts |
| community-pitch | Community Pitch | Sports Club | Poppins / Poppins | Community-organisation website patterns |
| multi-sport-union | Multi-Sport Union | Sports Club | Outfit / Inter | Multi-sport leisure and university sports unions |
| championship-portal | Championship Portal | Tournament Hub | Playfair Display / Inter | Major-tournament official websites |
| cup-night-football | Cup Night Football | Tournament Hub | Archivo Black / Archivo | Football cup branding |
| cricket-league-centre | Cricket League Centre | Tournament Hub | Rajdhani / Inter | Cricket league score centres |
| bracket-board | Bracket Board | Tournament Hub | Space Grotesk / Space Grotesk | Analytics dashboard layouts |
| global-games | Global Games | Tournament Hub | Sora / Inter | International multi-sport games websites |
| tournament-gazette | Tournament Gazette | Tournament Hub | Playfair Display / Libre Baskerville | Official matchday programmes |
| fixtures-results-desk | Fixtures & Results Desk | Tournament Hub | IBM Plex Sans / IBM Plex Sans | League administration systems |
| knockout-minimal | Knockout Minimal | Tournament Hub | Inter / Inter | Minimal competition brackets |
| premier-academy | Premier Academy | Sports Academy | Cormorant Garamond / Inter | Private-school and premium academy sites |
| pitch-academy | Pitch Academy | Sports Academy | Anton / Roboto Condensed | Football academy marketing sites |
| coaching-crease | Coaching Crease | Sports Academy | Libre Baskerville / Work Sans | Cricket coaching centres |
| rising-stars | Rising Stars | Sports Academy | Fredoka / Nunito | Children’s activity and youth sport branding |
| learn-and-play | Learn & Play | Sports Academy | DM Serif Display / DM Sans | Education and Montessori-style websites |
| performance-lab | Performance Lab | Sports Academy | Chakra Petch / Inter | Sports-science and performance-lab brands |
| coaching-institute | Coaching Institute Premium | Sports Academy | Merriweather / Inter | University and professional-institute catalogues |
| multi-sport-campus | Multi-Sport Campus | Sports Academy | Outfit / Inter | University sports-centre sites |

## Assets

- **Artwork:** pitches, courts, stadiums, track lanes, trophies, silhouettes and crests are drawn procedurally as
  SVG by `kit/art.ts`. No image files are bundled with the templates.
- **Card screenshots:** `client/public/images/sports-templates/<id>.jpg` are screenshots of each template's own
  preview route, generated for this project. They show fictional sample content.
- **Demo content:** `demos/demoData.ts` is written for this project. Clubs, places, people, scores and dates are
  invented, and contact details use the reserved `.example` domain. A unit test fails if a demo mentions a real
  club or league. Demo content is shown only in the library and preview route, with a visible "Sample content"
  badge, and is never copied into a client's project.
- **Client content:** logos, photographs, people, fixtures and results on a generated site come only from what the
  Admin entered. Sections with no data are hidden.

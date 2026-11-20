# Cultural Website Engine implementation status

"Verified" means it was run and the result inspected. A file existing is not counted as done.

Last updated: 2026-11-18

## Summary

| Area | State | Evidence |
| --- | --- | --- |
| 10 original templates (5 Cultural Association, 5 Puja Committee) | Verified | Headless Chrome on the isolated Vite server: 10 templates x desktop 1440 / tablet 820 / mobile 390 = 30 renders plus 10 reduced-motion renders. 0 px horizontal overflow, 0 console errors, 0 broken images, 0 elements stuck hidden under reduced motion. Each card screenshot was viewed |
| Distinct designs | Verified | Unit test: 10 different heading faces; no two templates share a font pairing or palette; unique names and design directions |
| Old six colour-variant designs | Retired and remapped | `heritage_akademi`, `sanskriti_mancha`, `samaj_milan`, `mahasabha_royal`, `kala_kendra_theme`, `prabashi_utsav_hub` map to a current design of the same category on client and server (unit tested). Stored ids are never rewritten |
| Library, full-page preview, device toggle, Select | Verified in browser | Both categories list 5 of 5; the modal shows the real design with Desktop / Tablet / Mobile; Select hands the template to the intake. Change template from the Studio shows the current design as "In use" |
| Intake (Association 12 steps, Puja 14 steps) | Verified in browser | Both driven from library to "Preview ready". Required fields are only organisation name, contact email and (Puja) festival; empty required fields block Continue with the field highlighted; Back keeps data; drafts autosave; an optional group (theme, visitor guide, donations) must be completed if started |
| Uploads, Drive and YouTube links | Verified | A PNG uploaded through the real file input is stored and served; a Drive folder link, a Drive video link and a YouTube link entered in the UI are persisted. Branding images never land in the gallery (unit and e2e tested) |
| Same design in preview and generated site | Verified | e2e (all 10 templates) and browser: the id chosen is the id in `generatedWebsite.selectedTemplate`, the Studio, Client Preview and `/live/<slug>` |
| Studio controls | Verified | Primary colour, accent colour and hero line edited in the Studio persist, validate (hex colours, 140-char line) and re-render the design (accent colour found on 4 rendered elements). A later Regenerate keeps the edit (e2e) |
| Change template | Verified | Association project switched from `arts-literature-society` to `dance-music-association` through the UI: stored and generated template both changed; name, hero line and committee kept |
| Publishing (local only, no Vercel) | Verified | Updated 2026-11-19: publishing no longer needs client approval or payment (technical checks only). Locally it publishes in simulated mode (see `docs/deployment/VERCEL.md`); earlier verification was against the shared `digiverse_shared` route; `/live/<slug>` renders with 0 overflow at 1440 / 820 / 390, no sample badge |
| Public data safety | Verified | Published payload carries no stored requirements, no Drive folder link, no `driveFileId`, no internal admin ids, no member email or phone (the sanitiser walks the whole website because members are copied into generated pages) |
| No invented content | Verified | Generator no longer fills placeholder phone, address, city, "Kolkata", `contact@organization.internal`, years, hours or donation text. An intake with only name and email generates a site with no sponsors, committee, events or schedule |
| Project ownership | Verified in browser and API | Second Admin cannot read or change another Admin's project (12 routes in the Cultural e2e, all 404) and gets a clear, non-identifying 409 message when reusing a name (draft kept). Super Admin "Organisations" panel reassigns with a confirmation and visibility moves to the new owner |
| API integration suites | 278/278 pass (re-run 2026-11-18 after the media fixes) | `npx tsx --test --test-concurrency=1 test/*.test.ts`, in-process on a temp SQLite DB. Includes 22 new Cultural e2e tests (10 templates end to end, plus no-mock-Drive) |
| Unit tests | 97/97 pass | `npm run test:unit`; 31 are the new Cultural library and intake tests |
| Type checks and builds | Pass | server `tsc --noEmit` 0; client `tsc -b` 0; `vite build` OK |
| Regression: Sports, Portfolio, shell | Passed | 4 Sports templates x 3 widths + reduced motion clean; 6 Portfolio previews render with no exceptions; home and staff portal load with no exceptions |
| Font licences | Verified | All 20 families are `license: "OFL"` in `google/fonts` (see `client/src/templates/cultural/LICENSES.md`) |
| Third-party template sources | Researched | No candidate had a clear reusable licence in these categories; nothing reused (see `CULTURAL_TEMPLATE_SOURCES.md`) |

## Bugs found and fixed during verification

- Retired-template lookup could return a prototype key (`__proto__`) as a template; now an own-property check, on client and server.
- Published sites carried committee members' private email and phone inside generated pages; the sanitiser now walks the whole website.
- Navigation names were cut at three words and could end on "&" ("Kaveri Arts &"); names now shorten by length and never end on a connector.
- Videos were invisible on 8 of 10 designs when a project had videos but no photos (the video grid sat inside the photo-gallery section). Found in the browser check of the mock-Drive change. Each of those designs now shows the section when there are photos or videos, the photo wall only when there are photos, and the nav link and heading follow ("Videos", "Watch", "Films"). Verified in the browser: all 10 designs x 1440 / 390 render the client's video tile with the project's real data, 0 overflow, 0 stock requests, 0 exceptions. A unit test guards the pattern.
- The Studio Media tab still showed a stock photo and a "Set Hero" button for a stored Drive video, and the stored Drive-video and YouTube-playlist records carried a stock thumbnail. Cultural projects no longer store the stock thumbnail, the Media tab shows a plain video tile and no "Set Hero", and the Sync Folder message now says why nothing was imported ("Google Drive credentials are not configured").
- Demo content used a non-reserved domain (`example.org`); all demo addresses use `.example`.

## Known limits and decisions for the owner

1. **No real Vercel deployment was performed or claimed.** Publishing now goes through the centralized publishing system (simulated locally, real Vercel code written but untested without credentials; see `docs/deployment/VERCEL.md`). Approval and payment gates were removed.
2. **Mock Drive media is off for Cultural projects (done 2026-11-18).** Cultural and Puja projects never receive the demo stock photos: with no Google credentials a Drive folder link imports nothing and the Drive route says why ("Google Drive credentials are not configured"); stock thumbnails on Drive videos and YouTube playlists are dropped when a Cultural site is generated (a plain play tile is shown), including for items stored earlier. The client's own Drive video and YouTube links are kept. Other engines (Portfolio, Sports, Event, NGO) still use the shared development demo adapter, unchanged and still tested. With `GOOGLE_DRIVE_API_KEY` or `GOOGLE_ACCESS_TOKEN` set, real folder contents are synced as before.
3. **Studio edits need a new revision before the client sees them.** Publishing uses the active revision snapshot. After editing colours or the hero line, use Regenerate or a new design variation, then publish again. Regenerate keeps the edit.
4. **Shared gallery component copy.** The Gallery step shows labels numbered "4.", "5.", "6." from `media/GalleryAndVideoSection.tsx`, shared with Event, NGO and Portfolio wizards. Left as is to avoid touching other engines.
5. **Pre-existing, not touched:** the Portfolio templates `engineer-blueprint` and `editorial-ux` overflow by 24 px at 390 px width. The Client Preview shell measures 1 px of scroll width at 820 px.
6. Tablet preview frames measure about 800 px of content inside the 820 px frame (frame padding).
7. Drive videos embed on Cultural sites through Drive's own player (added 2026-11-18). Only a genuine `https://drive.google.com/file/d/<id>/preview` URL is accepted. A Drive video has no thumbnail we may hotlink, so the design draws a plain play tile, and the auto-generated placeholder title is shown as "Video". Playback works only if the client shared the file as "anyone with the link". Verified in the browser on all 10 designs at 1440 and 390 (tile, click-to-play iframe on `drive.google.com`, 0 overflow, 0 stock requests) using a payload shaped like the generator's output; the real Drive player was not exercised with a real shared file.
8. Browser checks used headless Chrome with the file input driven directly; the OS-native picker, real devices and real Google/Vercel services were not exercised.
9. Git `user.name` / `user.email` are not configured by this work and nothing is committed. The owner said they will handle Git.
10. Existing real projects: 19 organisations in the owner's database belong to a disabled seed Admin and 3 to missing users. The owner must run Super Admin -> Organisations -> "Assign orphaned" on their own server. This work never touched the real database.

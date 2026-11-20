// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/db/repository.js';
import { extractFolderId, extractFileId, registerGoogleDriveVideoLink } from '../src/services/googleDriveService.js';
import { parseYouTubeUrl } from '../src/services/youtubeService.js';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import type { ClientRequirements, DriveMediaItem, YouTubeVideo } from '../src/types/index.js';

describe('Universal Branding, Google Drive Media & YouTube Integration Across Engines', () => {
  let adminToken = '';
  const testProjectId = `proj_test_${Date.now()}`;

  before(async () => {
    // Prime or authenticate Super Admin for test suite
    const superAdminEmail = 'contact@cogniverse.co.in';
    const superAdminUsername = 'satyakimaiti';
    const superAdminPassword = 'SuperPassword@2026!';

    const statusRes = await fetch(`${baseUrl}/api/auth/setup/status`);
    const statusData = await statusRes.json();

    if (statusData.setupRequired) {
      const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Satyaki Maiti',
          username: superAdminUsername,
          password: superAdminPassword,
          confirmPassword: superAdminPassword
        })
      });
      const setupJson = await setupRes.json();
      adminToken = setupJson.token;
    } else {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: superAdminEmail,
          password: superAdminPassword
        })
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        adminToken = loginData.token;
      } else {
        const bcrypt = await import('bcryptjs');
        const hash = await bcrypt.default.hash(superAdminPassword, 12);
        const db = getDatabase();
        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(hash, 'SUPER_ADMIN');

        const retryRes = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: superAdminEmail,
            password: superAdminPassword
          })
        });
        const retryData = await retryRes.json();
        adminToken = retryData.token;
      }
    }

    // Register a test project in repository for endpoints
    const initialReqs: ClientRequirements = {
      organizationName: 'Unified Test Sports & Cultural Club',
      category: 'sports',
      organizationType: 'sports',
      tagline: 'Leading with Passion & Integrity',
      aboutText: 'Premier regional organization fostering sportsmanship and cultural unity.',
      contactEmail: 'admin@unifiedtest.internal',
      contactPhone: '+91 98300 99999',
      primaryColor: '#0284c7',
      accentColor: '#06b6d4',
      typographyStyle: 'athletic',
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    await repository.saveProject({
      id: testProjectId,
      tenantSlug: 'unified-test-club',
      requirements: initialReqs,
      status: 'requirements_collected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // =========================================================================
  // TEST 1: MIME Type Validation on Asset Upload
  // =========================================================================
  test('1. MIME Type Validation on Asset Upload rejects unsupported formats', async () => {
    if (!adminToken) return;

    // 1a. Reject PDF upload as an image
    const pdfRes = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        filename: 'document.pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        assetType: 'logo',
        mimeType: 'application/pdf'
      })
    });
    assert.strictEqual(pdfRes.status, 400);
    const pdfData = await pdfRes.json();
    assert.match(pdfData.error, /Unsupported image format/i);

    // 1b. Accept valid PNG upload
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngRes = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        filename: 'official_crest.png',
        fileData: `data:image/png;base64,${samplePngBase64}`,
        assetType: 'logo',
        mimeType: 'image/png'
      })
    });
    assert.strictEqual(pngRes.status, 201);
    const pngData = await pngRes.json();
    assert.strictEqual(pngData.success, true);
    assert.match(pngData.url, /^\/api\/media\/uploads\//);
    assert.strictEqual(pngData.mimeType, 'image/png');
  });

  // =========================================================================
  // TEST 2: File Size Bounds on Asset Upload
  // =========================================================================
  test('2. File Size Bounds: Rejects oversized images according to assetType limits', async () => {
    if (!adminToken) return;

    // Create a dummy base64 payload larger than 10MB (~11MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0x41); // 11MB of 'A'
    const largeBase64 = largeBuffer.toString('base64');

    const res = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        filename: 'giant_banner.jpg',
        fileData: `data:image/jpeg;base64,${largeBase64}`,
        assetType: 'hero',
        mimeType: 'image/jpeg'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /exceeds the 10(\.0)?MB limit for hero/i);
  });

  // =========================================================================
  // TEST 3: Google Drive Folder Link Extraction & Storage
  // =========================================================================
  test('3. Google Drive Folder Link Extraction correctly extracts IDs', () => {
    const url1 = 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0jKlMnOpQrStUvW';
    assert.strictEqual(extractFolderId(url1), '1a2b3c4d5e6f7g8h9i0jKlMnOpQrStUvW');

    const url2 = 'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz123456';
    assert.strictEqual(extractFolderId(url2), '1AbCdEfGhIjKlMnOpQrStUvWxYz123456');

    const rawId = '1AbCdEfGhIjKlMnOpQrStUvWxYz123456';
    assert.strictEqual(extractFolderId(rawId), rawId);

    const invalid = 'https://notadriveurl.com/some/path';
    assert.strictEqual(extractFolderId(invalid), null);
  });

  // =========================================================================
  // TEST 4: Google Drive Single-File Video Link Parsing & Registration
  // =========================================================================
  test('4. Google Drive Video Link Parsing and Registration', async () => {
    const videoUrl1 = 'https://drive.google.com/file/d/1vIdE0_FiLe_Id_1234567890abcdef/view?usp=sharing';
    const extracted1 = extractFileId(videoUrl1);
    assert.strictEqual(extracted1, '1vIdE0_FiLe_Id_1234567890abcdef');

    const videoUrl2 = 'https://drive.google.com/uc?id=1vIdE0_FiLe_Id_1234567890abcdef';
    assert.strictEqual(extractFileId(videoUrl2), '1vIdE0_FiLe_Id_1234567890abcdef');

    // Test programmatic registration via service
    const registered = await registerGoogleDriveVideoLink(testProjectId, videoUrl1, 'Match Highlights Derby');
    assert.ok(registered);
    assert.strictEqual(registered.mediaType, 'video');
    assert.strictEqual(registered.sectionAssignment, 'video');
    assert.strictEqual(registered.driveFileId, '1vIdE0_FiLe_Id_1234567890abcdef');
    assert.strictEqual(registered.name, 'Match Highlights Derby');

    // Test via HTTP endpoint
    if (adminToken) {
      const httpRes = await fetch(`${baseUrl}/api/media/drive/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          projectId: testProjectId,
          videoUrl: 'https://drive.google.com/file/d/1XyZ_Video_File_ID_987654321/view',
          title: 'Official Ceremony Video'
        })
      });
      assert.strictEqual(httpRes.status, 201);
      const httpData = await httpRes.json();
      assert.strictEqual(httpData.success, true);
      assert.strictEqual(httpData.item.driveFileId, '1XyZ_Video_File_ID_987654321');
    }
  });

  // =========================================================================
  // TEST 5: YouTube Playlist & Video Link Parsing
  // =========================================================================
  test('5. YouTube Video and Playlist Link Parsing', () => {
    // 5a. Playlist URL
    const plUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt';
    const parsedPl = parseYouTubeUrl(plUrl, '2026 Season Match Highlights');
    assert.strictEqual(parsedPl.isValid, true);
    assert.strictEqual(parsedPl.type, 'playlist');
    assert.strictEqual(parsedPl.identifier, 'PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt');
    assert.strictEqual(parsedPl.embedUrl, 'https://www.youtube-nocookie.com/embed/videoseries?list=PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt');

    // 5b. Standard Watch URL
    const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const parsedWatch = parseYouTubeUrl(watchUrl, 'Rickroll Highlight');
    assert.strictEqual(parsedWatch.isValid, true);
    assert.strictEqual(parsedWatch.type, 'video');
    assert.strictEqual(parsedWatch.identifier, 'dQw4w9WgXcQ');
    assert.strictEqual(parsedWatch.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

    // 5c. Shorts URL
    const shortsUrl = 'https://www.youtube.com/shorts/12345678901';
    const parsedShorts = parseYouTubeUrl(shortsUrl);
    assert.strictEqual(parsedShorts.isValid, true);
    assert.strictEqual(parsedShorts.type, 'shorts');
  });

  // =========================================================================
  // TEST 6: Strict Non-Contamination Rule Verification
  // =========================================================================
  test('6. Strict Non-Contamination Rule: Drive Gallery photos never contaminate Logo or Hero Banner', () => {
    const driveGalleryImages: DriveMediaItem[] = [
      {
        id: 'drv_gallery_1',
        projectId: 'proj_separation_test',
        driveFileId: 'drive_photo_raw_123',
        name: 'festival-crowd.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        isApproved: true,
        sectionAssignment: 'hero', // Even if legacy or mis-assigned to hero!
        createdAt: new Date().toISOString()
      },
      {
        id: 'drv_gallery_2',
        projectId: 'proj_separation_test',
        driveFileId: 'drive_photo_raw_456',
        name: 'pandal-art.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        isApproved: true,
        sectionAssignment: 'gallery',
        createdAt: new Date().toISOString()
      }
    ];

    // Case 6A: Client explicitly uploaded official hero banner
    const reqsWithCover: ClientRequirements = {
      organizationName: 'Heritage Cultural Samiti',
      category: 'cultural',
      organizationType: 'cultural',
      tagline: 'Preserving Heritage with Dignity',
      aboutText: 'A revered cultural institution.',
      contactEmail: 'info@samiti.internal',
      contactPhone: '+91 98300 11111',
      logoUrl: 'https://cdn.digiverse.site/official_emblem.png',
      coverImageUrl: 'https://cdn.digiverse.site/official_hero_banner.jpg',
      primaryColor: '#831843',
      accentColor: '#f59e0b',
      typographyStyle: 'heritage',
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    const generatedA = synthesizeWebsite(reqsWithCover, driveGalleryImages, []);
    // Hero banner must strictly be the official uploaded cover banner
    assert.strictEqual(generatedA.heroImage, 'https://cdn.digiverse.site/official_hero_banner.jpg');
    // Navigation logo must strictly be the official uploaded logo
    assert.strictEqual(generatedA.navigationBar?.logoUrl, 'https://cdn.digiverse.site/official_emblem.png');

    // Case 6B: Client did NOT upload hero banner
    const reqsWithoutCover: ClientRequirements = {
      ...reqsWithCover,
      coverImageUrl: undefined
    };

    const generatedB = synthesizeWebsite(reqsWithoutCover, driveGalleryImages, []);
    // Hero banner must NEVER be set to `/api/media/drive/proxy/drive_photo_raw_123`!
    assert.notStrictEqual(generatedB.heroImage, '/api/media/drive/proxy/drive_photo_raw_123');
    assert.notStrictEqual(generatedB.heroImage, '/api/media/drive/proxy/drive_photo_raw_456');
    assert.ok(!generatedB.heroImage?.includes('drive_photo_raw'), 'Hero banner must never borrow Drive gallery photos');

    // Gallery photos must strictly contain the drive gallery images
    assert.ok(generatedB.galleryPhotos && generatedB.galleryPhotos.length >= 2);
    assert.strictEqual(generatedB.galleryPhotos[0].url, '/api/media/drive/proxy/drive_photo_raw_123');
  });

  // =========================================================================
  // TEST 7: Gallery & Video Showcase Ingestion Verification
  // =========================================================================
  test('7. Gallery & Video Showcase Ingestion: Ingests Drive videos and YouTube playlists into featuredVideos', () => {
    const driveMedia: DriveMediaItem[] = [
      {
        id: 'drv_vid_1',
        projectId: 'proj_video_test',
        driveFileId: 'drv_file_vid_777',
        name: 'Annual Concert Final Performance.mp4',
        mimeType: 'video/mp4',
        mediaType: 'video',
        isApproved: true,
        sectionAssignment: 'video',
        createdAt: new Date().toISOString()
      }
    ];

    const ytVideos: YouTubeVideo[] = [
      {
        id: 'yt_vid_1',
        projectId: 'proj_video_test',
        videoId: 'PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt',
        originalUrl: 'https://www.youtube.com/watch?v=demo&list=PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt',
        embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLrAXtmErZgOdP_8GztsuKi9uhSBiR-Awt',
        title: 'Full Program Playlist',
        category: 'Playlist',
        displayOrder: 1,
        isPublished: true,
        videoType: 'playlist',
        createdAt: new Date().toISOString()
      }
    ];

    const reqs: ClientRequirements = {
      organizationName: 'Global Symphony Association',
      category: 'cultural',
      tagline: 'Orchestrating Unity',
      aboutText: 'Musical society dedicated to orchestral arts.',
      contactEmail: 'contact@globalsymphony.internal',
      contactPhone: '+91 98300 22222',
      primaryColor: '#1e3a8a',
      accentColor: '#d97706',
      typographyStyle: 'classical',
      additionalBrandingImages: [
        'https://cdn.digiverse.site/co-sponsor-1.png',
        'https://cdn.digiverse.site/co-sponsor-2.png'
      ],
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(reqs, driveMedia, ytVideos);

    // Verify featuredVideos contains both YouTube playlist and Google Drive video
    assert.ok(site.featuredVideos && site.featuredVideos.length === 2);
    
    const ytItem = site.featuredVideos.find(v => v.provider === 'youtube');
    assert.ok(ytItem);
    assert.strictEqual(ytItem.videoType, 'playlist');
    assert.match(ytItem.embedUrl, /videoseries\?list=/);

    const drvItem = site.featuredVideos.find(v => v.provider === 'google_drive');
    assert.ok(drvItem);
    assert.strictEqual(drvItem.videoId, 'drv_file_vid_777');
    assert.strictEqual(drvItem.embedUrl, 'https://drive.google.com/file/d/drv_file_vid_777/preview');

    // Verify additional branding images are preserved on site
    assert.deepStrictEqual(site.additionalBrandingImages, [
      'https://cdn.digiverse.site/co-sponsor-1.png',
      'https://cdn.digiverse.site/co-sponsor-2.png'
    ]);
  });

  // =========================================================================
  // TEST 8: Sports Engine End-to-End Synthesis with Full Branding & Media
  // =========================================================================
  test('8. Sports Engine End-to-End Synthesis with Complete Branding & Media Pipeline', () => {
    const sportsReqs: ClientRequirements = {
      organizationName: 'Royal United FC',
      category: 'sports',
      organizationType: 'sports',
      sportsArchetype: 'sports_club',
      tagline: 'Victoria Concordia Crescit',
      aboutText: 'Elite community sports club with 120 years of sporting heritage.',
      contactEmail: 'management@royalunited.internal',
      contactPhone: '+91 33 2244 5566',
      logoUrl: 'https://cdn.royalunited.internal/crest_vector.svg',
      coverImageUrl: 'https://cdn.royalunited.internal/stadium_floodlights.jpg',
      additionalBrandingImages: ['https://cdn.royalunited.internal/monochrome_crest.png'],
      primaryColor: '#990000',
      accentColor: '#FFCC00',
      typographyStyle: 'athletic',
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(sportsReqs, [], []);
    assert.strictEqual(site.navigationBar?.brandName, 'Royal United FC');
    assert.strictEqual(site.navigationBar?.logoUrl, 'https://cdn.royalunited.internal/crest_vector.svg');
    assert.strictEqual(site.heroImage, 'https://cdn.royalunited.internal/stadium_floodlights.jpg');
    assert.deepStrictEqual(site.additionalBrandingImages, ['https://cdn.royalunited.internal/monochrome_crest.png']);
  });

  // =========================================================================
  // TEST 9: Event & Cultural Engine End-to-End Synthesis
  // =========================================================================
  test('9. Event and Cultural Engine End-to-End Synthesis with Branding Parity', () => {
    const eventReqs: ClientRequirements = {
      organizationName: 'Apex Technology Summit 2026',
      category: 'event',
      eventCategory: 'conference_seminar',
      tagline: 'Frontiers of Artificial Intelligence and Distributed Computing',
      aboutText: 'Leading international computing conference.',
      contactEmail: 'secretariat@apextech.internal',
      contactPhone: '+91 80 4455 6677',
      logoUrl: 'https://cdn.apextech.internal/apex_logo_light.svg',
      coverImageUrl: 'https://cdn.apextech.internal/auditorium_keynote_stage.jpg',
      primaryColor: '#0f172a',
      accentColor: '#38bdf8',
      typographyStyle: 'modern',
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(eventReqs, [], []);
    assert.strictEqual(site.navigationBar?.brandName, 'Apex Technology Summit 2026');
    assert.strictEqual(site.navigationBar?.logoUrl, 'https://cdn.apextech.internal/apex_logo_light.svg');
    assert.strictEqual(site.heroImage, 'https://cdn.apextech.internal/auditorium_keynote_stage.jpg');
    assert.strictEqual(site.eventCategory, 'conference_seminar');
  });

  // =========================================================================
  // TEST 10: Social & NGO Engine End-to-End Synthesis
  // =========================================================================
  test('10. Social & NGO Engine End-to-End Synthesis with Full Branding & Media', () => {
    const ngoReqs: ClientRequirements = {
      organizationName: 'Jal Chetna Water Foundation',
      category: 'ngo',
      ngoArchetype: 'grassroots_ngo',
      tagline: 'Community Watershed Stewardship & Potable Water Rights',
      aboutText: 'Restoring indigenous water retention lakes across 200 arid villages.',
      contactEmail: 'action@jalchetna.internal',
      contactPhone: '+91 141 2233 4455',
      logoUrl: 'https://cdn.jalchetna.internal/emblem_circular.png',
      coverImageUrl: 'https://cdn.jalchetna.internal/check_dam_watershed_wide.jpg',
      additionalBrandingImages: ['https://cdn.jalchetna.internal/trust_seal.png'],
      primaryColor: '#166534',
      accentColor: '#d97706',
      typographyStyle: 'humanist',
      events: [],
      committee: [],
      gallery: [],
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(ngoReqs, [], []);
    assert.strictEqual(site.navigationBar?.brandName, 'Jal Chetna Water Foundation');
    assert.strictEqual(site.navigationBar?.logoUrl, 'https://cdn.jalchetna.internal/emblem_circular.png');
    assert.strictEqual(site.heroImage, 'https://cdn.jalchetna.internal/check_dam_watershed_wide.jpg');
    assert.deepStrictEqual(site.additionalBrandingImages, ['https://cdn.jalchetna.internal/trust_seal.png']);
    assert.strictEqual(site.ngoArchetype, 'grassroots_ngo');
  });
});

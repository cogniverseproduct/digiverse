import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import { ClientRequirements, DriveMediaItem, YouTubeVideo } from '../src/types/index.js';

describe('AI Website Synthesizer & Media Composition', () => {
  const baseCulturalReqs: ClientRequirements = {
    organizationName: 'Navodaya Cultural Society & Kali Puja',
    organizationType: 'cultural',
    tagline: 'Preserving Bengali Heritage & Traditions',
    contactEmail: 'contact@navodaya.org',
    contactPhone: '+91 98300 99999',
    primaryColor: '#881337',
    accentColor: '#D97706',
    typographyStyle: 'heritage',
    preferredLanguage: 'bilingual',
    aboutText: 'Dedicated to cultural traditions, Diwali, and community youth initiatives.',
    enabledSections: {
      hero: true,
      events: true,
      about: true,
      committee: true,
      gallery: true,
      contact: true
    },
    events: [
      {
        id: 'evt_1',
        title: 'Shyama Puja & Aarti',
        date: 'Nov 02, 2026',
        time: '08:00 PM',
        venue: 'Main Samiti Grounds',
        category: 'Rituals'
      }
    ],
    committee: [
      { id: 'com_1', name: 'Alok Chatterjee', role: 'President', department: 'Executive' }
    ],
    gallery: [
      { id: 'g_1', title: 'Kali Idol', subtitle: 'Sculpted pratima', category: 'Ritual', iconType: 'flame' }
    ]
  };

  test('should synthesize cultural website with Drive photos and YouTube videos', () => {
    const driveItems: DriveMediaItem[] = [
      {
        id: 'dmi_test_1',
        projectId: 'proj_test',
        driveFileId: 'drv_durga_hero',
        name: 'durga-hero.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        isApproved: true,
        sectionAssignment: 'hero',
        createdAt: new Date().toISOString()
      },
      {
        id: 'dmi_test_2',
        projectId: 'proj_test',
        driveFileId: 'drv_kumartuli',
        name: 'kumartuli-clay.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        isApproved: true,
        sectionAssignment: 'gallery',
        createdAt: new Date().toISOString()
      }
    ];

    const youtubeVideos: YouTubeVideo[] = [
      {
        id: 'yt_test_1',
        projectId: 'proj_test',
        videoId: '7Y4lFv0Y1gQ',
        originalUrl: 'https://www.youtube.com/watch?v=7Y4lFv0Y1gQ',
        embedUrl: 'https://www.youtube-nocookie.com/embed/7Y4lFv0Y1gQ',
        title: 'Sandhya Aarti Special Stream',
        category: 'Rituals',
        displayOrder: 1,
        isPublished: true,
        createdAt: new Date().toISOString()
      }
    ];

    const generated = synthesizeWebsite(baseCulturalReqs, driveItems, youtubeVideos);

    // Drive images feed the gallery only; the hero banner is never taken from Drive.
    assert.notEqual(generated.heroImage, '/api/media/drive/proxy/drv_durga_hero');
    assert.ok(generated.galleryPhotos && generated.galleryPhotos.length > 0);
    assert.equal(generated.galleryPhotos[0].url, '/api/media/drive/proxy/drv_durga_hero');
    assert.equal(generated.galleryPhotos[1].url, '/api/media/drive/proxy/drv_kumartuli');
    
    assert.ok(generated.featuredVideos && generated.featuredVideos.length === 1);
    assert.equal(generated.featuredVideos[0].videoId, '7Y4lFv0Y1gQ');
    assert.equal(generated.featuredVideos[0].embedUrl, 'https://www.youtube-nocookie.com/embed/7Y4lFv0Y1gQ');

    // Organization and events verification
    assert.ok(generated.heroHeadline.includes('Navodaya'));
    assert.ok(generated.eventsTitle.includes('Cultural'));
  });

  test('should synthesize sports club website with athletic themes', () => {
    const sportsReqs: ClientRequirements = {
      ...baseCulturalReqs,
      organizationName: 'Mohun Bagan Youth Sports Club',
      organizationType: 'sports',
      preferredLanguage: 'english'
    };

    const generated = synthesizeWebsite(sportsReqs);

    assert.equal(generated.themeAccent, 'neon-cyan');
    assert.equal(generated.layoutPreset, 'split');
    assert.ok(generated.heroHeadline.includes('Mohun Bagan'));
    assert.ok(generated.eventsTitle.includes('Sports'));
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  extractFolderId, 
  isSupportedMediaType, 
  syncGoogleDriveMedia, 
  resolveProxyFilePath 
} from '../src/services/googleDriveService.js';

describe('Google Drive Media Discovery & Delivery', () => {
  test('should extract Google Drive folder ID correctly from standard URLs and raw IDs', () => {
    const urls = [
      { input: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ', expected: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ' },
      { input: 'https://drive.google.com/drive/u/0/folders/1XYZ9876543210ABC', expected: '1XYZ9876543210ABC' },
      { input: 'https://drive.google.com/open?id=folderId123456789', expected: 'folderId123456789' },
      { input: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_authorized', expected: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_authorized' }
    ];

    for (const { input, expected } of urls) {
      const extracted = extractFolderId(input);
      assert.equal(extracted, expected);
    }
  });

  test('should reject invalid folder inputs', () => {
    assert.equal(extractFolderId(''), null);
    assert.equal(extractFolderId('http://example.com/not-drive'), null);
    assert.equal(extractFolderId('short'), null);
  });

  test('should filter supported media types', () => {
    assert.deepEqual(isSupportedMediaType('image/jpeg'), { isSupported: true, mediaType: 'image' });
    assert.deepEqual(isSupportedMediaType('image/png'), { isSupported: true, mediaType: 'image' });
    assert.deepEqual(isSupportedMediaType('image/webp'), { isSupported: true, mediaType: 'image' });
    assert.deepEqual(isSupportedMediaType('video/mp4'), { isSupported: true, mediaType: 'video' });
    assert.deepEqual(isSupportedMediaType('video/webm'), { isSupported: true, mediaType: 'video' });
    
    assert.equal(isSupportedMediaType('application/pdf').isSupported, false);
    assert.equal(isSupportedMediaType('application/zip').isSupported, false);
    assert.equal(isSupportedMediaType('text/plain').isSupported, false);
  });

  test('should discover mock media assets when live credentials are not set', async () => {
    const result = await syncGoogleDriveMedia('test_proj_01', 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'cultural');

    assert.equal(result.source.status, 'connected');
    assert.equal(result.isMock, true);
    assert.ok(result.discoveredItems.length > 0, 'Discovered items should not be empty');
    
    const heroItem = result.discoveredItems.find(i => i.sectionAssignment === 'hero');
    assert.ok(heroItem, 'Should have an asset assigned to hero');
    assert.equal(heroItem.mediaType, 'image');
  });

  test('should resolve local proxy file paths correctly for secure delivery', () => {
    const resolved = resolveProxyFilePath('drv_durga_hero');
    assert.ok(resolved, 'Proxy path should resolve for drv_durga_hero');
    assert.equal(resolved.mimeType, 'image/jpeg');
    assert.ok(resolved.publicPath.includes('durga-hero.jpg'));
  });
});

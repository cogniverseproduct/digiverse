import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeUrl } from '../src/services/youtubeService.js';

describe('YouTube Video Link Validation & Safe Embed Parser', () => {
  test('should parse standard youtube.com watch URLs', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = parseYouTubeUrl(url, 'Sandhya Aarti Ritual', 'Rituals');

    assert.equal(result.isValid, true);
    assert.equal(result.type, 'video');
    assert.equal(result.identifier, 'dQw4w9WgXcQ');
    assert.equal(result.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    assert.equal(result.thumbnailUrl, 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    assert.equal(result.defaultTitle, 'Sandhya Aarti Ritual');
  });

  test('should parse youtu.be short URLs', () => {
    const url = 'https://youtu.be/LXb3EKWsInQ';
    const result = parseYouTubeUrl(url, undefined, 'Music');

    assert.equal(result.isValid, true);
    assert.equal(result.type, 'video');
    assert.equal(result.identifier, 'LXb3EKWsInQ');
    assert.equal(result.embedUrl, 'https://www.youtube-nocookie.com/embed/LXb3EKWsInQ');
    assert.ok(result.defaultTitle.includes('Cultural Performance'));
  });

  test('should parse youtube.com/shorts URLs', () => {
    const url = 'https://www.youtube.com/shorts/abcd1234efg';
    const result = parseYouTubeUrl(url, 'Dhunuchi Dance Short', 'Dance');

    assert.equal(result.isValid, true);
    assert.equal(result.type, 'shorts');
    assert.equal(result.identifier, 'abcd1234efg');
    assert.equal(result.embedUrl, 'https://www.youtube-nocookie.com/embed/abcd1234efg');
  });

  test('should parse youtube playlist URLs', () => {
    const url = 'https://www.youtube.com/playlist?list=PL1234567890abcdef';
    const result = parseYouTubeUrl(url, 'Durga Puja 2026 Full Recordings', 'Festivals');

    assert.equal(result.isValid, true);
    assert.equal(result.type, 'playlist');
    assert.equal(result.identifier, 'PL1234567890abcdef');
    assert.equal(result.embedUrl, 'https://www.youtube-nocookie.com/embed/videoseries?list=PL1234567890abcdef');
  });

  test('should strictly reject malicious and non-YouTube URLs', () => {
    const invalidUrls = [
      'https://vimeo.com/12345678',
      'https://malicious-site.com/video.mp4',
      'javascript:alert(1)',
      'not_a_valid_url',
      '',
      'https://youtube.com.evil.com/watch?v=123'
    ];

    for (const url of invalidUrls) {
      const result = parseYouTubeUrl(url);
      assert.equal(result.isValid, false, `URL "${url}" should be rejected`);
      assert.ok(result.error);
    }
  });
});

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { sanitizeWebsiteForPublic } from '../../src/services/publicSiteSanitizer.js';

describe('public site sanitizer: raw Google Drive links', () => {
  const website: any = {
    portfolioData: {
      media: {
        googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/PRIVATE_FOLDER_ID',
        googleDriveVideoUrl: 'https://drive.google.com/file/d/PRIVATE_FILE_ID/view',
        googleDriveVideoUrls: [
          'https://drive.google.com/file/d/ANOTHER_PRIVATE_ID/view',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        ],
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ'
      }
    },
    sportsData: { media: { googleDriveUrl: 'https://drive.google.com/drive/folders/SPORTS_FOLDER', googleDriveMediaFolders: { images: { folderId: 'SECRET' } } } },
    sections: [{ data: { googleDriveGalleryUrl: 'https://docs.google.com/document/d/DOC_ID/edit' } }],
    requirements: { googleDriveUrl: 'https://drive.google.com/drive/folders/REQ' }
  };

  test('removes Drive folder/file links wherever they appear, keeps non-Drive links', () => {
    const out: any = sanitizeWebsiteForPublic(website);
    const text = JSON.stringify(out);
    for (const secret of ['PRIVATE_FOLDER_ID', 'PRIVATE_FILE_ID', 'ANOTHER_PRIVATE_ID', 'SPORTS_FOLDER', 'SECRET', 'DOC_ID', 'REQ']) {
      assert.ok(!text.includes(secret), `${secret} leaked into public output`);
    }
    assert.deepEqual(out.portfolioData.media.googleDriveVideoUrls, ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    assert.equal(out.portfolioData.media.youtubeUrl, 'https://youtu.be/dQw4w9WgXcQ');
  });

  test('does not mutate the stored website object', () => {
    sanitizeWebsiteForPublic(website);
    assert.equal(website.portfolioData.media.googleDriveGalleryUrl, 'https://drive.google.com/drive/folders/PRIVATE_FOLDER_ID');
  });
});

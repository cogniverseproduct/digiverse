export interface ParsedYouTube {
  isValid: boolean;
  type: 'video' | 'shorts' | 'playlist';
  identifier: string; // video ID or playlist ID
  embedUrl: string;
  thumbnailUrl: string;
  defaultTitle: string;
  error?: string;
}

export function parseYouTubeUrl(rawUrl: string, suggestedTitle?: string, category: string = 'cultural'): ParsedYouTube {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      type: 'video',
      identifier: '',
      embedUrl: '',
      thumbnailUrl: '',
      defaultTitle: '',
      error: 'YouTube URL must be a non-empty string.'
    };
  }

  const trimmed = rawUrl.trim();

  // Playlist Pattern
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    const playlistId = playlistMatch[1];
    return {
      isValid: true,
      type: 'playlist',
      identifier: playlistId,
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      defaultTitle: suggestedTitle?.trim() || 'Festival & Community Video Playlist'
    };
  }

  // Shorts Pattern
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    const videoId = shortsMatch[1];
    return {
      isValid: true,
      type: 'shorts',
      identifier: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      defaultTitle: suggestedTitle?.trim() || `${formatCategoryTitle(category)} Short Highlight`
    };
  }

  // Standard Watch URL (youtube.com/watch?v=...)
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    const videoId = watchMatch[1];
    return {
      isValid: true,
      type: 'video',
      identifier: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      defaultTitle: suggestedTitle?.trim() || `${formatCategoryTitle(category)} Program Recording`
    };
  }

  // Short URL (youtu.be/...)
  const youtuBeMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) {
    const videoId = youtuBeMatch[1];
    return {
      isValid: true,
      type: 'video',
      identifier: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      defaultTitle: suggestedTitle?.trim() || `${formatCategoryTitle(category)} Program Recording`
    };
  }

  // Embed URL (youtube.com/embed/...)
  const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) {
    const videoId = embedMatch[1];
    return {
      isValid: true,
      type: 'video',
      identifier: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      defaultTitle: suggestedTitle?.trim() || `${formatCategoryTitle(category)} Video Stream`
    };
  }

  return {
    isValid: false,
    type: 'video',
    identifier: '',
    embedUrl: '',
    thumbnailUrl: '',
    defaultTitle: '',
    error: 'Invalid YouTube URL. Please provide a valid YouTube link (e.g. https://www.youtube.com/watch?v=..., https://youtu.be/..., or https://www.youtube.com/shorts/...)'
  };
}

function formatCategoryTitle(category: string): string {
  switch (category.toLowerCase()) {
    case 'durga puja':
    case 'rituals':
    case 'festivals':
      return 'Puja Ritual';
    case 'music':
    case 'dance':
    case 'cultural':
      return 'Cultural Performance';
    case 'sports':
    case 'athletics':
      return 'Match Day';
    default:
      return 'Community Event';
  }
}

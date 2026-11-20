import React, { useState } from 'react';
import { 
  HardDrive, 
  Youtube, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Film,
  PlaySquare,
  ListVideo
} from 'lucide-react';

export interface GalleryAndVideoSectionProps {
  googleDriveGalleryUrl: string;
  onGoogleDriveGalleryUrlChange: (url: string) => void;
  googleDriveVideoUrl?: string;
  onGoogleDriveVideoUrlChange?: (url: string) => void;
  googleDriveVideoUrls?: string[];
  onGoogleDriveVideoUrlsChange?: (urls: string[]) => void;
  youtubeUrls: string[];
  onYoutubeUrlsChange: (urls: string[]) => void;
  youtubePlaylistUrls?: string[];
  onYoutubePlaylistUrlsChange?: (urls: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const GalleryAndVideoSection: React.FC<GalleryAndVideoSectionProps> = ({
  googleDriveGalleryUrl,
  onGoogleDriveGalleryUrlChange,
  googleDriveVideoUrl = '',
  onGoogleDriveVideoUrlChange,
  googleDriveVideoUrls = [],
  onGoogleDriveVideoUrlsChange,
  youtubeUrls = [],
  onYoutubeUrlsChange,
  youtubePlaylistUrls = [],
  onYoutubePlaylistUrlsChange,
  title = 'Website Gallery & Video Content Pipeline',
  subtitle = 'Provide links to your cloud media repositories and video channels. All assets collected here are strictly assigned to Photo Galleries and Video Showcases.'
}) => {
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newDriveVideoUrl, setNewDriveVideoUrl] = useState('');

  // Validate Google Drive Folder URL
  const extractDriveFolderId = (url: string): string | null => {
    if (!url) return null;
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch?.[1]) return idMatch[1];
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return null;
  };

  // Validate Google Drive File/Video URL
  const extractDriveFileId = (url: string): string | null => {
    if (!url) return null;
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch?.[1]) return fileMatch[1];
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch?.[1]) return idMatch[1];
    if (/^[a-zA-Z0-9_-]{15,}$/.test(url.trim())) return url.trim();
    return null;
  };

  // Detect YouTube URL type
  const getYouTubeInfo = (url: string): { type: 'playlist' | 'video' | 'shorts' | 'invalid'; id: string } => {
    if (!url) return { type: 'invalid', id: '' };
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (playlistMatch?.[1]) return { type: 'playlist', id: playlistMatch[1] };
    const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (shortsMatch?.[1]) return { type: 'shorts', id: shortsMatch[1] };
    const watchMatch = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch?.[1]) return { type: 'video', id: watchMatch[1] };
    return { type: 'invalid', id: '' };
  };

  const detectedFolderId = extractDriveFolderId(googleDriveGalleryUrl);
  const detectedVideoId = extractDriveFileId(googleDriveVideoUrl);

  const handleAddYouTube = () => {
    const trimmed = newYoutubeUrl.trim();
    if (!trimmed) return;

    const info = getYouTubeInfo(trimmed);
    if (info.type === 'playlist') {
      if (onYoutubePlaylistUrlsChange) {
        onYoutubePlaylistUrlsChange([...youtubePlaylistUrls, trimmed]);
      } else {
        onYoutubeUrlsChange([...youtubeUrls, trimmed]);
      }
    } else {
      onYoutubeUrlsChange([...youtubeUrls, trimmed]);
    }
    setNewYoutubeUrl('');
  };

  const handleRemoveYouTube = (indexToRemove: number) => {
    onYoutubeUrlsChange(youtubeUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemovePlaylist = (indexToRemove: number) => {
    if (onYoutubePlaylistUrlsChange) {
      onYoutubePlaylistUrlsChange(youtubePlaylistUrls.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleAddDriveVideo = () => {
    const trimmed = newDriveVideoUrl.trim();
    if (!trimmed) return;

    if (onGoogleDriveVideoUrlsChange) {
      onGoogleDriveVideoUrlsChange([...googleDriveVideoUrls, trimmed]);
    } else if (onGoogleDriveVideoUrlChange) {
      onGoogleDriveVideoUrlChange(trimmed);
    }
    setNewDriveVideoUrl('');
  };

  const handleRemoveDriveVideoItem = (indexToRemove: number) => {
    if (onGoogleDriveVideoUrlsChange) {
      onGoogleDriveVideoUrlsChange(googleDriveVideoUrls.filter((_, idx) => idx !== indexToRemove));
    }
  };

  return (
    <div className="space-y-6">
      {/* Strict Non-Contamination Policy Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-50 via-amber-50 to-dv-canvas p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-700/60">
                Strict Separation Policy
              </span>
              <span className="text-xs font-semibold text-dv-ink">Group B: Gallery & Video Media</span>
            </div>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              Assets provided in this section are <span className="font-semibold text-dv-ink underline decoration-amber-400">strictly isolated</span>. 
              Google Drive gallery photos go only to the Photo Gallery. Google Drive and YouTube videos go only to the Video Showcase. 
              They will <span className="font-semibold text-dv-ink">never</span> overwrite, replace, or contaminate your official Logo or Hero Banner.
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="border-b border-dv-line pb-3">
        <h3 className="text-base font-bold text-dv-ink tracking-wide">{title}</h3>
        <p className="text-xs text-dv-muted mt-0.5">{subtitle}</p>
      </div>

      {/* =========================================
          ITEM 4: GOOGLE DRIVE GALLERY FOLDER LINK
         ========================================= */}
      <div className="rounded-xl border border-dv-line bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-700" />
            4. Google Drive Media / Gallery Folder Link
          </label>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-800/60">
            Syncs to Photo Gallery
          </span>
        </div>
        <p className="text-xs text-dv-muted mb-3">
          Provide a link to a Google Drive folder containing high-resolution event, program, or festive photos.
        </p>

        <div className="relative">
          <input
            type="url"
            value={googleDriveGalleryUrl}
            onChange={(e) => onGoogleDriveGalleryUrlChange(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
            className="w-full px-3.5 py-2 text-xs bg-white border border-dv-line rounded-lg text-dv-ink placeholder-dv-muted focus:outline-none focus:border-emerald-500 font-mono transition"
          />
          {googleDriveGalleryUrl && (
            <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
              {detectedFolderId ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  ID: {detectedFolderId.substring(0, 10)}...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-800/50">
                  <AlertCircle className="w-3 h-3" />
                  Invalid Folder URL
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-[11px] text-dv-muted mt-2 flex items-center gap-1">
          <span>Supported format:</span>
          <code className="text-dv-muted bg-white px-1 py-0.5 rounded">https://drive.google.com/drive/folders/&#123;id&#125;</code>
        </p>
      </div>

      {/* =========================================
          ITEM 5: GOOGLE DRIVE VIDEO LINK
         ========================================= */}
      <div className="rounded-xl border border-dv-line bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-700" />
            5. Google Drive Video Link
          </label>
          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-800/60">
            Streamed in Video Gallery
          </span>
        </div>
        <p className="text-xs text-dv-muted mb-3">
          Direct Google Drive link to an MP4 video file. Will be streamed securely with modal preview.
        </p>

        {/* Single primary input if no multi-list callback */}
        {onGoogleDriveVideoUrlChange && (
          <div className="relative mb-3">
            <input
              type="url"
              value={googleDriveVideoUrl}
              onChange={(e) => onGoogleDriveVideoUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/1XyZ_Video_File_ID/view"
              className="w-full px-3.5 py-2 text-xs bg-white border border-dv-line rounded-lg text-dv-ink placeholder-dv-muted focus:outline-none focus:border-purple-500 font-mono transition"
            />
            {googleDriveVideoUrl && (
              <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
                {detectedVideoId ? (
                  <span className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    File ID: {detectedVideoId.substring(0, 10)}...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-800/50">
                    <AlertCircle className="w-3 h-3" />
                    Invalid File URL
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-video addition if supported */}
        {onGoogleDriveVideoUrlsChange && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newDriveVideoUrl}
                onChange={(e) => setNewDriveVideoUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-dv-line rounded-lg text-dv-ink placeholder-dv-muted focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddDriveVideo}
                disabled={!newDriveVideoUrl.trim() || !extractDriveFileId(newDriveVideoUrl)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Drive Video
              </button>
            </div>

            {googleDriveVideoUrls.length > 0 && (
              <div className="space-y-2 mt-2">
                {googleDriveVideoUrls.map((vidUrl, idx) => (
                  <div 
                    key={`drv_vid_${idx}`} 
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-dv-line text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PlaySquare className="w-4 h-4 text-purple-700 flex-shrink-0" />
                      <span className="font-mono text-dv-ink-2 truncate">{vidUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDriveVideoItem(idx)}
                      className="p-1 rounded text-dv-muted hover:text-rose-700 hover:bg-rose-50 transition"
                      title="Remove video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-dv-muted mt-2 flex items-center gap-1">
          <span>Supported format:</span>
          <code className="text-dv-muted bg-white px-1 py-0.5 rounded">https://drive.google.com/file/d/&#123;fileId&#125;/view</code>
        </p>
      </div>

      {/* =========================================
          ITEM 6: YOUTUBE VIDEO / PLAYLIST LINKS
         ========================================= */}
      <div className="rounded-xl border border-dv-line bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
            <Youtube className="w-4 h-4 text-rose-500" />
            6. YouTube Video & Playlist Links
          </label>
          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-800/60">
            {youtubeUrls.length + (youtubePlaylistUrls?.length || 0)} Added
          </span>
        </div>
        <p className="text-xs text-dv-muted mb-3">
          Add YouTube video streams, match highlights, ceremonial recordings, or curated playlists.
        </p>

        {/* Input box */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="url"
            value={newYoutubeUrl}
            onChange={(e) => setNewYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or .../playlist?list=..."
            className="flex-1 px-3.5 py-2 text-xs bg-white border border-dv-line rounded-lg text-dv-ink placeholder-dv-muted focus:outline-none focus:border-rose-500 font-mono transition"
          />
          <button
            type="button"
            onClick={handleAddYouTube}
            disabled={!newYoutubeUrl.trim() || getYouTubeInfo(newYoutubeUrl).type === 'invalid'}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Add YouTube
          </button>
        </div>

        {/* List of Added YouTube Videos & Playlists */}
        <div className="space-y-2">
          {/* Playlists */}
          {youtubePlaylistUrls && youtubePlaylistUrls.map((plUrl, idx) => (
            <div 
              key={`pl_${idx}`}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-indigo-200 text-xs"
            >
                <div className="flex items-center gap-2 min-w-0">
                  <ListVideo className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-700">
                    Playlist
                  </span>
                  <span className="font-mono text-dv-ink-2 truncate">{plUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePlaylist(idx)}
                  className="p-1 rounded text-dv-muted hover:text-rose-700 hover:bg-rose-50 transition"
                  title="Remove playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          }

          {/* Standard Videos */}
          {youtubeUrls.map((ytUrl, idx) => {
            const info = getYouTubeInfo(ytUrl);
            const isPlaylist = info.type === 'playlist';
            return (
              <div 
                key={`yt_${idx}`}
                className={`flex items-center justify-between p-2.5 rounded-lg bg-white border text-xs ${
                  isPlaylist ? 'border-indigo-200' : 'border-dv-line'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isPlaylist ? (
                    <ListVideo className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                  ) : (
                    <PlaySquare className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  )}
                  {isPlaylist ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-700">
                      Playlist
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white text-dv-muted border border-dv-line">
                      Video
                    </span>
                  )}
                  <span className="font-mono text-dv-ink-2 truncate">{ytUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveYouTube(idx)}
                  className="p-1 rounded text-dv-muted hover:text-rose-700 hover:bg-rose-50 transition"
                  title="Remove video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {youtubeUrls.length === 0 && (!youtubePlaylistUrls || youtubePlaylistUrls.length === 0) && (
            <div className="text-center py-4 border border-dashed border-dv-line rounded-lg text-dv-muted text-xs">
              No YouTube videos or playlists added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryAndVideoSection;

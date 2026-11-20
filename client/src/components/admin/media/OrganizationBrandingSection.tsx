import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Plus, 
  Layers, 
  Link2,
  FileImage
} from 'lucide-react';
import { api } from '../../../lib/api';

export interface OrganizationBrandingSectionProps {
  logoUrl: string;
  onLogoChange: (url: string) => void;
  coverImageUrl: string;
  onCoverImageChange: (url: string) => void;
  additionalBrandingImages?: string[];
  onAdditionalImagesChange?: (urls: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const OrganizationBrandingSection: React.FC<OrganizationBrandingSectionProps> = ({
  logoUrl,
  onLogoChange,
  coverImageUrl,
  onCoverImageChange,
  additionalBrandingImages = [],
  onAdditionalImagesChange,
  title = 'Organization Branding & Visual Identity',
  subtitle = 'Provide official high-resolution branding assets. These assets strictly populate the Header, Navbar, Footer, and Homepage Hero sections.'
}) => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);

  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [additionalError, setAdditionalError] = useState<string | null>(null);
  const [customAdditionalUrl, setCustomAdditionalUrl] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  // Logo file handler
  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setIsUploadingLogo(true);
    try {
      const res = await api.uploadFileAsset(file, 'logo');
      onLogoChange(res.url);
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Cover image file handler
  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverError(null);
    setIsUploadingCover(true);
    try {
      const res = await api.uploadFileAsset(file, 'hero');
      onCoverImageChange(res.url);
    } catch (err: unknown) {
      setCoverError(err instanceof Error ? err.message : 'Cover banner upload failed');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Additional branding assets handler
  const handleAdditionalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAdditionalError(null);
    setIsUploadingAdditional(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await api.uploadFileAsset(file, 'branding');
        newUrls.push(res.url);
      }
      if (onAdditionalImagesChange) {
        onAdditionalImagesChange([...additionalBrandingImages, ...newUrls]);
      }
    } catch (err: unknown) {
      setAdditionalError(err instanceof Error ? err.message : 'One or more branding assets failed to upload');
    } finally {
      setIsUploadingAdditional(false);
      if (additionalInputRef.current) additionalInputRef.current.value = '';
    }
  };

  const handleAddAdditionalUrl = () => {
    if (!customAdditionalUrl.trim() || !onAdditionalImagesChange) return;
    onAdditionalImagesChange([...additionalBrandingImages, customAdditionalUrl.trim()]);
    setCustomAdditionalUrl('');
  };

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    if (!onAdditionalImagesChange) return;
    onAdditionalImagesChange(additionalBrandingImages.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-dv-line pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-700" />
          <h3 className="text-base font-bold text-dv-ink tracking-wide">{title}</h3>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-700/50">
            Group A Assets
          </span>
        </div>
        <p className="text-xs text-dv-muted mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =========================================
            ITEM 1: OFFICIAL ORGANIZATION LOGO
           ========================================= */}
        <div className="rounded-xl border border-dv-line bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
                <FileImage className="w-4 h-4 text-indigo-700" />
                1. Official Organization Logo
              </label>
              <span className="text-[11px] text-dv-muted font-mono">PNG, JPG, WebP, GIF (Max 10MB)</span>
            </div>

            {/* Logo Preview Container */}
            <div className="relative border-2 border-dashed border-dv-line rounded-lg p-4 bg-white flex flex-col items-center justify-center min-h-[170px] overflow-hidden group">
              {logoUrl ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="p-3 rounded-lg bg-dv-ink/[0.04] border border-dv-line flex items-center justify-center max-w-[220px] max-h-[120px] shadow-inner overflow-hidden">
                    <img 
                      src={logoUrl} 
                      alt="Organization Logo" 
                      className="max-h-24 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100%" height="100%" fill="%23222"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="10">Invalid Logo</text></svg>';
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-dv-canvas hover:bg-dv-mist text-dv-ink border border-dv-line transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUploadingLogo ? 'animate-spin' : ''}`} />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogoChange('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-rose-50 hover:bg-rose-50 text-rose-700 border border-rose-800/60 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full text-center hover:opacity-85 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-700/50 flex items-center justify-center text-indigo-700 mb-2">
                    <Upload className={`w-5 h-5 ${isUploadingLogo ? 'animate-bounce' : ''}`} />
                  </div>
                  <p className="text-xs font-medium text-dv-ink-2">Click to upload organization logo</p>
                  <p className="text-[11px] text-dv-muted mt-0.5">Transparent PNG recommended</p>
                </div>
              )}

              {/* Upload spinner overlay */}
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-dv-ink/[0.04] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-indigo-700 animate-spin" />
                  <span className="text-xs text-indigo-700">Uploading logo...</span>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input 
              ref={logoInputRef}
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleLogoFile}
              className="hidden" 
            />

            {/* Logo Error message */}
            {logoError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 mt-2 bg-rose-50 p-2 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{logoError}</span>
              </div>
            )}
          </div>

          {/* Fallback Direct URL input */}
          <div className="mt-3 pt-3 border-t border-dv-line">
            <button
              type="button"
              onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
              className="text-[11px] text-indigo-700 hover:text-indigo-700 flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" />
              {showLogoUrlInput ? 'Hide manual URL input' : 'Or paste direct logo image URL'}
            </button>
            {showLogoUrlInput && (
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => onLogoChange(e.target.value)}
                placeholder="https://cdn.example.com/logo.svg"
                className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-dv-line rounded-md text-dv-ink placeholder-dv-muted focus:outline-none focus:border-indigo-500 font-mono"
              />
            )}
          </div>
        </div>

        {/* =========================================
            ITEM 2: HERO BANNER / COVER IMAGE
           ========================================= */}
        <div className="rounded-xl border border-dv-line bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-700" />
                2. Hero Banner / Cover Image
              </label>
              <span className="text-[11px] text-dv-muted font-mono">16:9 Landscape (Max 10MB)</span>
            </div>

            {/* Cover Preview Container (16:9 Ratio) */}
            <div className="relative border-2 border-dashed border-dv-line rounded-lg p-2 bg-white flex flex-col items-center justify-center min-h-[170px] overflow-hidden group aspect-video">
              {coverImageUrl ? (
                <div className="relative w-full h-full rounded-md overflow-hidden flex items-center justify-center">
                  <img 
                    src={coverImageUrl} 
                    alt="Hero Banner" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170" viewBox="0 0 300 170"><rect width="100%" height="100%" fill="%23222"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="12">Invalid Banner</text></svg>';
                    }}
                  />
                  {/* Subtle Hero simulation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent flex flex-col justify-end p-3">
                    <span className="text-[10px] text-cyan-700 font-medium tracking-wider uppercase bg-dv-ink/[0.04] px-2 py-0.5 rounded w-max border border-cyan-800/40">
                      Homepage Hero Simulation
                    </span>
                  </div>

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-dv-ink/[0.04] opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-dv-canvas text-dv-ink border border-dv-line transition shadow-lg"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUploadingCover ? 'animate-spin' : ''}`} />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => onCoverImageChange('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-50 hover:bg-rose-50 text-rose-700 border border-rose-800/80 transition shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full text-center hover:opacity-85 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-700/50 flex items-center justify-center text-cyan-700 mb-2">
                    <Upload className={`w-5 h-5 ${isUploadingCover ? 'animate-bounce' : ''}`} />
                  </div>
                  <p className="text-xs font-medium text-dv-ink-2">Click to upload 16:9 hero banner</p>
                  <p className="text-[11px] text-dv-muted mt-0.5">High-definition landscape (1920x1080 optimal)</p>
                </div>
              )}

              {/* Upload spinner overlay */}
              {isUploadingCover && (
                <div className="absolute inset-0 bg-dv-ink/[0.04] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-cyan-700 animate-spin" />
                  <span className="text-xs text-cyan-700">Uploading hero banner...</span>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input 
              ref={coverInputRef}
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleCoverFile}
              className="hidden" 
            />

            {/* Cover Error message */}
            {coverError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 mt-2 bg-rose-50 p-2 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{coverError}</span>
              </div>
            )}
          </div>

          {/* Fallback Direct URL input */}
          <div className="mt-3 pt-3 border-t border-dv-line">
            <button
              type="button"
              onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
              className="text-[11px] text-cyan-700 hover:text-cyan-700 flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" />
              {showCoverUrlInput ? 'Hide manual URL input' : 'Or paste direct cover banner URL'}
            </button>
            {showCoverUrlInput && (
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => onCoverImageChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-dv-line rounded-md text-dv-ink placeholder-dv-muted focus:outline-none focus:border-cyan-500 font-mono"
              />
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          ITEM 3: ADDITIONAL BRANDING ASSETS
         ========================================= */}
      {onAdditionalImagesChange && (
        <div className="rounded-xl border border-dv-line bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-semibold text-dv-ink flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                3. Additional Organization Branding Images
              </label>
              <p className="text-[11px] text-dv-muted mt-0.5">
                Secondary logos, co-branding watermarks, emblem variants, and official institutional identity assets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-800/50">
                {additionalBrandingImages.length} {additionalBrandingImages.length === 1 ? 'asset' : 'assets'}
              </span>
              <button
                type="button"
                onClick={() => additionalInputRef.current?.click()}
                disabled={isUploadingAdditional}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload Assets
              </button>
            </div>
          </div>

          {/* Hidden multi-file input */}
          <input 
            ref={additionalInputRef}
            type="file" 
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleAdditionalFiles}
            className="hidden" 
          />

          {/* Additional Asset Error message */}
          {additionalError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 mb-3 bg-rose-50 p-2 rounded border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{additionalError}</span>
            </div>
          )}

          {/* Uploading progress indicator */}
          {isUploadingAdditional && (
            <div className="flex items-center gap-2 p-3 mb-3 bg-emerald-50 rounded-lg border border-emerald-800/40 text-emerald-700 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Uploading branding asset(s)...</span>
            </div>
          )}

          {/* Thumbnails Grid */}
          {additionalBrandingImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {additionalBrandingImages.map((imgUrl, idx) => (
                <div 
                  key={`branding_img_${idx}`} 
                  className="relative group rounded-lg overflow-hidden border border-dv-line bg-white aspect-square flex items-center justify-center p-1"
                >
                  <img 
                    src={imgUrl} 
                    alt={`Branding Asset ${idx + 1}`} 
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-dv-ink/[0.04] opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalImage(idx)}
                      className="p-1 rounded bg-rose-50 hover:bg-rose-50 text-rose-700 border border-rose-800 transition"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 px-1 py-0.2 text-[9px] font-mono bg-dv-ink/[0.04] text-dv-ink-2 rounded">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div 
              onClick={() => additionalInputRef.current?.click()}
              className="border border-dashed border-dv-line rounded-lg p-5 text-center cursor-pointer hover:border-dv-line bg-white transition"
            >
              <p className="text-xs text-dv-muted">No additional branding assets uploaded yet</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Click here or use the button above to upload multiple branding files</p>
            </div>
          )}

          {/* Direct URL addition input */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="url"
              value={customAdditionalUrl}
              onChange={(e) => setCustomAdditionalUrl(e.target.value)}
              placeholder="Or paste an image URL to add..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-dv-line rounded-md text-dv-ink placeholder-dv-muted focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={handleAddAdditionalUrl}
              disabled={!customAdditionalUrl.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-dv-canvas hover:bg-dv-mist disabled:opacity-50 text-dv-ink border border-dv-line transition"
            >
              Add URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationBrandingSection;

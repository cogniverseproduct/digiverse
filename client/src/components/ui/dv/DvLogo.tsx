import React, { useId } from 'react';
import { cn } from '../../../lib/utils';

/**
 * DigiVerse brand mark for the light main-product UI.
 * A vector re-interpretation of the original "D" emblem (flame + wave inside a D),
 * drawn in the Prism gradient so it reads crisply on light surfaces.
 */
export const DvMark: React.FC<{ className?: string; title?: string }> = ({ className, title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-9 w-9', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}-d`} x1="6" y1="6" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF8A3D" />
          <stop offset="0.48" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B6EF5" />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="14" y1="34" x2="30" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF6B4A" />
          <stop offset="1" stopColor="#FFC15C" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#12122A" />
      <path
        d="M14 11h10.5C33.6 11 39 16.6 39 24s-5.4 13-14.5 13H14V11Z"
        fill="none"
        stroke={`url(#${id}-d)`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M17.5 33c1-7.5 4.6-12.8 11-16-2.2 4.2-2.6 8-1.4 11.4-3.4.4-6.6 2-9.6 4.6Z" fill={`url(#${id}-f)`} />
      <path d="M16 35.2c5.5-3.6 11.8-4.6 19-3" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
};

export const DvLogo: React.FC<{ className?: string; compact?: boolean; tagline?: boolean }> = ({
  className,
  compact = false,
  tagline = false,
}) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <DvMark className="h-9 w-9 shrink-0 drop-shadow-[0_6px_14px_rgba(86,64,222,0.25)]" />
    {!compact && (
      <span className="flex flex-col leading-none">
        <span className="font-display text-[21px] font-bold tracking-[-0.03em] text-dv-ink">
          Digi<span className="dv-prism-text">Verse</span>
        </span>
        {tagline && (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-dv-muted">
            Websites · Portfolios
          </span>
        )}
      </span>
    )}
  </span>
);

export default DvLogo;

import React from 'react';
import { cn } from '../../lib/utils';

interface SlidingRowProps {
  /** Screen-reader name for the row. */
  label: string;
  /** Seconds for one pass of the whole card set. Lower is faster. */
  seconds?: number;
  /** Slide left-to-right instead of right-to-left. */
  reverse?: boolean;
  className?: string;
  /** The cards. Each needs `mr-5` (margin, not gap) so every copy has exactly the same width. */
  children: React.ReactNode;
}

/** Repeats a short list so one copy is wide enough to avoid a visible gap at the loop point. */
export function fillTo<T>(items: T[], min = 5): T[] {
  if (items.length === 0) return items;
  const out: T[] = [];
  while (out.length < min) out.push(...items);
  return out;
}

/**
 * Seamless auto-sliding row. The cards are rendered four times and the track moves by half of
 * that (two copies), so the visible window never runs out of cards, even on very wide screens.
 * Copies 2-4 are `inert`: no keyboard focus and not read twice by assistive tech.
 * Pauses on hover/focus; under prefers-reduced-motion the row stops and becomes a hand-scrollable
 * strip with the extra copies hidden (see .dv-marquee-* in index.css).
 */
export const SlidingRow: React.FC<SlidingRowProps> = ({ label, seconds = 55, reverse, className, children }) => (
  <div className={cn('dv-marquee-wrap', className)} role="region" aria-label={label}>
    <div className={cn('dv-marquee-track', reverse && 'is-reverse')} style={{ ['--dv-speed' as string]: `${seconds * 2}s` }}>
      {children}
      {[0, 1, 2].map((n) => (
        <div key={n} data-dup className="contents" aria-hidden inert>
          {children}
        </div>
      ))}
    </div>
  </div>
);

export default SlidingRow;

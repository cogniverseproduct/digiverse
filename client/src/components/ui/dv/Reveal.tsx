import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';

/**
 * Lightweight scroll-reveal. Uses a single IntersectionObserver per element and
 * the `.dv-reveal` CSS transition (index.css), which is disabled under
 * prefers-reduced-motion. Content is always rendered — never hidden from
 * assistive tech — and falls back to visible if IntersectionObserver is missing.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

type RevealProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
  delay?: number;
};

export const Reveal: React.FC<RevealProps> = ({ as = 'div', delay = 0, className, style, children, ...rest }) => {
  const { ref, visible } = useReveal<HTMLElement>();
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={cn('dv-reveal', visible && 'is-visible', className)}
      style={{ ...style, ['--dv-delay' as string]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;

import React, { useEffect, useRef } from 'react';

/**
 * Cherry Blossom living backdrop for the public DigiVerse site.
 * - Five blurred colour fields (soft pink, blossom pink, pale green, white glow) drifting slowly.
 * - A handful of petals falling very slowly.
 * - Gentle scroll parallax: one rAF-throttled passive listener writes a single CSS variable.
 * Everything is transform-only, decorative (aria-hidden, pointer-events none) and frozen/hidden
 * under prefers-reduced-motion. Parallax is skipped entirely when reduced motion is requested.
 */

const PETALS = [
  { l: '6%', s: '14px', d: '28s', dl: '-4s', sway: '60px' },
  { l: '17%', s: '10px', d: '34s', dl: '-19s', sway: '-50px' },
  { l: '29%', s: '16px', d: '30s', dl: '-11s', sway: '70px' },
  { l: '41%', s: '11px', d: '38s', dl: '-26s', sway: '-60px' },
  { l: '53%', s: '15px', d: '31s', dl: '-8s', sway: '55px' },
  { l: '64%', s: '12px', d: '36s', dl: '-22s', sway: '-45px' },
  { l: '76%', s: '17px', d: '29s', dl: '-15s', sway: '65px' },
  { l: '87%', s: '11px', d: '35s', dl: '-2s', sway: '-55px' },
  { l: '94%', s: '13px', d: '32s', dl: '-29s', sway: '45px' },
];

export const BlossomBackdrop: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.style.setProperty('--sy', `${window.scrollY.toFixed(0)}px`));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const px = (f: number) => ({ transform: `translate3d(0, calc(var(--sy, 0px) * ${f}), 0)` });

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[12%] -top-[16%]" style={px(-0.1)}>
        <div className="h-[640px] w-[640px] rounded-full bg-[#F2C7C7]/80 blur-[110px] animate-dv-drift will-change-transform" />
      </div>
      <div className="absolute -right-[10%] top-[0%]" style={px(-0.16)}>
        <div className="h-[560px] w-[560px] rounded-full bg-[#D5F3D8]/90 blur-[110px] animate-dv-drift will-change-transform [animation-delay:-7s]" />
      </div>
      <div className="absolute bottom-[-20%] right-[6%]" style={px(-0.06)}>
        <div className="h-[620px] w-[620px] rounded-full bg-[#FFB7C5]/55 blur-[120px] animate-dv-drift will-change-transform [animation-delay:-13s]" />
      </div>
      <div className="absolute bottom-[-14%] left-[4%]" style={px(-0.12)}>
        <div className="h-[520px] w-[520px] rounded-full bg-[#D5F3D8]/70 blur-[120px] animate-dv-drift will-change-transform [animation-delay:-19s]" />
      </div>
      <div className="absolute left-[34%] top-[26%]" style={px(-0.2)}>
        <div className="h-[420px] w-[420px] rounded-full bg-white/70 blur-[100px] animate-dv-drift will-change-transform [animation-delay:-4s]" />
      </div>

      <div className="absolute inset-0 dv-dots opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      {PETALS.map((p, i) => (
        <span
          key={i}
          className="dv-petal"
          style={{ ['--l' as string]: p.l, ['--s' as string]: p.s, ['--d' as string]: p.d, ['--dl' as string]: p.dl, ['--sway' as string]: p.sway }}
        />
      ))}
    </div>
  );
};

export default BlossomBackdrop;

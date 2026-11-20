import React from 'react';
import { cn } from '../../../lib/utils';

/**
 * Animated "aurora" backdrop: three blurred colour fields drifting slowly over a
 * dotted paper canvas. Pure CSS (transform-only animation, GPU friendly), purely
 * decorative, and frozen automatically under prefers-reduced-motion.
 */
export const Ambient: React.FC<{ className?: string; variant?: 'hero' | 'soft' | 'section' }> = ({
  className,
  variant = 'soft',
}) => (
  <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
    {variant !== 'section' && <div className="absolute inset-0 dv-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />}
    <div
      className={cn(
        'absolute rounded-full blur-[110px] animate-dv-drift',
        variant === 'hero'
          ? '-left-[10%] -top-[18%] h-[620px] w-[620px] bg-[#F2C7C7]/80'
          : '-left-[8%] -top-[10%] h-[420px] w-[420px] bg-[#F2C7C7]/65'
      )}
    />
    <div
      className={cn(
        'absolute rounded-full blur-[120px] animate-dv-drift [animation-delay:-8s]',
        variant === 'hero'
          ? 'right-[-12%] top-[8%] h-[560px] w-[560px] bg-[#D5F3D8]/85'
          : 'right-[-10%] top-[20%] h-[380px] w-[380px] bg-[#D5F3D8]/70'
      )}
    />
    <div
      className={cn(
        'absolute rounded-full blur-[120px] animate-dv-drift [animation-delay:-15s]',
        variant === 'hero'
          ? 'bottom-[-25%] left-[30%] h-[520px] w-[520px] bg-[#FFB7C5]/55'
          : 'bottom-[-20%] left-[35%] h-[360px] w-[360px] bg-[#FFB7C5]/45'
      )}
    />
  </div>
);

/**
 * Page-level multi-colour aurora: five large colour fields (lavender, sky, aqua, coral, pink)
 * drifting at different speeds behind the app. Fixed, transform-only, decorative, and frozen under
 * prefers-reduced-motion. Placed once in the workspace shell.
 */
export const Aurora: React.FC = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute -left-[12%] -top-[14%] h-[640px] w-[640px] rounded-full bg-[#B7A8FF]/55 blur-[110px] animate-dv-drift will-change-transform" />
    <div className="absolute -right-[10%] top-[2%] h-[560px] w-[560px] rounded-full bg-[#FFC2A8]/50 blur-[115px] animate-dv-drift will-change-transform [animation-delay:-7s]" />
    <div className="absolute bottom-[-18%] right-[8%] h-[600px] w-[600px] rounded-full bg-[#8FE0EE]/50 blur-[120px] animate-dv-drift will-change-transform [animation-delay:-13s]" />
    <div className="absolute bottom-[-14%] left-[6%] h-[520px] w-[520px] rounded-full bg-[#FFB8E0]/40 blur-[120px] animate-dv-drift will-change-transform [animation-delay:-19s]" />
    <div className="absolute left-[38%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#A9C4FF]/35 blur-[120px] animate-dv-drift will-change-transform [animation-delay:-4s]" />
    <div className="absolute inset-0 dv-dots opacity-[0.28] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
  </div>
);

/** Small uppercase pill used above section headings. */
export const Eyebrow: React.FC<{ icon?: React.ElementType; className?: string; children: React.ReactNode }> = ({
  icon: Icon,
  className,
  children,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-2 rounded-full border border-dv-iris-200/70 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-dv-iris-700 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_18px_-10px_rgba(86,64,222,0.35)] backdrop-blur',
      className
    )}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-dv-coral" />}
    {children}
  </span>
);

export default Ambient;

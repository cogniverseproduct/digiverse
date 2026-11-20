import React from 'react';
import { ClipboardList, Eye, MessageSquareText, Rocket, Sparkles } from 'lucide-react';
import { ENGINE_META, type EngineKey } from './projectMeta';
import { cn } from '../../lib/utils';

/**
 * Auto-sliding showcase rows for the main workspace.
 * Pure CSS motion (see .dv-marquee-* in index.css): transform-only, paused on hover or focus,
 * and replaced by a hand-scrollable row under prefers-reduced-motion.
 * Card previews are drawn with markup, so no images are downloaded.
 */

const ENGINES: EngineKey[] = ['sports', 'cultural', 'event', 'ngo', 'portfolio'];

/** A tiny abstract website, different for each engine. */
const MiniSite: React.FC<{ engine: EngineKey }> = ({ engine }) => {
  const g = ENGINE_META[engine].gradient;
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_-14px_rgba(18,18,42,0.45)] ring-1 ring-black/5">
      <div className="flex items-center gap-1 border-b border-dv-line/70 bg-dv-canvas/70 px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        <span className="ml-2 h-1.5 w-16 rounded-full bg-dv-line" />
      </div>
      <div className={cn('relative h-24 bg-gradient-to-br p-3', g)}>
        <div className="h-2 w-24 rounded-full bg-white/80" />
        <div className="mt-1.5 h-1.5 w-32 rounded-full bg-white/50" />
        {engine === 'sports' && (
          <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between rounded-lg bg-white/90 px-2.5 py-1.5">
            <span className="h-4 w-4 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold tracking-widest text-dv-muted">VS</span>
            <span className="h-4 w-4 rounded-full bg-sky-500" />
          </div>
        )}
        {engine === 'cultural' && (
          <div className="absolute bottom-2.5 left-3 flex gap-1.5">
            {[0, 1, 2].map((i) => <span key={i} className="h-7 w-7 rounded-lg bg-white/85" />)}
          </div>
        )}
        {engine === 'event' && (
          <div className="absolute inset-x-3 bottom-2.5 space-y-1">
            {[28, 20, 24].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 rounded-full bg-white/80" style={{ width: `${w * 2}%` }} />
              </div>
            ))}
          </div>
        )}
        {engine === 'ngo' && (
          <div className="absolute inset-x-3 bottom-2.5 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => <span key={i} className="h-6 rounded-lg bg-white/85" />)}
          </div>
        )}
        {engine === 'portfolio' && (
          <div className="absolute bottom-2.5 left-3 flex items-end gap-2">
            <span className="h-9 w-9 rounded-full bg-white/90" />
            <span className="mb-1 h-1.5 w-14 rounded-full bg-white/80" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[0, 1, 2].map((i) => <span key={i} className="h-5 rounded-md bg-dv-mist" />)}
      </div>
    </div>
  );
};

const EngineCard: React.FC<{ engine: EngineKey; onOpen?: (engine: EngineKey) => void; dup?: boolean }> = ({ engine, onOpen, dup }) => {
  const meta = ENGINE_META[engine];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(engine) : undefined}
      tabIndex={dup ? -1 : undefined}
      className="dv-border-glow group mr-5 w-[272px] shrink-0 rounded-[26px] bg-white/70 p-4 text-left shadow-dv-card backdrop-blur-md transition duration-500 hover:-translate-y-1.5 hover:shadow-dv-lift focus-visible:-translate-y-1.5 sm:w-[300px]"
    >
      <div className="transition duration-500 group-hover:scale-[1.03]">
        <MiniSite engine={engine} />
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', meta.gradient)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-bold tracking-[-0.01em] text-dv-ink">{meta.label}</div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-dv-muted">{meta.description}</p>
    </button>
  );
};

const STEPS = [
  { icon: ClipboardList, title: 'Collect requirements', text: 'Guided wizard per engine, with drafts you can save.', tone: 'from-violet-500 to-indigo-500' },
  { icon: Sparkles, title: 'Generate the website', text: 'Pages, theme and content built from the client’s details.', tone: 'from-fuchsia-500 to-rose-500' },
  { icon: Eye, title: 'Preview & compare', text: 'Device previews and version-by-version comparison.', tone: 'from-sky-500 to-cyan-500' },
  { icon: MessageSquareText, title: 'Client feedback', text: 'Private preview links, comments and approval.', tone: 'from-amber-500 to-orange-500' },
  { icon: Rocket, title: 'Publish', text: 'Live at its own address, with SEO and domain options.', tone: 'from-emerald-500 to-teal-500' }
];

const StepCard: React.FC<{ index: number; step: (typeof STEPS)[number] }> = ({ index, step }) => {
  const Icon = step.icon;
  return (
    <div className="mr-5 w-[240px] shrink-0 rounded-[22px] border border-white/70 bg-white/60 p-4 shadow-dv-card backdrop-blur-md sm:w-[260px]">
      <div className="flex items-center justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', step.tone)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="font-display text-3xl font-bold text-dv-ink/10">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="mt-3 font-display text-[15px] font-bold tracking-[-0.01em] text-dv-ink">{step.title}</div>
      <p className="mt-1 text-[12.5px] leading-5 text-dv-muted">{step.text}</p>
    </div>
  );
};

interface EngineShowcaseProps {
  /** Opens the new-website flow; the cards act as shortcuts into it. */
  onOpenEngine?: (engine: Exclude<EngineKey, 'other'>) => void;
  className?: string;
}

export const EngineShowcase: React.FC<EngineShowcaseProps> = ({ onOpenEngine, className }) => (
  <section className={cn('space-y-1', className)} aria-label="Engines and workflow">
    <div className="px-1">
      <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-dv-ink">Five engines, one workflow</h3>
      <p className="mt-0.5 text-[13px] text-dv-muted">Pick an engine to start a new website.</p>
    </div>

    <div className="dv-marquee-wrap">
      <div className="dv-marquee-track" style={{ ['--dv-speed' as string]: '60s' }}>
        {ENGINES.map((e) => <EngineCard key={e} engine={e} onOpen={onOpenEngine as ((e: EngineKey) => void) | undefined} />)}
        <div data-dup className="contents" aria-hidden>
          {ENGINES.map((e) => <EngineCard key={`d-${e}`} engine={e} onOpen={onOpenEngine as ((e: EngineKey) => void) | undefined} dup />)}
        </div>
      </div>
    </div>

    <div className="dv-marquee-wrap" aria-hidden>
      <div className="dv-marquee-track is-reverse" style={{ ['--dv-speed' as string]: '48s' }}>
        {STEPS.map((s, i) => <StepCard key={s.title} index={i} step={s} />)}
        <div data-dup className="contents">
          {STEPS.map((s, i) => <StepCard key={`d-${s.title}`} index={i} step={s} />)}
        </div>
      </div>
    </div>
  </section>
);

export default EngineShowcase;

import React, { useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '../../ui/dv/Button';
import { ENGINE_META, type EngineKey } from '../../workspace/projectMeta';

export interface WizardStep {
  title: string;
  /** Optional short label for the stepper when the title is long. */
  short?: string;
}

interface WizardFrameProps {
  engine: EngineKey;
  /** Small label above the title, e.g. the chosen archetype. */
  kicker?: string;
  title: string;
  description?: string;
  steps: WizardStep[];
  /** 1-based index of the visible step. */
  current: number;
  onStepChange: (step: number) => void;
  onCancel: () => void;
  /** Defaults to going one step back; on step 1 the Back button is hidden. */
  onBack?: () => void;
  /** Defaults to going one step forward. Use it when a step validates first. */
  onNext?: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  /** Blocks the final button, e.g. while required items are missing. */
  submitDisabled?: boolean;
  submitLabel?: string;
  /** Extra controls in the header, e.g. "Save draft". */
  headerActions?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Shared layout for every engine's requirements wizard: one header, one
 * stepper and one footer, so the six wizards look and behave the same.
 * The step content itself stays inside each wizard.
 */
export const WizardFrame: React.FC<WizardFrameProps> = ({
  engine,
  kicker,
  title,
  description,
  steps,
  current,
  onStepChange,
  onCancel,
  onBack,
  onNext,
  onSubmit,
  submitting = false,
  submitDisabled = false,
  submitLabel = 'Create website',
  headerActions,
  error,
  children
}) => {
  const meta = ENGINE_META[engine];
  const EngineIcon = meta.icon;
  const total = steps.length;
  const step = Math.min(Math.max(current, 1), total);
  const isLast = step === total;
  const progress = Math.round((step / total) * 100);

  const railRef = useRef<HTMLOListElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Keep the active step visible in the rail and bring the form back to the top on step change.
  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="step"]');
    if (rail && active) {
      rail.scrollTo({ left: active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' });
    }
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [step]);

  const goBack = onBack ?? (() => onStepChange(Math.max(1, step - 1)));
  const goNext = onNext ?? (() => onStepChange(Math.min(total, step + 1)));

  return (
    <div ref={topRef} className="mx-auto w-full max-w-5xl scroll-mt-6 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-dv-card`}>
            <EngineIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${meta.chip}`}>{meta.short}</span>
              {kicker && <span className="text-[12px] font-medium text-dv-muted">{kicker}</span>}
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-dv-ink">{title}</h2>
            {description && <p className="mt-1 max-w-2xl text-[13px] leading-6 text-dv-muted">{description}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          {headerActions}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      </header>

      {/* Stepper */}
      <nav aria-label="Wizard steps" className="mt-6 rounded-[22px] border border-dv-line bg-white p-4 shadow-dv-card sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] text-dv-muted">
            Step <span className="font-semibold text-dv-ink">{step}</span> of {total}
            <span className="mx-2 text-dv-line">/</span>
            <span className="font-semibold text-dv-ink">{steps[step - 1]?.title}</span>
          </p>
          <span className="text-[12px] font-semibold text-dv-muted">{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-dv-ink/[0.06]" aria-hidden>
          <div className="h-full rounded-full dv-prism-fill transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <ol ref={railRef} className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {steps.map((s, index) => {
            const num = index + 1;
            const done = num < step;
            const active = num === step;
            return (
              <li key={num} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onStepChange(num)}
                  aria-current={active ? 'step' : undefined}
                  title={s.title}
                  className={`flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 text-[12px] font-semibold transition ${
                    active ? 'bg-dv-ink text-white shadow-sm' : done ? 'text-dv-ink-2 hover:bg-dv-canvas' : 'text-dv-muted hover:bg-dv-canvas hover:text-dv-ink'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold ${
                      active ? 'bg-white/15 text-white' : done ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-dv-ink/[0.05] text-dv-muted'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : num}
                  </span>
                  <span className="whitespace-nowrap">{s.short || s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] text-rose-700 ring-1 ring-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step content */}
      <div className="dv-wizard-body mt-5 rounded-[22px] border border-dv-line bg-white p-5 shadow-dv-card sm:p-8">{children}</div>

      {/* Footer */}
      <footer className="sticky bottom-3 z-10 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-dv-line bg-white/90 p-2.5 shadow-dv-float backdrop-blur">
        {step > 1 ? (
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <span className="hidden text-[12px] text-dv-muted sm:block">
          {isLast ? 'Last step — review and create' : `Next: ${steps[step]?.title}`}
        </span>
        {isLast ? (
          <Button size="sm" onClick={onSubmit} disabled={submitting || submitDisabled}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {submitting ? 'Creating…' : submitLabel}
          </Button>
        ) : (
          <Button size="sm" onClick={goNext}>
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </footer>
    </div>
  );
};

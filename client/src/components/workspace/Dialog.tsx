import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Main-product dialog: dimmed backdrop, Escape / backdrop click to close,
 * focus moved into the dialog and restored afterwards.
 */
export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ElementType;
  tone?: 'iris' | 'emerald' | 'rose' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  /** Block closing while an action is running. */
  busy?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ open, onClose, title, description, icon: Icon, tone = 'iris', size = 'md', busy, footer, children }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button:not([data-dialog-close])');
    (focusable || panelRef.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const tones = {
    iris: 'bg-dv-iris-50 text-dv-iris-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-dv-ink/35 p-4 backdrop-blur-sm animate-dv-fade"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-[26px] bg-white p-6 shadow-dv-float ring-1 ring-dv-line outline-none animate-dv-pop sm:p-7',
          size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
        )}
      >
        <button
          type="button"
          data-dialog-close
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-xl p-2 text-dv-muted transition hover:bg-dv-canvas hover:text-dv-ink disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          {Icon && (
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tones[tone])}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 id={titleId} className="font-display text-xl font-bold tracking-[-0.02em] text-dv-ink">{title}</h3>
            {description && <p className="mt-1.5 text-[13px] leading-6 text-dv-muted">{description}</p>}
          </div>
        </div>

        {children && <div className="mt-6">{children}</div>}

        {footer && <div className="mt-7 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

/** Read-only link field with a copy button. */
export const CopyField: React.FC<{ label: string; value: string; copied: boolean; onCopy: () => void }> = ({ label, value, copied, onCopy }) => (
  <div>
    <div className="mb-2 text-[12px] font-semibold text-dv-ink-2">{label}</div>
    <div className="flex items-center gap-2 rounded-xl border border-dv-line bg-dv-canvas p-1.5 pl-3">
      <input
        readOnly
        value={value}
        onClick={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-dv-iris-700 outline-none"
      />
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          'shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition',
          copied ? 'bg-emerald-500 text-white' : 'bg-dv-ink text-white hover:bg-dv-ink-2'
        )}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  </div>
);

export const fieldClass =
  'w-full rounded-xl border border-dv-line bg-white px-3.5 py-2.5 text-[13px] text-dv-ink placeholder:text-dv-muted/70 outline-none transition focus:border-dv-iris-400 focus:ring-4 focus:ring-dv-iris-100';

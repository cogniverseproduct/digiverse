import React, { useId, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../../lib/api';

export const inputCls = (invalid?: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 focus:outline-none focus:ring-2 ${
    invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-dv-line focus:border-dv-iris-500 focus:ring-dv-iris-500/20'
  }`;

interface FieldShellProps { label: string; required?: boolean; hint?: string; error?: string; htmlFor: string; className?: string; children: React.ReactNode }

export const FieldShell: React.FC<FieldShellProps> = ({ label, required, hint, error, htmlFor, className = '', children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-dv-ink-2">
      {label}{required && <span aria-hidden className="text-rose-500"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-[11px] text-dv-muted">{hint}</p>}
    {error && <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-medium text-rose-600"><AlertCircle className="mt-px h-3 w-3 shrink-0" />{error}</p>}
  </div>
);

interface BaseProps { label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string; error?: string; placeholder?: string; className?: string }

export const TextField: React.FC<BaseProps & { type?: string; inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'url' }> = ({ label, value, onChange, required, hint, error, placeholder, className, type = 'text', inputMode }) => {
  const id = useId();
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      <input id={id} type={type} inputMode={inputMode} value={value} placeholder={placeholder} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={inputCls(!!error)} />
    </FieldShell>
  );
};

export const TextArea: React.FC<BaseProps & { rows?: number }> = ({ label, value, onChange, required, hint, error, placeholder, className, rows = 4 }) => {
  const id = useId();
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={`${inputCls(!!error)} resize-y leading-relaxed`} />
    </FieldShell>
  );
};

export const SelectField: React.FC<BaseProps & { options: string[]; emptyLabel?: string }> = ({ label, value, onChange, required, hint, error, className, options, emptyLabel = 'Select…' }) => {
  const id = useId();
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} htmlFor={id} className={className}>
      <select id={id} value={value} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={inputCls(!!error)}>
        <option value="">{emptyLabel}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </FieldShell>
  );
};

/** Upload a picture (stored on the server) or paste a link. */
export const ImageInput: React.FC<{ label: string; value: string; onChange: (url: string) => void; hint?: string; error?: string; kind?: 'logo' | 'hero' | 'branding' | 'general'; compact?: boolean }> = ({ label, value, onChange, hint, error, kind = 'general', compact }) => {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (f?: File) => {
    if (!f) return;
    setErr(null); setBusy(true);
    try { const r = await api.uploadFileAsset(f, kind); onChange(r.url); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  return (
    <FieldShell label={label} hint={hint} error={error || err || undefined} htmlFor={id}>
      <div className="flex items-stretch gap-2">
        {value && <img src={value} alt="" className={`${compact ? 'h-10 w-10' : 'h-11 w-11'} shrink-0 rounded-lg border border-dv-line object-cover`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />}
        <input id={id} type="text" inputMode="url" value={value} placeholder="Paste an image link, or upload" aria-invalid={!!(error || err)} onChange={(e) => onChange(e.target.value)} className={inputCls(!!(error || err))} />
        <input ref={file} type="file" accept="image/*" className="sr-only" aria-label={`${label}: choose a file`} onChange={(e) => void upload(e.target.files?.[0])} />
        <button type="button" onClick={() => file.current?.click()} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-dv-line bg-white px-3 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Upload
        </button>
        {value && <button type="button" onClick={() => onChange('')} aria-label={`Remove ${label}`} className="inline-flex shrink-0 items-center rounded-xl border border-dv-line bg-white px-2.5 text-dv-muted hover:text-rose-600"><X className="h-4 w-4" /></button>}
      </div>
    </FieldShell>
  );
};

/** Several images: upload many at once or paste a link. */
export const GalleryInput: React.FC<{ label: string; values: string[]; onChange: (urls: string[]) => void; hint?: string }> = ({ label, values, onChange, hint }) => {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null); setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push((await api.uploadFileAsset(f, 'branding')).url);
      onChange([...values, ...urls]);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={err || undefined} htmlFor={id}>
      <div className="flex flex-wrap gap-2">
        {values.map((u, i) => (
          <span key={`${u}-${i}`} className="group relative">
            <img src={u} alt={`${label} ${i + 1}`} className="h-16 w-16 rounded-lg border border-dv-line object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`} className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-dv-ink text-white shadow"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input ref={file} type="file" accept="image/*" multiple className="sr-only" aria-label={`${label}: choose files`} onChange={(e) => void upload(e.target.files)} />
        <button type="button" onClick={() => file.current?.click()} disabled={busy} className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-dv-line text-[10px] font-semibold text-dv-muted hover:border-dv-iris-500 hover:text-dv-iris-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Add
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input id={id} type="text" inputMode="url" value={link} placeholder="…or paste an image link" onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && link.trim()) { e.preventDefault(); onChange([...values, link.trim()]); setLink(''); } }} className={inputCls()} />
        <button type="button" onClick={() => { if (link.trim()) { onChange([...values, link.trim()]); setLink(''); } }} className="shrink-0 rounded-xl border border-dv-line bg-white px-3 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink">Add link</button>
      </div>
    </FieldShell>
  );
};

/** A repeatable card: children are the fields, with a remove button. */
export const EntryCard: React.FC<{ title: string; error?: string; onRemove: () => void; children: React.ReactNode }> = ({ title, error, onRemove, children }) => (
  <div className={`rounded-2xl border bg-white p-4 shadow-sm ${error ? 'border-rose-300' : 'border-dv-line'}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-dv-muted">{title}</span>
      <button type="button" onClick={onRemove} className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-dv-muted hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" />Remove</button>
    </div>
    {error && <p role="alert" className="mb-3 flex items-start gap-1 text-[12px] font-medium text-rose-600"><AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </div>
);

export const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-dv-iris-500/60 bg-dv-iris-50 px-4 py-2.5 text-xs font-bold text-dv-iris-700 transition hover:bg-dv-iris-100">
    <Plus className="h-4 w-4" />{label}
  </button>
);

export const StepHeading: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-5">
    <h2 className="flex items-center gap-2 text-lg font-bold text-dv-ink"><Icon className="h-5 w-5 text-dv-iris-600" />{title}</h2>
    {subtitle && <p className="mt-1 text-xs leading-relaxed text-dv-muted">{subtitle}</p>}
  </div>
);

export const Section: React.FC<{ title: string; hint?: string; error?: string; children: React.ReactNode }> = ({ title, hint, error, children }) => (
  <section className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-dv-ink">{title}</h3>
      {hint && <p className="text-xs text-dv-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 flex items-start gap-1 text-[12px] font-medium text-rose-600"><AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />{error}</p>}
    </div>
    {children}
  </section>
);

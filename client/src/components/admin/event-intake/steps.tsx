import React, { useId, useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Layers } from 'lucide-react';
import type { SelectedTemplateMetadata } from '../../../types/admin';
import type { EventCategoryId } from '../../../templates/event/ids';
import { getEventTemplateById } from '../../../templates/event/registry';
import { EventTemplateLibrary } from '../templates/EventTemplateLibrary';
import GalleryAndVideoSection from '../media/GalleryAndVideoSection';
import { AddButton, EntryCard, FieldShell, ImageInput, Section, StepHeading, TextArea, TextField, inputCls } from '../portfolio-intake/ui';
import {
  CATEGORY_LABEL, LIST_KEYS, MEDIA_KEYS, errKey, pruneBlank, stepsFor, validateAll,
  type Entry, type FieldErrors, type FieldSpec, type IntakeForm, type ListKey, type SectionSpec
} from './model';

export interface StepCtx {
  form: IntakeForm;
  category: EventCategoryId;
  errors: FieldErrors;
  setValue: (key: string, value: string) => void;
  setList: (list: ListKey, entries: Entry[]) => void;
  setTemplate: (t: SelectedTemplateMetadata) => void;
  goTo: (step: number) => void;
}

/* ------------------------------------------------------------------ one field */

const SelectInput: React.FC<{ spec: FieldSpec; value: string; onChange: (v: string) => void; error?: string }> = ({ spec, value, onChange, error }) => {
  const id = useId();
  return (
    <FieldShell label={spec.label} required={spec.required} hint={spec.hint} error={error} htmlFor={id} className={spec.wide ? 'sm:col-span-2' : ''}>
      <select id={id} value={value} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={inputCls(!!error)}>
        <option value="">{spec.emptyLabel || 'Select…'}</option>
        {(spec.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldShell>
  );
};

const ColorInput: React.FC<{ spec: FieldSpec; value: string; onChange: (v: string) => void; error?: string }> = ({ spec, value, onChange, error }) => {
  const id = useId();
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <FieldShell label={spec.label} hint={spec.hint} error={error} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${spec.label} picker`} value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-dv-line bg-white p-1" />
        <input id={id} type="text" value={value} placeholder="#6D5EFC" aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={inputCls(!!error)} />
        {value && <button type="button" onClick={() => onChange('')} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-dv-muted hover:text-dv-ink">Use the design’s colour</button>}
      </div>
    </FieldShell>
  );
};

interface FieldProps { spec: FieldSpec; value: string | string[] | Entry[] | undefined; onChange: (v: string) => void; error?: string }

const Field: React.FC<FieldProps> = ({ spec, value, onChange, error }) => {
  const s = typeof value === 'string' ? value : '';
  const cls = spec.wide ? 'sm:col-span-2' : '';
  switch (spec.kind) {
    case 'select': return <SelectInput spec={spec} value={s} onChange={onChange} error={error} />;
    case 'color': return <ColorInput spec={spec} value={s} onChange={onChange} error={error} />;
    case 'image': return <div className={cls}><ImageInput label={spec.label} value={s} onChange={onChange} hint={spec.hint} error={error} kind="general" /></div>;
    case 'textarea': return <TextArea label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} placeholder={spec.placeholder} className={cls} rows={3} />;
    case 'lines': return <TextArea label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} placeholder={spec.placeholder} className={cls} rows={4} />;
    case 'date': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} type="date" className={cls} />;
    case 'time': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} type="time" className={cls} />;
    case 'email': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} type="email" inputMode="email" placeholder={spec.placeholder} className={cls} />;
    case 'tel': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} type="tel" inputMode="tel" placeholder={spec.placeholder} className={cls} />;
    case 'url': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} inputMode="url" placeholder={spec.placeholder || 'https://'} className={cls} />;
    case 'number': return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} inputMode="numeric" placeholder={spec.placeholder} className={cls} />;
    default: return <TextField label={spec.label} value={s} onChange={onChange} required={spec.required} hint={spec.hint} error={error} placeholder={spec.placeholder} className={cls} />;
  }
};

/* ------------------------------------------------------------------ sections */

const FieldsSection: React.FC<{ sec: Extract<SectionSpec, { kind: 'fields' }>; ctx: StepCtx }> = ({ sec, ctx }) => (
  <Section title={sec.title || ''} hint={sec.hint}>
    <div className="grid gap-4 sm:grid-cols-2">
      {sec.fields.map((f) => <Field key={f.key} spec={f} value={ctx.form.v[f.key] ?? ''} error={ctx.errors[f.key]} onChange={(v) => ctx.setValue(f.key, v)} />)}
    </div>
  </Section>
);

const ListSection: React.FC<{ sec: Extract<SectionSpec, { kind: 'list' }>; ctx: StepCtx }> = ({ sec, ctx }) => {
  const entries = ctx.form.lists[sec.list];
  const update = (id: string, key: string, value: string) => ctx.setList(sec.list, entries.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  return (
    <Section title={sec.title} hint={sec.hint} error={ctx.errors[sec.list]}>
      {entries.length === 0 && <p className="rounded-xl border border-dashed border-dv-line bg-dv-mist px-4 py-3 text-xs text-dv-muted">Nothing added yet. This section will be left out of the website unless you add something.</p>}
      <div className="space-y-3">
        {entries.map((e, i) => (
          <EntryCard key={e.id} title={sec.itemLabel(e, i)} onRemove={() => ctx.setList(sec.list, entries.filter((x) => x.id !== e.id))}>
            {sec.fields.map((f) => (
              <Field key={f.key} spec={f} value={e[f.key]} error={ctx.errors[errKey(sec.list, e.id, f.key)]} onChange={(v) => update(e.id, f.key, v)} />
            ))}
          </EntryCard>
        ))}
      </div>
      <AddButton label={sec.addLabel} onClick={() => ctx.setList(sec.list, [...entries, sec.blank()])} />
    </Section>
  );
};

const toList = (s: string | undefined): string[] => (s || '').split('\n').map((l) => l.trim()).filter(Boolean);

/** Google Drive and YouTube links, using the same component the other intakes use. Lists are stored as newline text. */
const MediaSection: React.FC<{ ctx: StepCtx }> = ({ ctx }) => {
  const v = ctx.form.v;
  const set = (key: string, list: string[]) => ctx.setValue(key, list.join('\n'));
  const error = ctx.errors[MEDIA_KEYS.youtube] || ctx.errors[MEDIA_KEYS.driveVideos] || ctx.errors[MEDIA_KEYS.driveGallery];
  return (
    <Section title="Photo and video links" hint="Optional. Link a Google Drive folder of photos, and YouTube or Drive videos. Photos you upload above are used as well.">
      {error && <p role="alert" className="text-[11px] font-medium text-rose-600">{error}</p>}
      <GalleryAndVideoSection
        title="Drive and YouTube links"
        subtitle="Links only: nothing is copied. Make sure each Drive item is shared so visitors can view it."
        googleDriveGalleryUrl={v[MEDIA_KEYS.driveGallery] || ''}
        onGoogleDriveGalleryUrlChange={(u: string) => ctx.setValue(MEDIA_KEYS.driveGallery, u)}
        googleDriveVideoUrls={toList(v[MEDIA_KEYS.driveVideos])}
        onGoogleDriveVideoUrlsChange={(u: string[]) => set(MEDIA_KEYS.driveVideos, u)}
        youtubeUrls={toList(v[MEDIA_KEYS.youtube])}
        onYoutubeUrlsChange={(u: string[]) => set(MEDIA_KEYS.youtube, u)}
        youtubePlaylistUrls={toList(v[MEDIA_KEYS.playlists])}
        onYoutubePlaylistUrlsChange={(u: string[]) => set(MEDIA_KEYS.playlists, u)}
      />
    </Section>
  );
};

const TemplateSection: React.FC<{ ctx: StepCtx }> = ({ ctx }) => {
  const [changing, setChanging] = useState(false);
  const def = getEventTemplateById(ctx.form.template.templateId);
  return (
    <Section title="Website template" hint="Your website is built on this design. You can change it now, or later from the project.">
      <div className="flex flex-col gap-4 rounded-2xl border border-dv-iris-200 bg-dv-iris-50 p-4 sm:flex-row sm:items-center">
        {def && <img src={def.previewImage} alt="" className="h-24 w-full rounded-xl border border-dv-line object-cover object-top sm:w-44" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-bold text-dv-ink"><Layers className="h-4 w-4 text-dv-iris-700" />{ctx.form.template.templateName}</div>
          <p className="mt-0.5 text-xs text-dv-muted">{def ? `${def.designStyle} · ${CATEGORY_LABEL[def.category]}` : CATEGORY_LABEL[ctx.category]}</p>
          {def && <p className="mt-2 text-xs text-dv-ink-2">Design by {def.source.author} · {def.source.license} licence</p>}
        </div>
        <button type="button" onClick={() => setChanging((c) => !c)} className="shrink-0 rounded-xl border border-dv-line bg-white px-4 py-2 text-xs font-bold text-dv-ink hover:border-dv-iris-500">{changing ? 'Keep this template' : 'Change template'}</button>
      </div>
      {changing && (
        <div className="mt-4 rounded-2xl border border-dv-line p-4">
          <EventTemplateLibrary category={ctx.category} selectedTemplateId={ctx.form.template.templateId} selectLabel="Use template" onSelectTemplate={(t) => { ctx.setTemplate(t); setChanging(false); }} />
        </div>
      )}
    </Section>
  );
};

const LIST_NAMES: Record<ListKey, string> = {
  speakers: 'people', sessions: 'schedule items', tickets: 'passes', sponsors: 'partners', faqs: 'questions', gallery: 'photographs', exhibitors: 'exhibitors',
  awards: 'award categories', milestones: 'story moments', itinerary: 'day-plan items', hotels: 'hotels', registry: 'registry links', highlights: 'highlights', specs: 'specification groups'
};

const ReviewSection: React.FC<{ ctx: StepCtx }> = ({ ctx }) => {
  const clean = useMemo(() => pruneBlank(ctx.form), [ctx.form]);
  const problems = useMemo(() => validateAll(ctx.form), [ctx.form]);
  const steps = stepsFor(ctx.category);
  // Only lists this category actually asks about are reported.
  const asked = useMemo(() => {
    const keys = new Set<ListKey>();
    steps.forEach((s) => s.sections.forEach((sec) => { if (sec.kind === 'list') keys.add(sec.list); }));
    return LIST_KEYS.filter((k) => keys.has(k));
  }, [steps]);
  const shown = asked.filter((k) => clean.lists[k].length > 0);
  const hidden = asked.filter((k) => clean.lists[k].length === 0);
  const v = clean.v;
  const when = [v.startDate, v.endDate].filter(Boolean).join(' → ');
  return (
    <div className="space-y-6">
      {problems.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />Fix these before creating the website</p>
          <ul className="mt-2 space-y-1">
            {problems.map((p) => <li key={p.step}><button type="button" onClick={() => ctx.goTo(p.step)} className="text-left text-xs font-semibold text-amber-900 underline">Step {p.step}: {steps[p.step - 1].title}: {Object.values(p.errors)[0]}</button></li>)}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Everything required is filled in.</p>
      )}

      <Section title="Summary">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {([['Event', v.name], ['Type', CATEGORY_LABEL[ctx.category]], ['Template', clean.template.templateName], ['Dates', when], ['Venue', [v.venueName, v.city].filter(Boolean).join(', ')], ['Contact email', v.email]] as [string, string][]).map(([k, val]) => (
            <div key={k} className="rounded-xl border border-dv-line bg-white px-4 py-3"><dt className="text-[11px] font-bold uppercase tracking-wider text-dv-muted">{k}</dt><dd className="mt-0.5 font-semibold text-dv-ink">{val || <span className="font-normal text-dv-muted">Not provided</span>}</dd></div>
          ))}
        </dl>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Will appear on the website">
          {shown.length === 0 ? <p className="text-xs text-dv-muted">Only the basic details so far.</p> : (
            <ul className="space-y-1.5">{shown.map((k) => <li key={k} className="flex items-center gap-2 text-sm text-dv-ink"><Check className="h-4 w-4 text-emerald-600" />{clean.lists[k].length} {LIST_NAMES[k]}</li>)}</ul>
          )}
        </Section>
        <Section title="Left out (nothing entered)" hint="These sections stay hidden. Nothing is made up to fill them.">
          {hidden.length === 0 ? <p className="text-xs text-dv-muted">Everything has some content.</p> : <ul className="space-y-1 text-sm text-dv-muted">{hidden.map((k) => <li key={k}>{LIST_NAMES[k]}</li>)}</ul>}
        </Section>
      </div>
      <p className="text-xs text-dv-muted">The website shows information only. It takes no payments: ticket buttons go to the booking links you provide.</p>
    </div>
  );
};

/* ------------------------------------------------------------------ step */

export const StepView: React.FC<{ index: number; ctx: StepCtx }> = ({ index, ctx }) => {
  const step = stepsFor(ctx.category)[index - 1];
  if (!step) return null;
  return (
    <div className="space-y-8">
      <StepHeading icon={Layers} title={step.title} subtitle={step.subtitle} />
      {step.sections.map((sec, i) => {
        switch (sec.kind) {
          case 'fields': return <FieldsSection key={i} sec={sec} ctx={ctx} />;
          case 'list': return <ListSection key={`${sec.list}-${i}`} sec={sec} ctx={ctx} />;
          case 'media': return <MediaSection key={i} ctx={ctx} />;
          case 'template': return <TemplateSection key={i} ctx={ctx} />;
          case 'review': return <ReviewSection key={i} ctx={ctx} />;
          default: return null;
        }
      })}
    </div>
  );
};

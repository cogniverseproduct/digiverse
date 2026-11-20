import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, History, Save } from 'lucide-react';
import type { ClientRequirements, SelectedTemplateMetadata } from '../../types/admin';
import type { EventCategoryId } from '../../templates/event/ids';
import { getEventTemplateById } from '../../templates/event/registry';
import { WizardFrame } from './wizard/WizardFrame';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import {
  CATEGORY_LABEL, buildRequirements, drafts, emptyForm, hasContent, mergeDraft, pruneBlank, stepsFor, validateAll, validateStep,
  type Entry, type FieldErrors, type IntakeForm, type ListKey
} from './event-intake/model';
import { StepView } from './event-intake/steps';

interface EventIntakeWizardProps {
  category: EventCategoryId;
  /** The template chosen in the library. */
  template: SelectedTemplateMetadata;
  /** Whose browser draft this is (the signed-in admin's id). */
  draftScope?: string;
  onCancel: () => void;
  /** Must reject when creation fails, so the draft is kept and the error shown here. */
  onSubmit: (requirements: ClientRequirements) => Promise<void>;
}

/**
 * A saved draft remembers its template, but templates can be renamed or removed between releases. Use the draft's template only if
 * it still exists for this category; otherwise keep the one just chosen in the library.
 */
export function draftTemplateOrCurrent(stored: SelectedTemplateMetadata | undefined, current: SelectedTemplateMetadata, category: EventCategoryId): SelectedTemplateMetadata {
  return stored && getEventTemplateById(stored.templateId)?.category === category ? stored : current;
}

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Client intake for the Event Website Creation Engine. The steps depend on the event type (a wedding is not asked for sponsors, a
 * conference is not asked for a gift registry). Every field starts empty, steps are validated before moving on, answers survive
 * Back/Next, and progress is saved in this browser per admin, event type and template. No payment, bank, UPI or card information is
 * collected: ticket buttons use the organiser's own external booking links.
 */
export const EventIntakeWizard: React.FC<EventIntakeWizardProps> = ({ category, template, draftScope = 'admin', onCancel, onSubmit }) => {
  const steps = useMemo(() => stepsFor(category), [category]);
  const total = steps.length;
  const [form, setForm] = useState<IntakeForm>(() => emptyForm(category, template));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const storageOk = useMemo(() => drafts.available(), []);
  // Drafts are kept per template: a different template can ask for different content.
  const [pendingDraft, setPendingDraft] = useState(() => (storageOk ? drafts.load(draftScope, category, template.templateId) : null));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = useRef(false);

  const touch = useCallback((fn: (f: IntakeForm) => IntakeForm) => { dirty.current = true; setForm(fn); }, []);
  const setValue = useCallback((key: string, value: string) => touch((f) => ({ ...f, v: { ...f.v, [key]: value } })), [touch]);
  const setList = useCallback((list: ListKey, entries: Entry[]) => touch((f) => ({ ...f, lists: { ...f.lists, [list]: entries } })), [touch]);
  const setTemplate = useCallback((t: SelectedTemplateMetadata) => touch((f) => ({ ...f, template: t })), [touch]);

  const saveNow = useCallback((s: number, f: IntakeForm) => {
    if (!storageOk) { setSaveError('This browser is blocking saved drafts.'); return; }
    if (!hasContent(f)) return;
    const r = drafts.save(draftScope, category, template.templateId, s, f);
    if (r.ok) { setSavedAt(r.savedAt || null); setSaveError(null); dirty.current = false; }
    else setSaveError(r.error || 'The draft could not be saved.');
  }, [storageOk, draftScope, category, template.templateId]);

  // Autosave shortly after the last change, never while the resume prompt is still unanswered (it would overwrite the saved draft).
  useEffect(() => {
    if (!dirty.current || pendingDraft || submitting) return;
    const t = window.setTimeout(() => saveNow(step, form), 900);
    return () => window.clearTimeout(t);
  }, [form, step, pendingDraft, submitting, saveNow]);

  // Keep visible errors in step with the form so they clear as soon as the problem is fixed.
  useEffect(() => {
    if (!Object.keys(errors).length) return;
    const next = validateStep(step, form);
    if (Object.keys(next).length !== Object.keys(errors).length) setErrors(next);
    if (!Object.keys(next).length) setBanner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const focusFirstError = () => window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  const goTo = (n: number) => { setStep(Math.min(Math.max(n, 1), total)); setErrors({}); setBanner(null); };

  const onNext = () => {
    const e = validateStep(step, form);
    if (Object.keys(e).length) {
      setErrors(e);
      setBanner(`Please fix ${Object.keys(e).length === 1 ? 'the highlighted problem' : `the ${Object.keys(e).length} highlighted problems`} before continuing.`);
      focusFirstError();
      return;
    }
    const cleaned = pruneBlank(form);
    setForm(cleaned);
    saveNow(step + 1, cleaned);
    goTo(step + 1);
  };

  const handleSubmit = async () => {
    const problems = validateAll(form);
    if (problems.length) {
      setStep(problems[0].step); setErrors(problems[0].errors);
      setBanner(`Step ${problems[0].step} needs attention before the website can be created.`);
      focusFirstError();
      return;
    }
    setSubmitting(true); setBanner(null);
    try {
      await onSubmit(buildRequirements(form));
      drafts.clear(draftScope, category, template.templateId);
    } catch (err) {
      saveNow(step, form); // keep everything the Admin entered
      setBanner(err instanceof Error && err.message ? `The website could not be created: ${err.message}` : 'The website could not be created. Your answers are saved; please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const ctx = { form, category, errors, setValue, setList, setTemplate, goTo };

  return (
    <WizardFrame
      engine="event"
      kicker={`${CATEGORY_LABEL[category]} · ${form.template.templateName}`}
      title="New event website"
      description="Enter the event’s real details. They fill the selected template, and anything left empty is simply left out."
      steps={steps.map((s) => ({ title: s.title }))}
      current={step}
      onStepChange={goTo}
      onNext={onNext}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Create website"
      error={banner}
      headerActions={
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-dv-muted sm:inline" aria-live="polite">
            {saveError ? saveError : savedAt ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" />Draft saved {timeLabel(savedAt)}</span> : storageOk ? 'Progress saves automatically' : 'Drafts are unavailable in this browser'}
          </span>
          <button type="button" onClick={() => saveNow(step, form)} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-dv-line bg-white px-3 py-2 text-xs font-semibold text-dv-ink-2 hover:text-dv-ink">
            <Save className="h-3.5 w-3.5" />Save draft
          </button>
        </div>
      }
    >
      {pendingDraft && (
        <div role="region" aria-label="Saved draft" className="mb-6 flex flex-col gap-3 rounded-2xl border border-dv-iris-200 bg-dv-iris-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-dv-ink"><History className="mt-0.5 h-4 w-4 shrink-0 text-dv-iris-700" />You have a saved draft from {new Date(pendingDraft.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. Resume it, or start fresh?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForm({ ...mergeDraft(emptyForm(category, template), pendingDraft.form), category, template: draftTemplateOrCurrent(pendingDraft.form.template, template, category) }); setStep(Math.min(Math.max(pendingDraft.step, 1), total)); setPendingDraft(null); }} className="rounded-xl bg-dv-iris-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Resume draft</button>
            <button type="button" onClick={() => { drafts.clear(draftScope, category, template.templateId); setPendingDraft(null); }} className="rounded-xl border border-dv-line bg-white px-3.5 py-2 text-xs font-bold text-dv-ink-2 hover:text-dv-ink">Start fresh</button>
          </div>
        </div>
      )}
      <ErrorBoundary area="This step" resetKey={step} onBack={() => goTo(Math.max(1, step - 1))}>
        <StepView index={step} ctx={ctx} />
      </ErrorBoundary>
    </WizardFrame>
  );
};

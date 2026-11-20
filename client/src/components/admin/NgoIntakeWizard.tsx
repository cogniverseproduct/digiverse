import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, History, Save } from 'lucide-react';
import type { ClientRequirements, SelectedTemplateMetadata } from '../../types/admin';
import type { NgoArchetypeId } from '../../templates/ngo/ids';
import { getNgoTemplateById } from '../../templates/ngo/registry';
import { WizardFrame } from './wizard/WizardFrame';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import {
  ARCHETYPE_LABEL, STEPS, buildRequirements, drafts, emptyForm, hasContent, mergeDraft, pruneBlank, validateAll, validateStep,
  type Entry, type FieldErrors, type IntakeForm, type ListKey
} from './ngo-intake/model';
import { StepView } from './ngo-intake/steps';

interface NgoIntakeWizardProps {
  archetype: NgoArchetypeId;
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
 * it still exists for this archetype; otherwise keep the one just chosen in the library.
 */
export function draftTemplateOrCurrent(stored: SelectedTemplateMetadata | undefined, current: SelectedTemplateMetadata, archetype: NgoArchetypeId): SelectedTemplateMetadata {
  return stored && getNgoTemplateById(stored.templateId)?.archetype === archetype ? stored : current;
}

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Client intake for the Social & NGO Website Creation Engine: ten steps, the same for all three archetypes. Every field starts empty,
 * steps are validated before moving on, answers survive Back/Next, and progress is saved in this browser. No payment, bank, UPI, tax-id
 * or donor information is collected.
 */
export const NgoIntakeWizard: React.FC<NgoIntakeWizardProps> = ({ archetype, template, draftScope = 'admin', onCancel, onSubmit }) => {
  const total = STEPS.length;
  const [form, setForm] = useState<IntakeForm>(() => emptyForm(template));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const storageOk = useMemo(() => drafts.available(), []);
  const [pendingDraft, setPendingDraft] = useState(() => (storageOk ? drafts.load(draftScope, archetype) : null));
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
    const r = drafts.save(draftScope, archetype, s, f);
    if (r.ok) { setSavedAt(r.savedAt || null); setSaveError(null); dirty.current = false; }
    else setSaveError(r.error || 'The draft could not be saved.');
  }, [storageOk, draftScope, archetype]);

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
      await onSubmit(buildRequirements(form, archetype));
      drafts.clear(draftScope, archetype);
    } catch (err) {
      saveNow(step, form); // keep everything the Admin entered
      setBanner(err instanceof Error && err.message ? `The website could not be created: ${err.message}` : 'The website could not be created. Your answers are saved; please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const ctx = { form, archetype, errors, setValue, setList, setTemplate, goTo };

  return (
    <WizardFrame
      engine="ngo"
      kicker={`${ARCHETYPE_LABEL[archetype]} · ${form.template.templateName}`}
      title="New Social & NGO website"
      description="Enter the organisation’s real details. They fill the selected template, and anything left empty is simply left out."
      steps={STEPS.map((s) => ({ title: s.title }))}
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
            <button type="button" onClick={() => { setForm({ ...mergeDraft(emptyForm(template), pendingDraft.form), template: draftTemplateOrCurrent(pendingDraft.form.template, template, archetype) }); setStep(Math.min(Math.max(pendingDraft.step, 1), total)); setPendingDraft(null); }} className="rounded-xl bg-dv-iris-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Resume draft</button>
            <button type="button" onClick={() => { drafts.clear(draftScope, archetype); setPendingDraft(null); }} className="rounded-xl border border-dv-line bg-white px-3.5 py-2 text-xs font-bold text-dv-ink-2 hover:text-dv-ink">Start fresh</button>
          </div>
        </div>
      )}
      <ErrorBoundary area="This step" resetKey={step} onBack={() => goTo(Math.max(1, step - 1))}>
        <StepView index={step} ctx={ctx} />
      </ErrorBoundary>
    </WizardFrame>
  );
};

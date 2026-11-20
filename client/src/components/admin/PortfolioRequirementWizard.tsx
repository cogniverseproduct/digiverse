import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, History, Save } from 'lucide-react';
import type { ClientRequirements, SelectedTemplateMetadata } from '../../types/admin';
import type { PortfolioArchetype } from '../../types/portfolio';
import { PORTFOLIO_TEMPLATES } from '../../templates/portfolio/registry';
import { getProfession, recommendedTemplateFor } from '../../templates/portfolio/professions';
import { buildPortfolioTemplateMetadata } from './templates/PortfolioTemplateLibrary';
import { WizardFrame } from './wizard/WizardFrame';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { api } from '../../lib/api';
import {
  STEP_TITLES, buildRequirements, drafts, emptyForm, mergeDraft, pruneBlank, validateAll, validateStep,
  type FieldErrors, type IntakeForm
} from './portfolio-intake/model';
import { STEP_COMPONENTS } from './portfolio-intake/steps';

interface PortfolioRequirementWizardProps {
  archetype: PortfolioArchetype;
  /** The template chosen in the Portfolio Engine. Falls back to the profession's recommended template. */
  initialTemplate?: SelectedTemplateMetadata;
  /** Identifies whose browser draft this is (the signed-in admin's id). */
  draftScope?: string;
  onCancel: () => void;
  /** Must reject when creation fails, so the draft is kept and the error shown here. */
  onSubmit: (requirements: ClientRequirements) => Promise<void>;
}

const TOTAL = STEP_TITLES.length;
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Ten-step client intake for the Portfolio Engine. The steps are the same for every profession; the labels,
 * suggestions, project fields and link slots come from the profession config. Progress is saved in the
 * browser, validated per step, and nothing is pre-filled with sample data.
 */
export const PortfolioRequirementWizard: React.FC<PortfolioRequirementWizardProps> = ({ archetype, initialTemplate, draftScope = 'admin', onCancel, onSubmit }) => {
  const prof = getProfession(archetype);

  const baseTemplate = useMemo<SelectedTemplateMetadata>(
    () => initialTemplate || buildPortfolioTemplateMetadata(PORTFOLIO_TEMPLATES[recommendedTemplateFor(archetype)]),
    [initialTemplate, archetype]
  );

  const [form, setForm] = useState<IntakeForm>(() => emptyForm(baseTemplate));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameNotice, setNameNotice] = useState<string | null>(null);

  // Drafts live in this browser only.
  const storageOk = useMemo(() => drafts.available(), []);
  const [pendingDraft, setPendingDraft] = useState(() => (storageOk ? drafts.load(draftScope, archetype) : null));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = useRef(false);

  const set = useCallback((patch: Partial<IntakeForm>) => {
    dirty.current = true;
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const saveNow = useCallback((s: number, f: IntakeForm) => {
    if (!storageOk) { setSaveError('This browser is blocking saved drafts.'); return; }
    const r = drafts.save(draftScope, archetype, s, f);
    if (r.ok) { setSavedAt(r.savedAt || null); setSaveError(null); dirty.current = false; }
    else setSaveError(r.error || 'The draft could not be saved.');
  }, [storageOk, draftScope, archetype]);

  // Autosave shortly after the last change. Never while an unanswered "resume draft?" prompt is showing,
  // otherwise an empty form would overwrite the draft before the Admin chooses.
  useEffect(() => {
    if (!dirty.current || pendingDraft || submitting) return;
    const t = window.setTimeout(() => saveNow(step, form), 900);
    return () => window.clearTimeout(t);
  }, [form, step, pendingDraft, submitting, saveNow]);

  // Keep the visible errors in step with the form so they clear as soon as the problem is fixed.
  useEffect(() => {
    if (Object.keys(errors).length) {
      const next = validateStep(step, form, archetype);
      if (Object.keys(next).length !== Object.keys(errors).length) setErrors(next);
      if (!Object.keys(next).length) setBanner(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const focusFirstError = () => window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));

  const goTo = (n: number) => { setStep(Math.min(Math.max(n, 1), TOTAL)); setErrors({}); setBanner(null); };

  const onNext = async () => {
    const e = validateStep(step, form, archetype);
    if (Object.keys(e).length) {
      setErrors(e);
      setBanner(`Please fix ${Object.keys(e).length === 1 ? 'the highlighted problem' : `the ${Object.keys(e).length} highlighted problems`} before continuing.`);
      focusFirstError();
      return;
    }
    if (step === 1) {
      // Tell the Admin now, not after ten steps, if this name belongs to someone else. The server still enforces it on create.
      try {
        const check = await api.checkOrganizationName(form.fullName.trim());
        if (check.status === 'unavailable') {
          setErrors({ fullName: check.message || 'This name is already used by another organisation.' });
          setBanner(check.message || 'This name is already used by another organisation.');
          setNameNotice(null);
          focusFirstError();
          return;
        }
        setNameNotice(check.status === 'yours' ? `“${form.fullName.trim()}” is already one of your organisations. The new portfolio will be added under it; the existing organisation is not changed.` : null);
      } catch {
        setNameNotice(null); // the check is advisory; creation re-validates on the server
      }
    }
    setForm((f) => pruneBlank(f)); // drop cards that were added but left empty
    saveNow(step + 1, pruneBlank(form));
    goTo(step + 1);
  };

  const handleSubmit = async () => {
    const problems = validateAll(form, archetype);
    if (problems.length) {
      setStep(problems[0].step); setErrors(problems[0].errors);
      setBanner(`Step ${problems[0].step} needs attention before the portfolio can be created.`);
      focusFirstError();
      return;
    }
    setSubmitting(true); setBanner(null);
    try {
      await onSubmit(buildRequirements(form, archetype));
      drafts.clear(draftScope, archetype);
    } catch (err) {
      saveNow(step, form); // keep everything the Admin entered
      setBanner(err instanceof Error && err.message ? `The portfolio could not be created: ${err.message}` : 'The portfolio could not be created. Your answers are saved; please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <WizardFrame
      engine="portfolio"
      kicker={`${prof.label} · ${form.template.templateName}`}
      title="New portfolio"
      description="Collect the client’s story, work and credentials. The details you enter fill the selected template."
      steps={STEP_TITLES.map((t) => ({ title: t }))}
      current={step}
      onStepChange={goTo}
      onNext={onNext}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="Create portfolio"
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
          <p className="flex items-start gap-2 text-sm text-dv-ink"><History className="mt-0.5 h-4 w-4 shrink-0 text-dv-iris-700" />You have a saved {prof.label.toLowerCase()} draft from {new Date(pendingDraft.savedAt).toLocaleString()}.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForm({ ...mergeDraft(emptyForm(baseTemplate), pendingDraft.form), template: baseTemplate }); setStep(Math.min(Math.max(pendingDraft.step, 1), TOTAL)); setPendingDraft(null); }} className="rounded-xl bg-dv-iris-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-dv-iris-500">Resume draft</button>
            <button type="button" onClick={() => { drafts.clear(draftScope, archetype); setPendingDraft(null); }} className="rounded-xl border border-dv-line bg-white px-3.5 py-2 text-xs font-bold text-dv-ink-2 hover:text-dv-ink">Start fresh</button>
          </div>
        </div>
      )}
      {nameNotice && (
        <p role="status" className="mb-6 rounded-2xl border border-dv-iris-200 bg-dv-iris-50 p-4 text-sm text-dv-ink">{nameNotice}</p>
      )}
      <ErrorBoundary area="This step" resetKey={step} onBack={() => goTo(Math.max(1, step - 1))}>
        <StepComponent form={form} set={set} errors={errors} archetype={archetype} onJump={goTo} />
      </ErrorBoundary>
    </WizardFrame>
  );
};

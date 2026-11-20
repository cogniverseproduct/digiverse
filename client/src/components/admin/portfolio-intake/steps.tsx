import React, { useState } from 'react';
import { Award, Briefcase, CheckCircle2, Code2, GraduationCap, History, Image as ImageIcon, Layers, Layout, Link2, User, AlertCircle, X } from 'lucide-react';
import type { PortfolioArchetype } from '../../../types/portfolio';
import { getProfession, type ProjectFieldKey } from '../../../templates/portfolio/professions';
import { getPortfolioTemplateById, isLegacyTemplateId, LEGACY_TEMPLATES, PORTFOLIO_TEMPLATES } from '../../../templates/portfolio/registry';
import { PortfolioTemplateSelector } from '../templates/PortfolioTemplateSelector';
import GalleryAndVideoSection from '../media/GalleryAndVideoSection';
import {
  type FieldErrors, type IntakeForm, newId, emptyProject, validateAll, pruneBlank
} from './model';
import { AddButton, EntryCard, GalleryInput, ImageInput, Section, SelectField, StepHeading, TextArea, TextField, inputCls } from './ui';

export interface StepProps {
  form: IntakeForm;
  set: (patch: Partial<IntakeForm>) => void;
  errors: FieldErrors;
  archetype: PortfolioArchetype;
}

/** Replace one entry of a list by id. */
function patchList<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

/* ---------------------------------------------------------------- 1 identity */
export const IdentityStep: React.FC<StepProps> = ({ form, set, errors }) => (
  <div>
    <StepHeading icon={User} title="Identity and contact" subtitle="Who is this portfolio for, and how should visitors reach them? These details appear on the site’s header and contact section." />
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Full name" required value={form.fullName} onChange={(v) => set({ fullName: v })} error={errors.fullName} placeholder="Client’s full name" />
      <TextField label="Contact email" required type="email" inputMode="email" value={form.email} onChange={(v) => set({ email: v })} error={errors.email} placeholder="name@example.com" />
      <TextField label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={(v) => set({ phone: v })} error={errors.phone} placeholder="Optional" hint="Shown only if you fill it in." />
      <TextField label="Location" value={form.location} onChange={(v) => set({ location: v })} placeholder="City, country" hint="Optional." />
    </div>
  </div>
);

/* ------------------------------------------------------------ 2 introduction */
export const IntroStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  return (
    <div>
      <StepHeading icon={Briefcase} title="Professional title and introduction" subtitle="The words that open the site: a title, a one-line headline and a biography." />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Professional title" required value={form.title} onChange={(v) => set({ title: v })} error={errors.title} placeholder={prof.copy.titlePlaceholder} />
        <TextField label="Years of experience" type="number" inputMode="numeric" value={form.yearsOfExperience} onChange={(v) => set({ yearsOfExperience: v })} error={errors.yearsOfExperience} hint="Optional. Leave blank if not applicable." />
        <TextField label="Current company or studio" value={form.currentCompany} onChange={(v) => set({ currentCompany: v })} hint="Optional." />
        <TextField label="Current role" value={form.currentRole} onChange={(v) => set({ currentRole: v })} hint="Optional." />
        <TextArea className="sm:col-span-2" label="Headline" required rows={2} value={form.headline} onChange={(v) => set({ headline: v })} error={errors.headline} placeholder={prof.copy.headlinePlaceholder} />
        <TextArea className="sm:col-span-2" label="Biography" required rows={6} value={form.bio} onChange={(v) => set({ bio: v })} error={errors.bio} hint={prof.copy.bioHint} />
        <label className="flex min-h-[32px] items-center gap-2 text-sm text-dv-ink-2 sm:col-span-2">
          <input type="checkbox" checked={form.availableForHire} onChange={(e) => set({ availableForHire: e.target.checked })} className="h-4 w-4 rounded border-dv-line text-dv-iris-600 focus:ring-dv-iris-500" />
          Show an “available for new work” badge
        </label>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- 3 experience */
export const ExperienceStep: React.FC<StepProps> = ({ form, set, errors }) => (
  <div>
    <StepHeading icon={History} title="Professional experience" subtitle="Most recent first. Leave this empty if the client has no work history yet." />
    <div className="space-y-4">
      {form.experience.map((x, i) => (
        <EntryCard key={x.id} title={`Role ${i + 1}`} error={errors[`experience_${x.id}`]} onRemove={() => set({ experience: form.experience.filter((e) => e.id !== x.id) })}>
          <TextField label="Role" required value={x.role} onChange={(v) => set({ experience: patchList(form.experience, x.id, { role: v }) })} />
          <TextField label="Company or organisation" required value={x.company} onChange={(v) => set({ experience: patchList(form.experience, x.id, { company: v }) })} />
          <TextField label="Start" value={x.startDate} onChange={(v) => set({ experience: patchList(form.experience, x.id, { startDate: v }) })} placeholder="e.g. Mar 2021" />
          <TextField label="End" value={x.current ? '' : x.endDate} onChange={(v) => set({ experience: patchList(form.experience, x.id, { endDate: v }) })} placeholder={x.current ? 'Present' : 'e.g. Aug 2024'} hint={x.current ? 'Current role' : undefined} />
          <label className="flex min-h-[32px] items-center gap-2 text-xs text-dv-ink-2 sm:col-span-2"><input type="checkbox" checked={x.current} onChange={(e) => set({ experience: patchList(form.experience, x.id, { current: e.target.checked }) })} className="h-4 w-4 rounded border-dv-line text-dv-iris-600" />I currently work here</label>
          <TextField className="sm:col-span-2" label="Location" value={x.location} onChange={(v) => set({ experience: patchList(form.experience, x.id, { location: v }) })} />
          <TextArea className="sm:col-span-2" label="What did they do?" rows={3} value={x.description} onChange={(v) => set({ experience: patchList(form.experience, x.id, { description: v }) })} />
        </EntryCard>
      ))}
      <AddButton label="Add experience" onClick={() => set({ experience: [...form.experience, { id: newId('exp'), role: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }] })} />
    </div>
  </div>
);

/* ------------------------------------------------------------------ 4 skills */
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const SkillsStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(prof.skillCategories[0] || '');
  const [level, setLevel] = useState('Advanced');
  const has = (n: string) => form.skills.some((s) => s.name.toLowerCase() === n.toLowerCase());
  const add = (n: string) => {
    const v = n.trim();
    if (!v || has(v)) return;
    set({ skills: [...form.skills, { id: newId('sk'), name: v, category, proficiency: level }] });
  };
  return (
    <div>
      <StepHeading icon={Code2} title={prof.copy.skillsHeading} subtitle="Add the skills that matter for this profession. Group them by category and set how strong each one is." />
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <TextField label="Skill" value={name} onChange={setName} placeholder={prof.copy.skillPlaceholder} error={errors.skills} />
          <SelectField label="Category" value={category} onChange={setCategory} options={prof.skillCategories} emptyLabel="General" />
          <SelectField label="Level" value={level} onChange={setLevel} options={LEVELS} emptyLabel="—" />
          <button type="button" onClick={() => { add(name); setName(''); }} className="rounded-xl bg-dv-iris-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-dv-iris-500">Add skill</button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-dv-muted">Quick add:</span>
          {prof.skillSuggestions.filter((s) => !has(s)).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="min-h-[32px] rounded-full border border-dv-line bg-white px-3 py-1.5 text-[11px] font-medium text-dv-ink-2 hover:border-dv-iris-500 hover:text-dv-iris-700">+ {s}</button>
          ))}
        </div>
        {form.skills.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {form.skills.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl border border-dv-line bg-white p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-dv-ink">{s.name}</div>
                  <div className="mt-1 flex gap-1.5">
                    <select aria-label={`${s.name} category`} value={s.category} onChange={(e) => set({ skills: patchList(form.skills, s.id, { category: e.target.value }) })} className="min-w-0 rounded-md border border-dv-line bg-white px-1.5 py-1 text-[11px] text-dv-ink-2">
                      <option value="">General</option>
                      {prof.skillCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select aria-label={`${s.name} level`} value={s.proficiency} onChange={(e) => set({ skills: patchList(form.skills, s.id, { proficiency: e.target.value }) })} className="rounded-md border border-dv-line bg-white px-1.5 py-1 text-[11px] text-dv-ink-2">
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" aria-label={`Remove ${s.name}`} onClick={() => set({ skills: form.skills.filter((x) => x.id !== s.id) })} className="rounded-lg p-1.5 text-dv-muted hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- 5 education */
export const EducationStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  return (
    <div>
      <StepHeading icon={GraduationCap} title="Education and qualifications" subtitle={prof.educationHint} />
      {errors.education && <p role="alert" className="mb-3 flex items-start gap-1 text-[12px] font-medium text-rose-600"><AlertCircle className="mt-px h-3.5 w-3.5" />{errors.education}</p>}
      <div className="space-y-4">
        {form.education.map((x, i) => (
          <EntryCard key={x.id} title={`Qualification ${i + 1}`} error={errors[`education_${x.id}`]} onRemove={() => set({ education: form.education.filter((e) => e.id !== x.id) })}>
            <TextField label="Degree or qualification" required value={x.degree} onChange={(v) => set({ education: patchList(form.education, x.id, { degree: v }) })} placeholder="e.g. B.Des, Interaction Design" />
            <TextField label="Institution" required value={x.institution} onChange={(v) => set({ education: patchList(form.education, x.id, { institution: v }) })} />
            <TextField label="Year or period" value={x.year} onChange={(v) => set({ education: patchList(form.education, x.id, { year: v }) })} placeholder="e.g. 2019 – 2023" />
            <TextField label="Location" value={x.location} onChange={(v) => set({ education: patchList(form.education, x.id, { location: v }) })} />
            <TextField className="sm:col-span-2" label="Honours, grade or notes" value={x.honors} onChange={(v) => set({ education: patchList(form.education, x.id, { honors: v }) })} placeholder="e.g. First class, thesis topic, scholarship" />
          </EntryCard>
        ))}
        <AddButton label="Add qualification" onClick={() => set({ education: [...form.education, { id: newId('edu'), degree: '', institution: '', location: '', year: '', honors: '' }] })} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- 6 work */
export const WorkStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  const toolsLabel = archetype === 'developer' || archetype === 'data_scientist' || archetype === 'student_grad' ? 'Technologies (comma separated)' : 'Tools and materials (comma separated)';
  const field = (key: ProjectFieldKey, p: IntakeForm['projects'][number]) => {
    const upd = (patch: Partial<typeof p>) => set({ projects: patchList(form.projects, p.id, patch) });
    switch (key) {
      case 'summary': return <TextArea key={key} className="sm:col-span-2" label="Summary" rows={3} value={p.summary} onChange={(v) => upd({ summary: v })} />;
      case 'category': return <SelectField key={key} label="Category" value={p.category} onChange={(v) => upd({ category: v })} options={prof.projectCategories} emptyLabel="Choose a category" />;
      case 'year': return <TextField key={key} label="Year" value={p.year} onChange={(v) => upd({ year: v })} placeholder="e.g. 2025" />;
      case 'role': return <TextField key={key} label="Your role" value={p.role} onChange={(v) => upd({ role: v })} />;
      case 'client': return <TextField key={key} label="Client or brand" value={p.client} onChange={(v) => upd({ client: v })} />;
      case 'problem': return <TextArea key={key} className="sm:col-span-2" label="The problem" rows={2} value={p.problem} onChange={(v) => upd({ problem: v })} />;
      case 'process': return <TextArea key={key} className="sm:col-span-2" label="The process" rows={2} value={p.process} onChange={(v) => upd({ process: v })} />;
      case 'outcome': return <TextArea key={key} className="sm:col-span-2" label="The outcome" rows={2} value={p.outcome} onChange={(v) => upd({ outcome: v })} />;
      case 'location': return <TextField key={key} label="Location" value={p.location} onChange={(v) => upd({ location: v })} />;
      case 'area': return <TextField key={key} label="Area or scale" value={p.area} onChange={(v) => upd({ area: v })} placeholder="e.g. 2,400 sq ft" />;
      case 'tools': return <TextField key={key} className="sm:col-span-2" label={toolsLabel} value={p.tools} onChange={(v) => upd({ tools: v })} />;
      case 'liveUrl': return <TextField key={key} label="Live link" inputMode="url" value={p.liveUrl} onChange={(v) => upd({ liveUrl: v })} placeholder="https://…" />;
      case 'githubUrl': return <TextField key={key} label="Repository link" inputMode="url" value={p.githubUrl} onChange={(v) => upd({ githubUrl: v })} placeholder="https://github.com/…" />;
      case 'caseStudyUrl': return <TextField key={key} label="Case study link" inputMode="url" value={p.caseStudyUrl} onChange={(v) => upd({ caseStudyUrl: v })} placeholder="https://…" />;
      case 'videoUrl': return <TextField key={key} label="Video link" inputMode="url" value={p.videoUrl} onChange={(v) => upd({ videoUrl: v })} placeholder="https://youtube.com/…" />;
      case 'image': return <div key={key} className="sm:col-span-2"><ImageInput label="Cover image" value={p.image} onChange={(v) => upd({ image: v })} /></div>;
      case 'gallery': return <div key={key} className="sm:col-span-2"><GalleryInput label={archetype === 'photographer' ? 'Photographs in this gallery' : 'More images'} values={p.gallery} onChange={(v) => upd({ gallery: v })} /></div>;
      default: return null;
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <StepHeading icon={Layers} title={prof.copy.projectsHeading} subtitle={prof.copy.projectsHint} />
        {errors.projects && <p role="alert" className="mb-3 flex items-start gap-1 text-[12px] font-medium text-rose-600"><AlertCircle className="mt-px h-3.5 w-3.5" />{errors.projects}</p>}
        <div className="space-y-4">
          {form.projects.map((p, i) => (
            <EntryCard key={p.id} title={`${prof.copy.projectNoun.charAt(0).toUpperCase()}${prof.copy.projectNoun.slice(1)} ${i + 1}`} error={errors[`project_${p.id}`]} onRemove={() => set({ projects: form.projects.filter((x) => x.id !== p.id) })}>
              <TextField className="sm:col-span-2" label="Title" required value={p.title} onChange={(v) => set({ projects: patchList(form.projects, p.id, { title: v }) })} />
              {prof.projectFields.map((k) => field(k, p))}
            </EntryCard>
          ))}
          <AddButton label={`Add ${prof.copy.projectNoun}`} onClick={() => set({ projects: [...form.projects, emptyProject()] })} />
        </div>
      </div>

      {prof.extras.includes('services') && (
        <Section title="Services and packages" hint="What can clients hire this person for? Prices are optional.">
          <div className="space-y-4">
            {form.services.map((x, i) => (
              <EntryCard key={x.id} title={`Service ${i + 1}`} error={errors[`service_${x.id}`]} onRemove={() => set({ services: form.services.filter((s) => s.id !== x.id) })}>
                <TextField label="Service" required value={x.title} onChange={(v) => set({ services: patchList(form.services, x.id, { title: v }) })} />
                <TextField label="Starting price" value={x.price} onChange={(v) => set({ services: patchList(form.services, x.id, { price: v }) })} placeholder="e.g. From $1,200" hint="Optional." />
                <TextArea className="sm:col-span-2" label="Description" required rows={2} value={x.description} onChange={(v) => set({ services: patchList(form.services, x.id, { description: v }) })} />
                <TextField label="Timeline" value={x.timeline} onChange={(v) => set({ services: patchList(form.services, x.id, { timeline: v }) })} placeholder="e.g. 2–3 weeks" />
                <TextField label="Deliverables (comma separated)" value={x.deliverables} onChange={(v) => set({ services: patchList(form.services, x.id, { deliverables: v }) })} />
              </EntryCard>
            ))}
            <AddButton label="Add service" onClick={() => set({ services: [...form.services, { id: newId('svc'), title: '', description: '', price: '', timeline: '', deliverables: '' }] })} />
          </div>
        </Section>
      )}

      {prof.extras.includes('publications') && (
        <Section title="Publications" hint="Papers, articles and talks. Add the link and abstract if available.">
          <div className="space-y-4">
            {form.publications.map((x, i) => (
              <EntryCard key={x.id} title={`Publication ${i + 1}`} error={errors[`publication_${x.id}`]} onRemove={() => set({ publications: form.publications.filter((s) => s.id !== x.id) })}>
                <TextField className="sm:col-span-2" label="Title" required value={x.title} onChange={(v) => set({ publications: patchList(form.publications, x.id, { title: v }) })} />
                <TextField label="Venue or journal" value={x.venue} onChange={(v) => set({ publications: patchList(form.publications, x.id, { venue: v }) })} />
                <TextField label="Year" value={x.year} onChange={(v) => set({ publications: patchList(form.publications, x.id, { year: v }) })} />
                <TextField label="Authors (comma separated)" value={x.authors} onChange={(v) => set({ publications: patchList(form.publications, x.id, { authors: v }) })} />
                <TextField label="Link or DOI URL" inputMode="url" value={x.url} onChange={(v) => set({ publications: patchList(form.publications, x.id, { url: v }) })} placeholder="https://…" />
                <TextArea className="sm:col-span-2" label="Abstract" rows={3} value={x.abstract} onChange={(v) => set({ publications: patchList(form.publications, x.id, { abstract: v }) })} />
              </EntryCard>
            ))}
            <AddButton label="Add publication" onClick={() => set({ publications: [...form.publications, { id: newId('pub'), title: '', venue: '', year: '', authors: '', url: '', abstract: '' }] })} />
          </div>
        </Section>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ 7 achievements */
export const AchievementsStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  return (
    <div className="space-y-8">
      <div>
        <StepHeading icon={Award} title="Achievements and certifications" subtitle="Awards, recognition and credentials. Everything here is optional." />
        <Section title="Achievements and awards">
          <div className="space-y-4">
            {form.achievements.map((x, i) => (
              <EntryCard key={x.id} title={`Achievement ${i + 1}`} error={errors[`achievement_${x.id}`]} onRemove={() => set({ achievements: form.achievements.filter((s) => s.id !== x.id) })}>
                <TextField label="Title" required value={x.title} onChange={(v) => set({ achievements: patchList(form.achievements, x.id, { title: v }) })} />
                <TextField label="Awarded by" value={x.issuer} onChange={(v) => set({ achievements: patchList(form.achievements, x.id, { issuer: v }) })} />
                <TextField label="Year" value={x.year} onChange={(v) => set({ achievements: patchList(form.achievements, x.id, { year: v }) })} />
                <TextField label="Link" inputMode="url" value={x.url} onChange={(v) => set({ achievements: patchList(form.achievements, x.id, { url: v }) })} placeholder="https://…" />
                <TextArea className="sm:col-span-2" label="Details" rows={2} value={x.description} onChange={(v) => set({ achievements: patchList(form.achievements, x.id, { description: v }) })} />
              </EntryCard>
            ))}
            <AddButton label="Add achievement" onClick={() => set({ achievements: [...form.achievements, { id: newId('ach'), title: '', issuer: '', year: '', description: '', url: '' }] })} />
          </div>
        </Section>
      </div>
      <Section title="Certifications and licences">
        <div className="space-y-4">
          {form.certifications.map((x, i) => (
            <EntryCard key={x.id} title={`Certification ${i + 1}`} error={errors[`certification_${x.id}`]} onRemove={() => set({ certifications: form.certifications.filter((s) => s.id !== x.id) })}>
              <TextField label="Name" required value={x.name} onChange={(v) => set({ certifications: patchList(form.certifications, x.id, { name: v }) })} />
              <TextField label="Issued by" value={x.issuer} onChange={(v) => set({ certifications: patchList(form.certifications, x.id, { issuer: v }) })} />
              <TextField label="Year" value={x.year} onChange={(v) => set({ certifications: patchList(form.certifications, x.id, { year: v }) })} />
              <TextField label="Credential link" inputMode="url" value={x.credentialUrl} onChange={(v) => set({ certifications: patchList(form.certifications, x.id, { credentialUrl: v }) })} placeholder="https://…" />
            </EntryCard>
          ))}
          <AddButton label="Add certification" onClick={() => set({ certifications: [...form.certifications, { id: newId('cert'), name: '', issuer: '', year: '', credentialUrl: '' }] })} />
        </div>
      </Section>
      {prof.extras.includes('testimonials') && (
        <Section title="Testimonials" hint="Quotes from clients or colleagues, used by templates that have a reviews section.">
          <div className="space-y-4">
            {form.testimonials.map((x, i) => (
              <EntryCard key={x.id} title={`Testimonial ${i + 1}`} error={errors[`testimonial_${x.id}`]} onRemove={() => set({ testimonials: form.testimonials.filter((s) => s.id !== x.id) })}>
                <TextArea className="sm:col-span-2" label="Quote" required rows={3} value={x.quote} onChange={(v) => set({ testimonials: patchList(form.testimonials, x.id, { quote: v }) })} />
                <TextField label="Name" value={x.author} onChange={(v) => set({ testimonials: patchList(form.testimonials, x.id, { author: v }) })} />
                <TextField label="Role" value={x.role} onChange={(v) => set({ testimonials: patchList(form.testimonials, x.id, { role: v }) })} />
                <TextField label="Company" value={x.company} onChange={(v) => set({ testimonials: patchList(form.testimonials, x.id, { company: v }) })} />
              </EntryCard>
            ))}
            <AddButton label="Add testimonial" onClick={() => set({ testimonials: [...form.testimonials, { id: newId('tst'), quote: '', author: '', role: '', company: '' }] })} />
          </div>
        </Section>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ 8 assets */
export const AssetsStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => (
  <div className="space-y-6">
    <StepHeading icon={ImageIcon} title="Images, profile photo and assets" subtitle={archetype === 'photographer' ? 'Gallery photographs are added per gallery in the Work step. Add the portrait, cover and any extra images here.' : 'Upload files or paste links. Pictures you add here fill the hero, about and gallery areas of the template.'} />
    <div className="grid gap-5 sm:grid-cols-2">
      <ImageInput label="Profile photo" kind="logo" value={form.profilePhoto} onChange={(v) => set({ profilePhoto: v })} error={errors.profilePhoto} hint="A square or portrait photo works best." />
      <ImageInput label="Cover or hero image" kind="hero" value={form.coverImage} onChange={(v) => set({ coverImage: v })} error={errors.coverImage} hint="A wide image for the top of the site." />
    </div>
    <GalleryInput label="Additional images" values={form.additionalImages} onChange={(v) => set({ additionalImages: v })} hint="Extra photographs or artwork for galleries and the about section." />
    <GalleryAndVideoSection
      googleDriveGalleryUrl={form.googleDriveGalleryUrl}
      onGoogleDriveGalleryUrlChange={(v: string) => set({ googleDriveGalleryUrl: v })}
      googleDriveVideoUrl={form.googleDriveVideoUrl}
      onGoogleDriveVideoUrlChange={(v: string) => set({ googleDriveVideoUrl: v })}
      googleDriveVideoUrls={form.googleDriveVideoUrls}
      onGoogleDriveVideoUrlsChange={(v: string[]) => set({ googleDriveVideoUrls: v })}
      youtubeUrls={form.youtubeUrls}
      onYoutubeUrlsChange={(v: string[]) => set({ youtubeUrls: v })}
      youtubePlaylistUrls={form.youtubePlaylistUrls}
      onYoutubePlaylistUrlsChange={(v: string[]) => set({ youtubePlaylistUrls: v })}
    />
  </div>
);

/* ------------------------------------------------------------------- 9 links */
export const LinksStep: React.FC<StepProps> = ({ form, set, errors, archetype }) => {
  const prof = getProfession(archetype);
  return (
    <div>
      <StepHeading icon={Link2} title="Résumé, social links and references" subtitle={`Links for ${prof.label.toLowerCase()}s. Only the ones you fill in appear on the site.`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField className="sm:col-span-2" label="Résumé or CV link" inputMode="url" value={form.resumeUrl} onChange={(v) => set({ resumeUrl: v })} error={errors.resumeUrl} placeholder="https://…/cv.pdf" hint="A PDF or hosted page. Templates with a “Download CV” button use it." />
        {prof.socialLinks.map((s) => (
          <TextField key={s.key} label={s.label} inputMode="url" value={form.socialLinks[s.key] || ''} onChange={(v) => set({ socialLinks: { ...form.socialLinks, [s.key]: v } })} error={errors[`social_${s.key}`]} placeholder={s.placeholder} />
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------------- 10 design and review */
export const ReviewStep: React.FC<StepProps & { onJump: (step: number) => void }> = ({ form, set, archetype, onJump }) => {
  const [changing, setChanging] = useState(false);
  const prof = getProfession(archetype);
  const f = pruneBlank(form);
  const active = getPortfolioTemplateById(form.template.templateId);
  const legacy = isLegacyTemplateId(form.template.templateId) ? LEGACY_TEMPLATES[form.template.templateId] : null;
  const problems = validateAll(form, archetype);
  const mismatch = active && active.archetype !== archetype;
  const row = (label: string, n: number, step: number) => (
    <li key={label} className="flex items-center justify-between border-b border-dv-line py-1.5 text-xs last:border-0">
      <span className="text-dv-ink-2">{label}</span>
      <button type="button" onClick={() => onJump(step)} className="-my-1 min-h-[32px] px-1 font-semibold text-dv-iris-700 hover:underline">{n} · edit</button>
    </li>
  );
  return (
    <div className="space-y-6">
      <StepHeading icon={Layout} title="Design and final review" subtitle="Confirm the template, check what will be created, then create the portfolio." />

      <section className="rounded-2xl border border-dv-line bg-white p-4 shadow-sm" aria-label="Selected template">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {active && <img src={active.previewImage} alt={`${active.name} preview`} className="h-24 w-full rounded-xl border border-dv-line object-cover object-top sm:w-44" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-dv-muted">Template</p>
            <p className="text-base font-bold text-dv-ink" data-testid="selected-template-name">{form.template.templateName}</p>
            <p className="text-xs text-dv-muted">{active ? `${active.categoryLabel} · ${active.designStyle}` : legacy ? 'Retired template, still supported' : ''} · v{form.template.templateVersion}</p>
            <p className="mt-1 text-xs text-dv-ink-2">Profession: <strong>{prof.label}</strong></p>
          </div>
          <button type="button" onClick={() => setChanging((c) => !c)} className="rounded-xl border border-dv-line bg-white px-3.5 py-2 text-xs font-bold text-dv-ink-2 hover:text-dv-ink">{changing ? 'Close' : 'Change template'}</button>
        </div>
        {mismatch && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">This template is designed for {PORTFOLIO_TEMPLATES[active.id].categoryLabel}. Your {prof.label.toLowerCase()} content will still fill it.</p>}
        {changing && <div className="mt-5 border-t border-dv-line pt-5"><PortfolioTemplateSelector category="all" archetype={archetype} selectedTemplate={form.template} onSelect={(t) => { set({ template: t }); setChanging(false); }} /></div>}
      </section>

      <section className="rounded-2xl border border-dv-line bg-white p-4 shadow-sm" aria-label="Summary">
        <p className="text-[11px] font-bold uppercase tracking-wider text-dv-muted">Profile</p>
        <p className="text-sm font-bold text-dv-ink">{f.fullName || '—'}</p>
        <p className="text-xs text-dv-ink-2">{f.title || '—'}</p>
        <p className="text-xs text-dv-muted">{[f.location, f.email].filter(Boolean).join(' · ')}</p>
        <ul className="mt-3">
          {row('Experience', f.experience.length, 3)}
          {row('Skills', f.skills.length, 4)}
          {row('Education', f.education.length, 5)}
          {row(prof.copy.projectsHeading, f.projects.length, 6)}
          {row('Achievements and certifications', f.achievements.length + f.certifications.length, 7)}
          {row('Images', (f.profilePhoto ? 1 : 0) + (f.coverImage ? 1 : 0) + f.additionalImages.length + f.projects.filter((p) => p.image).length, 8)}
        </ul>
      </section>

      {problems.length > 0 ? (
        <section role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4" aria-label="Things to fix">
          <p className="flex items-center gap-2 text-sm font-bold text-rose-800"><AlertCircle className="h-4 w-4" />Fix these before creating the portfolio</p>
          <ul className="mt-2 space-y-1.5">
            {problems.map((p) => (
              <li key={p.step} className="text-xs text-rose-900">
                <button type="button" onClick={() => onJump(p.step)} className="font-bold underline">Step {p.step}</button>: {Object.values(p.errors)[0]}{Object.keys(p.errors).length > 1 ? ` (+${Object.keys(p.errors).length - 1} more)` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Everything required is filled in. Creating the portfolio generates the site with this template.</p>
      )}
    </div>
  );
};

/** Used by the shell to render step n. */
export const STEP_COMPONENTS: Record<number, React.FC<StepProps & { onJump: (step: number) => void }>> = {
  1: IdentityStep, 2: IntroStep, 3: ExperienceStep, 4: SkillsStep, 5: EducationStep, 6: WorkStep, 7: AchievementsStep, 8: AssetsStep, 9: LinksStep, 10: ReviewStep
};

// Re-exported so callers can build field styles consistently.
export { inputCls };

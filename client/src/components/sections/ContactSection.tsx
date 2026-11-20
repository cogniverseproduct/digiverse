
import React, { useState } from 'react';
import { Container } from '../layout/Container';
import { PLATFORM_CONFIG } from '../../config/platform';
import {
  Mail,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowUpRight,
  MessageCircle,
  ShieldCheck,
  Globe2,
  Clock3,
  ArrowRight,
  Layers3,
  Users,
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    organizationType: 'cultural',
    preferredLanguage: 'bilingual',
    requirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (
      !formData.name.trim() ||
      !formData.organization.trim() ||
      !formData.email.trim()
    ) {
      setErrorMessage(
        'Please fill in your name, organization name, and contact email.'
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error submitting inquiry'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const inputClass =
    'w-full rounded-xl border border-slate-900/[0.08] bg-[#FFF1F4] px-4 py-3.5 text-sm text-dv-ink placeholder:text-slate-500 outline-none transition-all duration-300 hover:border-slate-900/[0.14] focus:border-indigo-500/[0.72] focus:ring-4 focus:ring-indigo-500/[0.15]';

  const labelClass =
    'mb-2.5 block text-[11px] font-bold uppercase tracking-[0.13em] text-slate-600';

  const benefits = [
    {
      icon: Building2,
      title: 'Built around your organization',
      description: 'A digital identity that reflects your purpose and community.',
      color: 'text-indigo-700',
      bg: 'bg-indigo-500/[0.11]',
    },
    {
      icon: Layers3,
      title: 'A complete digital experience',
      description: 'Explore a website structure tailored to your requirements.',
      color: 'text-violet-700',
      bg: 'bg-violet-500/[0.11]',
    },
    {
      icon: Users,
      title: 'Guidance at every step',
      description: 'Share your vision and discuss the right direction for your project.',
      color: 'text-emerald-700',
      bg: 'bg-emerald-500/[0.11]',
    },
  ];

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden border-t border-slate-900/[0.08] bg-[#EAF8EC] py-20 sm:py-24 lg:py-28"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 top-10 h-[500px] w-[500px] rounded-full bg-indigo-500/[0.09] blur-[150px]" />
        <div className="absolute -right-48 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-600/[0.1] blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/[0.06] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
          }}
        />
      </div>

      <Container>
        <div className="relative mx-auto max-w-6xl">
          {/* Header */}
          <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-indigo-500/[0.24] bg-indigo-500/[0.077] px-4 py-2">
              <Sparkles className="h-4 w-4 text-indigo-700" />
              <span className="font-bengali text-xs font-semibold text-indigo-700">
                চলুন শুরু করি
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold tracking-[0.17em] text-slate-600">
                LET'S CONNECT
              </span>
            </div>

            <h2 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-dv-ink sm:text-5xl lg:text-6xl">
              Your next chapter
              <span className="mt-2 block bg-gradient-to-r from-indigo-600 via-violet-600 to-violet-400 bg-clip-text text-transparent">
                starts with a conversation.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              Every great digital experience begins with an idea. Tell us
              about your organization, your goals, and what you envision.
              Let's explore the possibilities together.
            </p>
          </div>

          {/* Main layout */}
          <div className="grid items-stretch gap-6 lg:grid-cols-[0.82fr_1.35fr] lg:gap-8">
            {/* Left information panel */}
            <aside className="relative flex flex-col overflow-hidden rounded-[28px] border border-slate-900/[0.08] bg-gradient-to-br from-[#FFFFFF] via-[#FFFAFB] to-[#FFF1F4] p-7 sm:p-9">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/[0.11] blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-violet-500/[0.1] blur-[90px]" />

              <div className="relative">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/[0.24] bg-indigo-500/[0.11] text-indigo-700 shadow-lg shadow-indigo-500/[0.15]">
                  <MessageCircle className="h-6 w-6" />
                </div>

                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">
                  YOUR VISION MATTERS
                </p>

                <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-dv-ink sm:text-[34px]">
                  Every organization has a story.
                  <span className="mt-2 block text-slate-500">
                    Let's make yours stand out.
                  </span>
                </h3>

                <p className="mt-6 text-sm leading-7 text-slate-500">
                  From cultural societies and sports clubs to educational
                  institutions and community organizations, DigiVerse helps
                  bring your organization's digital identity to life.
                </p>
              </div>

              {/* Benefits */}
              <div className="relative my-9 space-y-6 border-t border-slate-900/[0.08] pt-8">
                {benefits.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-dv-ink">
                          {item.title}
                        </h4>
                        <p className="mt-1.5 text-xs leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact details */}
              <div className="relative mt-auto space-y-4 rounded-2xl border border-dv-iris-100 bg-gradient-to-br from-white to-dv-iris-50/70 p-5 shadow-dv-card sm:p-6">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-slate-500">
                    HAVE A QUESTION?
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-dv-ink">
                    Let's talk about your idea.
                  </h4>
                </div>

                {[PLATFORM_CONFIG.productEmail, PLATFORM_CONFIG.secondaryEmail].map((address) => (
                  <a
                    key={address}
                    href={`mailto:${address}`}
                    className="flex items-center gap-3 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-700"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/[0.11]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="break-all">
                      {address}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </a>
                ))}

                <div className="flex items-center gap-3 border-t border-slate-900/[0.08] pt-4 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4 text-violet-700" />
                  <span>Share your requirements whenever you're ready.</span>
                </div>
              </div>
            </aside>

            {/* Right form panel */}
            <div className="relative overflow-hidden rounded-[28px] border border-slate-900/[0.08] bg-[#FFFAFB]/90 p-6 shadow-2xl shadow-slate-900/[0.09] backdrop-blur-xl sm:p-9 lg:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.06] blur-[90px]" />

              {submitted ? (
                <div className="relative flex min-h-[620px] flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/[0.24] bg-emerald-500/[0.088] shadow-lg shadow-emerald-500/[0.15]">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  </div>

                  <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-600">
                    INQUIRY RECEIVED
                  </p>

                  <h3 className="text-3xl font-extrabold text-dv-ink sm:text-4xl">
                    Thank You!
                  </h3>

                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                    Your inquiry has been submitted successfully. Thank you
                    for sharing your vision with DigiVerse.
                  </p>

                  <div className="mt-9 flex flex-col items-center gap-3">
                    <a
                      href={`mailto:${PLATFORM_CONFIG.productEmail}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-900/[0.08] bg-slate-900/[0.028] px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-500/[0.36] hover:bg-slate-900/[0.055]"
                    >
                      <Mail className="h-4 w-4 text-indigo-700" />
                      Contact our team
                      <ArrowUpRight className="h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          organization: '',
                          email: '',
                          phone: '',
                          organizationType: 'cultural',
                          preferredLanguage: 'bilingual',
                          requirements: '',
                        });
                      }}
                      className="mt-2 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-700"
                    >
                      Submit another inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="relative space-y-7"
                >
                  {/* Form heading */}
                  <div className="border-b border-slate-900/[0.08] pb-6">
                    <div className="mb-3 flex items-center gap-2 text-indigo-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">
                        PROJECT ENQUIRY
                      </p>
                    </div>

                    <h3 className="text-2xl font-extrabold tracking-tight text-dv-ink sm:text-3xl">
                      Tell us about your organization.
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      A few details will help us understand your vision.
                      Fields marked with * are required.
                    </p>
                  </div>

                  {/* Error message */}
                  {errorMessage && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/[0.24] bg-red-500/[0.088] p-4 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Personal details */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-700" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.13em] text-slate-700">
                        Your details
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="contact-name">
                          Your Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          autoComplete="name"
                          value={formData.name}
                          onChange={(e) =>
                            updateField('name', e.target.value)
                          }
                          placeholder="Enter your full name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          className={labelClass}
                          htmlFor="contact-email"
                        >
                          Email Address *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) =>
                            updateField('email', e.target.value)
                          }
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          className={labelClass}
                          htmlFor="contact-phone"
                        >
                          Phone / WhatsApp
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            updateField('phone', e.target.value)
                          }
                          placeholder="+91 XXXXX XXXXX"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          className={labelClass}
                          htmlFor="contact-organization"
                        >
                          Organization Name *
                        </label>
                        <input
                          id="contact-organization"
                          type="text"
                          required
                          value={formData.organization}
                          onChange={(e) =>
                            updateField('organization', e.target.value)
                          }
                          placeholder="Your organization"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organization preferences */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-violet-700" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.13em] text-slate-700">
                        Organization profile
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          className={labelClass}
                          htmlFor="organization-type"
                        >
                          Organization Type
                        </label>
                        <select
                          id="organization-type"
                          value={formData.organizationType}
                          onChange={(e) =>
                            updateField('organizationType', e.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="cultural">
                            Puja Committee / Cultural Society
                          </option>
                          <option value="sports">
                            Sports Club / Athletic Society
                          </option>
                          <option value="education">
                            Educational Institution
                          </option>
                          <option value="healthcare">
                            Healthcare Organization
                          </option>
                          <option value="social-welfare">
                            Social Welfare Organization
                          </option>
                          <option value="professional">
                            Professional Association
                          </option>
                          <option value="event">
                            Event Management Organization
                          </option>
                          <option value="youth">
                            Youth Club / E-Club
                          </option>
                          <option value="business">
                            Business Organization
                          </option>
                          <option value="heritage">
                            Cultural & Heritage Academy
                          </option>
                          <option value="civic">
                            Civic & Community Association
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={labelClass}
                          htmlFor="preferred-language"
                        >
                          Preferred Language
                        </label>
                        <select
                          id="preferred-language"
                          value={formData.preferredLanguage}
                          onChange={(e) =>
                            updateField('preferredLanguage', e.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="bilingual">
                            English & Bengali
                          </option>
                          <option value="english">English Only</option>
                          <option value="bengali">Bengali Primary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Project requirements */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.13em] text-slate-700">
                        Your vision
                      </h4>
                    </div>

                    <label
                      className={labelClass}
                      htmlFor="contact-requirements"
                    >
                      Tell us about your requirements
                    </label>

                    <textarea
                      id="contact-requirements"
                      rows={5}
                      value={formData.requirements}
                      onChange={(e) =>
                        updateField('requirements', e.target.value)
                      }
                      placeholder="Tell us about your organization, website goals, required pages, events, features or any special requirements..."
                      className={`${inputClass} min-h-[130px] resize-y leading-6`}
                    />

                    <p className="mt-2 text-[10px] text-slate-500">
                      You can share your initial ideas. Details can be discussed
                      later.
                    </p>
                  </div>

                  {/* Submit area */}
                  <div className="border-t border-slate-900/[0.08] pt-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex max-w-xs items-start gap-2.5 text-[11px] leading-5 text-slate-500">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Your information is used to process your project
                          enquiry.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="group inline-flex w-full items-center justify-center gap-3 rounded-xl border border-indigo-500/[0.24] bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/[0.15] transition-all duration-300 hover:-translate-y-1 hover:from-indigo-500 hover:to-violet-600 hover:shadow-xl hover:shadow-indigo-500/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Submit Inquiry
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Bottom note */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe2 className="h-4 w-4 text-indigo-600" />
              <span>One platform. Many possibilities.</span>
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-slate-200 sm:block" />
            <a
              href={`mailto:${PLATFORM_CONFIG.productEmail}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-700"
            >
              Prefer email? Write to us
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
};

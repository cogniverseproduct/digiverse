import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  Palette, Sparkles, ArrowUpRight, Star,
  CheckCircle2, Mail, MapPin, ExternalLink, Send
} from 'lucide-react';

export const CreativeStudioTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Creative Director',
    title: 'Principal Product Designer',
    headline: requirements.tagline || 'Crafting emotive digital products and design systems.',
    bio: requirements.aboutText || 'Award-winning product designer with deep expertise in design systems and art direction.',
    email: requirements.contactEmail || 'studio@example.com',
    location: requirements.address || 'Stockholm & London'
  };

  const skills = portfolioData?.skills || [];
  const projects = portfolioData?.projects || [];
  const experience = portfolioData?.experience || [];
  const testimonials = portfolioData?.testimonials || [];
  const metrics = website?.metrics || [
    { label: 'Years Directing', value: '8+' },
    { label: 'Conversion Lift', value: '+38%' },
    { label: 'Active Users', value: '4M+' },
    { label: 'Awwwards', value: '3x' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;

  const [contactSubmitted, setContactSubmitted] = useState(false);

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-orange-500/20 bg-[#0d0d0d]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-10 w-10 rounded-full border border-orange-500/40 object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/40 bg-orange-950/40 text-orange-400">
              <Palette className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="text-base font-extrabold tracking-tight text-white group-hover:text-orange-400 transition font-sans">
              {identity.fullName}
            </div>
            <div className="text-[11px] font-medium text-orange-400/90 tracking-wide uppercase">
              {identity.title}
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-2">
          {[
            { slug: '/', label: 'Selected Works' },
            { slug: '/case-studies', label: 'Case Studies' },
            { slug: '/about', label: 'Philosophy' },
            { slug: '/contact', label: 'Inquiry' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
                activePage === p.slug
                  ? 'border border-orange-500/50 bg-orange-500/15 text-orange-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="rounded-full border border-orange-500/30 bg-orange-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-orange-300">
              Demo
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition"
          >
            Initiate Project
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-orange-500/20 bg-[#080808] py-12 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" />
            {identity.fullName} &bull; <span className="text-orange-400">Creative Studio Edition</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 max-w-md">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          {identity.email && (
            <span className="text-gray-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-orange-400" /> {identity.email}
            </span>
          )}
          {identity.location && (
            <span className="text-gray-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-400" /> {identity.location}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <Nav />

      {/* OVERVIEW / HOME */}
      {activePage === '/' && (
        <div>
          {/* EDITORIAL HERO */}
          <section className="relative overflow-hidden border-b border-orange-500/20 py-20 sm:py-28 bg-gradient-to-b from-[#0d0d0d] via-[#14100c] to-[#0d0d0d]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="max-w-4xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-950/40 px-3.5 py-1 text-xs font-semibold text-orange-300">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  <span>Art Direction & Product Experience Systems</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                  Design that feels instinctive. Systems that scale.
                </h1>

                <p className="text-lg sm:text-xl text-gray-300 font-normal leading-relaxed max-w-2xl">
                  {identity.headline}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-orange-500/20 bg-[#161616] p-4">
                      <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">{m.value}</div>
                      <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('/case-studies')}
                    className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-orange-600/25 flex items-center gap-2 transition"
                  >
                    Explore Case Studies <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/about')}
                    className="rounded-full border border-orange-500/40 hover:bg-orange-950/30 px-6 py-3 text-sm font-semibold text-orange-300 transition"
                  >
                    Design Philosophy
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ASYMMETRIC CASE STUDIES PREVIEW */}
          <section className="py-20 border-b border-orange-500/15 bg-[#0d0d0d]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Portfolio Index</span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">Featured Case Studies</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/case-studies')}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  All Projects <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {projects.slice(0, 2).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className={`rounded-2xl border border-orange-500/20 bg-[#161616] overflow-hidden p-6 sm:p-8 flex flex-col justify-between hover:border-orange-500/50 transition ${
                      idx === 0 ? 'lg:col-span-7' : 'lg:col-span-5'
                    }`}
                  >
                    <div>
                      {p.featuredImageUrl && (
                        <div className="overflow-hidden rounded-xl mb-6 border border-orange-500/20">
                          <img
                            src={p.featuredImageUrl}
                            alt={p.title}
                            className="w-full h-64 sm:h-80 object-cover hover:scale-105 transition duration-500"
                          />
                        </div>
                      )}
                      <div className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                        {p.role || 'Principal Designer'}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{p.title}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed mb-6">{p.summary}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="rounded-full bg-orange-950/40 border border-orange-700/30 px-3 py-1 text-xs text-orange-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {p.metrics && p.metrics.length > 0 && (
                      <div className="border-t border-orange-500/15 pt-4 grid grid-cols-2 gap-4">
                        {p.metrics.slice(0, 2).map((m, midx) => (
                          <div key={midx}>
                            <div className="text-lg font-black text-orange-400">{m.value}</div>
                            <div className="text-[11px] text-gray-400 uppercase">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DESIGN SYSTEM TOKEN SPECIMEN */}
          <section className="py-16 bg-[#121212] border-b border-orange-500/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Design Architecture</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Foundational Design Capabilities</h2>
                <p className="text-xs text-gray-400 mt-2">Harmonizing color token hierarchies, fluid typography, and component accessibility.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {skills.map(sk => (
                  <div key={sk.id} className="rounded-xl border border-orange-500/20 bg-[#191919] p-4 text-center hover:border-orange-400/50 transition">
                    <div className="text-sm font-bold text-white">{sk.name}</div>
                    <div className="text-[11px] text-orange-400 mt-1 font-semibold">{sk.proficiency}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{sk.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          {testimonials.length > 0 && (
            <section className="py-20 bg-[#0d0d0d]">
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center mb-12">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Client Testimonials</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">What Product Leaders Say</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {testimonials.map(t => (
                    <div key={t.id} className="rounded-2xl border border-orange-500/20 bg-[#161616] p-6 sm:p-8 space-y-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <blockquote className="text-sm sm:text-base text-gray-200 leading-relaxed italic">
                        "{t.quote}"
                      </blockquote>
                      <div className="pt-2 border-t border-orange-500/15">
                        <div className="font-bold text-white text-sm">{t.clientName}</div>
                        <div className="text-xs text-orange-400">{t.clientRole} &bull; {t.clientCompany}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* CASE STUDIES PAGE */}
      {activePage === '/case-studies' && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Case Study Archive</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Deep Dives & Systems Work</h1>
              <p className="text-base text-gray-400 mt-3 leading-relaxed">
                Exploring the problem space, interaction architectures, tokenized design systems, and measured business impact.
              </p>
            </div>

            <div className="space-y-16">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="rounded-2xl border border-orange-500/20 bg-[#161616] p-6 sm:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-block rounded-full bg-orange-950/60 border border-orange-700/40 px-3 py-1 text-xs font-semibold text-orange-300">
                        {p.role || 'Design Direction'}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{p.title}</h2>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{p.detailedDescription || p.summary}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="rounded-full bg-[#202020] border border-orange-500/20 px-3 py-1 text-xs text-orange-300">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {p.metrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                          {p.metrics.map((m, midx) => (
                            <div key={midx} className="rounded-xl border border-orange-500/20 bg-[#0d0d0d] p-3">
                              <div className="text-xl font-black text-orange-400">{m.value}</div>
                              <div className="text-[10px] text-gray-400 uppercase">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {p.liveUrl && (
                        <div className="pt-4">
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-orange-600 hover:bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Live Experience
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-6">
                      {p.featuredImageUrl && (
                        <img
                          src={p.featuredImageUrl}
                          alt={p.title}
                          className="w-full rounded-xl border border-orange-500/30 object-cover shadow-2xl"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT PAGE */}
      {activePage === '/about' && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Philosophy & Lineage</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">About the Designer</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
              <div className="md:col-span-5">
                {profileImg && (
                  <img
                    src={profileImg}
                    alt={identity.fullName}
                    className="w-full rounded-2xl border border-orange-500/30 object-cover shadow-2xl"
                  />
                )}
                <div className="mt-6 rounded-xl border border-orange-500/20 bg-[#161616] p-4 space-y-2">
                  <div className="text-xs font-bold text-orange-400 uppercase">Current Station</div>
                  <div className="text-sm font-semibold text-white">{identity.currentCompany || 'Rostova Studio'}</div>
                  <div className="text-xs text-gray-400">{identity.currentRole || 'Design Director'}</div>
                </div>
              </div>

              <div className="md:col-span-7 space-y-6">
                <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal">
                  {identity.bio}
                </p>

                <div className="pt-6 border-t border-orange-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Career Journey</h3>
                  <div className="space-y-6">
                    {experience.map(exp => (
                      <div key={exp.id} className="border-l-2 border-orange-500/40 pl-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{exp.title}</span>
                          <span className="text-xs text-orange-400">{exp.period}</span>
                        </div>
                        <div className="text-xs text-gray-400">{exp.company} &bull; {exp.location}</div>
                        <p className="text-xs text-gray-300 pt-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT PAGE */}
      {activePage === '/contact' && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Get In Touch</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Initiate a Project Dialogue</h1>
              <p className="text-sm text-gray-400 mt-2">Available for select design direction, token architecture, and sprint engagements.</p>
            </div>

            <div className="rounded-2xl border border-orange-500/25 bg-[#161616] p-8 shadow-2xl">
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="text-lg font-bold text-white">Inquiry Received</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">We review project briefs within 24 hours to schedule an initial discovery alignment.</p>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-5 text-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-semibold mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Elena Vance"
                        className="w-full rounded-xl border border-orange-500/30 bg-[#0d0d0d] px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="elena@company.com"
                        className="w-full rounded-xl border border-orange-500/30 bg-[#0d0d0d] px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-semibold mb-1">Project Scope & Timeline</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Share details regarding the product, target audience, and desired launch..."
                      className="w-full rounded-xl border border-orange-500/30 bg-[#0d0d0d] px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-400 focus:outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 py-3 font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 transition"
                  >
                    <Send className="h-4 w-4" /> Send Project Brief
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

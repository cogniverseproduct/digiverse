import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  Film, Play, Box, Sparkles, CheckCircle2,
  Mail, Send, ExternalLink
} from 'lucide-react';

export const MotionverseTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Motion Director',
    title: '3D Generalist & Motion Director',
    headline: requirements.tagline || 'Pushing the boundaries of real-time computer graphics and procedural VFX.',
    bio: requirements.aboutText || 'Creating title sequences, procedural VFX, and commercials for international entertainment and gaming powerhouses.',
    email: requirements.contactEmail || 'motion@example.io',
    location: requirements.address || 'Tokyo & Los Angeles'
  };

  const skills = portfolioData?.skills || [];
  const projects = portfolioData?.projects || [];
  const experience = portfolioData?.experience || [];
  const metrics = website?.metrics || [
    { label: 'Years in Motion', value: '7+' },
    { label: 'Native Spec', value: '4K 60fps' },
    { label: 'Showreel Plays', value: '1.2M' },
    { label: 'Studio NPS', value: '5.0 ★' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;
  const heroCover = identity.heroCoverUrl || requirements.coverImageUrl || website.heroImage;

  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'shaded' | 'wireframe' | 'clay'>('shaded');
  const [commissionSubmitted, setCommissionSubmitted] = useState(false);

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-purple-500/20 bg-[#030712]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-9 w-9 rounded-lg border border-purple-500/40 object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-400">
              <Box className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold tracking-tight text-white group-hover:text-purple-400 transition font-sans">
              {identity.fullName}
            </div>
            <div className="text-[11px] font-mono text-purple-400/80">
              3D & VFX Motionverse
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { slug: '/', label: 'Showreel' },
            { slug: '/breakdowns', label: '3D Breakdowns' },
            { slug: '/clients', label: 'Collaborations' },
            { slug: '/contact', label: 'Commission' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
                activePage === p.slug
                  ? 'border border-purple-500/40 bg-purple-950/60 text-purple-300'
                  : 'text-gray-400 hover:text-purple-300 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded border border-purple-500/30 bg-purple-950/40 px-2.5 py-0.5 text-[10px] font-mono uppercase text-purple-300">
              Reel Demo
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition"
          >
            Commission Project
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-purple-500/20 bg-[#02040a] py-10 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Film className="h-4 w-4 text-purple-400" />
            {identity.fullName} &bull; <span className="text-purple-400">MOTIONVERSE Engine v1.0.0</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          {identity.email && (
            <span className="text-gray-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-purple-400" /> {identity.email}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-gray-200 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      <Nav />

      {/* OVERVIEW / SHOWREEL */}
      {activePage === '/' && (
        <div>
          {/* SHOWREEL HERO */}
          <section className="relative overflow-hidden border-b border-purple-500/20 bg-gradient-to-b from-[#030712] via-[#090b1e] to-[#030712] py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/50 px-3.5 py-1 text-xs font-mono text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>Cinematic 3D & Procedural Simulations</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  {identity.title || '3D Generalist & Motion Director'}
                </h1>
                <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  {identity.headline}
                </p>
              </div>

              {/* WIDESCREEN CINEMATIC VIDEO FRAME */}
              <div className="relative mx-auto max-w-5xl rounded-2xl border border-purple-500/30 bg-black/60 shadow-2xl overflow-hidden aspect-video flex items-center justify-center group">
                {heroCover ? (
                  <img
                    src={heroCover}
                    alt="Showreel Preview"
                    className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-950/40 via-indigo-950/30 to-black"></div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-purple-600/90 text-white shadow-2xl shadow-purple-600/50 group-hover:scale-110 transition cursor-pointer">
                    <Play className="h-8 w-8 ml-1 fill-white" />
                  </div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-purple-300 bg-black/60 px-3 py-1 rounded-full border border-purple-500/40">
                    Watch Official 4K Showreel
                  </span>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {metrics.map((m, idx) => (
                  <div key={idx} className="rounded-xl border border-purple-500/20 bg-[#0b0f19] p-4 text-center">
                    <div className="text-2xl font-black text-purple-400">{m.value}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED MOTION PROJECTS */}
          <section className="py-20 border-b border-purple-500/15 bg-[#030712]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Key Shots</span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">Featured 3D Projects</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/breakdowns')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                >
                  View VFX Breakdowns &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="rounded-xl border border-purple-500/25 bg-[#0b0f19] overflow-hidden p-5 hover:border-purple-400/60 transition flex flex-col justify-between">
                    <div>
                      {p.featuredImageUrl && (
                        <div className="overflow-hidden rounded-lg aspect-video mb-4 border border-purple-500/20">
                          <img
                            src={p.featuredImageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          />
                        </div>
                      )}
                      <div className="text-xs font-mono text-purple-400 font-semibold mb-2">{p.role || '3D Director'}</div>
                      <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                      <p className="text-xs text-gray-300 leading-relaxed mb-4">{p.summary}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="rounded bg-purple-950/60 border border-purple-700/40 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {p.liveUrl && (
                      <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between">
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          Watch Clip <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SIMULATION & DCC TOOLING */}
          <section className="py-16 bg-[#070b16] border-b border-purple-500/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">DCC Ecosystem</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Procedural VFX & Realtime Engine Pipeline</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {skills.map(sk => (
                  <div key={sk.id} className="rounded-xl border border-purple-500/20 bg-[#0b0f19] p-4 text-center hover:border-purple-400/50 transition">
                    <div className="text-sm font-bold text-white font-mono">{sk.name}</div>
                    <div className="text-[11px] text-purple-400 mt-1 font-semibold">{sk.proficiency}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{sk.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* BREAKDOWNS PAGE */}
      {activePage === '/breakdowns' && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">VFX Passes</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">3D Renders & Technical Breakdown</h1>
              <p className="text-sm text-gray-400 mt-2 font-mono">
                Wireframe topology, clay lighting studies, procedural simulations, and final ACES-graded beauty passes.
              </p>
            </div>

            <div className="flex items-center gap-2 mb-8">
              {(['shaded', 'wireframe', 'clay'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveBreakdownTab(tab)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
                    activeBreakdownTab === tab
                      ? 'bg-purple-600 text-white font-bold'
                      : 'border border-purple-500/30 text-gray-400 hover:text-white hover:bg-purple-950/30'
                  }`}
                >
                  {tab} Pass
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="rounded-xl border border-purple-500/25 bg-[#0b0f19] p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <span className="text-xs font-mono text-purple-400">Pass Layer 0{idx + 1}</span>
                      <h2 className="text-2xl font-bold text-white">{p.title}</h2>
                      <p className="text-sm text-gray-300 leading-relaxed">{p.detailedDescription || p.summary}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="rounded bg-purple-950/60 border border-purple-700/40 px-2.5 py-1 text-xs text-purple-300 font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 text-xs font-mono text-gray-400">
                        Active Layer: <span className="text-purple-300 uppercase font-bold">{activeBreakdownTab}</span> pass simulated
                      </div>
                    </div>

                    <div className="lg:col-span-6">
                      {p.featuredImageUrl && (
                        <div className="overflow-hidden rounded-xl border border-purple-500/30 shadow-2xl relative">
                          <img
                            src={p.featuredImageUrl}
                            alt={p.title}
                            className={`w-full h-72 object-cover transition duration-300 ${
                              activeBreakdownTab === 'wireframe'
                                ? 'invert contrast-200'
                                : activeBreakdownTab === 'clay'
                                ? 'grayscale contrast-125'
                                : ''
                            }`}
                          />
                          <div className="absolute top-3 right-3 rounded bg-black/80 px-2.5 py-1 text-[10px] font-mono uppercase text-purple-300 border border-purple-500/40">
                            {activeBreakdownTab} pass
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CLIENTS PAGE */}
      {activePage === '/clients' && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Collaborations</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Brand Collaborations & Studios</h1>
              <p className="text-sm text-gray-400 mt-2 font-mono">
                Trusted by international game developers, streaming networks, and luxury automotive brands.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-16">
              {[
                { name: 'Sony Music Interactive', project: 'Virtual Album Launch', year: '2025' },
                { name: 'Riot Games League of Legends', project: 'Cinematic VFX Shaders', year: '2024' },
                { name: 'Formula E Championship', project: 'Broadcast Title Sequence', year: '2024' },
                { name: 'Cyberpunk Soundworks', project: 'Audio-Reactive Stage Visuals', year: '2023' },
                { name: 'Nike Digital Innovation Lab', project: 'Procedural Footwear Reveal', year: '2023' },
                { name: 'Tokyo Digital Arts Conclave', project: 'Keynote Projection Mapping', year: '2023' }
              ].map((c, idx) => (
                <div key={idx} className="rounded-xl border border-purple-500/20 bg-[#0b0f19] p-5">
                  <div className="text-base font-bold text-white">{c.name}</div>
                  <div className="text-xs text-purple-400 mt-1 font-mono">{c.project}</div>
                  <div className="text-[10px] text-gray-500 mt-2 font-mono">{c.year}</div>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-purple-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Production Studio Journey</h2>
              <div className="space-y-6">
                {experience.map(exp => (
                  <div key={exp.id} className="rounded-lg border border-purple-500/20 bg-[#0b0f19] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-white">{exp.title}</div>
                      <span className="text-xs text-purple-400 font-mono">{exp.period}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{exp.company} &bull; {exp.location}</div>
                    <p className="text-xs text-gray-300 mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT / COMMISSION PAGE */}
      {activePage === '/contact' && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Inquire</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Commission a Motion Project</h1>
              <p className="text-sm text-gray-400 mt-2 font-mono">
                Booking 3D title sequences, commercial CGI spots, and real-time interactive experiences.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/25 bg-[#0b0f19] p-8 shadow-2xl">
              {commissionSubmitted ? (
                <div className="py-12 text-center space-y-3 font-mono">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="text-lg font-bold text-white">Project Commission Registered</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">Our producer will review your script/storyboard and reply with render estimates within 24 hours.</p>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setCommissionSubmitted(true);
                  }}
                  className="space-y-4 text-xs font-mono"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Producer / Client Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Kai Takahashi"
                        className="w-full rounded-lg border border-purple-500/30 bg-[#030712] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Studio / Agency Email</label>
                      <input
                        type="email"
                        required
                        placeholder="kai@motionverse3d.io"
                        className="w-full rounded-lg border border-purple-500/30 bg-[#030712] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Target Spec & Duration (e.g. 4K 60s Spot)</label>
                    <input
                      type="text"
                      placeholder="e.g. 30-sec Commercial Reveal + 3D Breakdowns"
                      className="w-full rounded-lg border border-purple-500/30 bg-[#030712] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Creative Brief & Reference Links</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Share concept references, storyboard links, delivery deadlines..."
                      className="w-full rounded-lg border border-purple-500/30 bg-[#030712] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-purple-400 focus:outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition"
                  >
                    <Send className="h-4 w-4" /> Dispatch Commission Brief
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

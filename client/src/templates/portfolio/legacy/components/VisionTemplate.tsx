import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  Camera, Eye, Aperture,
  CheckCircle2, Mail, MapPin, X, ExternalLink
} from 'lucide-react';

export const VisionTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Visual Artist',
    title: 'Fine Art & Documentary Photographer',
    headline: requirements.tagline || 'Capturing the stillness of raw frontiers in natural light.',
    bio: requirements.aboutText || 'Large-format and medium-format photographer specializing in landscape expeditions and monochrome geometry.',
    email: requirements.contactEmail || 'artist@example.com',
    location: requirements.address || 'Reykjavik & Vancouver'
  };

  const skills = portfolioData?.skills || [];
  const projects = portfolioData?.projects || [];
  const publications = portfolioData?.publications || [];
  const metrics = website?.metrics || [
    { label: 'Field Expeditions', value: '12+' },
    { label: 'Solo Exhibitions', value: '18+' },
    { label: 'Sensor Resolution', value: '100MP' },
    { label: 'Archival Editions', value: '75' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;
  const heroCover = identity.heroCoverUrl || requirements.coverImageUrl || website.heroImage;

  const [activeLightboxImg, setActiveLightboxImg] = useState<{ url: string; title: string; meta?: string } | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-10 w-10 rounded-full border border-white/20 object-cover grayscale group-hover:grayscale-0 transition" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-300">
              <Camera className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-serif text-base font-bold tracking-wider text-white group-hover:text-slate-200 transition">
              {identity.fullName}
            </div>
            <div className="text-[10px] tracking-widest uppercase text-slate-400 font-sans">
              Fine Art Photography
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { slug: '/', label: 'Exhibitions' },
            { slug: '/series', label: 'Collections' },
            { slug: '/gear', label: 'Optics' },
            { slug: '/contact', label: 'Acquire' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded px-3.5 py-1.5 font-sans text-xs tracking-widest uppercase transition ${
                activePage === p.slug
                  ? 'border border-white/25 bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="rounded border border-white/20 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
              Gallery Demo
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="rounded bg-white hover:bg-slate-200 px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-black shadow-md transition"
          >
            Acquire Print
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-white/10 bg-[#030303] py-12 text-slate-400 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-serif text-base font-bold text-white flex items-center gap-2">
            <Aperture className="h-4 w-4 text-slate-400" />
            {identity.fullName} &bull; <span className="text-slate-400 font-sans text-xs">VISION Canvas</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs tracking-wider uppercase">
          {identity.email && (
            <span className="text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {identity.email}
            </span>
          )}
          {identity.location && (
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {identity.location}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-white/20 selection:text-white">
      <Nav />

      {/* LIGHTBOX MODAL */}
      {activeLightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={activeLightboxImg.url}
              alt={activeLightboxImg.title}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <div className="font-serif text-lg font-bold text-white">{activeLightboxImg.title}</div>
              {activeLightboxImg.meta && (
                <div className="text-xs text-slate-400 tracking-widest uppercase mt-1">{activeLightboxImg.meta}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW / HOME */}
      {activePage === '/' && (
        <div>
          {/* CINEMATIC HERO */}
          <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden border-b border-white/10">
            {heroCover && (
              <div className="absolute inset-0 z-0">
                <img
                  src={heroCover}
                  alt={identity.fullName}
                  className="w-full h-full object-cover brightness-50 filter"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
              </div>
            )}

            <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center py-20">
              <span className="text-xs font-sans tracking-[0.3em] uppercase text-slate-400 inline-block mb-3">
                Chronicles in Natural Light
              </span>
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
                {identity.headline}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
                {identity.bio}
              </p>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {metrics.map((m, idx) => (
                  <div key={idx} className="rounded border border-white/15 bg-black/40 backdrop-blur-sm p-4 text-center">
                    <div className="font-serif text-2xl font-bold text-white">{m.value}</div>
                    <div className="text-[10px] tracking-widest uppercase text-slate-400 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('/series')}
                  className="rounded bg-white hover:bg-slate-200 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black transition"
                >
                  View Collections
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="rounded border border-white/30 hover:bg-white/10 px-6 py-2.5 font-sans text-xs uppercase tracking-wider text-white transition"
                >
                  Acquire Fine Art Print
                </button>
              </div>
            </div>
          </section>

          {/* CURATED EXHIBITIONS GRID */}
          <section className="py-20 border-b border-white/10 bg-[#050505]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-xs font-sans tracking-[0.25em] uppercase text-slate-400">Featured Series</span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">Exhibitions & Monographs</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/series')}
                  className="text-xs tracking-wider uppercase text-slate-400 hover:text-white"
                >
                  All Expeditions &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => p.featuredImageUrl && setActiveLightboxImg({ url: p.featuredImageUrl, title: p.title, meta: p.role })}
                    className="group cursor-pointer rounded-lg border border-white/10 bg-[#0c0c0c] overflow-hidden hover:border-white/30 transition flex flex-col justify-between"
                  >
                    <div>
                      {p.featuredImageUrl && (
                        <div className="overflow-hidden aspect-[4/3]">
                          <img
                            src={p.featuredImageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">
                          {p.role || 'Fine Art Monograph'}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-slate-300 transition">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {p.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Click to enlarge in Lightbox</span>
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SERIES / COLLECTIONS PAGE */}
      {activePage === '/series' && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-sans tracking-[0.25em] uppercase text-slate-400">Complete Archive</span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">Expeditions & Series</h1>
              <p className="text-sm text-slate-400 mt-3 font-sans leading-relaxed">
                Archival monochrome and large-format digital collections documented across the Arctic, Eastern Europe, and Central Asia.
              </p>
            </div>

            <div className="space-y-16">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <span className="text-xs tracking-widest uppercase text-slate-500">Expedition Series 0{idx + 1}</span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">{p.title}</h2>
                      <p className="text-sm text-slate-300 leading-relaxed font-sans">{p.detailedDescription || p.summary}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {p.metrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                          {p.metrics.map((m, midx) => (
                            <div key={midx} className="rounded border border-white/10 bg-black p-3">
                              <div className="font-serif text-lg font-bold text-white">{m.value}</div>
                              <div className="text-[10px] tracking-wider uppercase text-slate-500 mt-0.5">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => p.featuredImageUrl && setActiveLightboxImg({ url: p.featuredImageUrl, title: p.title, meta: p.role })}
                          className="inline-flex items-center gap-2 rounded border border-white/30 hover:bg-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Open Full-Resolution Frame
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-6">
                      {p.featuredImageUrl && (
                        <div
                          onClick={() => setActiveLightboxImg({ url: p.featuredImageUrl!, title: p.title, meta: p.role })}
                          className="cursor-pointer overflow-hidden rounded-lg border border-white/15 shadow-2xl"
                        >
                          <img
                            src={p.featuredImageUrl}
                            alt={p.title}
                            className="w-full h-80 object-cover hover:scale-105 transition duration-500"
                          />
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

      {/* GEAR / OPTICS PAGE */}
      {activePage === '/gear' && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-sans tracking-[0.25em] uppercase text-slate-400">Optics & Darkroom</span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">Optics & Medium Format Kit</h1>
              <p className="text-sm text-slate-400 mt-3 font-sans leading-relaxed">
                Precision instruments engineered to capture micro-contrast, atmospheric depth, and shadow nuances.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {skills.map(sk => (
                <div key={sk.id} className="rounded-lg border border-white/10 bg-[#0d0d0d] p-5">
                  <Aperture className="h-5 w-5 text-slate-400 mb-3" />
                  <div className="font-serif text-base font-bold text-white">{sk.name}</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{sk.proficiency} &bull; {sk.category}</div>
                </div>
              ))}
            </div>

            {publications.length > 0 && (
              <div className="pt-10 border-t border-white/10">
                <h2 className="font-serif text-2xl font-bold text-white mb-6">Monographs & Gallery Catalogues</h2>
                <div className="space-y-4">
                  {publications.map(pub => (
                    <div key={pub.id} className="rounded-lg border border-white/10 bg-[#0d0d0d] p-5 flex items-center justify-between">
                      <div>
                        <div className="font-serif text-base font-bold text-white">{pub.title}</div>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{pub.publisher} &bull; {pub.year}</div>
                      </div>
                      {pub.link && (
                        <a href={pub.link} target="_blank" rel="noreferrer" className="text-xs tracking-wider uppercase text-slate-300 hover:text-white flex items-center gap-1">
                          View Monograph <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CONTACT / ACQUIRE PAGE */}
      {activePage === '/contact' && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-sans tracking-[0.25em] uppercase text-slate-400">Archival Acquisitions</span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-1">Print Acquisition Desk</h1>
              <p className="text-sm text-slate-400 mt-3 font-sans">
                Inquiries for limited edition silver gelatin prints, museum loans, and editorial commissions.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-[#0a0a0a] p-8 shadow-2xl">
              {inquirySubmitted ? (
                <div className="py-12 text-center space-y-3 font-sans">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="font-serif text-xl font-bold text-white">Acquisition Inquiry Logged</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">The studio director will respond with print availability and authenticity certificates within 48 hours.</p>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setInquirySubmitted(true);
                  }}
                  className="space-y-5 text-xs font-sans"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider mb-1">Collector Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Marcus Vance"
                        className="w-full rounded border border-white/20 bg-[#050505] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider mb-1">Contact Email</label>
                      <input
                        type="email"
                        required
                        placeholder="collector@gallery.com"
                        className="w-full rounded border border-white/20 bg-[#050505] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Print Title / Collection Interest</label>
                    <input
                      type="text"
                      placeholder="e.g. The Silent Glaciers (Edition #12/75)"
                      className="w-full rounded border border-white/20 bg-[#050505] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Inquiry Details & Delivery Country</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Specify framed vs rolled archival rag, custom dimensions, or institutional exhibition scope..."
                      className="w-full rounded border border-white/20 bg-[#050505] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-white focus:outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded bg-white hover:bg-slate-200 py-3 font-bold uppercase tracking-widest text-black transition"
                  >
                    Submit Print Inquiry
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

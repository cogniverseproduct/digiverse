import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  TrendingUp, CheckCircle, Star, ArrowRight, ShieldCheck,
  Mail, MapPin
} from 'lucide-react';

export const BrandbuilderTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Growth Strategist',
    title: 'B2B SaaS Growth Strategist',
    headline: requirements.tagline || 'Scaling B2B SaaS ventures from $1M to $25M ARR.',
    bio: requirements.aboutText || 'Former 2x unicorn VP of Growth advising Series A/B founders on sustainable unit economics and sales momentum.',
    email: requirements.contactEmail || 'advisor@example.com',
    location: requirements.address || 'Austin & New York'
  };

  const projects = portfolioData?.projects || [];
  const services = portfolioData?.services || [];
  const testimonials = portfolioData?.testimonials || [];
  const metrics = website?.metrics || [
    { label: 'SaaS Clients Scaled', value: '45+' },
    { label: 'Net-New Pipeline', value: '$180M+' },
    { label: 'Unicorn Exits', value: '2x' },
    { label: 'Dispatch Readers', value: '65k' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;

  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-10 w-10 rounded-full border border-emerald-500/30 object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition">
              {identity.fullName}
            </div>
            <div className="text-[11px] font-medium text-emerald-400">
              {identity.title}
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { slug: '/', label: 'Overview' },
            { slug: '/services', label: 'Advisory Packages' },
            { slug: '/results', label: 'Client Results' },
            { slug: '/contact', label: 'Book Strategy Call' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
                activePage === p.slug
                  ? 'border border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
              Brand Demo
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition"
          >
            Book Strategy Call
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-emerald-500/20 bg-[#050505] py-12 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            {identity.fullName} &bull; <span className="text-emerald-400">BRANDBUILDER</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          {identity.email && (
            <span className="text-gray-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-400" /> {identity.email}
            </span>
          )}
          {identity.location && (
            <span className="text-gray-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" /> {identity.location}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Nav />

      {/* OVERVIEW / HOME */}
      {activePage === '/' && (
        <div>
          {/* VALUE PROPOSITION HERO */}
          <section className="relative overflow-hidden border-b border-emerald-500/20 bg-gradient-to-b from-[#0a0a0a] via-[#0c1611] to-[#0a0a0a] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Battle-Tested Enterprise SaaS GTM Advisor</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  Stop burning cash on unproven acquisition loops.
                </h1>

                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-normal">
                  {identity.headline}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-emerald-500/20 bg-[#121212] p-4">
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{m.value}</div>
                      <div className="text-xs text-gray-400 mt-1 uppercase font-semibold">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('/contact')}
                    className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition"
                  >
                    Schedule 30-Min Growth Audit <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services')}
                    className="rounded-lg border border-emerald-500/40 hover:bg-emerald-950/30 px-6 py-3 text-sm font-semibold text-emerald-300 transition"
                  >
                    Explore Retainers & Sprints
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SOCIAL PROOF RIBBON */}
          <section className="py-12 border-b border-emerald-500/15 bg-[#0f0f0f]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                Executive Advisory Impact Across High-Growth SaaS Ventures
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {[
                  { name: 'CloudScale AI', stat: '$12.4M ARR Added', tag: 'Series B' },
                  { name: 'Hypermetrics', stat: '+128% Net Retention', tag: 'Enterprise' },
                  { name: 'DataGrid Core', stat: '-68% Sales Cycle', tag: 'Series A' },
                  { name: 'OmniFlow', stat: '4.8x ACV Expansion', tag: 'Bootstrapped' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3">
                    <div className="text-base font-bold text-white">{s.name}</div>
                    <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{s.stat}</div>
                    <div className="text-[11px] text-gray-500 uppercase mt-0.5">{s.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRODUCTIZED SERVICE TIERS PREVIEW */}
          <section className="py-20 bg-[#0a0a0a]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Productized Engagements</span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">High-Impact Advisory Packages</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View All Packages &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((srv, idx) => (
                  <div key={srv.id || idx} className="rounded-2xl border border-emerald-500/20 bg-[#121212] p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-400/50 transition">
                    <div>
                      <div className="text-lg font-bold text-white mb-2">{srv.title}</div>
                      <div className="text-2xl font-black text-emerald-400 mb-4">{srv.price}</div>
                      <p className="text-xs text-gray-300 leading-relaxed mb-6">{srv.description}</p>
                      
                      {srv.deliverables && (
                        <div className="space-y-2 mb-6">
                          {srv.deliverables.map((del, didx) => (
                            <div key={didx} className="flex items-start gap-2 text-xs text-gray-300">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{del}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('/contact')}
                      className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition mt-4"
                    >
                      Inquire for Package
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VERIFIED TESTIMONIALS */}
          {testimonials.length > 0 && (
            <section className="py-20 border-t border-emerald-500/15 bg-[#0e0e0e]">
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Proof of Work</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">What Venture Founders Say</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {testimonials.map(t => (
                    <div key={t.id} className="rounded-2xl border border-emerald-500/20 bg-[#141414] p-6 sm:p-8 space-y-4">
                      <div className="flex items-center gap-1 text-emerald-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-emerald-400" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed italic">
                        "{t.quote}"
                      </p>
                      <div className="pt-2 border-t border-emerald-500/15">
                        <div className="font-bold text-white text-sm">{t.clientName}</div>
                        <div className="text-xs text-emerald-400">{t.clientRole} &bull; {t.clientCompany}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SERVICES PAGE */}
      {activePage === '/services' && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Transparent Engagements</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Advisory Packages & Deliverables</h1>
              <p className="text-base text-gray-400 mt-3 leading-relaxed">
                Direct, execution-focused guidance designed to unlock ARR velocity without lengthy ramp-up cycles.
              </p>
            </div>

            <div className="space-y-8">
              {services.map((srv, idx) => (
                <div key={srv.id || idx} className="rounded-2xl border border-emerald-500/20 bg-[#121212] p-6 sm:p-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <h2 className="text-2xl font-bold text-white">{srv.title}</h2>
                      <p className="text-sm text-gray-300 leading-relaxed">{srv.description}</p>
                      
                      {srv.deliverables && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                          {srv.deliverables.map((del, didx) => (
                            <div key={didx} className="flex items-start gap-2 text-xs text-gray-300">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{del}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-[#0a0a0a] p-6 text-center shrink-0 w-full lg:w-72">
                      <div className="text-xs text-gray-400 uppercase">Investment</div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400 my-2">{srv.price}</div>
                      <button
                        type="button"
                        onClick={() => onNavigate('/contact')}
                        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition mt-2"
                      >
                        Reserve Spot
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RESULTS PAGE */}
      {activePage === '/results' && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Case Records</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Client Results & Case Studies</h1>
              <p className="text-sm text-gray-400 mt-2">
                Detailed breakdowns of pipeline generation, cycle compression, and enterprise pricing recalibration.
              </p>
            </div>

            <div className="space-y-10">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="rounded-2xl border border-emerald-500/20 bg-[#121212] p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase mb-2">
                    {p.role || 'Lead Advisor'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">{p.title}</h2>
                  <p className="text-sm text-gray-300 leading-relaxed mb-6">{p.detailedDescription || p.summary}</p>

                  {p.metrics && (
                    <div className="grid grid-cols-3 gap-4 border-t border-emerald-500/15 pt-4">
                      {p.metrics.map((m, midx) => (
                        <div key={midx}>
                          <div className="text-lg sm:text-xl font-black text-emerald-400">{m.value}</div>
                          <div className="text-[11px] text-gray-400 uppercase mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT / BOOK CALL PAGE */}
      {activePage === '/contact' && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Growth Consultation</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Book a 30-Minute Growth Audit</h1>
              <p className="text-sm text-gray-400 mt-2">
                Review your current conversion leaks, sales cycles, and pricing tiers with zero obligation.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-[#121212] p-8 shadow-2xl">
              {bookingSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="text-lg font-bold text-white">Call Request Confirmed</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">We have logged your slot request and will send calendar confirmation with Zoom coordinates.</p>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setBookingSubmitted(true);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Founder / Operator Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Marcus Sterling"
                        className="w-full rounded-lg border border-emerald-500/30 bg-[#0a0a0a] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="founder@saascompany.com"
                        className="w-full rounded-lg border border-emerald-500/30 bg-[#0a0a0a] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Current ARR Band</label>
                      <select className="w-full rounded-lg border border-emerald-500/30 bg-[#0a0a0a] px-3.5 py-2.5 text-white focus:border-emerald-400 focus:outline-none">
                        <option>$500k - $1M ARR</option>
                        <option>$1M - $5M ARR</option>
                        <option>$5M - $15M ARR</option>
                        <option>$15M+ ARR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Primary Growth Bottleneck</label>
                      <select className="w-full rounded-lg border border-emerald-500/30 bg-[#0a0a0a] px-3.5 py-2.5 text-white focus:border-emerald-400 focus:outline-none">
                        <option>Long Sales Cycle & Slipping Deals</option>
                        <option>Low Self-Serve Trial Conversion</option>
                        <option>Enterprise Pricing & Packaging Recalibration</option>
                        <option>GTM Team Leadership & Hiring</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Website & Context</label>
                    <textarea
                      rows={3}
                      placeholder="Share your current domain and key growth challenges..."
                      className="w-full rounded-lg border border-emerald-500/30 bg-[#0a0a0a] px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-400 focus:outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 font-bold text-white shadow-xl shadow-emerald-600/30 transition"
                  >
                    Confirm Strategy Session Request
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

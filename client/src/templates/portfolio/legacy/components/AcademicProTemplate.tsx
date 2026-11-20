import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  GraduationCap, BookOpen, Award,
  Mail, MapPin, ExternalLink, Copy, Check, Download
} from 'lucide-react';

export const AcademicProTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Faculty Researcher',
    title: 'Professor of Quantum Computing',
    headline: requirements.tagline || 'Advancing post-quantum cryptography and fault-tolerant algorithms.',
    bio: requirements.aboutText || 'Tenured faculty researcher leading fundamental inquiries in lattice-based cryptography and theoretical computer science.',
    email: requirements.contactEmail || 'faculty@mit.example.edu',
    location: requirements.address || 'Cambridge, MA'
  };

  const skills = portfolioData?.skills || [];
  const projects = portfolioData?.projects || [];
  const experience = portfolioData?.experience || [];
  const publications = portfolioData?.publications || [];
  const education = portfolioData?.education || [];
  const metrics = website?.metrics || [
    { label: 'Peer-Reviewed Papers', value: '35+' },
    { label: 'Total Citations', value: '2,800+' },
    { label: 'Grants Awarded', value: '$2.4M' },
    { label: 'Doctoral Advisees', value: '8' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;

  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);

  const handleCopyBibtex = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedBibtexId(id);
    setTimeout(() => setCopiedBibtexId(null), 2500);
  };

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-blue-500/20 bg-[#0b0f19]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-10 w-10 rounded-full border border-blue-500/30 object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300">
              <GraduationCap className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-serif text-base font-bold tracking-wide text-white group-hover:text-blue-300 transition">
              {identity.fullName}
            </div>
            <div className="text-[11px] font-sans text-blue-300/80 tracking-normal">
              {identity.title}
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { slug: '/', label: 'Profile' },
            { slug: '/publications', label: 'Publications' },
            { slug: '/teaching', label: 'Teaching' },
            { slug: '/cv', label: 'Curriculum Vitae' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded px-3.5 py-1.5 font-serif text-xs tracking-wide transition ${
                activePage === p.slug
                  ? 'border border-blue-500/40 bg-blue-950/60 text-blue-200'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded border border-blue-500/30 bg-blue-950/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-blue-300 font-sans">
              Academic Demo
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/cv')}
            className="rounded bg-blue-700 hover:bg-blue-600 px-3.5 py-1.5 font-sans text-xs font-semibold text-white shadow-md flex items-center gap-1.5 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download CV
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-blue-500/20 bg-[#070b13] py-12 text-gray-400 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-serif text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            {identity.fullName} &bull; <span className="text-blue-300 font-sans text-xs">ACADEMIC PRO</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs">
          {identity.email && (
            <span className="text-gray-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-blue-400" /> {identity.email}
            </span>
          )}
          {identity.location && (
            <span className="text-gray-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-400" /> {identity.location}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 font-serif selection:bg-blue-500/30 selection:text-blue-200">
      <Nav />

      {/* OVERVIEW / HOME */}
      {activePage === '/' && (
        <div>
          {/* SCHOLARLY PROFILE HERO */}
          <section className="relative overflow-hidden border-b border-blue-500/20 bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#0b0f19] py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-8 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-sans text-blue-300">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                    <span>Faculty Laboratory & Theoretical Foundations</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-serif">
                    {identity.title}
                  </h1>

                  <p className="text-base sm:text-lg text-gray-300 font-sans leading-relaxed">
                    {identity.headline}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-sans">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="rounded-lg border border-blue-500/20 bg-[#111827] p-3.5">
                        <div className="font-serif text-xl sm:text-2xl font-bold text-blue-300">{m.value}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 font-sans">
                    <button
                      type="button"
                      onClick={() => onNavigate('/publications')}
                      className="rounded bg-blue-700 hover:bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition"
                    >
                      Peer-Reviewed Papers
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/cv')}
                      className="rounded border border-blue-500/40 hover:bg-blue-950/50 px-5 py-2.5 text-xs text-blue-300 transition"
                    >
                      View Full Curriculum Vitae
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  {profileImg && (
                    <div className="overflow-hidden rounded-2xl border-2 border-blue-500/30 shadow-2xl">
                      <img
                        src={profileImg}
                        alt={identity.fullName}
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  )}
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-[#111827] p-4 font-sans text-xs space-y-1">
                    <div className="font-bold text-white text-sm font-serif">{identity.currentCompany}</div>
                    <div className="text-blue-300">{identity.currentRole}</div>
                    <div className="text-gray-400">{identity.location}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RESEARCH FOCUS & CORE THEORIES */}
          <section className="py-16 border-b border-blue-500/15 bg-[#0b0f19] font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-8">
                <span className="text-xs font-sans text-blue-400 uppercase tracking-widest">Theoretical Domains</span>
                <h2 className="text-2xl font-bold text-white font-serif mt-1">Research Specializations & Methods</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {skills.map(sk => (
                  <div key={sk.id} className="rounded-lg border border-blue-500/20 bg-[#111827] p-4">
                    <div className="font-bold text-white text-sm">{sk.name}</div>
                    <div className="text-xs text-blue-300 mt-1">{sk.proficiency} &bull; {sk.category}</div>
                    {sk.yearsOfExperience && (
                      <div className="text-[11px] text-gray-500 mt-2">{sk.yearsOfExperience} years active investigation</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SPONSORED LAB PROJECTS */}
          <section className="py-16 bg-[#0f172a] font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs text-blue-400 uppercase tracking-widest">Investigative Programs</span>
                  <h2 className="text-2xl font-bold text-white font-serif mt-1">Active Research Grants & Projects</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/publications')}
                  className="text-xs text-blue-300 hover:text-white"
                >
                  All Publications &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="rounded-xl border border-blue-500/20 bg-[#0b0f19] p-6 space-y-4">
                    <div>
                      <span className="text-xs text-blue-400 font-semibold">{p.role || 'Principal Investigator'}</span>
                      <h3 className="text-lg font-bold text-white font-serif mt-1">{p.title}</h3>
                      <p className="text-xs text-gray-300 leading-relaxed mt-2">{p.detailedDescription || p.summary}</p>
                    </div>

                    {p.metrics && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-500/15">
                        {p.metrics.map((m, midx) => (
                          <div key={midx}>
                            <div className="text-sm font-bold text-blue-300 font-serif">{m.value}</div>
                            <div className="text-[10px] text-gray-400 uppercase">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* PUBLICATIONS PAGE */}
      {activePage === '/publications' && (
        <section className="py-20 font-sans">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <span className="text-xs text-blue-400 uppercase tracking-widest">Bibliography</span>
              <h1 className="text-3xl sm:text-5xl font-bold text-white font-serif mt-1">Peer-Reviewed Research</h1>
              <p className="text-sm text-gray-300 mt-2 font-sans">
                Scholarly publications across ACM, IEEE, STOC, FOCS, CRYPTO, and Nature Quantum Information.
              </p>
            </div>

            <div className="space-y-6">
              {publications.map((pub, idx) => (
                <div key={pub.id || idx} className="rounded-xl border border-blue-500/20 bg-[#111827] p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-700/40 uppercase">
                      {pub.type || 'journal'}
                    </span>
                    <span className="text-xs text-gray-400">{pub.year}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-white font-serif">{pub.title}</h2>
                  <div className="text-xs text-gray-300 font-sans italic">{pub.publisher}</div>

                  {pub.doi && (
                    <div className="text-xs font-mono text-blue-400">DOI: {pub.doi}</div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {pub.link && (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-blue-500/40 hover:bg-blue-950/50 px-3.5 py-1.5 text-xs text-blue-300 flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="h-3 w-3" /> View Publisher Article
                      </a>
                    )}
                    {pub.bibtex && (
                      <button
                        type="button"
                        onClick={() => handleCopyBibtex(pub.id, pub.bibtex!)}
                        className="rounded bg-blue-900/60 hover:bg-blue-800/80 px-3.5 py-1.5 text-xs text-white flex items-center gap-1.5 transition"
                      >
                        {copiedBibtexId === pub.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> Copied BibTeX!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy BibTeX
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TEACHING PAGE */}
      {activePage === '/teaching' && (
        <section className="py-20 font-sans">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <span className="text-xs text-blue-400 uppercase tracking-widest">Pedagogy</span>
              <h1 className="text-3xl sm:text-5xl font-bold text-white font-serif mt-1">Courses & Pedagogy</h1>
              <p className="text-sm text-gray-300 mt-2 font-sans">
                Curricula and graduate lecture syllabi developed for future cryptographers and quantum scientists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  code: 'CS 6.840',
                  title: 'Theory of Quantum Computation',
                  term: 'Fall 2025',
                  description: 'Quantum circuits, Shor algorithm, Grover search, quantum error correcting codes, and fault tolerance threshold theorems.'
                },
                {
                  code: 'CS 6.875',
                  title: 'Advanced Cryptographic Protocols',
                  term: 'Spring 2025',
                  description: 'Zero-knowledge proofs, multiparty computation, lattice hardness reductions, and post-quantum digital signature standards.'
                },
                {
                  code: 'CS 6.045',
                  title: 'Automata, Computability & Complexity',
                  term: 'Fall 2024',
                  description: 'Core theoretical foundation covering Turing machines, undecidability, NP-completeness, and space complexity.'
                }
              ].map((c, idx) => (
                <div key={idx} className="rounded-xl border border-blue-500/20 bg-[#111827] p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-blue-400 font-bold">{c.code}</span>
                    <span className="text-xs text-gray-400">{c.term}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-serif">{c.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CV PAGE */}
      {activePage === '/cv' && (
        <section className="py-20 font-sans">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-blue-500/20">
              <div>
                <span className="text-xs text-blue-400 uppercase tracking-widest">Vitae</span>
                <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif mt-1">Curriculum Vitae</h1>
                <p className="text-xs text-gray-400 mt-1">{identity.fullName} &bull; {identity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Simulated PDF Download: Dr_Julianne_Mercer_CV.pdf')}
                className="rounded-lg bg-blue-700 hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white flex items-center gap-2 self-start sm:self-auto transition"
              >
                <Download className="h-4 w-4" /> Download PDF (8 Pages)
              </button>
            </div>

            <div className="space-y-12">
              <div>
                <h2 className="text-xl font-bold text-white font-serif mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-400" /> Education & Degrees
                </h2>
                <div className="space-y-4">
                  {education.map(edu => (
                    <div key={edu.id} className="rounded-lg border border-blue-500/20 bg-[#111827] p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">{edu.degree}</div>
                        <span className="text-xs text-blue-300">{edu.year}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{edu.institution}</div>
                      {edu.honors && <div className="text-xs text-blue-400 mt-1 italic">{edu.honors}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white font-serif mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-400" /> Academic Appointments
                </h2>
                <div className="space-y-4">
                  {experience.map(exp => (
                    <div key={exp.id} className="rounded-lg border border-blue-500/20 bg-[#111827] p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">{exp.title}</div>
                        <span className="text-xs text-blue-300">{exp.period}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{exp.company} &bull; {exp.location}</div>
                      <p className="text-xs text-gray-300 mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

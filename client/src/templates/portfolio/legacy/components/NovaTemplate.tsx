import React, { useState } from 'react';
import type { PortfolioTemplateProps } from '../../types';
import {
  Terminal, Code2, Cpu, GitBranch, Github, ExternalLink,
  Mail, Phone, MapPin, CheckCircle2, ChevronRight,
  Layers, Send
} from 'lucide-react';

export const NovaTemplate: React.FC<PortfolioTemplateProps> = ({
  requirements,
  portfolioData,
  website,
  activePage,
  onNavigate,
  isDemo
}) => {
  const identity = portfolioData?.identity || {
    fullName: requirements.organizationName || 'Developer Portfolio',
    title: 'Senior Software Engineer',
    headline: requirements.tagline || 'Building resilient distributed systems',
    bio: requirements.aboutText || 'Staff software architect with deep expertise in cloud-native platforms.',
    email: requirements.contactEmail || 'dev@example.com',
    location: requirements.address || 'San Francisco, CA'
  };

  const skills = portfolioData?.skills || [];
  const projects = portfolioData?.projects || [];
  const experience = portfolioData?.experience || [];
  const publications = portfolioData?.publications || [];
  const metrics = website?.metrics || [
    { label: 'Experience', value: '9+ Yrs' },
    { label: 'Max Throughput', value: '850K QPS' },
    { label: 'Uptime Achieved', value: '99.999%' }
  ];

  const profileImg = identity.profilePhotoUrl || requirements.logoUrl;

  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    let res = '';
    if (cmd === 'help') res = 'Available: help, bio, skills, projects, contact, clear';
    else if (cmd === 'bio') res = identity.bio || 'Architect and engineer.';
    else if (cmd === 'skills') res = skills.map(s => s.name).join(', ') || 'Rust, Go, TypeScript';
    else if (cmd === 'projects') res = `Featured: ${projects.map(p => p.title).join(' | ')}`;
    else if (cmd === 'contact') res = `Email: ${identity.email || 'N/A'}`;
    else if (cmd === 'clear') {
      setTerminalOutput([]);
      setCommandInput('');
      return;
    } else {
      res = `command not found: "${cmd}". Type "help" for a list of commands.`;
    }
    setTerminalOutput(prev => [...prev, `$ ${commandInput}`, res]);
    setCommandInput('');
  };

  const Nav = () => (
    <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-[#090D16]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          {profileImg ? (
            <img src={profileImg} alt={identity.fullName} className="h-9 w-9 rounded-lg border border-cyan-500/40 object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
              <Terminal className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="font-mono text-sm font-bold tracking-tight text-white group-hover:text-cyan-400 transition">
              {identity.fullName}
            </div>
            <div className="font-mono text-[11px] text-cyan-400/80 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {identity.currentRole || 'Available for Projects'}
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { slug: '/', label: 'Overview' },
            { slug: '/projects', label: 'Systems & Repos' },
            { slug: '/experience', label: 'Milestones' },
            { slug: '/contact', label: 'Terminal Dispatch' }
          ].map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.slug)}
              className={`rounded px-3 py-1.5 font-mono text-xs transition ${
                activePage === p.slug
                  ? 'border border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                  : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan-300">
              Demo Environment
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="rounded bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 font-mono text-xs font-semibold text-white shadow-lg shadow-cyan-600/25 transition"
          >
            $ connect
          </button>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-cyan-500/20 bg-[#060a12] py-10 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-400" />
            {identity.fullName} &bull; <span className="text-cyan-400">NOVA Engine v1.0.0</span>
          </div>
          <p className="mt-1 font-mono text-xs text-gray-500">
            {identity.headline}
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          {identity.socialLinks?.github && (
            <a href={identity.socialLinks.github} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          )}
          {identity.email && (
            <span className="text-gray-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-cyan-400" /> {identity.email}
            </span>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-[#090D16] text-gray-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Nav />

      {/* OVERVIEW / HOME PAGE */}
      {activePage === '/' && (
        <div>
          {/* HERO SECTION */}
          <section className="relative overflow-hidden border-b border-cyan-500/20 bg-gradient-to-b from-[#090D16] via-[#0c1424] to-[#090D16] py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-mono text-cyan-300">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    <span>sys.arch // distributed systems & cloud kernels</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-mono tracking-tight text-white leading-tight">
                    {identity.title || 'Senior Systems Architect'}
                  </h1>

                  <p className="text-base sm:text-lg text-gray-300 font-sans leading-relaxed">
                    {identity.headline}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="rounded-lg border border-cyan-500/25 bg-[#0f172a]/80 p-3">
                        <div className="font-mono text-lg sm:text-xl font-bold text-cyan-400">{m.value}</div>
                        <div className="font-mono text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => onNavigate('/projects')}
                      className="rounded bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 font-mono text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
                    >
                      <GitBranch className="h-4 w-4" /> Inspect Architecture
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/contact')}
                      className="rounded border border-cyan-500/40 hover:bg-cyan-950/50 px-5 py-2.5 font-mono text-xs text-cyan-300 transition"
                    >
                      Direct Message
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  {/* TERMINAL EMULATOR CARD */}
                  <div className="rounded-xl border border-cyan-500/30 bg-[#050811] shadow-2xl overflow-hidden font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 bg-[#0a0f1d] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <span className="text-gray-400 text-[11px]">nova-shell &bull; zsh 5.9</span>
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <div className="p-4 space-y-2 text-gray-300 max-h-72 overflow-y-auto">
                      <div className="text-gray-500">Last login: {new Date().toLocaleDateString()} from 127.0.0.1</div>
                      <div className="text-cyan-400">$ whoami</div>
                      <div className="text-white">{identity.fullName} &bull; {identity.title}</div>
                      <div className="text-cyan-400">$ cat /etc/bio.txt</div>
                      <div className="text-gray-300">{identity.bio}</div>
                      {terminalOutput.map((out, idx) => (
                        <div key={idx} className={out.startsWith('$') ? 'text-cyan-400 font-bold' : 'text-gray-300'}>
                          {out}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleCommand} className="flex items-center border-t border-cyan-500/20 bg-[#080d19] px-3 py-2">
                      <span className="text-cyan-400 mr-2">$</span>
                      <input
                        type="text"
                        value={commandInput}
                        onChange={e => setCommandInput(e.target.value)}
                        placeholder="type 'help', 'skills', or 'projects'..."
                        className="w-full bg-transparent text-white focus:outline-none text-xs font-mono placeholder:text-gray-600"
                      />
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SKILLS MATRIX */}
          <section className="py-16 border-b border-cyan-500/15 bg-[#090D16]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-cyan-400" />
                    Core Competencies & Tooling
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-1">Verified production expertise & runtime languages</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {skills.map(sk => (
                  <div key={sk.id} className="rounded-lg border border-cyan-500/20 bg-[#0f172a]/70 p-4 hover:border-cyan-400/50 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-white">{sk.name}</span>
                      <span className="font-mono text-[10px] rounded bg-cyan-950/80 px-2 py-0.5 text-cyan-300 border border-cyan-700/40">
                        {sk.proficiency}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 font-mono flex items-center justify-between">
                      <span>{sk.category}</span>
                      {sk.yearsOfExperience && <span>{sk.yearsOfExperience} yrs exp</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED PROJECTS TEASER */}
          <section className="py-16 bg-[#0a0f1d]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-cyan-400" />
                    Featured Architecture & Repositories
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-1">Open-source distributed systems and tooling</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/projects')}
                  className="font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View all systems <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 3).map(p => (
                  <div key={p.id} className="rounded-xl border border-cyan-500/25 bg-[#090D16] p-5 hover:border-cyan-400/60 transition flex flex-col justify-between">
                    <div>
                      {p.featuredImageUrl && (
                        <img src={p.featuredImageUrl} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-4 border border-cyan-500/20" />
                      )}
                      <div className="font-mono text-base font-bold text-white mb-2">{p.title}</div>
                      <p className="text-xs text-gray-300 leading-relaxed mb-4">{p.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="font-mono text-[10px] rounded bg-[#0f172a] border border-cyan-500/20 px-2 py-0.5 text-cyan-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-cyan-500/15 pt-3">
                      {p.metrics?.[0] && (
                        <div className="font-mono text-xs text-cyan-400 font-bold">
                          {p.metrics[0].label}: {p.metrics[0].value}
                        </div>
                      )}
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* PROJECTS PAGE */}
      {activePage === '/projects' && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10">
              <div className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-1">$ ls -la /architecture</div>
              <h1 className="text-3xl sm:text-4xl font-bold font-mono text-white">Systems Architecture & Repositories</h1>
              <p className="text-sm text-gray-400 font-mono mt-2">Production-grade distributed stores, service meshes, and cloud kernels.</p>
            </div>

            <div className="space-y-8">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="rounded-xl border border-cyan-500/25 bg-[#0f172a]/60 p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan-400">repo_0{idx + 1}</span>
                        <span className="font-mono text-xs text-gray-500">&bull;</span>
                        <span className="font-mono text-xs text-gray-400">{p.role || 'Lead Architect'}</span>
                      </div>
                      <h2 className="text-2xl font-bold font-mono text-white">{p.title}</h2>
                      <p className="text-sm text-gray-300 leading-relaxed">{p.detailedDescription || p.summary}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {p.technologies?.map((tech, tidx) => (
                          <span key={tidx} className="font-mono text-xs rounded bg-cyan-950/60 border border-cyan-700/40 px-2.5 py-1 text-cyan-300">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {p.metrics && p.metrics.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                          {p.metrics.map((m, midx) => (
                            <div key={midx} className="rounded border border-cyan-500/20 bg-[#090D16] p-2.5">
                              <div className="font-mono text-xs text-gray-400">{m.label}</div>
                              <div className="font-mono text-sm font-bold text-cyan-300 mt-0.5">{m.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-4">
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noreferrer" className="rounded bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-mono text-xs text-white flex items-center gap-1.5 transition">
                            <ExternalLink className="h-3.5 w-3.5" /> Live Benchmarks
                          </a>
                        )}
                        {p.githubUrl && (
                          <a href={p.githubUrl} target="_blank" rel="noreferrer" className="rounded border border-cyan-500/40 hover:bg-cyan-950/50 px-4 py-2 font-mono text-xs text-cyan-300 flex items-center gap-1.5 transition">
                            <Github className="h-3.5 w-3.5" /> Source Code
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      {p.featuredImageUrl && (
                        <img src={p.featuredImageUrl} alt={p.title} className="w-full rounded-xl border border-cyan-500/30 object-cover shadow-xl" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EXPERIENCE PAGE */}
      {activePage === '/experience' && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-10">
              <div className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-1">$ git log --career</div>
              <h1 className="text-3xl sm:text-4xl font-bold font-mono text-white">Engineering Experience & Milestones</h1>
              <p className="text-sm text-gray-400 font-mono mt-2">Proven track record of technical leadership and large-scale delivery.</p>
            </div>

            <div className="relative border-l border-cyan-500/30 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-12">
              {experience.map(exp => (
                <div key={exp.id} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-4 w-4 rounded-full border-2 border-cyan-400 bg-[#090D16]"></div>
                  
                  <div className="rounded-xl border border-cyan-500/25 bg-[#0f172a]/70 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="font-mono text-lg font-bold text-white">{exp.title}</div>
                      <span className="font-mono text-xs rounded bg-cyan-950/80 px-2.5 py-1 text-cyan-300 border border-cyan-700/30 self-start sm:self-auto">
                        {exp.period}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-cyan-400 font-semibold mb-3">
                      {exp.company} &bull; <span className="text-gray-400">{exp.location}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                      {exp.description}
                    </p>

                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="space-y-1.5 mb-4 text-xs text-gray-300">
                        {exp.highlights.map((h, hidx) => (
                          <li key={hidx} className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">&bull;</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {exp.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cyan-500/15">
                        {exp.technologies.map((t, tidx) => (
                          <span key={tidx} className="font-mono text-[10px] rounded bg-[#090D16] border border-cyan-500/20 px-2 py-0.5 text-gray-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {publications.length > 0 && (
              <div className="mt-16 pt-10 border-t border-cyan-500/20">
                <h2 className="text-xl font-bold font-mono text-white mb-6">Publications & Technical Writings</h2>
                <div className="space-y-4">
                  {publications.map(pub => (
                    <div key={pub.id} className="rounded-lg border border-cyan-500/20 bg-[#0f172a]/50 p-4 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-semibold text-white">{pub.title}</div>
                        <div className="font-mono text-xs text-gray-400 mt-1">{pub.publisher} &bull; {pub.year}</div>
                      </div>
                      {pub.link && (
                        <a href={pub.link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1">
                          Read <ExternalLink className="h-3 w-3" />
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

      {/* CONTACT PAGE */}
      {activePage === '/contact' && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <div className="font-mono text-xs text-cyan-400 uppercase tracking-widest mb-1">$ nc -vz dispatch 443</div>
              <h1 className="text-3xl sm:text-4xl font-bold font-mono text-white">Initialize Direct Communication</h1>
              <p className="text-sm text-gray-400 font-mono mt-2">Available for high-scale architectural contracts, staff roles, and advisory.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-5 space-y-4">
                <div className="rounded-xl border border-cyan-500/25 bg-[#0f172a]/80 p-5 space-y-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">Contact Coordinates</div>
                  
                  {identity.email && (
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
                      <Mail className="h-4 w-4 text-cyan-400" />
                      <span>{identity.email}</span>
                    </div>
                  )}

                  {identity.phone && (
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
                      <Phone className="h-4 w-4 text-cyan-400" />
                      <span>{identity.phone}</span>
                    </div>
                  )}

                  {identity.location && (
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
                      <MapPin className="h-4 w-4 text-cyan-400" />
                      <span>{identity.location}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-cyan-500/25 bg-[#0f172a]/80 p-5">
                  <div className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold mb-2">Availability Status</div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Accepting Q1/Q2 Architecture Engagements
                  </div>
                </div>
              </div>

              <div className="md:col-span-7">
                <div className="rounded-xl border border-cyan-500/30 bg-[#050811] p-6 shadow-2xl">
                  {contactSubmitted ? (
                    <div className="py-12 text-center space-y-3 font-mono">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                      <div className="text-base font-bold text-white">Packet Transmitted Successfully</div>
                      <p className="text-xs text-gray-400">Your message has been queued to the architect's mailbox.</p>
                      <button
                        type="button"
                        onClick={() => setContactSubmitted(false)}
                        className="rounded border border-cyan-500/40 text-cyan-300 text-xs px-4 py-1.5 mt-2"
                      >
                        Send Another Packet
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        setContactSubmitted(true);
                      }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div>
                        <label className="block text-gray-400 mb-1">Origin Identifier (Name)</label>
                        <input
                          type="text"
                          required
                          placeholder="Your name or organization"
                          className="w-full rounded border border-cyan-500/30 bg-[#090D16] px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Return Endpoint (Email)</label>
                        <input
                          type="email"
                          required
                          placeholder="you@company.com"
                          className="w-full rounded border border-cyan-500/30 bg-[#090D16] px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Payload (Message & Scope)</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Describe your technical challenge, timeline, and requirements..."
                          className="w-full rounded border border-cyan-500/30 bg-[#090D16] px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none resize-none"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded bg-cyan-600 hover:bg-cyan-500 py-2.5 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition"
                      >
                        <Send className="h-3.5 w-3.5" /> Dispatch Packet
                      </button>
                    </form>
                  )}
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

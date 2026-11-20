import React from 'react';
import { Container } from '../layout/Container';
import { Badge } from '../ui/Badge';
import { FileText, Cpu, SlidersHorizontal, Eye, Rocket, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export const Workflow: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Collect Requirements & Media',
      subtitle: 'Admin & Sales Ingestion',
      description: 'Authorized company Admins and Salespersons interface with the client organization to collect official branding, color preferences, committee members, schedules, and authorized Google Drive media.',
      icon: FileText,
      accent: 'text-amber-400',
      borderAccent: 'border-amber-500/30',
      badge: 'Step 1 • Requirements'
    },
    {
      stepNumber: '02',
      title: 'Layout & Content Generation',
      subtitle: 'Built From Your Details',
      description: 'Digiverse builds the website from the organization profile: page structure, responsive sections, content drawn from your answers, and navigation suited to the organization type.',
      icon: Cpu,
      accent: 'text-cyan-400',
      borderAccent: 'border-cyan-500/30',
      badge: 'Step 2 • Generation'
    },
    {
      stepNumber: '03',
      title: 'Theme & Layout Customization',
      subtitle: 'Precision Tailoring',
      description: 'Admins fine-tune brand typography, primary/accent color schemes, header styles, and content layouts to ensure each client receives a distinctive, non-generic presentation.',
      icon: SlidersHorizontal,
      accent: 'text-indigo-400',
      borderAccent: 'border-indigo-500/30',
      badge: 'Step 3 • Customization'
    },
    {
      stepNumber: '04',
      title: 'Interactive Staging Preview',
      subtitle: 'Client Review & Feedback',
      description: 'The organization committee reviews a private, interactive staging website to verify festival schedules, match fixtures, committee directories, and media galleries before launch.',
      icon: Eye,
      accent: 'text-violet-400',
      borderAccent: 'border-violet-500/30',
      badge: 'Step 4 • Review'
    },
    {
      stepNumber: '05',
      title: 'Approve & Edge Publish',
      subtitle: 'Isolated Deployment',
      description: 'Upon approval, the website is published to global edge infrastructure with dedicated domain routing and complete multi-tenant data isolation from other customer organizations.',
      icon: Rocket,
      accent: 'text-emerald-400',
      borderAccent: 'border-emerald-500/30',
      badge: 'Step 5 • Live Launch'
    }
  ];

  return (
    <section id="workflow" className="py-20 lg:py-28 relative bg-digiverse-surface/40 border-b border-digiverse-border/40">
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="indigo" dot>
            Operational Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            How Digiverse Works
          </h2>
          <p className="text-sm sm:text-base text-digiverse-muted leading-relaxed">
            A controlled, end-to-end process operated by our authorized platform team. From initial committee intake to live edge deployment—each website is purpose-built and securely isolated.
          </p>
        </div>

        {/* 5-Step Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className={`relative rounded-2xl border ${s.borderAccent} bg-[#0D1424]/90 p-5 flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}
              >
                {/* Step Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-gray-400 group-hover:text-white transition-colors">
                      {s.stepNumber}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${s.accent}`} />
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {s.subtitle}
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-gray-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Step</span>
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">{s.badge}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Governance & Operator Notice */}
        <div className="mt-12 p-6 rounded-2xl border border-digiverse-border bg-digiverse-surface/80 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                Controlled Platform Governance & Tenant Security
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Enterprise Guarded
                </span>
              </h4>
              <p className="text-xs text-digiverse-muted leading-relaxed max-w-3xl">
                Digiverse is operated exclusively by authorized company Admins and Sales representatives. Clients receive dedicated website links and restricted, tenant-isolated content panels for authorized updates—never direct access to core platform code or other organizations' assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto flex-shrink-0">
            <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-black/40 px-3 py-2 rounded-lg border border-white/5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero Cross-Tenant Leakage</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

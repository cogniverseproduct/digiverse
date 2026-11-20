import React from 'react';
import { Container } from '../layout/Container';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Sparkles, Layers, Shield, HardDrive, Smartphone, Zap } from 'lucide-react';

export const ValuePillars: React.FC = () => {
  const pillars = [
    {
      title: 'Dedicated Community Modules',
      description: 'Unlike generic business website builders, Digiverse natively structures puja rituals, cultural schedules, athletic tournament fixtures, and committee directories.',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Genuinely Distinct Brand Identities',
      description: 'Every organization receives a tailored visual presence. We avoid identical cookie-cutter layouts, dynamically varying color schemes, typography, and content hierarchies.',
      icon: Layers,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Authorized Google Drive Media Ingestion',
      description: 'Ingest high-resolution festival photos, event videos, and committee headshots directly through authorized server-side Google Drive integrations without public token exposure.',
      icon: HardDrive,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Strict Multi-Tenant Isolation',
      description: 'Tenant data, customer records, and media assets are compartmentalized on the server. No client can access another organization’s data or platform source code.',
      icon: Shield,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Ultra-Fast Edge Publishing',
      description: 'Generated websites are deployed to low-latency edge networks with automated SSL, lightning-fast TTFB, and 99.9% uptime for peak festival and matchday traffic spikes.',
      icon: Zap,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      title: 'Mobile-First Community Reach',
      description: 'Every generated template is rigorously optimized for smartphones, tablets, and desktops so community members can check schedules and fixtures on the go.',
      icon: Smartphone,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-28 relative bg-digiverse-bg border-b border-digiverse-border/40">
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="indigo" dot>
            Platform Advantages
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Engineered Exclusively for{' '}
            <span className="bg-gradient-to-r from-digiverse-indigo via-violet-400 to-digiverse-cyan bg-clip-text text-transparent">
              Community Societies
            </span>
          </h2>
          <p className="text-sm sm:text-base text-digiverse-muted leading-relaxed">
            Standard web builders miss the nuances of cultural samitis and athletic clubs. Digiverse builds purpose-specific features directly into the core website creation flow.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Card key={idx} glow className="flex flex-col justify-between">
                <CardHeader>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${p.iconBg} mb-4`}>
                    <Icon className={`w-5 h-5 ${p.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg text-white">
                    {p.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400 leading-relaxed mt-2">
                    {p.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

import React, { useState } from 'react';
import { Container } from '../layout/Container';
import { Badge } from '../ui/Badge';
import { TenantWebsitePreview } from './TenantWebsitePreview';
import { mockOrganizations } from '../../data/mockOrganizations';
import { OrganizationType, LayoutPreset, ThemeAccent } from '../../types/preview';
import { Sparkles, Trophy, Users, Palette, Layout, Sliders, Shield, Info } from 'lucide-react';

export const InteractiveShowcase: React.FC = () => {
  const [selectedOrgType, setSelectedOrgType] = useState<OrganizationType>('cultural');
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('split');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('crimson-gold');

  const currentOrg = mockOrganizations[selectedOrgType];

  const handleOrgChange = (type: OrganizationType) => {
    setSelectedOrgType(type);
    setThemeAccent(mockOrganizations[type].themeAccentDefault);
  };

  const themeOptions: { id: ThemeAccent; label: string; color: string }[] = [
    { id: 'crimson-gold', label: 'Crimson & Gold', color: 'bg-red-600' },
    { id: 'neon-cyan', label: 'Electric Cyan', color: 'bg-cyan-500' },
    { id: 'forest-emerald', label: 'Forest Emerald', color: 'bg-emerald-600' },
    { id: 'royal-violet', label: 'Royal Violet', color: 'bg-violet-600' }
  ];

  const layoutOptions: { id: LayoutPreset; label: string }[] = [
    { id: 'split', label: 'Split Modern' },
    { id: 'grid', label: 'Dashboard Grid' },
    { id: 'editorial', label: 'Heritage Editorial' }
  ];

  return (
    <section id="showcase" className="py-20 lg:py-28 relative bg-digiverse-bg border-b border-digiverse-border/40">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-digiverse-indigo/15 via-digiverse-cyan/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <Badge variant="cyan" dot>
            Live Generation Showcase
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            One Platform.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Tailored Websites for Every Organization.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-digiverse-muted leading-relaxed">
            Digiverse is purpose-built for community organizations. Switch between representative client organizations below to see how our workflow creates completely distinct layouts, color palettes, event schedules, and committee directories.
          </p>
        </div>

        {/* Organization Type Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => handleOrgChange('cultural')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
              selectedOrgType === 'cultural'
                ? 'bg-red-950/70 border-amber-500/50 text-white shadow-lg shadow-red-950/40 ring-1 ring-amber-500/30'
                : 'bg-digiverse-surface border-digiverse-border text-gray-300 hover:text-white hover:border-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Cultural Society & Puja Samiti</span>
          </button>

          <button
            onClick={() => handleOrgChange('sports')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
              selectedOrgType === 'sports'
                ? 'bg-cyan-950/70 border-cyan-400/50 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                : 'bg-digiverse-surface border-digiverse-border text-gray-300 hover:text-white hover:border-gray-600'
            }`}
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>Sports & Athletic Club</span>
          </button>

          <button
            onClick={() => handleOrgChange('community')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
              selectedOrgType === 'community'
                ? 'bg-emerald-950/70 border-emerald-400/50 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                : 'bg-digiverse-surface border-digiverse-border text-gray-300 hover:text-white hover:border-gray-600'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Civic & Community Association</span>
          </button>
        </div>

        {/* Live Customization Control Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-digiverse-surface/90 border border-digiverse-border shadow-glow-card backdrop-blur-md mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Control Group 1: Theme Accent */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-digiverse-indigo" />
                <span>Theme Accent:</span>
              </span>
              <div className="flex items-center gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setThemeAccent(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      themeAccent === opt.id
                        ? 'bg-white/10 border-white/40 text-white ring-1 ring-white/20'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control Group 2: Layout Arrangement */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-digiverse-cyan" />
                <span>Layout Style:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
                {layoutOptions.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setLayoutPreset(preset.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      layoutPreset === preset.id
                        ? 'bg-digiverse-indigo text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Badge */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Layout Engine Active</span>
            </div>
          </div>
        </div>

        {/* Live Website Preview Window */}
        <TenantWebsitePreview
          org={currentOrg}
          layout={layoutPreset}
          themeAccent={themeAccent}
        />

        {/* Informational Platform Disclaimer */}
        <div className="mt-8 p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Illustrative frontend simulation of the Digiverse multi-tenant generation engine. Live customer sites receive independent edge routing and strict data isolation.
            </span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Operated Centrally by Digiverse Admins</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

import React from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import { HeartHandshake, Landmark, Droplet, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import type { NGOArchetype } from '../../types/ngo';
import { getNgoTemplatesByArchetype } from '../../templates/ngo/registry';

export type NGOArchetypeChoice = NGOArchetype;

interface NGOTypeSelectorProps {
  onSelectArchetype: (archetype: NGOArchetypeChoice) => void;
  onBack: () => void;
}

interface ArchetypeCardDef {
  id: NGOArchetypeChoice;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  description: string;
  features: string[];
}

// Every archetype collects the same real information; what differs is the character of the designs in its library.
const NGO_ARCHETYPES: ArchetypeCardDef[] = [
  {
    id: 'grassroots_ngo',
    title: 'Grassroots Impact & Community NGO',
    subtitle: 'Community groups, volunteer networks and local relief work',
    badge: 'Grassroots',
    icon: HeartHandshake,
    gradient: 'from-amber-50 via-emerald-50 to-dv-canvas',
    borderColor: 'border-amber-500/80 hover:border-amber-400',
    description: 'Warm, people-first designs for organisations that work close to the community: local programmes, volunteers, neighbourhood updates and the people behind them.',
    features: ['Programmes and where they run', 'Volunteer roles and how to join', 'News, updates and community stories', 'Team and contact details']
  },
  {
    id: 'institutional_foundation',
    title: 'Institutional Foundation & Trust',
    subtitle: 'Foundations, trusts, fellowships and research bodies',
    badge: 'Institutional',
    icon: Landmark,
    gradient: 'from-blue-50 via-white to-dv-canvas',
    borderColor: 'border-blue-500/80 hover:border-blue-400',
    description: 'Composed, credible designs for organisations that lead with governance, long-term programmes and published work.',
    features: ['Mission, vision and values', 'Leadership and trustees', 'Programmes and published updates', 'Partners and contact details']
  },
  {
    id: 'cause_charity',
    title: 'Visual Storytelling & Cause Charity',
    subtitle: 'Single-cause charities that lead with photography and stories',
    badge: 'Storytelling',
    icon: Droplet,
    gradient: 'from-teal-50 via-cyan-50 to-dv-canvas',
    borderColor: 'border-cyan-500/80 hover:border-cyan-400',
    description: 'Image-led designs for organisations whose work is best shown through photographs, impact figures and the stories of the people they help.',
    features: ['Photograph galleries', 'Impact figures you can verify', 'Stories told in people’s own words', 'How people can get involved']
  }
];

export const NGOTypeSelector: React.FC<NGOTypeSelectorProps> = ({ onSelectArchetype, onBack }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-800/60">
              Digiverse Social & NGO Engine
            </span>
            <Badge variant="indigo">Step 1 of 3: Organisation type</Badge>
          </div>
          <h2 className="text-2xl font-black text-dv-ink tracking-tight">Choose the type of organisation</h2>
          <p className="text-xs text-dv-muted mt-1">
            Next you will pick a design from that type’s library, then enter the organisation’s real details. Websites share information only: they do not collect donations or payments.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-dv-muted hover:text-dv-ink self-start sm:self-auto">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Change Engine</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {NGO_ARCHETYPES.map((arch) => {
          const Icon = arch.icon;
          const count = getNgoTemplatesByArchetype(arch.id).length;
          // An organisation type with no qualifying design yet cannot be started: nothing could be generated from it.
          const available = count > 0;
          return (
            <div
              key={arch.id}
              role="button"
              tabIndex={available ? 0 : -1}
              aria-disabled={!available}
              data-archetype={arch.id}
              data-available={available}
              onClick={() => { if (available) onSelectArchetype(arch.id); }}
              onKeyDown={(e) => { if (available && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectArchetype(arch.id); } }}
              className={`group relative rounded-2xl border-2 ${arch.borderColor} bg-gradient-to-br ${arch.gradient} p-6 transition-all duration-200 flex flex-col justify-between ${available ? 'cursor-pointer hover:shadow-xl' : 'cursor-not-allowed opacity-60 grayscale'}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-dv-ink/[0.03] flex items-center justify-center text-dv-ink shadow-md">
                    <Icon className="w-6 h-6 text-dv-ink" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-dv-ink/[0.04] text-dv-ink border border-dv-line">
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    {arch.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-dv-ink group-hover:text-emerald-700 transition-colors">{arch.title}</h3>
                  <p className="text-xs text-dv-ink-2 mt-1 leading-relaxed">{arch.subtitle}</p>
                </div>

                <p className="text-xs text-dv-ink-2 leading-relaxed">{arch.description}</p>

                <div className="space-y-2 pt-2 border-t border-dv-line">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-dv-muted">What the site can include:</div>
                  <ul className="text-xs text-dv-ink-2 space-y-1.5">
                    {arch.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
                <span className={`text-xs font-semibold ${available ? 'text-emerald-700 group-hover:underline' : 'text-dv-muted'}`} data-testid="template-count">
                  {available ? `${count} ${count === 1 ? 'template' : 'templates'} available` : 'No qualifying template available yet'}
                </span>
                {available ? (
                  <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-dv-muted">Unavailable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

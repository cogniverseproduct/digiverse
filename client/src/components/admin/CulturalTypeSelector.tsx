import React from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  Building2,
  Flame,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  Compass,
  Award,
  Layers,
  Heart
} from 'lucide-react';

export type CulturalArchetypeChoice = 'cultural_society' | 'puja_committee';

interface CulturalTypeSelectorProps {
  onSelectType: (archetype: CulturalArchetypeChoice) => void;
  onBack: () => void;
}

export const CulturalTypeSelector: React.FC<CulturalTypeSelectorProps> = ({
  onSelectType,
  onBack
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-800/60">
              Cultural Website Engine
            </span>
            <Badge variant="default" className="text-amber-700 border-amber-500/30 bg-amber-50">Step 2 of 2: Select Website Type</Badge>
          </div>
          <h2 className="text-2xl font-black text-dv-ink tracking-tight">Choose Cultural Website Type</h2>
          <p className="text-xs text-dv-muted mt-1">
            Select the specialized cultural website model tailored for your organization's mission and audience.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-dv-muted hover:text-dv-ink self-start sm:self-auto">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Change Engine</span>
        </Button>
      </div>

      {/* Two Dedicated Archetypes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TYPE 1: CULTURAL SOCIETY & ASSOCIATION */}
        <div
          onClick={() => onSelectType('cultural_society')}
          className="group relative cursor-pointer rounded-2xl border-2 border-dv-line bg-gradient-to-br from-amber-50 via-white to-dv-canvas p-6 transition-all duration-200 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-600/60">
                <Sparkles className="w-3 h-3 text-amber-700" />
                Societies & associations
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-700">Model 01 · Heritage & Samaj</div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-amber-700 transition-colors mt-0.5">
                Cultural Society & Association
              </h3>
              <p className="text-xs text-dv-ink-2 mt-2 leading-relaxed">
                Sophisticated editorial portal engineered for cultural societies, Bengali associations, arts foundations, and heritage groups. Emphasizes heritage storytelling, performing arts curriculums, executive leadership directories, and community membership.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-dv-line">
              <div className="text-[11px] font-semibold text-dv-muted uppercase tracking-wider">Ideal For:</div>
              <div className="flex flex-wrap gap-1.5">
                {['Cultural Societies', 'Bengali Associations', 'Literary Councils', 'Music & Dance Guilds', 'Heritage Foundations'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-dv-ink/[0.03] border border-dv-line text-[10px] text-dv-ink-2">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-dv-line">
              <div className="text-[11px] font-semibold text-dv-muted uppercase tracking-wider">Key Modules:</div>
              <ul className="text-xs text-dv-ink-2 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <span><strong>Heritage Storytelling & History:</strong> Milestones, founding narrative & core values</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <span><strong>Executive Leadership Directory:</strong> President, Secretary & Committee portraits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <span><strong>Performing Arts & Activities:</strong> Music, dance, theatre, workshops & seminars</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <span><strong>Samaj Community Membership:</strong> Supporter enrollment, benefits & participation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 group-hover:underline">Start Cultural Society Website</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500">
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* TYPE 2: PUJA COMMITTEE */}
        <div
          onClick={() => onSelectType('puja_committee')}
          className="group relative cursor-pointer rounded-2xl border-2 border-dv-line bg-gradient-to-br from-red-50 via-white to-dv-canvas p-6 transition-all duration-200 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
                <Flame className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-600/60">
                <Sparkles className="w-3 h-3 text-red-700" />
                Pujas & festivals
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-red-700">Model 02 · Utsav & Puja Samiti</div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-red-700 transition-colors mt-0.5">
                Puja Committee Website
              </h3>
              <p className="text-xs text-dv-ink-2 mt-2 leading-relaxed">
                Vibrant, festival-focused web engine tailored for Durga Puja, Kali Puja, Saraswati Puja, and festival committees. Features ritual schedules, Kumartuli idol artisan tributes, pandal architectural concept showcases, and visitor transit guides.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-dv-line">
              <div className="text-[11px] font-semibold text-dv-muted uppercase tracking-wider">Ideal For:</div>
              <div className="flex flex-wrap gap-1.5">
                {['Durga Puja Committees', 'Kali Puja Samitis', 'Saraswati Puja', 'Lakshmi Puja', 'Jagaddhatri Utsav', 'Ganesh Utsav'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-dv-ink/[0.03] border border-dv-line text-[10px] text-dv-ink-2">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-dv-line">
              <div className="text-[11px] font-semibold text-dv-muted uppercase tracking-wider">Key Modules:</div>
              <ul className="text-xs text-dv-ink-2 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-red-700 mt-0.5 shrink-0" />
                  <span><strong>5-Day Tithi & Ritual Timetable:</strong> Shasthi to Dashami, Pushpanjali, Sandhi Puja & Bhog</span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="w-3.5 h-3.5 text-red-700 mt-0.5 shrink-0" />
                  <span><strong>Theme & Idol Artisan Tribute:</strong> Kumartuli master sculptors & pandal architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <Compass className="w-3.5 h-3.5 text-red-700 mt-0.5 shrink-0" />
                  <span><strong>Visitor & Transit Guide:</strong> Nearest metro station, parking, crowd guidelines & hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-red-700 mt-0.5 shrink-0" />
                  <span><strong>Organizing Committee & Purohit:</strong> President, Secretary, volunteers & religious desk</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 group-hover:underline">Start Puja Committee Website</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500">
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

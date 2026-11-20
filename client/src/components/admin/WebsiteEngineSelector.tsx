import React from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  Trophy,
  Building,
  Calendar,
  HeartHandshake,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { IncludedFeaturesRow } from '../workspace/FeatureRows';

interface WebsiteEngineSelectorProps {
  onSelectEngine: (engine: 'sports' | 'cultural' | 'event' | 'ngo' | 'portfolio') => void;
  onCancel: () => void;
}

export const WebsiteEngineSelector: React.FC<WebsiteEngineSelectorProps> = ({
  onSelectEngine,
  onCancel
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Digiverse SaaS Architecture
            </span>
            <Badge variant="indigo">Step 1 of 2: Engine Selection</Badge>
          </div>
          <h2 className="text-2xl font-black text-dv-ink tracking-tight">Select Website Creation Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose the specialized generation engine suited to your client organization domain.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-slate-500 hover:text-dv-ink self-start sm:self-auto">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Projects</span>
        </Button>
      </div>

      {/* Engines Grid */}
      <IncludedFeaturesRow />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Sports Engine - ACTIVE */}
        <div
          onClick={() => onSelectEngine('sports')}
          className="group relative cursor-pointer rounded-2xl border-2 border-indigo-500/80 bg-gradient-to-br from-indigo-50/40 via-indigo-50/20 to-white p-6 transition-all duration-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available & Ready
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                Sports Website Creation Engine
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Professional websites for sports clubs, tournament hubs, and sports academies with squad rosters, player cards, fixtures, results, standings with form, and sponsor showcases.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-indigo-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supported Experiences:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Sports Club Website:</strong> Teams, squads, countdowns, form & standings</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Tournament Hub Website:</strong> Brackets, groups, live scores & fixtures</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Sports Academy Website:</strong> Coaching programmes, schedules & trials</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 group-hover:underline">Launch Sports Studio</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform">
              <span>Select Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* 2. Cultural Engine - ACTIVE */}
        <div
          onClick={() => onSelectEngine('cultural')}
          className="group relative cursor-pointer rounded-2xl border-2 border-amber-500/80 bg-gradient-to-br from-red-50/40 via-amber-50/20 to-white p-6 transition-all duration-200 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Building className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available & Ready
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-amber-700 transition-colors flex items-center gap-2">
                Cultural Website Generation Engine
                <Sparkles className="w-4 h-4 text-amber-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Websites for cultural societies and puja committees, with heritage storytelling, 5-day Tithi ritual timetables, Kumartuli idol artisan tributes, pandal architecture showcases, and visitor transit guides.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-amber-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supported Experiences:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Cultural Society & Association:</strong> activities, committee & members</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Puja Committee:</strong> Tithi schedule, idol themes & visitor guide</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 group-hover:underline">Launch Cultural Studio</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500">
              <span>Select Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* 3. Event Engine - ACTIVE */}
        <div
          onClick={() => onSelectEngine('event')}
          className="group relative cursor-pointer rounded-2xl border-2 border-purple-500/80 bg-gradient-to-br from-purple-50/40 via-indigo-50/20 to-white p-6 transition-all duration-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available & Ready
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-purple-700 transition-colors flex items-center gap-2">
                Event Website Generation Engine
                <Sparkles className="w-4 h-4 text-purple-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Event websites in 7 categories, with dynamic multi-track agendas, artist lineups, interactive RSVP, bento-box hardware specs, and ticket pricing passes.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supported 7 Categories:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Conference & Seminar:</strong> keynotes, multi-track & passes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Festival & Concert:</strong> Lineup poster, stage timetables & live countdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Corporate & Business:</strong> executive agenda & networking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Exhibition & Trade:</strong> booth floor plans & viewing rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Wedding & Private:</strong> love story milestones & interactive RSVP</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Award Ceremony:</strong> Cannes Lions standard, nominees, winners & gala tables</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span><strong>Launch & Reveal:</strong> Apple Keynote standard, bento specs & pre-orders</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-purple-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 group-hover:underline">Launch Event Studio</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
              <span>Select Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* 4. Social & NGO Engine - ACTIVE */}
        <div
          onClick={() => onSelectEngine('ngo')}
          className="group relative cursor-pointer rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white p-6 transition-all duration-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available & Ready
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                Social & NGO Website Engine
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Websites for NGOs and foundations in 3 styles, with verified 80G tax receipt transparency, 100% donation model proof, live impact counters, drop-off collection hubs, and volunteer recruitment.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supported 3 Archetypes:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Grassroots NGO:</strong> material collection hubs, relief drives & dignity campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Institutional Foundation:</strong> fellowships, summits & governance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Cause Charity:</strong> 100% model proof, live impact counters & donation ladder</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 group-hover:underline">Launch Impact Studio</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
              <span>Select Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* 5. Portfolio Website Creation Engine - ACTIVE */}
        <div
          onClick={() => onSelectEngine('portfolio')}
          className="group relative cursor-pointer rounded-2xl border-2 border-indigo-500/80 bg-gradient-to-br from-indigo-50/40 via-indigo-50/20 to-white p-6 transition-all duration-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between md:col-span-2"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Available & Ready
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                Portfolio Website Creation Engine
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Bespoke professional portfolio creation across 6 high-conversion archetypes. Features an integrated live template library, multi-device viewports, and strict architectural fidelity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Developer:</strong> NOVA terminal theme & metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>UI/UX Designer:</strong> Creative Studio editorial</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Photographer:</strong> VISION darkroom canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Motion & 3D:</strong> MOTIONVERSE showreels</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Academic:</strong> ACADEMIC PRO bibliographies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span><strong>Brand & Freelancer:</strong> BRANDBUILDER tiers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 group-hover:underline">Launch Portfolio Studio</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-indigo-600 hover:bg-indigo-600">
              <span>Select Engine</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

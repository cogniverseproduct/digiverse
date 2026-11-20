import React from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  Shield,
  Trophy,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export type SportsArchetypeChoice = 'sports_club' | 'sports_tournament' | 'sports_academy';

interface SportsTypeSelectorProps {
  onSelectType: (type: SportsArchetypeChoice) => void;
  onBack: () => void;
}

export const SportsTypeSelector: React.FC<SportsTypeSelectorProps> = ({
  onSelectType,
  onBack
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-800/60">
              Sports Website Creation Engine
            </span>
            <Badge variant="indigo">Step 2 of 2: Website Type Selection</Badge>
          </div>
          <h2 className="text-2xl font-black text-dv-ink tracking-tight">Select Sports Website Experience</h2>
          <p className="text-xs text-dv-muted mt-1">
            Each website type uses its own specialized layout architecture, information hierarchy, and user journey.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-dv-muted hover:text-dv-ink self-start sm:self-auto">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Engine Selection</span>
        </Button>
      </div>

      {/* 3 Sports Website Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Sports Club Website */}
        <div
          onClick={() => onSelectType('sports_club')}
          className="group cursor-pointer rounded-2xl border-2 border-cyan-500/60 hover:border-cyan-400 bg-gradient-to-b from-cyan-50 via-white to-dv-canvas p-6 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-700/60">
                Primary Reference
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono text-cyan-700 font-bold uppercase tracking-wider">Archetype A</div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-cyan-700 transition-colors mt-0.5">
                Sports Club Website
              </h3>
              <p className="text-xs text-dv-ink-2 mt-2 leading-relaxed">
                Professional club website. Built for football, cricket, rugby, basketball, and athletics clubs needing full squad, match, and league presentation.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-dv-line text-xs text-dv-ink-2">
              <div className="text-[10px] font-semibold text-dv-muted uppercase tracking-wider">Included Experience:</div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 mt-0.5" />
                  <span>Next matchday countdown hero card</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 mt-0.5" />
                  <span>Squad rosters & player profiles with jersey & stats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 mt-0.5" />
                  <span>League standings table with form guide (<strong className="text-emerald-700">W</strong>/<strong className="text-amber-700">D</strong>/<strong className="text-red-700">L</strong>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 mt-0.5" />
                  <span>Match results, sports news & sponsor marquee</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 shrink-0 mt-0.5" />
                  <span>Join club & membership enquiry form</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-700 group-hover:underline">Build Club Portal</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform">
              <span>Select Club</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* B. Tournament Hub Website */}
        <div
          onClick={() => onSelectType('sports_tournament')}
          className="group cursor-pointer rounded-2xl border-2 border-indigo-500/60 hover:border-indigo-400 bg-gradient-to-b from-indigo-50 via-white to-dv-canvas p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-700/60">
                Tournament Hub
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono text-indigo-700 font-bold uppercase tracking-wider">Archetype B</div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-indigo-700 transition-colors mt-0.5">
                Tournament Hub Website
              </h3>
              <p className="text-xs text-dv-ink-2 mt-2 leading-relaxed">
                High-energy tournament portal. Built for cups, leagues, multi-tier tournaments, and corporate championships with brackets, participating teams, and scoreboards.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-dv-line text-xs text-dv-ink-2">
              <div className="text-[10px] font-semibold text-dv-muted uppercase tracking-wider">Included Experience:</div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Competition overview, rules & format display</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Visual knockout brackets & tournament stages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Participating teams directory & rosters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Match schedules, venue maps & live score centre</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <span>Team registration & tournament enquiry forms</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 group-hover:underline">Build Tournament Hub</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-indigo-600 hover:bg-indigo-500">
              <span>Select Hub</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* C. Sports Academy Website */}
        <div
          onClick={() => onSelectType('sports_academy')}
          className="group cursor-pointer rounded-2xl border-2 border-emerald-500/60 hover:border-emerald-400 bg-gradient-to-b from-emerald-50 via-white to-dv-canvas p-6 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-700/60">
                Sports Academy
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">Archetype C</div>
              <h3 className="text-lg font-bold text-dv-ink group-hover:text-emerald-700 transition-colors mt-0.5">
                Sports Academy Website
              </h3>
              <p className="text-xs text-dv-ink-2 mt-2 leading-relaxed">
                Coaching academy and training school portal. Designed for sports development institutes, junior academies, certified trainers, and batch enrollments.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-dv-line text-xs text-dv-ink-2">
              <div className="text-[10px] font-semibold text-dv-muted uppercase tracking-wider">Included Experience:</div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Coaching programmes catalog & curriculum highlights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Certified coach & trainer profiles with credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Weekly training batches & timetable schedules</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Training facilities, turfs & equipment showcase</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Online trials booking & admission enquiry flow</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 group-hover:underline">Build Academy Portal</span>
            <Button size="sm" variant="primary" className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-emerald-600 hover:bg-emerald-500">
              <span>Select Academy</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

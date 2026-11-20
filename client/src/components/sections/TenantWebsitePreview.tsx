import React, { useState } from 'react';
import { OrganizationData, LayoutPreset, ThemeAccent } from '../../types/preview';
import { 
  Calendar, MapPin, Clock, Users, 
  Flame, Music, Coffee, Trophy, Zap, Activity, Sun, Book, Heart, 
  Globe, Shield, Sparkles, CheckCircle2
} from 'lucide-react';

interface TenantWebsitePreviewProps {
  org: OrganizationData;
  layout: LayoutPreset;
  themeAccent: ThemeAccent;
}

export const TenantWebsitePreview: React.FC<TenantWebsitePreviewProps> = ({
  org,
  layout,
  themeAccent
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Dynamic theme accent tokens based on selection
  const accentStyles = {
    'crimson-gold': {
      heroGlow: 'from-amber-600/20 via-red-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-red-900/40 border-amber-500/30',
      badge: 'bg-red-950/80 text-amber-300 border-amber-500/40',
      highlightBorder: 'border-amber-500/30',
      accentText: 'text-amber-400',
      cardHover: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      headerGradient: 'from-red-500 via-amber-400 to-yellow-200'
    },
    'neon-cyan': {
      heroGlow: 'from-cyan-600/20 via-blue-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/40 border-cyan-400/30',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/40',
      highlightBorder: 'border-cyan-400/30',
      accentText: 'text-cyan-400',
      cardHover: 'hover:border-cyan-400/40 hover:shadow-cyan-500/10',
      tagBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      headerGradient: 'from-cyan-400 via-teal-300 to-blue-300'
    },
    'forest-emerald': {
      heroGlow: 'from-emerald-600/20 via-teal-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 border-emerald-400/30',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/40',
      highlightBorder: 'border-emerald-400/30',
      accentText: 'text-emerald-400',
      cardHover: 'hover:border-emerald-400/40 hover:shadow-emerald-500/10',
      tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      headerGradient: 'from-emerald-400 via-teal-300 to-green-200'
    },
    'royal-violet': {
      heroGlow: 'from-violet-600/20 via-indigo-600/15 to-transparent',
      primaryBtn: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/40 border-violet-400/30',
      badge: 'bg-violet-950/80 text-violet-300 border-violet-400/40',
      highlightBorder: 'border-violet-400/30',
      accentText: 'text-violet-400',
      cardHover: 'hover:border-violet-400/40 hover:shadow-violet-500/10',
      tagBg: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      headerGradient: 'from-violet-400 via-fuchsia-300 to-indigo-200'
    }
  }[themeAccent];

  // Helper icon renderer
  const renderIcon = (type: string) => {
    switch (type) {
      case 'flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'music': return <Music className="w-5 h-5 text-amber-300" />;
      case 'coffee': return <Coffee className="w-5 h-5 text-amber-200" />;
      case 'trophy': return <Trophy className="w-5 h-5 text-cyan-400" />;
      case 'zap': return <Zap className="w-5 h-5 text-blue-400" />;
      case 'activity': return <Activity className="w-5 h-5 text-teal-400" />;
      case 'sun': return <Sun className="w-5 h-5 text-emerald-400" />;
      case 'book': return <Book className="w-5 h-5 text-teal-300" />;
      case 'heart': return <Heart className="w-5 h-5 text-emerald-300" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const filteredSchedule = activeCategory === 'all' 
    ? org.scheduleItems 
    : org.scheduleItems.filter(item => item.category.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <div className="w-full rounded-2xl border border-gray-700/60 bg-[#070B13] shadow-2xl overflow-hidden transition-all duration-300">
      {/* Realistic Simulated Browser Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1422] border-b border-gray-800 text-xs text-gray-400 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          <span className="ml-2 font-mono text-[11px] text-gray-400 hidden sm:inline-flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Isolated Tenant Website</span>
          </span>
        </div>

        {/* Browser URL Bar */}
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-lg border border-gray-700/50 max-w-md w-full justify-center">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-gray-300 text-[11px] truncate">
            https://{org.simulatedDomain}
          </span>
          <span className="ml-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
            SSL Active
          </span>
        </div>

        <div className="text-[11px] text-gray-400 hidden md:block">
          Preset: <span className="text-gray-200 capitalize font-medium">{layout}</span>
        </div>
      </div>

      {/* Simulated Client Website Canvas */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#090D17] text-gray-100 min-h-[620px] max-h-[820px] overflow-y-auto space-y-10 custom-scrollbar">
        {/* Tenant Header & Nav */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-md border ${accentStyles.highlightBorder} bg-gradient-to-br from-white/10 to-white/5`}>
              {org.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">{org.name}</h3>
              <p className="text-[11px] text-gray-400 hidden sm:block">{org.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${accentStyles.badge}`}>
              {org.categoryBadge}
            </span>
          </div>
        </div>

        {/* HERO SECTION - Adapts to Layout Preset */}
        {layout === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            <div className="lg:col-span-7 space-y-5">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${accentStyles.badge}`}>
                Official Organization Portal
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {org.heroHeadline.split(' ').map((word, i) => i === 1 || i === 2 ? (
                  <span key={i} className={`bg-gradient-to-r ${accentStyles.headerGradient} bg-clip-text text-transparent`}>
                    {' '}{word}{' '}
                  </span>
                ) : word + ' ')}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                {org.heroDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${accentStyles.primaryBtn}`}>
                  View Schedule & Events
                </button>
                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-colors">
                  Contact Committee
                </button>
              </div>
            </div>

            {/* Split Highlight Box with Metrics */}
            <div className="lg:col-span-5">
              <div className={`p-5 rounded-xl border ${accentStyles.highlightBorder} bg-white/[0.03] backdrop-blur-md relative overflow-hidden space-y-4`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${accentStyles.heroGlow} rounded-bl-full pointer-events-none`} />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">At A Glance</h4>
                <div className="grid grid-cols-2 gap-3">
                  {org.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <div className={`text-xl font-bold ${accentStyles.accentText}`}>{m.value}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-300 border-t border-white/5 pt-3 leading-normal">
                  {org.aboutText}
                </p>
              </div>
            </div>
          </div>
        )}

        {layout === 'grid' && (
          <div className="space-y-6 text-center pt-2">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${accentStyles.badge}`}>
                Community Portal & Dashboard
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {org.heroHeadline}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {org.heroDescription}
              </p>
            </div>
            
            {/* Grid Metrics Highlight */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {org.metrics.map((m, idx) => (
                <div key={idx} className={`p-4 rounded-xl border border-white/10 bg-white/[0.03] text-center ${accentStyles.cardHover} transition-all`}>
                  <div className={`text-2xl font-bold ${accentStyles.accentText}`}>{m.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {layout === 'editorial' && (
          <div className="space-y-6 pt-2">
            <div className={`p-6 sm:p-8 rounded-2xl border ${accentStyles.highlightBorder} bg-gradient-to-br from-white/[0.04] via-black/40 to-transparent relative overflow-hidden`}>
              <div className="max-w-2xl space-y-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${accentStyles.badge}`}>
                  Heritage Gazette & Community Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {org.heroHeadline}
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {org.aboutText}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${accentStyles.primaryBtn}`}>
                    Explore Full Schedule
                  </button>
                  <span className="text-xs text-gray-400">Established Community Legacy</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE / FIXTURES SECTION */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${accentStyles.accentText}`} />
                {org.scheduleTitle}
              </h3>
              <p className="text-xs text-gray-400">Live events updated by authorized committee administrators</p>
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${activeCategory === 'all' ? 'bg-white/20 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
              >
                All
              </button>
              {Array.from(new Set(org.scheduleItems.map(i => i.category))).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-white/20 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSchedule.map((item, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-2.5 ${accentStyles.cardHover}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">{item.title}</h4>
                  {item.tag && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${accentStyles.tagBg}`}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span>{item.date} • {item.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{item.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LEADERSHIP / COMMITTEE SECTION */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className={`w-4 h-4 ${accentStyles.accentText}`} />
                {org.leadershipTitle}
              </h3>
              <p className="text-xs text-gray-400">Key office bearers, advisors, and coaching faculty</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {org.leadership.map((member, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border border-white/5 bg-white/[0.02] ${accentStyles.cardHover} transition-all space-y-1.5`}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-gray-300">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">{member.name}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${accentStyles.accentText}`}>{member.role}</div>
                  {member.department && (
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{member.department}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MEDIA / HIGHLIGHTS SECTION */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {org.galleryTitle}
            </h3>
            <p className="text-xs text-gray-400">Media ingested from authorized organization repositories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {org.galleryImages.map((img, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                  {renderIcon(img.iconType)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{img.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{img.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Footer Notice */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
          <p>© 2026 {org.name}. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Tenant Architecture: Isolated Data Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

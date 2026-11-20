import React from 'react';
import { Container } from '../layout/Container';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  HeartHandshake, 
  Camera, 
  Share2, 
  PhoneCall, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';

interface MockupProps {
  onInteract?: () => void;
}

export const SinglePreviewMockup: React.FC<MockupProps> = () => {
  return (
    <section className="py-24 bg-digiverse-bg relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-digiverse-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="default" className="mb-4 py-1.5 px-4 text-xs tracking-wider border-amber-500/30 text-amber-300 bg-amber-500/5">
            <Sparkles className="w-3.5 h-3.5 mr-2 inline text-amber-400" />
            HIGH-FIDELITY ARCHETYPE PREVIEW
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            See the Architectural Difference: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
              Cultural & Heritage Archetype
            </span>
          </h2>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Experience our simulated client website engine in action. This high-density preview showcases responsive typography, event schedules, community leadership, and bilingual heritage design.
          </p>
        </div>

        {/* Master Showcase Browser Frame */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-gray-700/60 bg-digiverse-card shadow-2xl shadow-digiverse-accent/10 overflow-hidden transition-all duration-300 hover:border-digiverse-accent/40">
            {/* Browser Navigation Chrome */}
            <div className="bg-[#0e1422] border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              
              {/* Simulated Omnibox Address Bar */}
              <div className="flex-1 max-w-xl mx-auto flex items-center justify-center gap-2 bg-black/40 border border-gray-700/50 rounded-lg py-1 px-4 text-xs font-mono text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">https://sparsh-cultural.digiverse.site</span>
                <span className="text-[10px] text-emerald-400/90 font-sans uppercase font-bold tracking-wider bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 ml-2 shrink-0 hidden sm:inline-block">
                  LIVE SSL
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-gray-400 text-xs">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-gray-300 font-sans">
                  <Layers className="w-3 h-3 text-amber-400" />
                  Cultural V2 Engine
                </span>
              </div>
            </div>

            {/* Inner Simulated Website Container */}
            <div className="bg-[#0b0f19] text-gray-100 p-6 sm:p-10 font-sans space-y-12 select-none">
              
              {/* Simulated Client Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800/80 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-600/20 text-white font-bold text-lg">
                    স্প
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white tracking-wide">
                      Sparsh Cultural Society
                    </h3>
                    <p className="text-xs text-amber-400 font-medium font-bengali">
                      স্পর্শ কালচারাল সোসাইটি ও শারদোৎসব
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white transition">Home</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">Puja Schedule</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white transition">Committee</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white transition">Gallery</span>
                  <button className="text-xs px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold shadow-md hover:brightness-110 transition flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Donate
                  </button>
                </div>
              </div>

              {/* Simulated Hero Section */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-950/40 via-red-950/20 to-black/60 border border-amber-500/20 p-8 sm:p-12">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    52nd Annual Grand Celebration
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Sharodotsav 2026: <br />
                    <span className="text-amber-400">Tradition Meets Heritage</span>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Celebrating half a century of devotion, cultural unity, and social philanthropy in South Kolkata. Join us for 5 days of immersive rituals, music, and community banquets.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <div className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                      View Ritual Schedule
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium text-xs border border-white/10 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-gray-400" />
                      Browse 2025 Archive
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated Structured Feature: Live Event Schedule Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      Official Event Timetable
                    </h4>
                    <p className="text-xs text-gray-400">Verified by executive samiti committee</p>
                  </div>
                  <Badge variant="default" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]">
                    <Clock className="w-3 h-3 mr-1 inline" /> Real-Time Sync
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      day: 'Maha Shasthi',
                      date: 'Oct 17, 2026',
                      event: 'Bodhan & Amontran',
                      time: '07:30 AM - 11:30 AM',
                      location: 'Central Pandal Hall'
                    },
                    {
                      day: 'Maha Saptami',
                      date: 'Oct 18, 2026',
                      event: 'Nabapatrika Pravesh',
                      time: '06:15 AM - 09:45 AM',
                      location: 'Ganga Ghat & Hall'
                    },
                    {
                      day: 'Maha Ashtami',
                      date: 'Oct 19, 2026',
                      event: 'Sandhi Puja & Bhog',
                      time: '04:45 PM - 07:15 PM',
                      location: 'Main Sanctorum'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#141b2d] border border-gray-800 hover:border-amber-500/30 transition-all space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-400 uppercase tracking-wider">{item.day}</span>
                        <span className="text-gray-400">{item.date}</span>
                      </div>
                      <div className="text-sm font-semibold text-white">{item.event}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {item.time}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {item.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Committee & Community Transparency */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-digiverse-accent" />
                    Managing Committee & Oversight
                  </h4>
                  <span className="text-xs text-gray-400">Term 2025-2027</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'Dr. Subhash Bose', role: 'President', dept: 'Executive Council' },
                    { name: 'Aparna Sen Gupta', role: 'General Secretary', dept: 'Operations & Cultural' },
                    { name: 'Rajeev Mukherjee', role: 'Treasurer', dept: 'Financial Transparency' },
                    { name: 'Debashis Roy', role: 'Convener', dept: 'Security & Logistics' }
                  ].map((member, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#111726] border border-gray-800/80 space-y-1">
                      <div className="w-8 h-8 rounded-full bg-digiverse-accent/20 border border-digiverse-accent/40 flex items-center justify-center text-xs font-bold text-digiverse-accent mb-2">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-xs font-bold text-white truncate">{member.name}</div>
                      <div className="text-[11px] text-amber-400">{member.role}</div>
                      <div className="text-[10px] text-gray-500 truncate">{member.dept}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Footer with Real Digiverse Infrastructure Notes */}
              <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span>Registered Non-Profit NGO: WB-ACT-1961-4409</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                    <PhoneCall className="w-3.5 h-3.5" /> +91 98300 00000
                  </span>
                  <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" /> Social Hub
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Feature Highlights Grid Below Mockup */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 bg-digiverse-card/50 border-gray-800/80">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Authentic Thematic Styling</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Deep vermilion tones, sacred golden accents, and traditional Bengali typography honoring cultural legacy without generic template artifacts.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-digiverse-card/50 border-gray-800/80">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-digiverse-accent/10 border border-digiverse-accent/20 text-digiverse-accent shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Structured Micro-Data</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Time-critical schedules, tithi details, ritual locations, and executive committee roles are generated with strict schema validation.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-digiverse-card/50 border-gray-800/80">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Full Tenant Isolation</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every preview operates within its designated tenant perimeter with isolated DNS simulation, SSL emulation, and preview token control.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </Container>
    </section>
  );
};

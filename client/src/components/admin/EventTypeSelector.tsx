import React from 'react';
import { Button } from '../ui/dv/Button';
import { Badge } from '../ui/dv/Badge';
import {
  Mic,
  Music2,
  Briefcase,
  Palette,
  Heart,
  Trophy,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { EventCategory } from '../../types/event';
import { getEventTemplatesByCategory } from '../../templates/event/registry';

export type EventCategoryChoice = EventCategory;

interface EventTypeSelectorProps {
  onSelectCategory: (category: EventCategoryChoice) => void;
  onBack: () => void;
}

interface CategoryCardDef {
  id: EventCategoryChoice;
  title: string;
  subtitle: string;
  badge: string;
  reference: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  accentText: string;
  description: string;
  features: string[];
  pages: string[];
  ctaLabel: string;
}

const EVENT_CATEGORIES: CategoryCardDef[] = [
  {
    id: 'conference_seminar',
    title: 'Conference & Seminar',
    subtitle: 'Tech summits, academic symposiums & professional conferences',
    badge: 'Tech-conference style',
    reference: 'Web Summit (https://www.websummit.com/) & Relate Conference',
    icon: Mic,
    gradient: 'from-cyan-50 via-blue-50 to-dv-canvas',
    borderColor: 'border-cyan-500/80 hover:border-cyan-400',
    accentText: 'text-cyan-700',
    description: 'High-contrast modern tech aesthetic with speaker grids, multi-track session timelines, tiered pass pricing tables, and corporate partner showcases.',
    features: [
      'Keynote & speaker profiles with session tags',
      'Multi-track timeline filterable by Day, Track & Stage',
      'Tiered ticket pricing (Early Bird, VIP, Student Pass)',
      'Venue transit directions & partner logos'
    ],
    pages: ['/', '/speakers', '/schedule', '/tickets', '/venue', '/sponsors', '/faq', '/contact'],
    ctaLabel: 'Book Passes'
  },
  {
    id: 'festival_concert',
    title: 'Festival & Concert',
    subtitle: 'Music festivals, live concerts, dance & cultural celebrations',
    badge: 'Music-festival style',
    reference: 'Outside Festival (https://festival.outsideonline.com/) & Summer Dance',
    icon: Music2,
    gradient: 'from-orange-50 via-purple-50 to-dv-canvas',
    borderColor: 'border-orange-500/80 hover:border-orange-400',
    accentText: 'text-orange-700',
    description: 'Immersive full-screen festival hero with live JavaScript opening countdown, festival lineup poster, stage-by-stage timetables, passes, and camping guides.',
    features: [
      'Live opening countdown timer & headliner highlights',
      'Festival poster artist lineup with headliner tags',
      'Stage-wise schedules (Main Stage, Dance Tent, Acoustic)',
      'Multi-tier passes (General, VIP, Weekend Camping)'
    ],
    pages: ['/', '/lineup', '/stages', '/tickets', '/venue', '/gallery', '/partners', '/contact'],
    ctaLabel: 'Get Passes'
  },
  {
    id: 'corporate_business',
    title: 'Corporate & Business Events',
    subtitle: 'Executive summits, investor meetings & company celebrations',
    badge: 'Corporate-summit style',
    reference: 'Dreamforce (https://www.dreamforce.com/) & Credit Summer Event',
    icon: Briefcase,
    gradient: 'from-blue-50 via-white to-dv-canvas',
    borderColor: 'border-blue-500/80 hover:border-blue-400',
    accentText: 'text-blue-700',
    description: 'Premium corporate visual identity with executive keynote spotlight, multi-day business breakout sessions, VIP networking lounges, and delegate passes.',
    features: [
      'C-suite executive keynotes & company leadership',
      'Multi-day agenda & strategic business tracks',
      'Networking lounges, workshops & roundtables',
      'Tiered corporate sponsor recognition (Title, Platinum)'
    ],
    pages: ['/', '/agenda', '/speakers', '/networking', '/registration', '/partners', '/venue', '/contact'],
    ctaLabel: 'Register Now'
  },
  {
    id: 'exhibition_trade',
    title: 'Exhibition & Trade Fair',
    subtitle: 'Art exhibitions, trade expos, technology expos & fairs',
    badge: 'Gallery & exhibition style',
    reference: 'The Other Art Fair (https://www.theotherartfair.com/) & Art Basel',
    icon: Palette,
    gradient: 'from-white via-white to-dv-canvas',
    borderColor: 'border-stone-400/80 hover:border-stone-300',
    accentText: 'text-dv-ink-2',
    description: 'Curatorial gallery-grade layout with searchable exhibitor directory, booth allocations, interactive exhibition hall floor plans, and online viewing rooms.',
    features: [
      'Exhibitor & artist directory with sector filters',
      'Hall sectors, booth allocations & floor plan map',
      'Featured artwork & product viewing room cards',
      'Timed visitor entry passes & exhibitor inquiries'
    ],
    pages: ['/', '/exhibitors', '/floorplan', '/schedule', '/tickets', '/gallery', '/sponsors', '/contact'],
    ctaLabel: 'Explore Directory'
  },
  {
    id: 'wedding_private',
    title: 'Wedding & Private Events',
    subtitle: 'Weddings, engagements, anniversaries & private galas',
    badge: 'Wedding & celebration style',
    reference: 'Zola (https://www.zola.com/) & Wix Events',
    icon: Heart,
    gradient: 'from-rose-50 via-amber-50 to-dv-canvas',
    borderColor: 'border-rose-500/80 hover:border-rose-400',
    accentText: 'text-rose-700',
    description: 'Romantic and emotionally engaging visual storytelling with love story timeline milestones, ceremony itineraries, interactive guest RSVP, and hotel room blocks.',
    features: [
      'Couple introduction, wedding countdown & love story',
      'Ceremony itinerary (Welcome Drinks, Vows, Reception)',
      'Interactive RSVP with meal choice & plus-ones',
      'Accommodations hotel room blocks & registry links'
    ],
    pages: ['/', '/story', '/schedule', '/rsvp', '/travel', '/gallery', '/contact'],
    ctaLabel: 'RSVP Now'
  },
  {
    id: 'award_ceremony',
    title: 'Award Ceremony & Special Events',
    subtitle: 'Industry awards, film/music honours, gala nights & banquets',
    badge: 'Awards-night style',
    reference: 'Cannes Lions (https://www.canneslions.com/) & The Webby Awards',
    icon: Trophy,
    gradient: 'from-amber-50 via-yellow-50 to-dv-canvas',
    borderColor: 'border-amber-500/80 hover:border-amber-400',
    accentText: 'text-amber-700',
    description: 'Dramatic black-tie red carpet aesthetic with trophy categories, nominee showcases, winner announcement gold badges, jury panels, and table banquet bookings.',
    features: [
      'Dramatic red-carpet hero & edition trophy badges',
      'Award categories grid with nominee shortlists',
      'Winner announcements with gold accolade emblems',
      'Distinguished jury showcase & gala table bookings'
    ],
    pages: ['/', '/categories', '/nominees', '/jury', '/ceremony', '/tickets', '/gallery', '/contact'],
    ctaLabel: 'Book Gala Table'
  },
  {
    id: 'launch_reveal',
    title: 'Launch & Product Reveal',
    subtitle: 'Hardware reveals, brand launches, digital keynotes & reveals',
    badge: 'Product-launch style',
    reference: 'Apple Events (https://www.apple.com/apple-events/) & Apple iPhone',
    icon: Rocket,
    gradient: 'from-white via-blue-50 to-dv-canvas',
    borderColor: 'border-blue-500/80 hover:border-blue-400',
    accentText: 'text-blue-700',
    description: 'Precision Cupertino-inspired product reveal with cinematic teaser hero, keynote broadcast countdown, bento-box feature specifications, and pre-order CTAs.',
    features: [
      'Cinematic product silhouette & keynote live countdown',
      'Apple-style bento box cards for key tech specs',
      '360-degree product angle gallery & video reveal',
      'Early-access reservation & media press kit downloads'
    ],
    pages: ['/', '/product', '/specs', '/schedule', '/gallery', '/preorder', '/contact'],
    ctaLabel: 'Pre-Order Now'
  }
];

export const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  onSelectCategory,
  onBack
}) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dv-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-800/60">
              Digiverse Event Engine
            </span>
            <Badge variant="indigo">Step 2 of 2: Select Event Category</Badge>
          </div>
          <h2 className="text-2xl font-black text-dv-ink tracking-tight">
            Select Event Website Category
          </h2>
          <p className="text-xs text-dv-muted mt-1 max-w-2xl leading-relaxed">
            Choose the kind of event. Each one comes with its own pages, design and fields — schedules, speakers or line-ups, tickets and more.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-dv-muted hover:text-dv-ink self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Engine Selection</span>
        </Button>
      </div>

      {/* 7 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EVENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = getEventTemplatesByCategory(cat.id).length;
          // An event type with no qualifying design yet cannot be started: nothing could be generated from it.
          const available = count > 0;
          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={available ? 0 : -1}
              aria-disabled={!available}
              data-category={cat.id}
              data-available={available}
              onClick={() => { if (available) onSelectCategory(cat.id); }}
              onKeyDown={(e) => { if (available && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectCategory(cat.id); } }}
              className={`group relative rounded-2xl border-2 ${cat.borderColor} bg-gradient-to-br ${cat.gradient} p-6 transition-all duration-200 flex flex-col justify-between ${available ? 'cursor-pointer hover:shadow-xl hover:shadow-purple-500/10' : 'cursor-not-allowed opacity-60 grayscale'}`}
            >
              <div className="space-y-4">
                {/* Header Icon + Reference Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-xl bg-dv-ink/[0.03] backdrop-blur-md flex items-center justify-center text-dv-ink border border-dv-line shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-700/60 shadow-sm text-right">
                    <Sparkles className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                    <span>{cat.badge}</span>
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className={`text-lg font-bold text-dv-ink group-hover:${cat.accentText} transition-colors flex items-center gap-2`}>
                    {cat.title}
                  </h3>
                  <p className="text-xs text-dv-ink-2 mt-1 line-clamp-2 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-[11px] text-dv-muted leading-relaxed border-t border-dv-line pt-2">
                  {cat.description}
                </p>

                {/* Key Features */}
                <div className="space-y-1.5 pt-2 border-t border-dv-line">
                  <div className="text-[10px] font-semibold text-dv-muted uppercase tracking-wider">
                    Core Capabilities:
                  </div>
                  <ul className="text-xs text-dv-ink-2 space-y-1">
                    {cat.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${cat.accentText} shrink-0 mt-0.5`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-dv-line flex items-center justify-between">
                <span className={`text-xs font-semibold ${available ? `${cat.accentText} group-hover:underline` : 'text-dv-muted'}`} data-testid="template-count">
                  {available ? `${count} ${count === 1 ? 'template' : 'templates'} available` : 'No qualifying template available yet'}
                </span>
                {available ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="cursor-pointer group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs"
                  >
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

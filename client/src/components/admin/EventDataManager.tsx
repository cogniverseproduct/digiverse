import React, { useState } from 'react';
import { Button } from '../ui/dv/Button';
import {
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Code2,
  X
} from 'lucide-react';
import type { ClientProject } from '../../types/admin';
import type {
  EventCategory,
  EventWebsiteData,
  EventPerson,
  EventSession,
  EventTicketTier,
  EventTypographyStyle
} from '../../types/event';
import { api } from '../../lib/api';

interface EventDataManagerProps {
  project: ClientProject;
  onProjectUpdated: (project: ClientProject) => void;
  onClose?: () => void;
}

export type EventTabKey =
  | 'profile'
  | 'branding'
  | 'speakers'
  | 'schedule'
  | 'tracks'
  | 'tickets'
  | 'exhibitors'
  | 'awards'
  | 'weddingStory'
  | 'productLaunch'
  | 'sponsors'
  | 'venue'
  | 'faqs'
  | 'gallery'
  | 'rsvp'
  | 'json';

/**
 * The starting point when a project has no event data yet. Only what the client already gave is used; everything else is
 * left empty (nothing is invented), and the matching sections stay hidden on the website until it is filled in.
 */
function createDefaultEventData(project: ClientProject): EventWebsiteData {
  const req = project.requirements;
  const category: EventCategory = req.eventCategory || 'conference_seminar';

  return {
    schemaVersion: '1.0',
    category,
    profile: {
      name: req.organizationName || '',
      tagline: req.tagline || '',
      description: req.aboutText || '',
      startDate: '',
      time: '',
      timezone: '',
      venueName: '',
      venueAddress: req.address || '',
      city: '',
      country: '',
      organizerName: req.contactPerson || '',
      organizerEmail: req.contactEmail || '',
      organizerPhone: req.contactPhone || undefined,
      socialLinks: req.socialLinks || {}
    },
    branding: {
      primaryColor: req.primaryColor || '',
      accentColor: req.accentColor || '',
      typographyStyle: (req.typographyStyle as EventTypographyStyle) || 'modern'
    },
    speakers: [],
    tracks: [],
    sessions: [],
    tickets: [],
    exhibitors: [],
    awardCategories: [],
    sponsors: [],
    venue: { venueName: '', address: req.address || '', city: '', country: '' },
    faqs: [],
    gallery: [],
    dataAvailability: {
      speakers: false,
      schedule: false,
      tickets: false,
      exhibitors: false,
      awards: false,
      weddingStory: false,
      productLaunch: false,
      sponsors: false,
      venue: false,
      faqs: false,
      gallery: false
    }
  };
}

export const EventDataManager: React.FC<EventDataManagerProps> = ({
  project,
  onProjectUpdated,
  onClose
}) => {
  const [data, setData] = useState<EventWebsiteData>(() => {
    return (
      project.requirements.eventData ||
      project.generatedWebsite?.eventData ||
      createDefaultEventData(project)
    );
  });

  const [activeTab, setActiveTab] = useState<EventTabKey>('profile');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const category = data.category;

  const handleSave = async (dataToSave = data) => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await api.saveEventData(project.id, dataToSave);
      onProjectUpdated(res.project);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save event data.');
    } finally {
      setSaving(false);
    }
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      setJsonError(null);
      handleSave(parsed);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/[0.04] backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dv-line bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-dv-ink tracking-tight">Event Studio Data Manager</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-50 text-purple-700 border border-purple-800">
                  {category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-dv-muted">
                Bidirectional visual CRUD and raw JSON editor for {project.requirements.organizationName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced with SQLite</span>
              </span>
            )}
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>{saving ? 'Saving...' : 'Save & Sync'}</span>
            </Button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-dv-muted hover:text-dv-ink hover:bg-dv-canvas rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-dv-line bg-white overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'profile' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('speakers')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'speakers' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Speakers ({data.speakers.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'schedule' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Schedule ({data.sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'tickets' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Tickets ({data.tickets.length})
          </button>
          {category === 'exhibition_trade' && (
            <button
              onClick={() => setActiveTab('exhibitors')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'exhibitors' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
              }`}
            >
              Exhibitors ({data.exhibitors.length})
            </button>
          )}
          {category === 'award_ceremony' && (
            <button
              onClick={() => setActiveTab('awards')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'awards' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
              }`}
            >
              Awards ({data.awardCategories.length})
            </button>
          )}
          {category === 'wedding_private' && (
            <>
              <button
                onClick={() => setActiveTab('weddingStory')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'weddingStory' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
                }`}
              >
                Wedding Story
              </button>
              <button
                onClick={() => setActiveTab('rsvp')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'rsvp' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
                }`}
              >
                RSVPs ({data.rsvpSubmissions?.length || 0})
              </button>
            </>
          )}
          {category === 'launch_reveal' && (
            <button
              onClick={() => setActiveTab('productLaunch')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'productLaunch' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
              }`}
            >
              Product Reveal
            </button>
          )}
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'sponsors' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Sponsors ({data.sponsors.length})
          </button>
          <button
            onClick={() => setActiveTab('venue')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'venue' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            Venue & Transit
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'faqs' ? 'bg-purple-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            FAQs ({data.faqs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('json');
              setJsonText(JSON.stringify(data, null, 2));
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-dv-muted hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-800 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={data.profile.name}
                    onChange={(e) =>
                      setData({ ...data, profile: { ...data.profile, name: e.target.value } })
                    }
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Edition Title</label>
                  <input
                    type="text"
                    value={data.profile.edition || ''}
                    onChange={(e) =>
                      setData({ ...data, profile: { ...data.profile, edition: e.target.value } })
                    }
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Tagline</label>
                <input
                  type="text"
                  value={data.profile.tagline}
                  onChange={(e) =>
                    setData({ ...data, profile: { ...data.profile, tagline: e.target.value } })
                  }
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={data.profile.description}
                  onChange={(e) =>
                    setData({ ...data, profile: { ...data.profile, description: e.target.value } })
                  }
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={data.profile.startDate}
                    onChange={(e) =>
                      setData({ ...data, profile: { ...data.profile, startDate: e.target.value } })
                    }
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">End Date</label>
                  <input
                    type="date"
                    value={data.profile.endDate || ''}
                    onChange={(e) =>
                      setData({ ...data, profile: { ...data.profile, endDate: e.target.value } })
                    }
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={data.profile.timezone}
                    onChange={(e) =>
                      setData({ ...data, profile: { ...data.profile, timezone: e.target.value } })
                    }
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SPEAKERS TAB */}
          {activeTab === 'speakers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dv-muted">Manage keynote speakers, artists, and featured luminaries.</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newPerson: EventPerson = {
                      id: `spk_${Date.now()}`,
                      name: 'New Speaker',
                      role: 'speaker',
                      title: 'Executive Leader',
                      organization: 'Organization Name',
                      bio: 'Distinguished speaker profile.',
                      isFeatured: false,
                      displayOrder: data.speakers.length + 1
                    };
                    setData({ ...data, speakers: [...data.speakers, newPerson] });
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Speaker</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.speakers.map((spk, idx) => (
                  <div key={spk.id} className="p-4 bg-white border border-dv-line rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={spk.name}
                        onChange={(e) => {
                          const updated = [...data.speakers];
                          updated[idx].name = e.target.value;
                          setData({ ...data, speakers: updated });
                        }}
                        className="bg-transparent font-bold text-dv-ink text-sm focus:outline-none border-b border-transparent focus:border-purple-500"
                      />
                      <button
                        onClick={() => {
                          setData({ ...data, speakers: data.speakers.filter((_, i) => i !== idx) });
                        }}
                        className="text-dv-muted hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-dv-muted">Designation</label>
                        <input
                          type="text"
                          value={spk.title || ''}
                          onChange={(e) => {
                            const updated = [...data.speakers];
                            updated[idx].title = e.target.value;
                            setData({ ...data, speakers: updated });
                          }}
                          className="w-full bg-white border border-dv-line rounded px-2 py-1 text-dv-ink text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-dv-muted">Organization</label>
                        <input
                          type="text"
                          value={spk.organization || ''}
                          onChange={(e) => {
                            const updated = [...data.speakers];
                            updated[idx].organization = e.target.value;
                            setData({ ...data, speakers: updated });
                          }}
                          className="w-full bg-white border border-dv-line rounded px-2 py-1 text-dv-ink text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-dv-muted">Biography</label>
                      <textarea
                        rows={2}
                        value={spk.bio}
                        onChange={(e) => {
                          const updated = [...data.speakers];
                          updated[idx].bio = e.target.value;
                          setData({ ...data, speakers: updated });
                        }}
                        className="w-full bg-white border border-dv-line rounded px-2 py-1 text-dv-ink text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dv-muted">Manage multi-track agenda sessions and keynotes.</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newSess: EventSession = {
                      id: `sess_${Date.now()}`,
                      title: 'New Session',
                      description: 'Session overview and key discussion points.',
                      day: 'Day 1',
                      date: data.profile.startDate,
                      startTime: '10:00 AM',
                      endTime: '11:00 AM',
                      stage: 'Stage A',
                      speakerIds: [],
                      isKeynote: false
                    };
                    setData({ ...data, sessions: [...data.sessions, newSess] });
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Session</span>
                </Button>
              </div>

              <div className="space-y-3">
                {data.sessions.map((sess, idx) => (
                  <div key={sess.id} className="p-3 bg-white border border-dv-line rounded-lg flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sess.day}
                          onChange={(e) => {
                            const updated = [...data.sessions];
                            updated[idx].day = e.target.value;
                            setData({ ...data, sessions: updated });
                          }}
                          className="bg-transparent font-mono text-purple-700 font-bold text-xs w-20 border-b border-transparent focus:border-purple-500"
                        />
                        <span className="text-dv-muted">•</span>
                        <input
                          type="text"
                          value={`${sess.startTime} - ${sess.endTime}`}
                          onChange={(e) => {
                            const [start, end] = e.target.value.split('-');
                            const updated = [...data.sessions];
                            if (start) updated[idx].startTime = start.trim();
                            if (end) updated[idx].endTime = end.trim();
                            setData({ ...data, sessions: updated });
                          }}
                          className="bg-transparent text-dv-ink-2 text-xs w-36 border-b border-transparent focus:border-purple-500"
                        />
                        <input
                          type="text"
                          value={sess.stage || ''}
                          onChange={(e) => {
                            const updated = [...data.sessions];
                            updated[idx].stage = e.target.value;
                            setData({ ...data, sessions: updated });
                          }}
                          placeholder="Stage"
                          className="bg-purple-50 border border-purple-800 text-purple-700 text-[10px] px-2 py-0.5 rounded"
                        />
                      </div>
                      <input
                        type="text"
                        value={sess.title}
                        onChange={(e) => {
                          const updated = [...data.sessions];
                          updated[idx].title = e.target.value;
                          setData({ ...data, sessions: updated });
                        }}
                        className="bg-transparent font-bold text-dv-ink text-sm w-full border-b border-transparent focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setData({ ...data, sessions: data.sessions.filter((_, i) => i !== idx) });
                      }}
                      className="text-dv-muted hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dv-muted">Manage pass tiers and registration fees.</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newTicket: EventTicketTier = {
                      id: `tkt_${Date.now()}`,
                      name: 'General Admission',
                      price: 4999,
                      currency: 'INR',
                      description: 'Full day access pass.',
                      features: ['Keynote Entry', 'Exhibition Access'],
                      isAvailable: true
                    };
                    setData({ ...data, tickets: [...data.tickets, newTicket] });
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Ticket Tier</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.tickets.map((t, idx) => (
                  <div key={t.id} className="p-4 bg-white border border-dv-line rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const updated = [...data.tickets];
                          updated[idx].name = e.target.value;
                          setData({ ...data, tickets: updated });
                        }}
                        className="bg-transparent font-bold text-dv-ink text-sm focus:outline-none border-b border-transparent focus:border-purple-500"
                      />
                      <button
                        onClick={() => {
                          setData({ ...data, tickets: data.tickets.filter((_, i) => i !== idx) });
                        }}
                        className="text-dv-muted hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={t.currency}
                        onChange={(e) => {
                          const updated = [...data.tickets];
                          updated[idx].currency = e.target.value;
                          setData({ ...data, tickets: updated });
                        }}
                        className="w-16 bg-white border border-dv-line rounded px-2 py-1 text-xs text-purple-700 font-mono"
                      />
                      <input
                        type="text"
                        value={String(t.price)}
                        onChange={(e) => {
                          const updated = [...data.tickets];
                          updated[idx].price = e.target.value;
                          setData({ ...data, tickets: updated });
                        }}
                        className="flex-1 bg-white border border-dv-line rounded px-2 py-1 text-xs text-dv-ink font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-dv-muted">Description</label>
                      <input
                        type="text"
                        value={t.description}
                        onChange={(e) => {
                          const updated = [...data.tickets];
                          updated[idx].description = e.target.value;
                          setData({ ...data, tickets: updated });
                        }}
                        className="w-full bg-white border border-dv-line rounded px-2 py-1 text-xs text-dv-ink-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WEDDING STORY / RSVP TAB */}
          {activeTab === 'weddingStory' && data.weddingStory && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Partner 1</label>
                  <input
                    type="text"
                    value={data.weddingStory.partnerOne}
                    onChange={(e) => {
                      setData({
                        ...data,
                        weddingStory: {
                          ...data.weddingStory!,
                          partnerOne: e.target.value,
                          coupleNames: `${e.target.value} & ${data.weddingStory!.partnerTwo}`
                        }
                      });
                    }}
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Partner 2</label>
                  <input
                    type="text"
                    value={data.weddingStory.partnerTwo}
                    onChange={(e) => {
                      setData({
                        ...data,
                        weddingStory: {
                          ...data.weddingStory!,
                          partnerTwo: e.target.value,
                          coupleNames: `${data.weddingStory!.partnerOne} & ${e.target.value}`
                        }
                      });
                    }}
                    className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RSVP SUBMISSIONS */}
          {activeTab === 'rsvp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dv-muted">Guest responses submitted via public wedding portal.</span>
                <span className="text-xs text-purple-700 font-bold">
                  {data.rsvpSubmissions?.length || 0} Responses Recorded
                </span>
              </div>
              <div className="space-y-2">
                {(data.rsvpSubmissions || []).map((r) => (
                  <div key={r.id} className="p-3 bg-white border border-dv-line rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-dv-ink">{r.guestName} ({r.guestEmail})</div>
                      <div className="text-dv-muted">Meal: {r.mealPreference} • Plus-Ones: {r.plusOnes} • Dietary: {r.dietaryNotes || 'None'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-800">
                      {r.attending}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCT LAUNCH TAB */}
          {activeTab === 'productLaunch' && data.productLaunch && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Product Name</label>
                <input
                  type="text"
                  value={data.productLaunch.productName}
                  onChange={(e) =>
                    setData({
                      ...data,
                      productLaunch: { ...data.productLaunch!, productName: e.target.value }
                    })
                  }
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dv-ink-2 mb-1">Hero Reveal Headline</label>
                <input
                  type="text"
                  value={data.productLaunch.heroHeadline}
                  onChange={(e) =>
                    setData({
                      ...data,
                      productLaunch: { ...data.productLaunch!, heroHeadline: e.target.value }
                    })
                  }
                  className="w-full bg-white border border-dv-line rounded-lg px-3 py-2 text-sm text-dv-ink"
                />
              </div>
            </div>
          )}

          {/* RAW JSON TAB */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dv-muted">Directly inspect or patch complete EventWebsiteData JSON tree.</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleJsonApply}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500"
                >
                  <span>Apply JSON Changes</span>
                </Button>
              </div>
              {jsonError && (
                <div className="p-3 bg-red-50 border border-red-800 rounded text-xs text-red-700">
                  {jsonError}
                </div>
              )}
              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                }}
                className="w-full bg-white border border-dv-line rounded-xl p-4 font-mono text-xs text-dv-ink focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

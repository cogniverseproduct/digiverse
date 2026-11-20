import React, { useState, useEffect } from 'react';
import { isNgoTemplateIdLite } from '../../templates/ngo/ids';
import { api } from '../../lib/api';
import { TenantWebsiteRenderer } from '../admin/TenantWebsiteRenderer';
import { isSportsTemplateIdLite } from '../../templates/sports/ids';
import { 
  CheckCircle2, AlertCircle, MessageSquare, 
  Monitor, Tablet, Smartphone, Sparkles, Send, X, Star,
  ArrowLeft, RefreshCw
} from 'lucide-react';

interface ClientPreviewPortalProps {
  token: string;
  onExit?: () => void;
}

export const ClientPreviewPortal: React.FC<ClientPreviewPortalProps> = ({ token, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Modals
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Feedback form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorRole, setAuthorRole] = useState('Client Representative');
  const [feedbackType, setFeedbackType] = useState('change_request');
  const [section, setSection] = useState('General');
  const [rating, setRating] = useState<number>(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPublicPreview(token);
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPreview();
    }
  }, [token]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !feedbackMessage.trim()) return;

    try {
      setSubmittingFeedback(true);
      await api.submitPublicFeedback(token, {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        authorRole: authorRole.trim() || undefined,
        feedbackType,
        section,
        rating,
        message: feedbackMessage.trim()
      });

      setFeedbackSuccessMsg('Thank you! Your feedback has been delivered directly to the Digiverse team.');
      setFeedbackMessage('');
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Error submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex flex-col items-center justify-center text-dv-ink px-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <Sparkles className="w-6 h-6 text-amber-600 absolute inset-0 m-auto" />
        </div>
        <h2 className="text-xl font-semibold text-amber-800 tracking-wide">Loading Client Website Preview</h2>
        <p className="text-slate-500 text-sm mt-2">Preparing simulated staging environment...</p>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FFFFFF] border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center text-dv-ink shadow-2xl">
          <div className="w-14 h-14 bg-red-500/[0.1] border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-dv-ink mb-2">Preview Unavailable</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {error || 'The preview link you followed is invalid, has expired, or was revoked by the administrator.'}
          </p>
          <div className="bg-white/60 rounded-xl p-4 text-xs text-slate-500 mb-6 text-left border border-slate-200">
            <p className="font-medium text-slate-600 mb-1">What should I do?</p>
            <p>Please reach out to your Digiverse account manager or representative to request an updated preview link.</p>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Platform Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const { organizationName, website, requirements, revision } = previewData;
  // Sports library templates preview in a real device-width iframe (see SportsLiveFrame).
  const isSportsLibrary = Boolean(website?.sportsData) && isSportsTemplateIdLite(website?.selectedTemplate?.templateId || requirements?.selectedTemplate?.templateId);
  // Cultural projects always render through a library design (a retired or missing id resolves to a current one), in the same kind of frame.
  const isCulturalLibrary = Boolean(website?.culturalData || requirements?.culturalData) && (requirements?.category === 'cultural' || requirements?.category === 'puja_committee');
  // Social & NGO library templates render in a sandboxed frame at the chosen device width.
  const isNgoLibrary = isNgoTemplateIdLite(website?.selectedTemplate?.templateId || requirements?.selectedTemplate?.templateId);
  const isLibraryFrame = isSportsLibrary || isCulturalLibrary || isNgoLibrary;

  return (
    <div className="dv-app min-h-screen bg-dv-canvas text-dv-ink flex flex-col">
      {/* Client Preview Header Bar */}
      <header className="sticky top-0 z-50 bg-[#FAFBFD]/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Organization Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wide text-dv-ink">DIGIVERSE</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/[0.1] text-amber-600 border border-amber-500/20">
                    Client Preview
                  </span>
                </div>
                <h1 className="text-xs text-slate-600 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                  {organizationName}
                </h1>
              </div>
            </div>

            {/* Version Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{revision?.variationLabel || 'Design V1'}</span>
            </div>
          </div>

          {/* Viewport Switcher */}
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewport === 'desktop'
                  ? 'bg-amber-500 text-slate-50 font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewport === 'tablet'
                  ? 'bg-amber-500 text-slate-50 font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewport === 'mobile'
                  ? 'bg-amber-500 text-slate-50 font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Request Changes</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Exit Preview"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Preview Canvas Area */}
      <main className="flex-1 overflow-x-hidden flex justify-center p-3 sm:p-6 bg-[#F2F5FA]">
        <div
          className={`transition-all duration-300 ease-out w-full ${
            isLibraryFrame
              ? 'max-w-none' // library frames set their own device width inside a real iframe
              : viewport === 'desktop'
              ? 'max-w-none'
              : viewport === 'tablet'
              ? 'max-w-[768px] border-4 border-slate-200 rounded-3xl overflow-hidden shadow-2xl my-4'
              : 'max-w-[375px] border-4 border-slate-200 rounded-3xl overflow-hidden shadow-2xl my-4'
          }`}
        >
          <TenantWebsiteRenderer
            previewViewport={isLibraryFrame ? viewport : undefined}
            requirements={requirements}
            website={website}
            inBrowserFrame={false}
          />
        </div>
      </main>

      {/* Sticky Bottom Review Trigger on Mobile */}
      <div className="sm:hidden sticky bottom-0 z-40 bg-[#FAFBFD]/95 border-t border-slate-200 p-3 flex gap-2">
        <button
          onClick={() => setFeedbackModalOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          Feedback
        </button>
      </div>

      {/* Modal 1: Request Changes / Client Feedback */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 backdrop-blur-sm p-4">
          <div className="bg-[#FDFDFE] border border-slate-200/80 rounded-2xl max-w-lg w-full p-6 text-dv-ink shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/[0.15] border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Request Changes or Provide Feedback</h3>
                  <p className="text-xs text-slate-500">Communicate directly with your assigned Digiverse team</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-500 hover:text-dv-ink p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackSuccessMsg ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/[0.2] text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-dv-ink mb-1">Feedback Submitted</h4>
                <p className="text-sm text-slate-600">{feedbackSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Subhasish Roy"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Your Email (optional)</label>
                    <input
                      type="email"
                      placeholder="e.g., s.roy@committee.org"
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Your Role / Designation</label>
                    <input
                      type="text"
                      placeholder="e.g., Secretary / General Member"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Target Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-dv-ink focus:outline-none focus:border-amber-500"
                    >
                      <option value="General">Entire Website</option>
                      <option value="Hero Section">Hero Banner & Headline</option>
                      <option value="About Mission">About & Mission Copy</option>
                      <option value="Events Schedule">Events Schedule</option>
                      <option value="Executive Team">Executive Leadership</option>
                      <option value="Gallery Media">Gallery & Photos</option>
                      <option value="Color Theme">Color Palette & Theme</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Feedback Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'change_request', label: 'Change Request' },
                      { id: 'inquiry', label: 'Question' },
                      { id: 'general', label: 'General Note' }
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setFeedbackType(type.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          feedbackType === type.id
                            ? 'bg-amber-500/[0.2] border-amber-500 text-amber-700'
                            : 'bg-white/60 border-slate-200 text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Design Satisfaction Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-transform hover:scale-110 ${
                          rating >= star ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs text-slate-500 ml-2">
                      {rating === 5 ? '5/5 Excellent' : `${rating}/5`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Detailed Notes or Desired Modifications *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific changes to copy, layout, imagery, or schedule details..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    className="w-full bg-white/80 border border-slate-200 rounded-xl p-3 text-xs text-dv-ink focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback || !authorName.trim() || !feedbackMessage.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-50 text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
                  >
                    {submittingFeedback ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

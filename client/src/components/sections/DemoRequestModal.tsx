import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { PLATFORM_CONFIG } from '../../config/platform';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    organizationType: 'cultural',
    preferredLanguage: 'bilingual',
    requirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard accessibility: Escape closes the dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side Validation
    if (!formData.name.trim() || !formData.organization.trim() || !formData.email.trim()) {
      setErrorMessage('Please fill in your name, organization name, and email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit demo request.');
      }

      setSuccessMessage(data.message || 'Your demo request has been received successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting demo request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      organization: '',
      email: '',
      phone: '',
      organizationType: 'cultural',
      preferredLanguage: 'bilingual',
      requirements: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dv-ink/40 p-4 backdrop-blur-md animate-dv-fade" role="dialog" aria-modal="true" aria-labelledby="dv-demo-title">
      <div className="relative w-full max-w-xl max-h-[90vh] space-y-6 overflow-y-auto rounded-[28px] border border-white bg-white p-6 shadow-[0_40px_100px_-30px_rgba(18,18,42,0.45)] animate-dv-pop sm:p-8">
        {/* Close button */}
        <button
          onClick={handleReset}
          className="absolute right-4 top-4 rounded-xl p-2 text-dv-muted transition-colors hover:bg-dv-iris-50 hover:text-dv-ink cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header (English First) */}
        <div className="space-y-1.5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D9658A] to-[#F58FA7] text-white shadow-[0_12px_28px_-10px_rgba(214,90,126,0.65)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 id="dv-demo-title" className="pt-2 font-display text-2xl font-bold tracking-[-0.03em] text-dv-ink">
            Request a Platform Demo
          </h3>
          <p className="mx-auto max-w-md text-[13px] leading-6 text-dv-muted">
            Experience how DigiVerse creates customized websites for your cultural committee, sports club, or heritage society.
          </p>
        </div>

        {/* Success Confirmation State */}
        {successMessage ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-lg font-bold text-dv-ink">
                Demo Request Submitted!
              </h4>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-dv-muted">
                Our platform operations team will contact you shortly to review your requirements and demonstrate a live sample website.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {[PLATFORM_CONFIG.productEmail, PLATFORM_CONFIG.secondaryEmail].map((address) => (
                <a
                  key={address}
                  href={`mailto:${address}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dv-line bg-white px-4 py-2.5 text-xs font-semibold text-dv-ink transition-colors hover:bg-dv-iris-50"
                >
                  <Mail className="h-3.5 w-3.5 text-dv-iris-600" />
                  <span>{address}</span>
                </a>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-dv-ink px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-dv-ink-2 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Subir Mukherjee"
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Sarvajanik Puja Samiti"
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.org"
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98300 XXXXX"
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Organization Type
                </label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                >
                  <option value="cultural">Puja Committee / Sharadotsav</option>
                  <option value="sports">Sports & Athletic Club</option>
                  <option value="heritage">Cultural & Heritage Society</option>
                  <option value="civic">Civic & Community Association</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-dv-ink-2">
                  Preferred Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
                >
                  <option value="bilingual">Bilingual (English & Bengali)</option>
                  <option value="english">English Only</option>
                  <option value="bengali">Bengali Primary</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dv-ink-2">
                Festival or Website Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Mention specific festival dates, idol themes, or special features..."
                className="w-full rounded-xl border border-dv-line bg-dv-canvas/60 px-3.5 py-2.5 text-sm text-dv-ink placeholder:text-dv-muted/70 transition focus:border-dv-iris-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-dv-iris-500/15"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-dv-ink-2 transition-colors hover:bg-dv-ink/[0.05] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="dv-sheen flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#B8335C] via-[#C94872] to-[#D9658A] px-6 py-3 text-xs font-semibold text-white shadow-[0_12px_28px_-10px_rgba(214,90,126,0.65)] transition-all hover:-translate-y-px disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Submit Demo Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

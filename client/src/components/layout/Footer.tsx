import React from 'react';
import { Container } from './Container';
import { DvLogo } from '../ui/dv/DvLogo';
import { PLATFORM_CONFIG } from '../../config/platform';
import { Mail, ShieldCheck, ArrowUpRight, Globe2, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden border-t border-dv-line bg-white/70 text-dv-ink-2 backdrop-blur">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dv-iris-300 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-dv-iris-100/70 blur-[110px]" />

      <Container>
        <div className="relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-10">
          {/* Brand */}
          <div>
            <a href="/" aria-label="DigiVerse home" className="inline-flex rounded-xl">
              <DvLogo tagline />
            </a>

            <p className="mt-5 max-w-xs text-sm leading-7 text-dv-muted">
              Every organization has a story. DigiVerse helps bring that story to life through beautiful, modern
              digital experiences.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-dv-iris-200 bg-dv-iris-50 px-3 py-1.5 text-[11px] font-semibold text-dv-iris-700">
              <Globe2 className="h-3.5 w-3.5" />
              Your Community. Your Digital Identity.
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.14em] text-dv-ink">Platform</h3>
            <ul className="space-y-3 text-sm">
              {[
                ['Home', '/'],
                ['How It Works', '/how-it-works'],
                ['Features', '/features'],
                ['Website Templates', '/templates'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-dv-muted transition-colors hover:text-dv-iris-700">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Audience */}
          <div>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.14em] text-dv-ink">Who We Serve</h3>
            <ul className="space-y-3 text-sm text-dv-muted">
              <li>Cultural Societies</li>
              <li>Sports Clubs</li>
              <li>Educational Institutions</li>
              <li>Healthcare Organizations</li>
              <li>Community Associations</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.14em] text-dv-ink">Get In Touch</h3>
            <p className="mb-5 text-sm leading-6 text-dv-muted">
              Have a project or want to explore DigiVerse? Let's start a conversation.
            </p>

            <div className="flex flex-col gap-2">
              {[PLATFORM_CONFIG.productEmail, PLATFORM_CONFIG.secondaryEmail].map((address) => (
                <a
                  key={address}
                  href={`mailto:${address}`}
                  className="group inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-dv-iris-700 transition-colors hover:text-dv-iris-600"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {address}
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>

            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-dv-ink px-4 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-dv-glow"
            >
              Request a Consultation
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-between gap-4 border-t border-dv-line py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-dv-muted">© {new Date().getFullYear()} DigiVerse. All rights reserved.</p>

          <div className="flex items-center gap-2 text-xs text-dv-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Built for organizations. Designed for growth.</span>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-dv-ink-2 transition-colors hover:bg-dv-iris-50 hover:text-dv-iris-700"
          >
            Back to Top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </Container>
    </footer>
  );
};

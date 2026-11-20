import React, { useEffect, useState } from 'react';
import { Container } from './Container';
import { DvLogo } from '../ui/dv/DvLogo';
import { Sparkles, Menu, X, Lock, ArrowUpRight, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenDemo: () => void;
  isAdminAuthenticated?: boolean;
  onGoToStudio?: () => void;
}

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Features', href: '/features' },
  { name: 'Website Templates', href: '/templates' },
  { name: 'Contact', href: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenDemo, isAdminAuthenticated, onGoToStudio }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isActive = (href: string) => currentPath === href;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet with Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
      <Container className="px-0 sm:px-0 lg:px-0">
        <div
          className={`relative flex h-[66px] items-center justify-between gap-4 rounded-2xl border px-3 transition-all duration-500 sm:px-4 ${
            scrolled || mobileMenuOpen
              ? 'dv-glass border-white/70 shadow-[0_10px_40px_-18px_rgba(18,18,42,0.28)]'
              : 'border-transparent bg-transparent'
          }`}
        >
          <a href="/" onClick={closeMobileMenu} aria-label="DigiVerse home" className="shrink-0 rounded-xl transition-opacity hover:opacity-90">
            <DvLogo tagline />
          </a>

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-full border border-dv-line/80 bg-white/70 p-1 shadow-[0_1px_2px_rgba(18,18,42,0.04)] backdrop-blur xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-300 ${
                  isActive(link.href)
                    ? 'bg-dv-ink text-white shadow-[0_6px_16px_-8px_rgba(18,18,42,0.6)]'
                    : 'text-dv-ink-2 hover:bg-dv-iris-50 hover:text-dv-ink'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {isAdminAuthenticated ? (
              <button
                type="button"
                onClick={onGoToStudio}
                className="inline-flex items-center gap-2 rounded-xl border border-dv-line bg-white px-4 py-2.5 text-sm font-semibold text-dv-ink shadow-[0_1px_2px_rgba(18,18,42,0.05)] transition-all hover:-translate-y-px hover:border-dv-iris-200"
              >
                <LayoutDashboard className="h-4 w-4 text-dv-iris-600" />
                Staff Console
                <ArrowUpRight className="h-4 w-4 text-dv-muted" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-dv-ink-2 transition-colors hover:bg-dv-ink/[0.05] hover:text-dv-ink"
              >
                <Lock className="h-4 w-4 text-dv-iris-600" />
                Staff Portal
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDemo}
              className="dv-sheen group inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-dv-ink px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(18,18,42,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(86,64,222,0.7)]"
            >
              <Sparkles className="h-4 w-4 text-[#FFB59E]" />
              Request a Demo
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dv-line bg-white text-dv-ink transition-colors hover:bg-dv-iris-50 xl:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="dv-mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile navigation sheet */}
        {mobileMenuOpen && (
          <div id="dv-mobile-nav" className="dv-glass mt-2 animate-dv-pop rounded-2xl border border-white/70 p-3 shadow-[0_24px_60px_-24px_rgba(18,18,42,0.35)] xl:hidden">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={closeMobileMenu}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive(link.href) ? 'bg-dv-ink text-white' : 'text-dv-ink-2 hover:bg-dv-iris-50 hover:text-dv-ink'
                  }`}
                >
                  {link.name}
                  <ArrowUpRight className="h-4 w-4 opacity-50" />
                </a>
              ))}
            </nav>

            <div className="mt-3 grid gap-2 border-t border-dv-line pt-3 md:hidden">
              {isAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onGoToStudio?.();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dv-line bg-white py-3 text-sm font-semibold text-dv-ink"
                >
                  <LayoutDashboard className="h-4 w-4 text-dv-iris-600" />
                  Staff Console
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onOpenLogin();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dv-line bg-white py-3 text-sm font-semibold text-dv-ink"
                >
                  <Lock className="h-4 w-4 text-dv-iris-600" />
                  Staff Portal
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  onOpenDemo();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-dv-ink py-3 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4 text-[#FFB59E]" />
                Request a Demo
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Navbar;

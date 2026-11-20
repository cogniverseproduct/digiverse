
import React, { useState, useEffect } from 'react';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

import { Hero } from './components/sections/Hero';
import { HowItWorks } from './components/sections/HowItWorks';
import { PlatformAdvantages } from './components/sections/PlatformAdvantages';
import { ThemeCustomizerPreview } from './components/sections/ThemeCustomizerPreview';
import { ContactSection } from './components/sections/ContactSection';
import { CTASection } from './components/sections/CTASection';
import { EngineShowcase } from './components/sections/EngineShowcase';
import { ShowcaseTracks } from './components/sections/ShowcaseTracks';
import { BlossomBackdrop } from './components/ui/dv/Blossom';
import { Ambient } from './components/ui/dv/Ambient';

import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { ForcePasswordChange } from './components/admin/ForcePasswordChange';

import { DemoRequestModal } from './components/sections/DemoRequestModal';

import { ClientPreviewPortal } from './components/preview/ClientPreviewPortal';
import { LiveWebsitePortal } from './components/public/LiveWebsitePortal';

import { api, getStoredToken, setStoredToken } from './lib/api';
import { User } from './types/admin';

type PublicPage =
  | '/'
  | '/staff-portal'
  | '/how-it-works'
  | '/features'
  | '/templates'
  | '/contact';

/**
 * Host-based routing for published client sites (One Project - Many Sites).
 * Inactive until configured, so the DigiVerse app behaves exactly as before:
 *  - VITE_SITES_ROOT_DOMAIN: <slug>.<root> hosts render that client's site.
 *  - VITE_APP_HOSTNAMES: hostnames of the DigiVerse app itself; any other
 *    hostname is treated as a client's custom domain.
 */
const SITES_ROOT_DOMAIN = String(import.meta.env.VITE_SITES_ROOT_DOMAIN || '').trim().toLowerCase();
const APP_HOSTNAMES = String(import.meta.env.VITE_APP_HOSTNAMES || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const detectClientSiteHost = (): string | null => {
  const host = window.location.hostname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1') return null;
  if (SITES_ROOT_DOMAIN && host.endsWith(`.${SITES_ROOT_DOMAIN}`)) return host;
  if (APP_HOSTNAMES.length > 0 && !APP_HOSTNAMES.includes(host)) return host;

  return null;
};

const getCurrentPath = (): string => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path || '/';
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Setup and password-reset links point at /staff-portal?setupToken=… / ?resetToken=…;
  // open the staff sign-in straight away so the link lands on the right screen.
  const [loginModalOpen, setLoginModalOpen] = useState(() => getCurrentPath() === '/staff-portal');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [clientSiteHost] = useState(detectClientSiteHost);

  // Client preview route
  const [previewToken, setPreviewToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/preview\/([a-zA-Z0-9_-]+)/);

    if (match) return match[1];

    const hashMatch = window.location.hash.match(
      /^#\/preview\/([a-zA-Z0-9_-]+)/
    );

    return hashMatch ? hashMatch[1] : null;
  });

  // Published website route
  const [liveSlug, setLiveSlug] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/live\/([a-zA-Z0-9_-]+)/);

    if (match) return match[1];

    const hashMatch = window.location.hash.match(
      /^#\/live\/([a-zA-Z0-9_-]+)/
    );

    return hashMatch ? hashMatch[1] : null;
  });

  // Listen for URL and browser history changes
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      setCurrentPath(getCurrentPath());

      const prevMatch =
        path.match(/^\/preview\/([a-zA-Z0-9_-]+)/) ||
        hash.match(/^#\/preview\/([a-zA-Z0-9_-]+)/);

      if (prevMatch) {
        setPreviewToken(prevMatch[1]);
        setLiveSlug(null);
        return;
      }

      const liveMatch =
        path.match(/^\/live\/([a-zA-Z0-9_-]+)/) ||
        hash.match(/^#\/live\/([a-zA-Z0-9_-]+)/);

      if (liveMatch) {
        setLiveSlug(liveMatch[1]);
        setPreviewToken(null);
        return;
      }

      setPreviewToken(null);
      setLiveSlug(null);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Restore authenticated user
  useEffect(() => {
    api.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setViewMode('admin');
    setLoginModalOpen(false);
  };

  const handleImpersonateStart = (token: string, targetUser: User) => {
    // Keep the Super Admin session aside, then act with the short-lived
    // impersonation token (same storage key the API client reads).
    const currentToken = getStoredToken();
    if (currentToken) {
      localStorage.setItem('superadmin_backup_token', currentToken);
    }
    setStoredToken(token);
    setCurrentUser(targetUser);
  };

  const handleImpersonateEnd = (restoredUser: User) => {
    setCurrentUser(restoredUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin_backup_token');
    api.logout();
    setCurrentUser(null);
    setViewMode('public');
  };

  const handleExitPortal = () => {
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
    setPreviewToken(null);
    setLiveSlug(null);
  };

  // A client's own subdomain or custom domain: render only that website.
  if (clientSiteHost) {
    return <LiveWebsitePortal host={clientSiteHost} />;
  }

  // Client preview portal
  if (previewToken) {
    return (
      <ClientPreviewPortal
        token={previewToken}
        onExit={handleExitPortal}
      />
    );
  }

  // Published website portal
  if (liveSlug) {
    return (
      <LiveWebsitePortal
        slug={liveSlug}
        onBackToHome={handleExitPortal}
      />
    );
  }

  // Admin dashboard
  if (viewMode === 'admin' && currentUser) {
    // A password somebody else chose must be replaced before anything else is shown (the server enforces this too).
    if (currentUser.mustChangePassword) {
      return (
        <ForcePasswordChange
          user={currentUser}
          onChanged={(updated) => setCurrentUser(updated)}
          onLogout={handleLogout}
        />
      );
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return (
        <SuperAdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onExitToPublic={() => setViewMode('public')}
          onImpersonateSuccess={handleImpersonateStart}
        />
      );
    }

    return (
      <AdminDashboard
        user={currentUser}
        onLogout={handleLogout}
        onExitToPublic={() => setViewMode('public')}
        onExitImpersonation={handleImpersonateEnd}
      />
    );
  }

  // Individual public pages
  const renderPublicPage = () => {
    switch (currentPath as PublicPage) {
      case '/':
      case '/staff-portal':
        return (
          <>
            <Hero onOpenDemo={() => setDemoModalOpen(true)} />
            <ShowcaseTracks />
            <EngineShowcase />
            <CTASection onOpenDemo={() => setDemoModalOpen(true)} />
          </>
        );

      case '/how-it-works':
        return <HowItWorks />;

      case '/features':
        return <PlatformAdvantages />;

      case '/templates':
        return <ThemeCustomizerPreview />;

      case '/contact':
        return <ContactSection />;

      default:
        return (
          <section className="relative isolate flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
            <Ambient />
            <p className="dv-prism-text pr-3 font-editorial text-[120px] italic leading-none sm:text-[160px]">
              404
            </p>

            <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-dv-ink">
              Page Not Found
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-7 text-dv-muted">
              The page you are looking for does not exist or may have been moved.
            </p>

            <a
              href="/"
              className="dv-sheen mt-8 rounded-2xl bg-dv-ink px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(18,18,42,0.7)] transition hover:-translate-y-0.5"
            >
              Back to Home
            </a>
          </section>
        );
    }
  };

  // Public DigiVerse website
  return (
    <div className="dv-app dv-public relative isolate flex min-h-screen flex-col overflow-x-hidden bg-dv-canvas font-sans text-dv-ink">
      {/* Cherry Blossom living backdrop (fixed, decorative) */}
      <BlossomBackdrop />

      {/* Navigation */}
      <Navbar
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenDemo={() => setDemoModalOpen(true)}
        isAdminAuthenticated={!!currentUser}
        onGoToStudio={() => setViewMode('admin')}
      />

      {/* Current Page Content */}
      <main key={currentPath} className="relative flex-1 animate-dv-fade">
        {renderPublicPage()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Admin Authentication */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Demo Request */}
      <DemoRequestModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

    </div>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Aurora } from '../ui/dv/Ambient';
import { DvLogo, DvMark } from '../ui/dv/DvLogo';

/**
 * DigiVerse workspace shell — the frame shared by the Admin and Super Admin
 * workspaces: a persistent sidebar (drawer on small screens), a sticky top
 * bar with the page title and actions, and a calm ambient canvas.
 *
 * It only frames main-product screens. Engine workspaces and generated
 * customer websites render inside it unchanged.
 */

export interface WorkspaceNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  onSelect: () => void;
  active?: boolean;
  /** Small count shown at the right edge. */
  count?: number;
  /** Count rendered as an attention badge (pending work). */
  attention?: boolean;
  hint?: string;
}

export interface WorkspaceNavSection {
  label: string;
  items: WorkspaceNavItem[];
}

interface WorkspaceShellProps {
  roleLabel: string;
  roleTone?: 'iris' | 'coral';
  userName: string;
  userHandle: string;
  sections: WorkspaceNavSection[];
  /** Account-level actions rendered at the bottom of the sidebar. */
  accountItems?: WorkspaceNavItem[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  /** Full-width banner above the top bar (e.g. impersonation notice). */
  banner?: React.ReactNode;
  onExitToPublic: () => void;
  onLogout: () => void;
  /** 'wide' removes the max width (used by the studio and engine workspaces). */
  width?: 'default' | 'wide';
  /** Hide the large page header (screens that render their own). */
  hideHeader?: boolean;
  /** Start with the sidebar collapsed to an icon rail (e.g. the studio). */
  preferCompactSidebar?: boolean;
  children: React.ReactNode;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DV';
}

const NavButton: React.FC<{ item: WorkspaceNavItem; onNavigate?: () => void; compact?: boolean }> = ({ item, onNavigate, compact }) => {
  const Icon = item.icon;
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          item.onSelect();
          onNavigate?.();
        }}
        title={item.label}
        aria-label={item.label}
        aria-current={item.active ? 'page' : undefined}
        className={cn(
          'relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
          item.active ? 'dv-prism-fill text-white shadow-dv-glow' : 'text-dv-muted hover:bg-white hover:text-dv-iris-600'
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {typeof item.count === 'number' && item.count > 0 && item.attention && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-dv-coral ring-2 ring-[#F1EFF8]" />
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        item.onSelect();
        onNavigate?.();
      }}
      title={item.hint}
      aria-current={item.active ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200',
        item.active
          ? 'bg-white text-dv-ink shadow-[0_1px_2px_rgba(18,18,42,0.06),0_10px_24px_-16px_rgba(71,50,184,0.45)] ring-1 ring-dv-iris-100'
          : 'text-dv-ink-2 hover:bg-white/70 hover:text-dv-ink'
      )}
    >
      {item.active && (
        <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full dv-prism-fill" />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          item.active ? 'dv-prism-fill text-white shadow-dv-glow' : 'bg-dv-ink/[0.04] text-dv-muted group-hover:text-dv-iris-600'
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {typeof item.count === 'number' && item.count > 0 && (
        <span
          className={cn(
            'min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
            item.attention ? 'bg-dv-coral text-white' : 'bg-dv-ink/[0.06] text-dv-muted'
          )}
        >
          {item.count}
        </span>
      )}
    </button>
  );
};

const CompactSidebar: React.FC<
  Pick<WorkspaceShellProps, 'sections' | 'accountItems' | 'onExitToPublic' | 'onLogout' | 'userName'> & { onExpand: () => void }
> = ({ sections, accountItems, onExitToPublic, onLogout, userName, onExpand }) => (
  <div className="flex h-full flex-col items-center py-5">
    <DvMark className="h-10 w-10" title="DigiVerse" />
    <button
      type="button"
      onClick={onExpand}
      title="Expand sidebar"
      aria-label="Expand sidebar"
      className="mt-4 rounded-lg p-2 text-dv-muted transition hover:bg-white hover:text-dv-ink"
    >
      <PanelLeftOpen className="h-4 w-4" />
    </button>
    <nav className="mt-4 flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2" aria-label="Workspace">
      {sections.map((section, index) => (
        <div key={section.label} className={cn('flex flex-col gap-1', index > 0 && 'mt-3 border-t border-dv-line/80 pt-3')}>
          {section.items.map((item) => (
            <NavButton key={item.id} item={item} compact />
          ))}
        </div>
      ))}
    </nav>
    <div className="flex w-full flex-col items-center gap-1 border-t border-dv-line/80 px-2 pt-3">
      {accountItems?.map((item) => <NavButton key={item.id} item={item} compact />)}
      <button type="button" onClick={onExitToPublic} title="Public site" aria-label="Public site" className="flex h-11 w-11 items-center justify-center rounded-xl text-dv-muted hover:bg-white hover:text-dv-ink">
        <ExternalLink className="h-[18px] w-[18px]" />
      </button>
      <button type="button" onClick={onLogout} title="Sign out" aria-label="Sign out" className="flex h-11 w-11 items-center justify-center rounded-xl text-dv-muted hover:bg-rose-50 hover:text-rose-600">
        <LogOut className="h-[18px] w-[18px]" />
      </button>
      <span title={userName} className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl dv-prism-fill font-display text-xs font-bold text-white">
        {initials(userName)}
      </span>
    </div>
  </div>
);

const SidebarContent: React.FC<
  Pick<WorkspaceShellProps, 'roleLabel' | 'roleTone' | 'userName' | 'userHandle' | 'sections' | 'accountItems' | 'onExitToPublic' | 'onLogout'> & {
    onNavigate?: () => void;
    onCollapse?: () => void;
  }
> = ({ roleLabel, roleTone = 'iris', userName, userHandle, sections, accountItems, onExitToPublic, onLogout, onNavigate, onCollapse }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-start justify-between px-5 pb-4 pt-6">
      <DvLogo />
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="mt-1 rounded-lg p-1.5 text-dv-muted transition hover:bg-white hover:text-dv-ink"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      )}
    </div>

    <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-dv-line bg-white/70 px-3 py-2">
      <span className={cn('h-2 w-2 rounded-full', roleTone === 'coral' ? 'bg-dv-coral' : 'bg-dv-iris-500')} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dv-ink-2">{roleLabel}</span>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-5 pb-6" aria-label="Workspace">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-dv-muted/80">{section.label}</div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavButton key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>

    <div className="border-t border-dv-line/80 px-5 py-4">
      {accountItems && accountItems.length > 0 && (
        <div className="mb-3 space-y-1">
          {accountItems.map((item) => (
            <NavButton key={item.id} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-dv-card ring-1 ring-dv-line/70">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl dv-prism-fill font-display text-sm font-bold text-white">
          {initials(userName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-dv-ink">{userName}</div>
          <div className="truncate text-[11px] text-dv-muted">@{userHandle}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onExitToPublic}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dv-line bg-white/60 px-2 py-2 text-[11px] font-semibold text-dv-ink-2 transition hover:border-dv-iris-200 hover:text-dv-ink"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Public site
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dv-line bg-white/60 px-2 py-2 text-[11px] font-semibold text-dv-ink-2 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  </div>
);

export const WorkspaceShell: React.FC<WorkspaceShellProps> = (props) => {
  const { title, subtitle, eyebrow, actions, banner, width = 'default', hideHeader, preferCompactSidebar = false, children } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Manual choice wins; otherwise follow the screen's preference.
  const [manualCompact, setManualCompact] = useState<boolean | null>(null);
  const compact = manualCompact ?? preferCompactSidebar;

  useEffect(() => {
    setManualCompact(null);
  }, [preferCompactSidebar]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="dv-app relative min-h-screen bg-dv-canvas font-sans text-dv-ink">
      <Aurora />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-dv-line/80 bg-[#F1EFF8]/85 backdrop-blur-xl transition-[width] duration-300 lg:block',
          compact ? 'w-[76px]' : 'w-[272px]'
        )}
      >
        {compact ? (
          <CompactSidebar {...props} onExpand={() => setManualCompact(false)} />
        ) : (
          <SidebarContent {...props} onCollapse={() => setManualCompact(true)} />
        )}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-dv-ink/30 backdrop-blur-sm animate-dv-fade"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[288px] max-w-[85vw] bg-[#F4F2FA] shadow-dv-float animate-dv-pop">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 rounded-lg p-2 text-dv-muted hover:bg-white hover:text-dv-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent {...props} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn('relative transition-[padding] duration-300', compact ? 'lg:pl-[76px]' : 'lg:pl-[272px]')}>
        {banner}

        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-dv-line/70 bg-dv-canvas/75 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-dv-line bg-white p-2 text-dv-ink-2 shadow-sm lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <DvLogo compact />
            </div>
            <div className="hidden min-w-0 flex-1 items-center gap-2 text-[13px] text-dv-muted lg:flex">
              <span className="font-semibold text-dv-ink-2">{props.roleLabel}</span>
              <span className="text-dv-line">/</span>
              <span className="truncate text-dv-ink">{typeof title === 'string' ? title : null}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </div>
        </header>

        <main className={cn('relative px-4 pb-16 pt-8 sm:px-6 lg:px-10', width === 'default' && 'mx-auto max-w-[1280px]')}>
          {!hideHeader && (
            <div className="mb-8 animate-dv-rise">
              {eyebrow && <div className="mb-3">{eyebrow}</div>}
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-dv-ink sm:text-[34px]">
                {title}
              </h1>
              {subtitle && <p className="mt-2 max-w-2xl text-[14px] leading-6 text-dv-muted">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default WorkspaceShell;

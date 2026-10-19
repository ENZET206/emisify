import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Sidebar, SidebarContent, MAIN_NAV } from './Sidebar';
import { Topbar } from './Topbar';
import { LangToggle } from './LangToggle';
import { useLang } from '../../context/LangContext';

function MobileNav() {
  const { t } = useLang();
  return (
    <nav aria-label={t('nav.mainGroup')} data-testid="mobile-bottom-nav"
      className="fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-[1.75rem] border border-brown/10 bg-white/95 px-2 py-1.5 shadow-lift backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(.375rem, env(safe-area-inset-bottom))' }}>
      {MAIN_NAV.map((i) => (
        <NavLink key={i.to} to={i.to} data-testid={`bottom-nav-${i.id}`}
          className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors ${isActive ? 'bg-peach/70 text-terracotta' : 'text-muted'}`}>
          <i.icon className="h-5 w-5" aria-hidden />
          <span className="truncate">{t(i.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Drawer({ open, onClose }) {
  const { t } = useLang();
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.mainGroup')} data-testid="mobile-drawer">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs animate-[rise_.25s_ease-out_both] overflow-y-auto bg-peach shadow-lift">
        <button type="button" onClick={onClose} aria-label={t('nav.closeMenu')} data-testid="mobile-drawer-close" className="absolute right-3 top-6 rounded-full p-2 hover:bg-soft/60"><X className="h-5 w-5" /></button>
        <SidebarContent onNavigate={onClose} />
        <div className="px-6 pb-6"><LangToggle /></div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-dvh bg-soft">
      <Sidebar />
      <Drawer open={drawer} onClose={() => setDrawer(false)} />
      <div className="lg:pl-72">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-8 sm:pt-10 lg:pb-16" data-testid="app-main">
          <div className="pointer-events-none absolute -top-10 right-0 -z-0 h-64 w-64 rounded-full bg-peach/50 blur-3xl" aria-hidden />
          <div className="relative"><Outlet /></div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

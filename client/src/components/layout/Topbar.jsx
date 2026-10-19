import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound, Menu, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LangToggle } from './LangToggle';
import { Logo } from '../common/Logo';

function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const doLogout = async () => {
    await logout();
    toast.info(t('logout.done'));
    nav('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t('nav.account')} data-testid="user-menu-button"
        className="flex h-11 items-center gap-2 rounded-full bg-peach py-1 pl-1.5 pr-3 transition-colors hover:bg-[#F3CFB2]">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-brown"><UserRound className="h-4 w-4" aria-hidden /></span>
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:block" data-testid="user-menu-name">{user?.name}</span>
        <ChevronDown className={`h-4 w-4 text-brown transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" data-testid="user-menu-dropdown" className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 animate-pop rounded-3xl border border-line bg-white p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); nav('/progress'); }} data-testid="user-menu-progress"
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-soft"><Trophy className="h-4 w-4 text-brown" aria-hidden />{t('nav.progress')}</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setConfirm(true); }} data-testid="logout-button"
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-[#FDECEA]"><LogOut className="h-4 w-4" aria-hidden />{t('nav.logout')}</button>
        </div>
      )}
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doLogout} title={t('logout.title')} body={t('logout.body')}
        confirmLabel={t('logout.confirm')} testId="logout-dialog" />
    </div>
  );
}

export function Topbar({ onMenu, left }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-20 border-b border-brown/10 bg-soft/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[4.5rem] sm:px-8">
        <button type="button" onClick={onMenu} aria-label={t('nav.menu')} data-testid="mobile-menu-button" className="-ml-1 rounded-full p-2 hover:bg-peach/60 lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="lg:hidden"><Logo to="/dashboard" testId="topbar-logo" /></div>
        <div className="hidden lg:block">{left}</div>
        <div className="ml-auto flex items-center gap-2">
          <LangToggle className="hidden sm:inline-flex" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

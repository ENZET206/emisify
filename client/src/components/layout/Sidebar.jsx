import { NavLink } from 'react-router-dom';
import { Home, Calculator, Search, UserRound, Footprints, History, Flag, Sparkles } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { Logo } from '../common/Logo';

export const MAIN_NAV = [
  { to: '/dashboard', key: 'nav.dashboard', icon: Home, id: 'dashboard' },
  { to: '/calculator', key: 'nav.calculator', icon: Calculator, id: 'calculator' },
  { to: '/impact', key: 'nav.impact', icon: Search, id: 'impact' },
  { to: '/progress', key: 'nav.progress', icon: UserRound, id: 'progress' },
  { to: '/recommendations', key: 'nav.actions', icon: Footprints, id: 'actions' },
];
export const MORE_NAV = [
  { to: '/history', key: 'nav.history', icon: History, id: 'history' },
  { to: '/challenges', key: 'nav.challenges', icon: Flag, id: 'challenges' },
  { to: '/ask-ai', key: 'nav.ai', icon: Sparkles, id: 'ask-ai' },
];

function Item({ item, onNavigate }) {
  const { t } = useLang();
  return (
    <NavLink to={item.to} onClick={onNavigate} data-testid={`sidebar-nav-${item.id}`}
      className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-[background-color,color] duration-200 ${isActive ? 'bg-soft text-terracotta shadow-soft' : 'text-ink/80 hover:bg-soft/60 hover:text-ink'}`}>
      <item.icon className="h-[18px] w-[18px] transition-transform group-hover:scale-110" aria-hidden />
      {t(item.key)}
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-7"><Logo to="/dashboard" /></div>
      <nav aria-label={t('nav.mainGroup')} className="space-y-1 px-4">
        {MAIN_NAV.map((i) => <Item key={i.to} item={i} onNavigate={onNavigate} />)}
      </nav>
      <p className="label-sm mb-2 mt-8 px-8">{t('nav.moreGroup')}</p>
      <nav aria-label={t('nav.moreGroup')} className="space-y-1 px-4">
        {MORE_NAV.map((i) => <Item key={i.to} item={i} onNavigate={onNavigate} />)}
      </nav>
      <div className="relative mx-4 mb-6 mt-auto overflow-hidden rounded-leaf bg-forest p-5 text-white">
        <img src="/assets/tree.png" alt="" className="absolute -bottom-3 -right-3 h-20 w-20 opacity-90" />
        <p className="max-w-[9rem] text-sm font-semibold leading-snug">{t('brand.tagline')}</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-brown/10 bg-peach/80 lg:block" data-testid="desktop-sidebar">
      <SidebarContent />
    </aside>
  );
}

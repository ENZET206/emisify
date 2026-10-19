import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { LangToggle } from './LangToggle';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';

export function PublicNavbar() {
  const { t } = useLang();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [['#beranda', 'nav.home'], ['#fitur', 'nav.features'], ['#tentang', 'nav.about']];
  return (
    <header className="sticky top-0 z-40 border-b border-brown/10 bg-soft/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:h-20 sm:px-8">
        <Logo />
        <nav className="mx-auto hidden items-center gap-8 md:flex" aria-label={t('nav.mainGroup')}>
          {links.map(([href, key], i) => (
            <a key={href} href={href} data-testid={`landing-nav-${href.slice(1)}`} className={`text-sm font-semibold transition-colors hover:text-terracotta ${i === 0 ? 'text-terracotta' : 'text-ink/70'}`}>{t(key)}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LangToggle className="hidden sm:inline-flex" />
          {user ? (
            <Button size="sm" to="/dashboard" data-testid="landing-dashboard-button">{t('nav.dashboard')}</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" to="/login" className="hidden sm:inline-flex" data-testid="landing-login-button">{t('nav.login')}</Button>
              <Button size="sm" to="/register" data-testid="landing-register-button">{t('nav.register')}</Button>
            </>
          )}
          <button type="button" className="rounded-full p-2 hover:bg-peach/60 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t(open ? 'nav.closeMenu' : 'nav.menu')} data-testid="landing-menu-button">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="animate-rise border-t border-brown/10 bg-soft px-5 pb-5 pt-2 md:hidden" data-testid="landing-mobile-menu">
          {links.map(([href, key]) => <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-2xl px-3 py-3 font-semibold hover:bg-peach/50">{t(key)}</a>)}
          <div className="mt-2 flex items-center gap-2"><LangToggle />{!user && <Link to="/login" className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">{t('nav.login')}</Link>}</div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-brown/10 bg-cream" data-testid="landing-footer">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{t('brand.tagline')}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">{t('footer.nav')}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><a href="#beranda" className="hover:text-terracotta">{t('nav.home')}</a></li>
            <li><a href="#fitur" className="hover:text-terracotta">{t('nav.features')}</a></li>
            <li><a href="#tentang" className="hover:text-terracotta">{t('nav.about')}</a></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">{t('footer.support')}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><a href="#cara-kerja" className="hover:text-terracotta">{t('footer.howItWorks')}</a></li>
            <li><a href="#asumsi" className="hover:text-terracotta">{t('footer.factors')}</a></li>
            <li>{t('footer.privacy')}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-brown/10 px-5 py-5 text-xs text-terracotta sm:flex-row sm:justify-between sm:px-8">
        <span>{t('footer.rights')}</span><span>{t('footer.together')}</span>
      </div>
    </footer>
  );
}

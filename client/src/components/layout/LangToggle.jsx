import { Languages } from 'lucide-react';
import { useLang } from '../../context/LangContext';

export function LangToggle({ className = '' }) {
  const { lang, toggle, t } = useLang();
  return (
    <button type="button" onClick={toggle} data-testid="language-toggle" aria-label={t('lang.switch')}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-bold text-ink transition-colors hover:border-brown/30 ${className}`}>
      <Languages className="h-4 w-4 text-brown" aria-hidden />
      <span className={lang === 'id' ? 'text-terracotta' : 'text-muted'}>ID</span>
      <span className="text-line">/</span>
      <span className={lang === 'en' ? 'text-terracotta' : 'text-muted'}>EN</span>
    </button>
  );
}

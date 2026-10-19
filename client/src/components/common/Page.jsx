import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '../../context/LangContext';

export function PageHeader({ title, subtitle, eyebrow, actions, testId = 'page-title' }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="label-sm mb-2">{eyebrow}</p>}
        <h1 data-testid={testId} className="text-[1.85rem] font-extrabold leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-muted sm:text-lg">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function BackButton({ to }) {
  const { t } = useLang();
  const nav = useNavigate();
  return (
    <button type="button" data-testid="back-button" onClick={() => (to ? nav(to) : nav(-1))}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-peach/60">
      <ArrowLeft className="h-4 w-4" aria-hidden />{t('common.back')}
    </button>
  );
}

export function Pills({ options, value, onChange, testId, label, tone = 'terracotta' }) {
  const active = tone === 'forest' ? 'bg-forest text-white shadow-[0_8px_18px_-10px_rgba(63,104,75,.8)]' : 'bg-terracotta text-white shadow-[0_8px_18px_-10px_rgba(201,74,47,.8)]';
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} data-testid={`${testId}-${String(o.value).toLowerCase()}`}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ${value === o.value ? active : 'border border-line bg-white text-ink hover:border-brown/30'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FactorBadge({ status }) {
  const { t } = useLang();
  const map = { DEMO: ['common.demo', 'bg-[#F6E7C8] text-warning'], ESTIMATE: ['common.estimateBadge', 'bg-peach text-brown'], VALIDATED: ['common.validated', 'bg-mint text-forest'] };
  const [key, cls] = map[status] || map.DEMO;
  return <span data-testid="factor-status-badge" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${cls}`}>{t(key)}</span>;
}

export function IconTile({ icon: Icon, tone = 'bg-peach/70 text-terracotta', size = 'md' }) {
  const s = { sm: 'h-10 w-10 rounded-2xl', md: 'h-12 w-12 rounded-[1.1rem]', lg: 'h-16 w-16 rounded-[1.5rem_1.5rem_1.5rem_.6rem]' }[size];
  return <span className={`grid shrink-0 place-items-center ${s} ${tone}`}><Icon className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} aria-hidden /></span>;
}

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus, Trees } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { formatKg, formatMonth, formatNumber, formatDate } from '../../utils/format';

export function SummaryHero({ data }) {
  const { t, lang } = useLang();
  const pct = data.changePct;
  const Arrow = pct == null ? Minus : pct <= 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <section data-testid="dashboard-summary-hero" className="grain relative overflow-hidden rounded-[2.25rem_2.25rem_2.25rem_.9rem] bg-terracotta p-6 text-white shadow-lift sm:p-8">
      <svg className="absolute -right-10 -top-10 h-56 w-56 text-white/10" viewBox="0 0 64 64" aria-hidden><path fill="currentColor" d="M54 8C30 8 12 20 10 40c-.6 6 1 11 3 14 2-9 9-19 22-26-10 8-16 16-19 27 4 2 9 2 14 0 18-7 24-26 24-47z" /></svg>
      <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-ink/20 blur-2xl" aria-hidden />
      <p className="relative text-lg font-medium text-white/90 sm:text-xl">{t('dash.total')}</p>
      <p className="relative mt-2 flex items-baseline gap-2"><span className="text-5xl font-extrabold tracking-tight sm:text-6xl" data-testid="dashboard-total-kg">{formatNumber(data.thisMonthKg, lang)}</span><span className="text-sm font-semibold">kg CO₂e</span></p>
      <div className="relative mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold" data-testid="dashboard-change-pct">
          <Arrow className="h-4 w-4" aria-hidden />{pct == null ? t('dash.noCompare') : t('dash.vsLast', { pct: formatNumber(Math.abs(pct), lang) })}
        </span>
        {data.thisMonthKg > 0 && <span className="inline-flex items-center gap-1.5 text-white/85"><Trees className="h-4 w-4" aria-hidden />{t('dash.trees', { n: formatNumber(data.equivalentTreesMonth, lang) })}</span>}
      </div>
    </section>
  );
}

function ChartTip({ active, payload, label, lang, daily }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2 text-xs shadow-soft">
      <p className="font-semibold text-muted">{daily ? formatDate(label, lang) : formatMonth(label, lang)}</p>
      <p className="font-bold text-ink">{formatKg(payload[0].value, lang)}</p>
    </div>
  );
}

export function TrendChart({ data, daily }) {
  const { lang } = useLang();
  const key = daily ? 'day' : 'month';
  return (
    <div className="h-56 w-full" data-testid="dashboard-trend-chart">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D9653F" stopOpacity={0.35} /><stop offset="100%" stopColor="#D9653F" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EBDCCD" strokeDasharray="4 6" />
          <XAxis dataKey={key} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A675C' }}
            tickFormatter={(v) => (daily ? formatDate(v, lang, { day: 'numeric' }) : formatMonth(v, lang))} interval={daily ? 1 : 0} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A675C' }} width={44} />
          <Tooltip content={<ChartTip lang={lang} daily={daily} />} cursor={{ stroke: '#C94A2F', strokeDasharray: 4 }} />
          <Area type="monotone" dataKey="kg" stroke="#C94A2F" strokeWidth={2.5} fill="url(#trendFill)" animationDuration={700} dot={{ r: 3, fill: '#C94A2F' }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, ArrowRight, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { PageHeader, Pills, IconTile } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { getIcon } from '../../utils/icons';
import { formatKg, formatNumber } from '../../utils/format';

const COLORS = { VEHICLE: '#C94A2F', ENERGY: '#D9653F', ELECTRONICS: '#3F684B' };
const TONES = { VEHICLE: 'bg-peach/70 text-terracotta', ENERGY: 'bg-[#F6E7C8] text-warning', ELECTRONICS: 'bg-mint text-forest' };

export function RangePills({ value, onChange }) {
  const { t } = useLang();
  return <Pills value={value} onChange={onChange} testId="impact-range" label="range" options={[{ value: 'month', label: t('impact.rangeMonth') }, { value: '30d', label: t('impact.range30') }, { value: 'all', label: t('impact.rangeAll') }]} />;
}

export default function ImpactPage() {
  const { t, pick, lang } = useLang();
  const [range, setRange] = useState('month');
  const { data, loading, error, reload } = useApi(`/impact?range=${range}`);
  const names = data?.top.map((k) => pick(data.categories.find((c) => c.key === k).label)) || [];

  return (
    <>
      <PageHeader title={t('impact.title')} subtitle={t('impact.sub')} actions={<RangePills value={range} onChange={setRange} />} testId="impact-title" />
      {loading && !data && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (data.totalKg === 0 ? (
        <EmptyState icon={Search} title={t('impact.empty')} body={t('impact.emptyBody')} testId="impact-empty"
          action={<Button to="/calculator" iconRight={ArrowRight}>{t('dash.startCalc')}</Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <div className="stagger grid gap-4 sm:grid-cols-3">
              {data.categories.map((c, i) => (
                <Link key={c.key} to={`/impact/${c.slug}`} data-testid={`impact-category-${c.slug}`}
                  className={`group surface flex flex-col items-center p-6 text-center transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lift ${['rounded-blob', 'rounded-leaf', 'rounded-[2rem]'][i]}`}>
                  <IconTile icon={getIcon(c.icon)} tone={TONES[c.key]} size="lg" />
                  <h2 className="mt-3 text-lg font-bold">{pick(c.label)}</h2>
                  <p className="text-sm font-medium" data-testid={`impact-category-kg-${c.slug}`}>{formatKg(c.kg, lang)}</p>
                  <p className="text-xs text-muted">{formatNumber(c.pct, lang)}% · {t('impact.items', { n: c.count })}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-terracotta opacity-80 group-hover:opacity-100">{t('common.seeDetail')}<ChevronRight className="h-3.5 w-3.5" aria-hidden /></span>
                </Link>
              ))}
            </div>
            {names.length > 0 && (
              <p className="surface flex items-center gap-3 rounded-[1.5rem] p-4 text-[15px] text-ink/80" data-testid="impact-insight">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terracotta text-white"><Zap className="h-4 w-4" aria-hidden /></span>
                {names.length > 1 ? t('impact.insight2', { a: names[0], b: names[1] }) : t('impact.insight', { a: names[0] })}
              </p>
            )}
          </div>
          <section className="surface rounded-[2rem] p-5" data-testid="impact-pie">
            <h2 className="font-bold">{t('impact.chart')}</h2>
            <div className="relative h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.categories.filter((c) => c.kg > 0)} dataKey="kg" nameKey="key" innerRadius="62%" outerRadius="92%" paddingAngle={3} cornerRadius={8} animationDuration={700}>
                    {data.categories.filter((c) => c.kg > 0).map((c) => <Cell key={c.key} fill={COLORS[c.key]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><p className="text-xl font-extrabold">{formatNumber(data.totalKg, lang)}<span className="block text-xs font-medium text-muted">kg CO₂e</span></p></div>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.categories.map((c) => <li key={c.key} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[c.key] }} aria-hidden />{pick(c.label)}<span className="ml-auto font-semibold">{formatNumber(c.pct, lang)}%</span></li>)}
            </ul>
          </section>
        </div>
      ))}
    </>
  );
}

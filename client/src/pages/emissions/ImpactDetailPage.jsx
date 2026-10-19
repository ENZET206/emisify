import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, Zap, ChevronRight } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { BackButton, IconTile } from '../../components/common/Page';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { RangePills } from './ImpactPage';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatKg, formatNumber, formatDate } from '../../utils/format';

export default function ImpactDetailPage() {
  const { slug } = useParams();
  const { t, pick, lang } = useLang();
  const [range, setRange] = useState('month');
  const { data, loading, error, reload } = useApi(`/impact/${slug}?range=${range}`);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><BackButton to="/impact" /><RangePills value={range} onChange={setRange} /></div>
      {loading && !data && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <>
          <header className="mb-6">
            <p className="text-lg font-semibold">{t('impact.detailTitle', { cat: pick(data.category.label) })}</p>
            <p className="text-4xl font-extrabold" data-testid="impact-detail-kg">{formatKg(data.kg, lang)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-terracotta"><ArrowDown className="h-4 w-4" aria-hidden />{t('impact.ofTotal', { pct: formatNumber(data.pctOfTotal, lang) })}</p>
          </header>
          {data.items.length === 0 ? (
            <EmptyState title={t('impact.empty')} body={t('impact.emptyBody')} testId="impact-detail-empty" />
          ) : (
            <>
              <section className="surface rounded-[2rem] p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-extrabold sm:text-2xl">{t('impact.breakdownTitle')}</h2>
                <ul className="stagger space-y-3" data-testid="impact-item-list">
                  {data.items.map((it) => (
                    <li key={it.id}>
                      <Link to={`/items/${it.id}`} data-testid={`impact-item-${it.id}`} className="group flex items-center gap-4 rounded-[1.5rem] border border-line/70 p-3 transition-[border-color,background-color] hover:border-burnt/40 hover:bg-soft sm:p-4">
                        <IconTile icon={getIcon(it.icon)} tone={ACTIVITY_TONE[it.activityType]} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate font-bold sm:text-lg">{pick(it.itemName)}</p>
                            <p className="text-sm font-bold">{formatNumber(it.pct, lang)}%</p>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F1ECE7]" role="progressbar" aria-valuenow={it.pct} aria-valuemin={0} aria-valuemax={100} aria-label={pick(it.itemName)}>
                            <div className="h-full origin-left animate-[rise_.6s_ease-out_both] rounded-full bg-terracotta" style={{ width: `${it.pct}%` }} />
                          </div>
                          <p className="mt-1 text-sm text-muted">{formatKg(it.resultKg, lang)} · {formatDate(it.activityDate, lang)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="surface mt-4 flex items-center gap-3 rounded-[1.5rem] p-4 text-sm text-ink/80" data-testid="impact-detail-insight">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terracotta text-white"><Zap className="h-4 w-4" aria-hidden /></span>
                {t('impact.topItem', { name: pick(data.items[0].itemName) })}
              </p>
            </>
          )}
        </>
      )}
    </>
  );
}

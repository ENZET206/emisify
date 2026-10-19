import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Flag, Calculator } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { PageHeader, Pills, IconTile } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { SummaryHero, TrendChart } from '../../components/dashboard/DashboardWidgets';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { TargetCard } from '../../components/dashboard/TargetCard';
import { formatKg, formatNumber, formatDate } from '../../utils/format';

function ActivityCards({ items }) {
  const { pick, lang } = useLang();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((a) => (
        <Link key={a.type} to={`/calculator/${a.slug}`} data-testid={`dashboard-activity-${a.slug}`}
          className="group surface flex flex-col items-center rounded-[1.75rem] p-4 text-center transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lift sm:p-5">
          <IconTile icon={getIcon(a.icon)} tone={ACTIVITY_TONE[a.type]} />
          <h3 className="mt-3 text-[15px] font-bold sm:text-lg">{pick(a.label)}</h3>
          <p className="text-sm font-medium text-ink/80">{formatKg(a.kg, lang)}</p>
          <p className="text-xs text-muted">{formatNumber(a.pct, lang)}%</p>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, pick, lang } = useLang();
  const { data, loading, error, reload } = useApi('/dashboard/summary');
  const [view, setView] = useState('monthly');

  const header = <PageHeader title={t('dash.greeting', { name: user?.name?.split(' ')[0] })} subtitle={t('dash.sub')} testId="dashboard-greeting" />;
  if (loading) return <>{header}<PageSkeleton /></>;
  if (error) return <>{header}<ErrorMessage error={error} onRetry={reload} /></>;

  if (!data.hasData) {
    return (
      <>
        {header}
        <div className="mb-6"><TargetCard data={data} onChanged={reload} /></div>
        <EmptyState icon={Calculator} title={t('dash.emptyTitle')} body={t('dash.emptyBody')} testId="dashboard-empty"
          action={<Button to="/calculator" iconRight={ArrowRight} data-testid="dashboard-empty-start">{t('dash.startCalc')}</Button>} />
      </>
    );
  }

  const rec = data.recommendation;
  return (
    <div className="space-y-8">
      {header}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold sm:text-2xl">{t('dash.summary')}</h2>
        <SummaryHero data={data} />
        <TargetCard data={data} onChanged={reload} />
        <ActivityCards items={data.byActivity} />
      </section>

      {rec && (
        <section data-testid="dashboard-recommendation" className="flex flex-col gap-4 rounded-[1.75rem] bg-peach/80 p-5 sm:flex-row sm:items-center">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-terracotta" aria-hidden />
          <div className="flex-1">
            <h3 className="font-bold">{t('dash.recToday')}</h3>
            <Link to={`/recommendations/${rec.id}`} className="text-sm text-ink/80 hover:text-terracotta hover:underline">{pick(rec.content).title} — {pick(rec.content).summary}</Link>
          </div>
          <Button variant="dark" to="/calculator" iconRight={ArrowRight} data-testid="dashboard-start-calc">{t('dash.startCalc')}</Button>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="surface rounded-[2rem] p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{view === 'monthly' ? t('dash.trend') : t('dash.trendDaily')}</h2>
            <Pills value={view} onChange={setView} testId="dashboard-trend-toggle" label={t('dash.trend')}
              options={[{ value: 'monthly', label: t('dash.trend') }, { value: 'daily', label: t('dash.trendDaily') }]} />
          </div>
          <TrendChart data={view === 'monthly' ? data.monthly : data.daily} daily={view === 'daily'} />
        </section>
        <section className="space-y-4">
          <div className="surface rounded-[2rem] p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{t('dash.recent')}</h2><Link to="/history" className="text-sm font-semibold text-terracotta hover:underline" data-testid="dashboard-see-history">{t('common.seeAll')}</Link></div>
            <ul className="divide-y divide-line/70">
              {data.recent.map((c) => (
                <li key={c.id}>
                  <Link to={`/items/${c.id}`} className="flex items-center gap-3 py-2.5 hover:text-terracotta" data-testid={`dashboard-recent-${c.id}`}>
                    <IconTile icon={getIcon(c.icon)} tone={ACTIVITY_TONE[c.activityType]} size="sm" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{pick(c.itemName)}</span><span className="text-xs text-muted">{formatDate(c.activityDate, lang)}</span></span>
                    <span className="text-sm font-bold">{formatKg(c.resultKg, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] bg-mint p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-forest"><Flag className="h-4 w-4" aria-hidden />{t('dash.challenges')}</h2>
            {data.activeChallenges.length ? data.activeChallenges.map((c) => (
              <div key={c.id} className="mb-3 last:mb-0">
                <p className="text-sm font-semibold">{pick(c.content).title}</p>
                <div className="mt-1.5 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-forest transition-[width] duration-700" style={{ width: `${(c.progress / c.target) * 100}%` }} /></div>
                <p className="mt-1 text-xs text-forest">{t('ch.progress', { p: c.progress, t: c.target })}</p>
              </div>
            )) : <p className="text-sm text-forest/80">{t('dash.noChallenges')}</p>}
            <Link to="/challenges" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-forest hover:underline" data-testid="dashboard-challenges-link">{t('dash.joinChallenge')}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

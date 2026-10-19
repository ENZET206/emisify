import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader, Lock, Trees, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { PageHeader, BackButton, Pills } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { getIcon } from '../../utils/icons';
import { formatNumber, formatDate } from '../../utils/format';

function Donut({ pct }) {
  const data = [{ v: pct }, { v: 100 - pct }];
  return (
    <div className="relative h-40 w-40 shrink-0" data-testid="progress-donut">
      <ResponsiveContainer>
        <PieChart><Pie data={data} dataKey="v" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" animationDuration={800}>
          <Cell fill="#3F684B" /><Cell fill="#E4E0DB" />
        </Pie></PieChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold" data-testid="progress-percent">{pct}%</span>
    </div>
  );
}

function ActionsTab({ data }) {
  const { t, pick, lang } = useLang();
  return (
    <section className="surface rounded-[2rem] p-5 sm:p-6" data-testid="progress-actions-tab">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <Donut pct={data.completionPct} />
        <div>
          <p className="text-xl font-extrabold sm:text-2xl" data-testid="progress-actions-count">{t('pr.ofActions', { d: data.actionsCompleted, s: data.actionsStarted })}</p>
          <p className="mt-1 text-sm text-muted">{t('pr.keepGoing')}</p>
        </div>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">{t('pr.list')}</h2>
      {data.actions.length === 0 ? (
        <EmptyState title={t('pr.emptyActions')} body={t('pr.emptyActionsBody')} testId="progress-actions-empty"
          action={<div className="flex flex-wrap justify-center gap-2"><Button to="/recommendations" variant="outline">{t('nav.actions')}</Button><Button to="/challenges" variant="forest">{t('nav.challenges')}</Button></div>} />
      ) : (
        <ul className="space-y-3" data-testid="progress-action-list">
          {data.actions.map((a) => (
            <li key={`${a.kind}-${a.id}`}>
              <Link to={a.kind === 'recommendation' ? `/recommendations/${a.id}` : '/challenges'} className="flex items-start gap-3 rounded-2xl p-2 transition-colors hover:bg-soft">
                {a.status === 'DONE' ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-forest" aria-hidden /> : <Loader className="mt-0.5 h-6 w-6 shrink-0 text-warning" aria-hidden />}
                <span className="min-w-0">
                  <span className="block font-semibold">{pick(a.content).title}</span>
                  <span className="text-xs text-muted">{t(`pr.kind.${a.kind}`)} · {t(`pr.status.${a.status}`)}{a.kind === 'challenge' ? ` (${a.progress}/${a.target})` : ''} · {formatDate(a.date, lang)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RewardsGrid({ achievements }) {
  const { t, pick, lang } = useLang();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="progress-rewards">
      {achievements.map((a) => {
        const Icon = getIcon(a.icon);
        const c = pick(a.content);
        return (
          <div key={a.id} data-testid={`reward-${a.slug}`} data-earned={a.earned}
            className={`relative flex flex-col items-center rounded-[1.5rem] border p-4 text-center transition-transform duration-200 hover:-translate-y-0.5 ${a.earned ? 'border-forest/20 bg-white shadow-soft' : 'border-dashed border-line bg-cream/60'}`}>
            <div className={`grid h-16 w-16 place-items-center ${a.earned ? '' : 'opacity-40 grayscale'}`}>
              {a.image ? <img src={a.image} alt="" className="h-14 w-14 object-contain" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-mint text-forest"><Icon className="h-7 w-7" aria-hidden /></span>}
            </div>
            <p className="mt-2 font-bold">{c.title}</p>
            <p className="text-xs text-muted">{c.requirement}</p>
            <p className={`mt-2 text-[11px] font-bold ${a.earned ? 'text-forest' : 'text-muted'}`}>
              {a.earned ? t('pr.earned', { date: formatDate(a.earnedAt, lang) }) : <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden />{t('pr.progressTo', { c: formatNumber(Math.min(a.current, a.threshold), lang), t: formatNumber(a.threshold, lang) })}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function ProgressPage() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('actions');
  const { data, loading, error, reload } = useApi('/progress');
  return (
    <>
      <div className="mb-4"><BackButton /></div>
      <PageHeader title={t('pr.title')} subtitle={t('pr.sub')} testId="progress-title" />
      {loading && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-4"><Pills value={tab} onChange={setTab} testId="progress-tab" tone="forest" label={t('pr.title')}
              options={[{ value: 'actions', label: t('pr.tabActions') }, { value: 'rewards', label: t('pr.tabRewards') }]} /></div>
            {tab === 'actions' ? <ActionsTab data={data} /> : (
              <section className="surface rounded-[2rem] p-5 sm:p-6">
                <RewardsGrid achievements={data.achievements} />
                <div className="mt-6 rounded-2xl bg-cream p-4"><p className="text-sm font-bold">{t('pr.rulesTitle')}</p><p className="mt-1 text-sm text-muted">{t('pr.rulesBody')}</p></div>
              </section>
            )}
          </div>
          <aside className="space-y-6">
            <section className="grain relative overflow-hidden rounded-[2rem_2rem_2rem_.75rem] bg-mint p-6 text-center" data-testid="progress-reduction">
              <h2 className="text-lg font-bold text-forest">{t('pr.reduced')}</h2>
              <p className="mt-1 text-4xl font-extrabold text-forest" data-testid="progress-reduction-kg">{formatNumber(data.reductionKg, lang)} <span className="text-lg">kg CO₂e</span></p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-forest/90"><Trees className="h-4 w-4" aria-hidden />{t('pr.treesEq', { n: formatNumber(data.treesEquivalentMonth, lang) })}</p>
              <p className="mt-2 text-xs text-forest/70">{t('pr.reductionNote')}</p>
            </section>
            {tab === 'actions' && (
              <section>
                <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold">{t('pr.rewards')}</h2>
                  <button type="button" onClick={() => setTab('rewards')} className="inline-flex items-center gap-1 text-sm font-bold text-forest hover:underline" data-testid="progress-see-rewards">{t('common.seeAll')}<ArrowRight className="h-4 w-4" aria-hidden /></button></div>
                <RewardsGrid achievements={data.achievements.slice(0, 3)} />
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCheck, Bookmark, X, Info } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { BackButton, IconTile } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { StatusChip, RewardModal } from '../../components/recommendations/RecommendationParts';
import { AiChat } from '../../components/ai/AiChat';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatNumber, errorMessage } from '../../utils/format';

function Actions({ rec, onChange }) {
  const { t } = useLang();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const run = async (status, msgKey) => {
    setBusy(status);
    try {
      const res = await api.patch(`/user/recommendations/${rec.id}`, { status });
      toast.success(t(msgKey));
      onChange(res);
    } catch (err) {
      toast.error(err.code === 'MUST_START_FIRST' ? t('rec.mustStart') : errorMessage(err, t));
    } finally { setBusy(null); }
  };
  const s = rec.userStatus;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t('rec.statusLabel')} data-testid="recommendation-actions">
      {(!s || s === 'SAVED') && <Button variant="forest" icon={Play} loading={busy === 'IN_PROGRESS'} onClick={() => run('IN_PROGRESS', 'rec.started')} data-testid="recommendation-start-button">{t('rec.start')}</Button>}
      {!s && <Button variant="outline" icon={Bookmark} loading={busy === 'SAVED'} onClick={() => run('SAVED', 'rec.saved')} data-testid="recommendation-save-button">{t('rec.save')}</Button>}
      {s === 'IN_PROGRESS' && <Button variant="forest" icon={CheckCheck} loading={busy === 'DONE'} onClick={() => run('DONE', 'rec.done')} data-testid="recommendation-done-button">{t('rec.markDone')}</Button>}
      {(s === 'IN_PROGRESS' || s === 'SAVED') && <Button variant="ghost" icon={X} loading={busy === 'NONE'} onClick={() => run('NONE', 'rec.removed')} data-testid="recommendation-cancel-button">{t('rec.cancel')}</Button>}
    </div>
  );
}

export default function RecommendationDetailPage() {
  const { id } = useParams();
  const { t, pick, lang } = useLang();
  const { data: rec, loading, error, reload, setData } = useApi(`/recommendations/${id}`);
  const [rewards, setRewards] = useState(null);

  if (loading) return <PageSkeleton />;
  if (error) return error.status === 404 ? <EmptyState title={t('rec.empty')} testId="recommendation-not-found" /> : <ErrorMessage error={error} onRetry={reload} />;
  const c = pick(rec.content);

  return (
    <>
      <div className="mb-4"><BackButton to="/recommendations" /></div>
      <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <article>
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {rec.image
              ? <img src={rec.image} alt="" className="h-28 w-36 rounded-[1.5rem] bg-white object-contain p-2 shadow-soft" />
              : <IconTile icon={getIcon(rec.icon)} tone={ACTIVITY_TONE[rec.activityType]} size="lg" />}
            <div>
              <h1 className="text-[1.85rem] font-extrabold leading-tight sm:text-4xl" data-testid="recommendation-title">{c.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-forest px-3 py-1 text-sm font-semibold text-white">{t(`act.${rec.activityType}`)}</span>
                <StatusChip status={rec.userStatus} />
              </div>
            </div>
          </header>
          <section className="mt-8">
            <h2 className="text-xl font-bold sm:text-2xl">{t('rec.why')}</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/80 sm:text-base">{c.reason}</p>
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-bold sm:text-2xl">{t('rec.how')}</h2>
            <ol className="mt-3 space-y-3">
              {c.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span><span className="pt-0.5 text-[15px] sm:text-base">{s}</span></li>
              ))}
            </ol>
          </section>
          <section className="mt-8 rounded-[2rem_2rem_2rem_.75rem] bg-mint p-6" data-testid="recommendation-reduction">
            <h2 className="text-lg font-bold text-forest">{t('rec.reduction')}</h2>
            <p className="mt-1"><span className="text-4xl font-extrabold text-forest">±{formatNumber(rec.reductionKgPerMonth, lang)}</span> <span className="font-bold text-forest">kg CO₂e</span> <span className="text-sm text-forest/80">{t('rec.perMonth')}</span></p>
            <p className="mt-3 text-sm text-forest/90">{t('rec.assumption', { text: c.assumption })}</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-forest/80"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t('rec.disclaimer')}</p>
          </section>
          <div className="mt-6"><Actions rec={rec} onChange={(res) => { setData(res.recommendation); if (res.newlyEarned?.length) setRewards(res.newlyEarned); }} /></div>
        </article>
        <aside className="xl:sticky xl:top-24 xl:self-start"><AiChat recommendationId={rec.id} topic={c.title.toLowerCase()} compact /></aside>
      </div>
      <RewardModal rewards={rewards} onClose={() => setRewards(null)} />
    </>
  );
}

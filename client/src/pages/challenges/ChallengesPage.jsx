import { useMemo, useState } from 'react';
import { Flag, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PageHeader, Pills, IconTile } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { RewardModal } from '../../components/recommendations/RecommendationParts';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatDate, errorMessage } from '../../utils/format';

function ChallengeCard({ ch, busy, onJoin, onCheckin }) {
  const { t, pick, lang } = useLang();
  const c = pick(ch.content);
  const pct = Math.min(100, (ch.progress / ch.target) * 100);
  const when = ch.nextCheckinAt && formatDate(ch.nextCheckinAt, lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const stateLabel = { NOT_JOINED: t('ch.statusNot'), JOINED: t('ch.statusJoined'), COMPLETED: t('ch.completed'), EXPIRED: t('ch.expired') }[ch.state];
  return (
    <li className="surface flex flex-col gap-4 rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:p-5" data-testid={`challenge-card-${ch.slug}`}>
      <IconTile icon={getIcon(ch.icon)} tone={ACTIVITY_TONE[ch.activityType]} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold sm:text-lg">{c.title}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ch.state === 'COMPLETED' ? 'bg-mint text-forest' : ch.state === 'JOINED' ? 'bg-[#F6E7C8] text-warning' : 'bg-cream text-muted'}`} data-testid={`challenge-state-${ch.slug}`}>{stateLabel}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{c.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 max-w-xs flex-1 overflow-hidden rounded-full bg-[#E4E0DB]" role="progressbar" aria-valuenow={ch.progress} aria-valuemin={0} aria-valuemax={ch.target} aria-label={c.title}>
            <div className="h-full rounded-full bg-forest transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold" data-testid={`challenge-progress-${ch.slug}`}>{t('ch.progress', { p: ch.progress, t: ch.target })}</span>
        </div>
        <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">
          <span>{t('ch.rule')}: {c.rule}</span>
          <span>· {t('ch.period', { n: ch.periodDays })} · {t('ch.points', { n: ch.rewardPoints })}</span>
          {ch.state === 'JOINED' && ch.endsAt && <span>· {t('ch.endsAt', { date: formatDate(ch.endsAt, lang) })}</span>}
        </p>
        {when && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning"><Clock className="h-3.5 w-3.5" aria-hidden />{t('ch.cooldown', { time: when })}</p>}
      </div>
      <div className="shrink-0">
        {ch.state === 'NOT_JOINED' && <Button variant="forest" loading={busy} onClick={() => onJoin(ch)} data-testid={`challenge-join-${ch.slug}`}>{t('ch.start')}</Button>}
        {ch.state === 'EXPIRED' && <Button variant="outline" loading={busy} onClick={() => onJoin(ch)} data-testid={`challenge-rejoin-${ch.slug}`}>{t('ch.rejoin')}</Button>}
        {ch.state === 'JOINED' && <Button variant="forest" loading={busy} disabled={Boolean(ch.nextCheckinAt)} onClick={() => onCheckin(ch)} data-testid={`challenge-checkin-${ch.slug}`}>{ch.progress ? t('ch.continue') : t('ch.checkin')}</Button>}
        {ch.state === 'COMPLETED' && <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-bold text-forest"><CheckCircle2 className="h-4 w-4" aria-hidden />{t('ch.completed')}</span>}
      </div>
    </li>
  );
}

export default function ChallengesPage() {
  const { t, pick } = useLang();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi('/challenges');
  const [cat, setCat] = useState('ALL');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [rewards, setRewards] = useState(null);
  const items = useMemo(() => (data?.items || []).filter((c) => cat === 'ALL' || c.activityType === cat), [data, cat]);
  const replace = (ch) => setData({ items: data.items.map((x) => (x.id === ch.id ? ch : x)) });

  const join = async (ch) => {
    setBusy(ch.id);
    try { replace(await api.post(`/challenges/${ch.id}/join`)); toast.success(t('ch.joined', { name: pick(ch.content).title })); }
    catch (err) { toast.error(errorMessage(err, t)); } finally { setBusy(null); }
  };
  const checkin = async () => {
    const ch = confirm;
    setBusy(ch.id);
    try {
      const res = await api.patch(`/challenges/${ch.id}/progress`);
      replace(res.challenge);
      if (res.completed) toast.success(t('ch.done', { name: pick(ch.content).title }));
      else toast.success(t('ch.checked', { p: res.challenge.progress, t: res.challenge.target }));
      if (res.newlyEarned?.length) setRewards(res.newlyEarned);
    } catch (err) { toast.error(errorMessage(err, t)); reload(); } finally { setBusy(null); setConfirm(null); }
  };

  const options = [{ value: 'ALL', label: t('rec.all') }, ...['TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS'].map((c) => ({ value: c, label: t(`act.${c}`) }))];
  return (
    <>
      <PageHeader title={t('ch.title')} subtitle={t('ch.sub')} testId="challenges-title" actions={<Button variant="forest" icon={Trophy} to="/progress" data-testid="challenges-my-progress">{t('ch.mine')}</Button>} />
      <div className="mb-6"><Pills value={cat} onChange={setCat} options={options} testId="challenge-tab" label={t('ch.title')} tone="forest" /></div>
      {loading && !data && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (items.length ? <ul className="stagger space-y-3" data-testid="challenge-list">{items.map((ch) => <ChallengeCard key={ch.id} ch={ch} busy={busy === ch.id} onJoin={join} onCheckin={setConfirm} />)}</ul>
        : <EmptyState icon={Flag} title={t('ch.empty')} testId="challenges-empty" />)}
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={checkin} loading={Boolean(busy)} danger={false} testId="challenge-checkin-dialog"
        title={t('ch.confirmTitle')} body={confirm ? t('ch.confirmBody', { name: pick(confirm.content).title }) : ''} confirmLabel={t('ch.confirm')} />
      <RewardModal rewards={rewards} onClose={() => setRewards(null)} />
    </>
  );
}

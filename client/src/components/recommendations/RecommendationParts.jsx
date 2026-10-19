import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { IconTile } from '../common/Page';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatKg } from '../../utils/format';

export function StatusChip({ status }) {
  const { t } = useLang();
  if (!status) return null;
  const cls = { SAVED: 'bg-peach text-brown', IN_PROGRESS: 'bg-[#F6E7C8] text-warning', DONE: 'bg-mint text-forest' }[status];
  return <span data-testid="recommendation-status-chip" className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{t(`rec.status.${status}`)}</span>;
}

export function RecommendationCard({ rec }) {
  const { t, pick, lang } = useLang();
  const c = pick(rec.content);
  return (
    <Link to={`/recommendations/${rec.id}`} data-testid={`recommendation-card-${rec.slug}`}
      className="group surface flex items-center gap-4 rounded-[1.75rem] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <IconTile icon={getIcon(rec.icon)} tone={ACTIVITY_TONE[rec.activityType]} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold sm:text-lg">{c.title}</h3>
          {rec.relevant && <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 text-[11px] font-bold text-terracotta"><Sparkles className="h-3 w-3" aria-hidden />{t('rec.relevant')}</span>}
          <StatusChip status={rec.userStatus} />
        </div>
        <p className="mt-0.5 text-sm text-muted">{t('rec.potential', { kg: formatKg(rec.reductionKgPerMonth, lang) })}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

export function RewardModal({ rewards, onClose }) {
  const { t, pick } = useLang();
  return (
    <Modal open={Boolean(rewards?.length)} onClose={onClose} title={t('reward.newTitle')} size="sm" testId="reward-modal"
      footer={<><Button variant="outline" onClick={onClose}>{t('common.close')}</Button><Button variant="forest" to="/progress" onClick={onClose} data-testid="reward-modal-view">{t('reward.view')}</Button></>}>
      <p className="mb-4 text-sm text-muted">{t('reward.newBody')}</p>
      <ul className="space-y-3">
        {rewards?.map((r) => {
          const Icon = getIcon(r.icon);
          return (
            <li key={r.id} className="flex animate-pop items-center gap-3 rounded-2xl bg-mint p-3">
              {r.image ? <img src={r.image} alt="" className="h-12 w-12 object-contain" /> : <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-forest"><Icon className="h-6 w-6" aria-hidden /></span>}
              <div><p className="font-bold text-forest">{pick(r.content).title}</p><p className="text-xs text-forest/80">{pick(r.content).requirement}</p></div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

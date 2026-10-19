import { useState } from 'react';
import { Target, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Field, TextInput } from '../common/Input';
import { formatKg, formatNumber, errorMessage } from '../../utils/format';

function TargetModal({ open, onClose, current, onSaved }) {
  const { t } = useLang();
  const toast = useToast();
  const { setUser } = useAuth();
  const [value, setValue] = useState(current ? String(current) : '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const save = async (kg) => {
    if (kg !== null) {
      const n = Number(String(value).replace(',', '.'));
      if (!value.trim()) return setError({ code: 'required' });
      if (!Number.isFinite(n)) return setError({ code: 'number' });
      if (n < 1) return setError({ code: 'min', params: { min: 1 } });
      if (n > 100000) return setError({ code: 'max', params: { max: 100000 } });
      kg = n;
    }
    setBusy(kg === null ? 'remove' : 'save');
    try {
      const { user } = await api.patch('/user/target', { monthlyTargetKg: kg });
      setUser(user);
      toast.success(kg === null ? t('target.removed') : t('target.saved'));
      onSaved();
    } catch (err) { toast.error(errorMessage(err, t)); } finally { setBusy(null); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('target.modalTitle')} size="sm" testId="target-modal"
      footer={(
        <>
          {current && <Button variant="ghost" loading={busy === 'remove'} onClick={() => save(null)} data-testid="target-remove-button">{t('target.remove')}</Button>}
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={busy === 'save'} onClick={() => save(0)} data-testid="target-save-button">{t('common.save')}</Button>
        </>
      )}>
      <p className="mb-4 text-sm text-muted">{t('target.help')}</p>
      <Field label={t('target.label')} htmlFor="target-kg" unit="kg CO₂e" required error={error ? t(`v.${error.code}`, error.params) : ''}>
        <TextInput id="target-kg" type="number" inputMode="decimal" min="1" max="100000" step="0.1" value={value} error={error}
          onChange={(e) => { setValue(e.target.value); setError(null); }} placeholder="100" data-testid="target-input" />
      </Field>
    </Modal>
  );
}

export function TargetCard({ data, onChanged }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const tg = data.target;
  const over = tg && tg.overKg > 0;
  const tone = !tg ? 'bg-white' : over ? 'bg-[#FDF3F1]' : tg.usedPct >= 80 ? 'bg-[#FBF3E3]' : 'bg-mint';
  const bar = over ? 'bg-danger' : tg?.usedPct >= 80 ? 'bg-warning' : 'bg-forest';
  return (
    <section className={`surface rounded-[2rem_2rem_2rem_.75rem] p-5 sm:p-6 ${tone}`} data-testid="dashboard-target-card">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-terracotta ring-1 ring-line"><Target className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{t('target.title')}</h2>
          {tg ? (
            <p className="text-sm text-ink/80" data-testid="target-status">
              {over ? t('target.over', { kg: formatKg(tg.overKg, lang) }) : t('target.remaining', { kg: formatKg(tg.remainingKg, lang) })}
            </p>
          ) : <p className="text-sm text-muted">{t('target.empty')}</p>}
        </div>
        <Button size="sm" variant={tg ? 'outline' : 'primary'} icon={tg ? Pencil : Target} onClick={() => setOpen(true)} data-testid="target-edit-button">{tg ? t('common.edit') : t('target.set')}</Button>
      </div>
      {tg && (
        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={tg.usedPct} aria-valuemin={0} aria-valuemax={100} aria-label={t('target.title')}>
            <div className={`h-full rounded-full transition-[width] duration-700 ${bar}`} style={{ width: `${Math.min(100, tg.usedPct)}%` }} />
          </div>
          <p className="mt-2 flex justify-between text-xs font-semibold text-muted">
            <span data-testid="target-used">{t('target.used', { pct: formatNumber(tg.usedPct, lang), kg: formatNumber(data.thisMonthKg, lang) })}</span>
            <span>{t('target.of', { kg: formatKg(tg.kg, lang) })}</span>
          </p>
        </div>
      )}
      {open && <TargetModal open={open} onClose={() => setOpen(false)} current={tg?.kg} onSaved={() => { setOpen(false); onChanged(); }} />}
    </section>
  );
}

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { Modal } from '../common/Modal';
import { FactorBadge } from '../common/Page';
import { formatNumber, formatKg } from '../../utils/format';

export function lineValue(line, pick, lang) {
  const v = typeof line.value === 'number' ? formatNumber(line.value, lang, 2) : pick(line.value);
  return line.unit ? `${v} ${pick(line.unit)}` : v;
}

export function BreakdownList({ lines, total }) {
  const { t, pick, lang } = useLang();
  return (
    <dl className="divide-y divide-line/70" data-testid="calculation-breakdown">
      {lines.map((l) => (
        <div key={l.key} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-sm font-medium text-muted">{pick(l.label)}</dt>
          <dd className="text-right text-[15px] font-bold text-ink sm:text-lg" data-testid={`breakdown-${l.key}`}>{lineValue(l, pick, lang)}</dd>
        </div>
      ))}
      {total !== undefined && (
        <div className="flex items-baseline justify-between gap-4 pt-5">
          <dt className="text-lg font-bold sm:text-xl">{t('calc.totalEmission')}</dt>
          <dd className="text-right text-lg font-extrabold text-terracotta sm:text-xl" data-testid="breakdown-total">{formatKg(total, lang, 3)}</dd>
        </div>
      )}
    </dl>
  );
}

export function FactorInfo({ factors }) {
  const { t, pick, lang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-testid="factor-info-button"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brown ring-1 ring-line transition-colors hover:bg-peach/50">
        <Info className="h-3.5 w-3.5" aria-hidden />{t('calc.viewFactor')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('calc.factorDetail')} testId="factor-modal">
        <p className="mb-4 rounded-2xl bg-[#F6E7C8] p-3 text-sm text-warning">{t('calc.factorNote')}</p>
        <p className="mb-4 text-sm text-muted"><span className="font-semibold text-ink">{t('calc.formula')}:</span> {lang === 'en' ? 'emissions = activity data × emission factor' : 'emisi = data aktivitas × faktor emisi'}</p>
        <ul className="space-y-3">
          {factors.map((f) => (
            <li key={f.key} className="rounded-2xl border border-line bg-white p-4" data-testid={`factor-${f.key}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{pick(f.name)}</p><FactorBadge status={f.status} />
              </div>
              <p className="mt-1 text-sm font-semibold text-terracotta">{formatNumber(f.value, lang, 4)} {f.outputUnit}/{f.inputUnit}</p>
              <p className="mt-2 text-xs text-muted"><span className="font-semibold">{t('calc.source')}:</span> {f.source}{f.year ? ` (${f.year})` : ''}</p>
              {f.notes && <p className="mt-1 text-xs text-muted">{f.notes}</p>}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

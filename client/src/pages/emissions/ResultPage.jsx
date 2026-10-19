import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { useCalculator } from '../../context/CalculatorContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PageHeader, BackButton, FactorBadge } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { Stepper } from '../../components/activities/CalculatorParts';
import { BreakdownList, FactorInfo } from '../../components/emissions/Breakdown';
import { formatNumber, formatDate, errorMessage } from '../../utils/format';

const TIP = { VEHICLE: 'calc.tipTransport', ENERGY: 'calc.tipEnergy', ELECTRONICS: 'calc.tipElectronics' };

export default function ResultPage() {
  const { t, pick, lang } = useLang();
  const { draft, reset } = useCalculator();
  const toast = useToast();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const r = draft.result;
  if (!r) return <Navigate to="/calculator" replace />;

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/calculations', { activity: draft.activity, subType: draft.subType, inputs: draft.inputs });
      toast.success(t('calc.saved'));
      reset();
      nav('/history');
    } catch (err) {
      toast.error(errorMessage(err, t));
      setSaving(false);
    }
  };
  const zero = r.resultKg === 0;

  return (
    <>
      <div className="mb-4"><BackButton to={`/calculator/${draft.activity}/${draft.subType}`} /></div>
      <Stepper step={4} />
      <PageHeader title={t('calc.resultTitle')} subtitle={`${pick(r.itemName)} · ${formatDate(r.activityDate, lang)}`} testId="result-title" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="surface flex items-center gap-5 rounded-[2rem_2rem_2rem_.75rem] p-6" data-testid="result-summary">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-peach/70 text-terracotta"><BookOpenCheck className="h-6 w-6" aria-hidden /></span>
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2"><span className="text-4xl font-extrabold" data-testid="result-kg">{formatNumber(r.resultKg, lang, 2)}</span><span className="text-lg font-bold text-terracotta">kg CO₂e</span></p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CheckCircle2 className="h-4 w-4 text-terracotta" aria-hidden />{t('calc.treesMonth', { n: formatNumber(r.equivalentTreesMonth, lang) })}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2"><FactorBadge status={r.factor.status} /><FactorInfo factors={r.breakdown.factors} /></div>
          </div>
        </section>
        <section className={`flex items-start gap-3 rounded-[2rem] p-6 ${zero ? 'bg-mint' : 'bg-peach/80'}`} data-testid="result-insight">
          {zero ? <CheckCircle2 className="h-6 w-6 shrink-0 text-forest" aria-hidden /> : <Lightbulb className="h-6 w-6 shrink-0 text-terracotta" aria-hidden />}
          <div>
            <h2 className="font-bold">{zero ? t('calc.goodTitle') : t('calc.tipTitle')}</h2>
            <p className="mt-1 text-sm text-ink/80">{zero ? t('calc.zeroBody') : t(TIP[r.impactCategory])}</p>
          </div>
        </section>
      </div>
      <section className="surface mt-6 rounded-[2rem] p-5 sm:p-7">
        <h2 className="mb-2 text-xl font-bold">{t('calc.breakdown')}</h2>
        <BreakdownList lines={[...r.breakdown.lines, { key: 'periodDays', label: { id: 'Periode', en: 'Period' }, value: r.periodDays, unit: { id: 'hari', en: 'days' } }]} total={r.resultKg} />
      </section>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" icon={RotateCcw} to={`/calculator/${draft.activity}/${draft.subType}`} data-testid="result-again-button">{t('calc.again')}</Button>
        <Button iconRight={ArrowRight} onClick={save} loading={saving} data-testid="result-save-button">{t('calc.saveHistory')}</Button>
      </div>
    </>
  );
}

import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { useActivities } from '../../hooks/useActivities';
import { useCalculator } from '../../context/CalculatorContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PageHeader, BackButton, IconTile } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { PageSkeleton, ErrorMessage } from '../../components/common/Feedback';
import { Stepper } from '../../components/activities/CalculatorParts';
import { DynamicForm, initialValues, validateClient } from '../../components/activities/DynamicForm';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { errorMessage } from '../../utils/format';

function InputForm({ def, sub, activity, subType }) {
  const { t, pick } = useLang();
  const { draft, update } = useCalculator();
  const toast = useToast();
  const nav = useNavigate();
  const saved = draft.activity === activity && draft.subType === subType ? draft.inputs : null;
  const [values, setValues] = useState(() => initialValues(sub.fields, saved));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (next, name) => { setValues(next); setErrors((e) => ({ ...e, [name]: undefined })); };
  const reset = () => { setValues(initialValues(sub.fields)); setErrors({}); update({ inputs: null, result: null }); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateClient(sub.fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error(t('calc.fixErrors')); return; }
    setLoading(true);
    try {
      const result = await api.post('/calculations/preview', { activity, subType, inputs: values });
      update({ activity, subType, inputs: values, result });
      nav('/calculator/result');
    } catch (err) {
      if (err.details?.fields) { setErrors(err.details.fields); toast.error(t('calc.fixErrors')); }
      else toast.error(errorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate data-testid="activity-input-form">
      <div className="surface rounded-[2rem] p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <IconTile icon={getIcon(sub.icon)} tone={ACTIVITY_TONE[def.type]} />
          <div><p className="label-sm">{pick(def.label)}</p><p className="text-lg font-bold">{pick(sub.label)}</p></div>
        </div>
        <DynamicForm fields={sub.fields} values={values} errors={errors} onChange={onChange} />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" icon={RotateCcw} onClick={reset} data-testid="input-reset-button">{t('calc.reset')}</Button>
        <Button type="submit" iconRight={ArrowRight} loading={loading} data-testid="input-calculate-button">{t('calc.calculate')}</Button>
      </div>
    </form>
  );
}

export default function InputActivityPage() {
  const { activity, subType } = useParams();
  const { t } = useLang();
  const { data, loading, error, reload } = useActivities();
  const def = useMemo(() => data?.find((a) => a.slug === activity), [data, activity]);
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const sub = def?.subTypes[subType];
  if (!sub) return <Navigate to="/calculator" replace />;
  return (
    <>
      <div className="mb-4"><BackButton to={`/calculator/${activity}`} /></div>
      <Stepper step={3} />
      <PageHeader title={t('calc.inputTitle')} subtitle={t('calc.inputSub')} />
      <InputForm key={`${activity}-${subType}`} def={def} sub={sub} activity={activity} subType={subType} />
    </>
  );
}

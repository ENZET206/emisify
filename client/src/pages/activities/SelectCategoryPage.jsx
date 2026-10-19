import { Navigate, useParams } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useActivities } from '../../hooks/useActivities';
import { useCalculator } from '../../context/CalculatorContext';
import { PageHeader, BackButton } from '../../components/common/Page';
import { PageSkeleton, ErrorMessage } from '../../components/common/Feedback';
import { Stepper, OptionCard } from '../../components/activities/CalculatorParts';
import { ACTIVITY_TONE } from '../../utils/icons';

export default function SelectCategoryPage() {
  const { activity } = useParams();
  const { t, pick } = useLang();
  const { data, loading, error, reload } = useActivities();
  const { draft, update } = useCalculator();
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  const def = data.find((a) => a.slug === activity);
  if (!def) return <Navigate to="/calculator" replace />;
  return (
    <>
      <div className="mb-4"><BackButton to="/calculator" /></div>
      <Stepper step={2} />
      <PageHeader eyebrow={pick(def.label)} title={t('calc.categoryTitle')} subtitle={t('calc.categorySub')} />
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(def.subTypes).map(([key, sub], i) => (
          <OptionCard key={key} index={i} to={`/calculator/${activity}/${key}`} icon={sub.icon} title={pick(sub.label)} desc={pick(sub.desc)}
            tone={ACTIVITY_TONE[def.type]} testId={`category-option-${key}`} selected={draft.activity === activity && draft.subType === key}
            onClick={() => (draft.activity !== activity || draft.subType !== key) && update({ activity, subType: key, inputs: null, result: null })} />
        ))}
      </div>
    </>
  );
}

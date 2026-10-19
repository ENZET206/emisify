import { useLang } from '../../context/LangContext';
import { useActivities } from '../../hooks/useActivities';
import { useCalculator } from '../../context/CalculatorContext';
import { PageHeader } from '../../components/common/Page';
import { PageSkeleton, ErrorMessage } from '../../components/common/Feedback';
import { Stepper, OptionCard } from '../../components/activities/CalculatorParts';
import { ACTIVITY_TONE } from '../../utils/icons';

export default function SelectActivityPage() {
  const { t, pick } = useLang();
  const { data, loading, error, reload } = useActivities();
  const { draft, update } = useCalculator();
  return (
    <>
      <Stepper step={1} />
      <PageHeader title={t('calc.selectTitle')} subtitle={t('calc.selectSub')} />
      {loading && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {data.map((a, i) => (
            <OptionCard key={a.slug} index={i} to={`/calculator/${a.slug}`} icon={a.icon} title={pick(a.label)} desc={pick(a.desc)} tone={ACTIVITY_TONE[a.type]}
              selected={draft.activity === a.slug} testId={`activity-option-${a.slug}`}
              onClick={() => draft.activity !== a.slug && update({ activity: a.slug, subType: null, inputs: null, result: null })} />
          ))}
        </div>
      )}
    </>
  );
}

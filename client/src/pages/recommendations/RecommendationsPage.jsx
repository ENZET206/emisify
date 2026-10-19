import { useState } from 'react';
import { Footprints } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { PageHeader, Pills } from '../../components/common/Page';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { RecommendationCard } from '../../components/recommendations/RecommendationParts';

export default function RecommendationsPage() {
  const { t } = useLang();
  const [cat, setCat] = useState('ALL');
  const { data, loading, error, reload } = useApi(`/recommendations?category=${cat}`);
  const options = [{ value: 'ALL', label: t('rec.all') }, ...['TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS'].map((c) => ({ value: c, label: t(`act.${c}`) }))];
  return (
    <>
      <PageHeader title={t('rec.title')} subtitle={t('rec.sub')} testId="recommendations-title" />
      <div className="mb-6 border-b border-line pb-5"><Pills value={cat} onChange={setCat} options={options} testId="recommendation-tab" label={t('rec.title')} /></div>
      {loading && !data && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (data.items.length ? (
        <div className={`stagger space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`} data-testid="recommendation-list">
          {data.items.map((r) => <RecommendationCard key={r.id} rec={r} />)}
        </div>
      ) : <EmptyState icon={Footprints} title={t('rec.empty')} testId="recommendations-empty" />)}
    </>
  );
}

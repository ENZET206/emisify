import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2, History as HistoryIcon, ArrowRight, FileSpreadsheet, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PageHeader, IconTile } from '../../components/common/Page';
import { FilterSelect } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatKg, formatDate, errorMessage } from '../../utils/format';

export default function HistoryPage() {
  const { t, pick, lang } = useLang();
  const toast = useToast();
  const [f, setF] = useState({ category: 'ALL', range: 'all', sort: 'newest' });
  const { data, loading, error, reload } = useApi(`/calculations?category=${f.category}&range=${f.range}&sort=${f.sort}`);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const filtered = f.category !== 'ALL' || f.range !== 'all';
  const exportUrl = (format) => `${import.meta.env.VITE_API_URL || ''}/api/calculations/export?format=${format}&lang=${lang}&category=${f.category}&range=${f.range}&sort=${f.sort}`;

  const remove = async () => {
    setDeleting(true);
    try {
      await api.del(`/calculations/${target.id}`);
      toast.success(t('history.deleted'));
      setTarget(null);
      reload();
    } catch (err) { toast.error(errorMessage(err, t)); } finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title={t('history.title')} testId="history-title" actions={data?.count > 0 && (
        <>
          <Button variant="outline" size="sm" icon={FileSpreadsheet} href={exportUrl('csv')} as="a" onClick={() => toast.info(t('history.exporting'))} data-testid="history-export-csv">CSV</Button>
          <Button variant="outline" size="sm" icon={FileText} href={exportUrl('pdf')} as="a" onClick={() => toast.info(t('history.exporting'))} data-testid="history-export-pdf">PDF</Button>
        </>
      )} />
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <FilterSelect label={t('history.filterCat')} value={f.category} onChange={set('category')} testId="history-filter-category"
          options={[{ value: 'ALL', label: t('history.allCat') }, ...['TRANSPORT', 'ELECTRICITY', 'AC', 'ELECTRONICS'].map((c) => ({ value: c, label: t(`act.${c}`) }))]} />
        <FilterSelect label={t('history.filterDate')} value={f.range} onChange={set('range')} testId="history-filter-date"
          options={[['all', 'history.allDate'], ['7d', 'history.7d'], ['30d', 'history.30d'], ['month', 'history.month'], ['lastMonth', 'history.lastMonth']].map(([value, k]) => ({ value, label: t(k) }))} />
        <FilterSelect label={t('history.sort')} value={f.sort} onChange={set('sort')} testId="history-sort"
          options={['newest', 'oldest', 'highest', 'lowest'].map((value) => ({ value, label: `${t('history.sort')}: ${t(`history.${value}`)}` }))} />
      </div>
      {loading && !data && <PageSkeleton />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (data.items.length === 0 ? (
        <EmptyState icon={HistoryIcon} title={filtered ? t('history.emptyFilter') : t('history.empty')} body={filtered ? null : t('history.emptyBody')} testId="history-empty"
          action={!filtered && <Button to="/calculator" iconRight={ArrowRight} data-testid="history-empty-start">{t('dash.startCalc')}</Button>} />
      ) : (
        <>
          <ul className={`stagger space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`} data-testid="history-list">
            {data.items.map((c) => (
              <li key={c.id} className="surface group flex items-center gap-3 rounded-[1.5rem] p-3 pr-2 transition-shadow hover:shadow-lift sm:gap-4 sm:p-4" data-testid={`history-item-${c.id}`}>
                <Link to={`/items/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4" data-testid={`history-item-link-${c.id}`}>
                  <IconTile icon={getIcon(c.icon)} tone={ACTIVITY_TONE[c.activityType]} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold sm:text-lg">{pick(c.itemName)}</span>
                    <span className="block text-xs text-muted sm:text-sm">{t(`act.${c.activityType}`)} · {formatDate(c.activityDate, lang)}</span>
                  </span>
                  <span className="whitespace-nowrap text-right text-sm font-extrabold sm:text-lg" data-testid={`history-item-kg-${c.id}`}>{formatKg(c.resultKg, lang)}</span>
                  <ChevronRight className="hidden h-4 w-4 text-muted sm:block" aria-hidden />
                </Link>
                <button type="button" onClick={() => setTarget(c)} aria-label={t('history.deleteAria', { name: pick(c.itemName) })} data-testid={`history-delete-${c.id}`}
                  className="rounded-full p-2.5 text-muted transition-colors hover:bg-[#FDECEA] hover:text-danger"><Trash2 className="h-[18px] w-[18px]" /></button>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-24 mt-6 flex items-center justify-between rounded-[1.5rem] bg-ink px-5 py-4 text-white shadow-lift lg:bottom-4" data-testid="history-total">
            <div><p className="text-xs text-white/70">{t('history.total')} · {t('history.entries', { n: data.count })}</p><p className="text-lg font-extrabold" data-testid="history-total-kg">{formatKg(data.totalKg, lang)}</p></div>
            <Link to="/impact" className="inline-flex items-center gap-1 text-sm font-bold text-peach hover:underline" data-testid="history-see-impact">{t('common.seeDetail')}<ChevronRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </>
      ))}
      <ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} onConfirm={remove} loading={deleting} testId="history-delete-dialog"
        title={t('history.deleteTitle')} body={target ? t('history.deleteBody', { name: pick(target.itemName), kg: formatKg(target.resultKg, lang) }) : ''} confirmLabel={t('common.delete')} />
    </>
  );
}

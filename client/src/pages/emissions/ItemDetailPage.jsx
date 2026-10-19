import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, CalendarDays, Trees } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useActivities } from '../../hooks/useActivities';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { BackButton, FactorBadge } from '../../components/common/Page';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PageSkeleton, ErrorMessage, EmptyState } from '../../components/common/Feedback';
import { DynamicForm, initialValues, validateClient } from '../../components/activities/DynamicForm';
import { BreakdownList, FactorInfo } from '../../components/emissions/Breakdown';
import { getIcon, ACTIVITY_TONE } from '../../utils/icons';
import { formatKg, formatNumber, formatDate, errorMessage } from '../../utils/format';

function EditModal({ item, fields, open, onClose, onSaved }) {
  const { t, pick, lang } = useLang();
  const toast = useToast();
  const [values, setValues] = useState(() => initialValues(fields, item.inputs));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const errs = validateClient(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/items/${item.id}`, { inputs: values });
      toast.success(t('item.updated', { kg: formatKg(updated.resultKg, lang, 2) }));
      onSaved(updated);
    } catch (err) {
      if (err.details?.fields) setErrors(err.details.fields);
      else toast.error(errorMessage(err, t));
    } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={t('item.editTitle', { name: pick(item.itemName) })} size="lg" testId="item-edit-modal"
      footer={<><Button variant="outline" onClick={onClose} data-testid="item-edit-cancel">{t('common.cancel')}</Button><Button onClick={save} loading={saving} data-testid="item-edit-save">{t('item.saveRecalc')}</Button></>}>
      <DynamicForm fields={fields} values={values} errors={errors} idPrefix="edit" onChange={(next, name) => { setValues(next); setErrors((e) => ({ ...e, [name]: undefined })); }} />
    </Modal>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams();
  const { t, pick, lang } = useLang();
  const toast = useToast();
  const nav = useNavigate();
  const { data: item, loading, error, reload, setData } = useApi(`/items/${id}`);
  const { data: activities } = useActivities();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <PageSkeleton />;
  if (error) return error.status === 404
    ? <EmptyState title={t('item.notFound')} testId="item-not-found" action={<Button to="/history">{t('nav.history')}</Button>} />
    : <ErrorMessage error={error} onRetry={reload} />;

  const fields = activities?.find((a) => a.type === item.activityType)?.subTypes[item.subType]?.fields;
  const Icon = getIcon(item.icon);
  const remove = async () => {
    setDeleting(true);
    try {
      await api.del(`/items/${item.id}`);
      toast.success(t('item.deleted'));
      nav('/history', { replace: true });
    } catch (err) { toast.error(errorMessage(err, t)); setDeleting(false); }
  };

  return (
    <>
      <div className="mb-4"><BackButton /></div>
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
        <div className="overflow-hidden rounded-[2rem_2rem_2rem_.75rem] bg-white shadow-soft">
          {item.subType === 'laptop'
            ? <img src="/assets/item-laptop.jpg" alt="Laptop" className="aspect-square w-full object-cover" />
            : <div className={`grid aspect-square w-full place-items-center ${ACTIVITY_TONE[item.activityType]}`}><Icon className="h-24 w-24" strokeWidth={1.4} aria-hidden /></div>}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl" data-testid="item-name">{pick(item.itemName)}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brown px-3 py-1 text-sm font-bold text-white" data-testid="item-category">{t(`act.${item.activityType}`)}</span>
            <span className="rounded-lg bg-peach px-3 py-1 text-sm font-semibold text-brown">{pick(item.subTypeLabel)}</span>
            <FactorBadge status={item.factor.status} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-terracotta p-5 text-white sm:col-span-1">
              <p className="text-sm text-white/80">{t('item.estimate')}</p>
              <p className="text-2xl font-extrabold" data-testid="item-kg">{formatKg(item.resultKg, lang, 2)}</p>
            </div>
            <div className="surface rounded-[1.5rem] p-5"><p className="flex items-center gap-1.5 text-sm text-muted"><CalendarDays className="h-4 w-4" aria-hidden />{t('item.date')}</p><p className="font-bold">{formatDate(item.activityDate, lang)}</p></div>
            <div className="surface rounded-[1.5rem] p-5"><p className="flex items-center gap-1.5 text-sm text-muted"><Trees className="h-4 w-4" aria-hidden />≈</p><p className="font-bold">{t('calc.treesMonth', { n: formatNumber(item.equivalentTreesMonth, lang) })}</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" className="!bg-peach !border-peach" icon={Pencil} onClick={() => setEditing(true)} disabled={!fields} data-testid="item-edit-button">{t('item.edit')}</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirm(true)} data-testid="item-delete-button">{t('item.delete')}</Button>
          </div>
        </div>
      </div>
      <section className="surface mt-8 rounded-[2rem] p-5 sm:p-7">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{t('item.inputs')}</h2><FactorInfo factors={item.breakdown.factors} /></div>
        <BreakdownList lines={item.breakdown.lines} total={item.resultKg} />
        <p className="mt-4 text-xs text-muted">{t('item.updatedAt')}: {formatDate(item.updatedAt, lang, { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </section>
      {fields && editing && <EditModal item={item} fields={fields} open={editing} onClose={() => setEditing(false)} onSaved={(u) => { setData(u); setEditing(false); }} />}
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} loading={deleting} testId="item-delete-dialog"
        title={t('item.deleteTitle')} body={t('item.deleteBody', { name: pick(item.itemName) })} confirmLabel={t('item.delete')} />
    </>
  );
}

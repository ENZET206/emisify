import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useLang } from '../../context/LangContext';

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, loading, danger = true, testId = 'confirm-dialog' }) {
  const { t } = useLang();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" testId={testId}
      footer={(
        <>
          <Button variant="outline" onClick={onClose} data-testid={`${testId}-cancel`}>{t('common.cancel')}</Button>
          <Button variant={danger ? 'dangerSolid' : 'forest'} loading={loading} onClick={onConfirm} data-testid={`${testId}-confirm`}>{confirmLabel}</Button>
        </>
      )}>
      <div className="flex gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${danger ? 'bg-[#FDECEA] text-danger' : 'bg-mint text-forest'}`}><AlertTriangle className="h-5 w-5" aria-hidden /></span>
        <p className="text-[15px] leading-relaxed text-muted">{body}</p>
      </div>
    </Modal>
  );
}

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLang } from '../../context/LangContext';

// Accessible modal: Escape to close, focus moved inside and restored, body scroll locked.
export function Modal({ open, onClose, title, children, footer, size = 'md', testId = 'modal' }) {
  const { t } = useLang();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => panel.current?.querySelector('[data-autofocus], input, select, button:not([data-close])')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-[rise_.2s_ease-out_both] bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${testId}-title`} data-testid={testId}
        className={`relative flex max-h-[92dvh] w-full ${width} animate-pop flex-col overflow-hidden rounded-t-[2rem] bg-soft shadow-lift sm:rounded-[2rem]`}>
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <h2 id={`${testId}-title`} className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" data-close onClick={onClose} aria-label={t('common.close')} data-testid={`${testId}-close`}
            className="-mr-2 -mt-1 rounded-full p-2 text-muted transition-colors hover:bg-peach/60 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line/70 bg-white/60 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

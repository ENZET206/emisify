import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const STYLES = {
  success: { icon: CheckCircle2, cls: 'border-forest/20 bg-mint text-forest' },
  error: { icon: AlertTriangle, cls: 'border-danger/20 bg-[#FDECEA] text-danger' },
  info: { icon: Info, cls: 'border-brown/15 bg-peach text-brown' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts.slice(-2), { id, type, message }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);
  const value = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6" aria-live="polite" role="status">
        {toasts.map((x) => {
          const S = STYLES[x.type];
          return (
            <div key={x.id} data-testid={`toast-${x.type}`} className={`pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lift ${S.cls}`}>
              <S.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1">{x.message}</p>
              <button type="button" onClick={() => dismiss(x.id)} aria-label="Tutup notifikasi" className="opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

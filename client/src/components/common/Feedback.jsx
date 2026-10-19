import { AlertTriangle, RotateCcw, Sprout } from 'lucide-react';
import { Button } from './Button';
import { useLang } from '../../context/LangContext';
import { errorMessage } from '../../utils/format';

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status" data-testid="loading-spinner">
      <Sprout className="h-6 w-6 animate-sway text-sage" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`relative overflow-hidden rounded-3xl bg-peach/40 ${className}`} aria-hidden><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" /></div>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading" data-testid="page-skeleton">
      <Skeleton className="h-10 w-2/3 max-w-sm" />
      <Skeleton className="h-40" />
      <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Sprout, title, body, action, testId = 'empty-state' }) {
  return (
    <div data-testid={testId} className="relative flex flex-col items-center overflow-hidden rounded-leaf border border-dashed border-sage/40 bg-white/70 px-6 py-12 text-center">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-mint/60 blur-2xl" aria-hidden />
      <span className="relative mb-4 grid h-16 w-16 place-items-center rounded-[1.5rem_1.5rem_1.5rem_.5rem] bg-mint text-forest"><Icon className="h-7 w-7" aria-hidden /></span>
      <h3 className="relative text-lg font-bold">{title}</h3>
      {body && <p className="relative mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  const { t } = useLang();
  return (
    <div data-testid="error-state" role="alert" className="flex flex-col items-start gap-3 rounded-3xl border border-danger/20 bg-[#FDF3F1] p-5 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
      <p className="flex-1 text-sm font-medium text-danger">{errorMessage(error, t)}</p>
      {onRetry && <Button variant="outline" size="sm" icon={RotateCcw} onClick={onRetry} data-testid="error-retry-button">{t('common.retry')}</Button>}
    </div>
  );
}

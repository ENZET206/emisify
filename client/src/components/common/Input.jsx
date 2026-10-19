import { forwardRef, useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export function Field({ label, required, error, helper, unit, htmlFor, children, optionalLabel }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required ? <span className="ml-0.5 text-terracotta" aria-hidden>*</span> : optionalLabel && <span className="ml-1 font-normal text-muted">({optionalLabel})</span>}
          {unit && <span className="ml-1.5 rounded-full bg-peach/60 px-2 py-0.5 text-[11px] font-semibold text-brown">{unit}</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="flex items-center gap-1 text-xs font-medium text-danger" role="alert"><AlertCircle className="h-3.5 w-3.5" aria-hidden />{error}</p>
      ) : helper ? <p className="text-xs text-muted">{helper}</p> : null}
    </div>
  );
}

const base = 'w-full rounded-2xl border bg-white text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4';
const tone = (error) => (error ? 'border-danger/60 focus:border-danger focus:ring-danger/10' : 'border-line hover:border-brown/30 focus:border-burnt focus:ring-burnt/15');

export const TextInput = forwardRef(function TextInput({ icon: Icon, error, right, className = '', id, ...rest }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brown/70" aria-hidden />}
      <input ref={ref} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${id}-error` : undefined}
        className={`${base} ${tone(error)} h-12 ${Icon ? 'pl-11' : 'pl-4'} ${right ? 'pr-12' : 'pr-4'} ${className}`} {...rest} />
      {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
});

export function Select({ error, id, children, className = '', ...rest }) {
  return (
    <div className="relative">
      <select id={id} aria-invalid={Boolean(error) || undefined} className={`${base} ${tone(error)} h-12 appearance-none pl-4 pr-10 ${className}`} {...rest}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" aria-hidden />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, testId }) {
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-full border border-line bg-white pl-4 pr-10 text-sm font-semibold text-ink shadow-soft transition-colors hover:border-brown/30 focus:border-burnt focus:outline-none focus:ring-4 focus:ring-burnt/15">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" aria-hidden />
    </div>
  );
}

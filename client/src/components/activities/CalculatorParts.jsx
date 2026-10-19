import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { IconTile } from '../common/Page';
import { getIcon } from '../../utils/icons';

export function Stepper({ step }) {
  const { t } = useLang();
  const steps = ['calc.step1', 'calc.step2', 'calc.step3', 'calc.step4'];
  return (
    <ol className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold sm:gap-2 sm:text-sm" aria-label="Langkah kalkulator" data-testid="calculator-stepper">
      {steps.map((k, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'current' : 'todo';
        return (
          <li key={k} className="flex shrink-0 items-center gap-1.5 sm:gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] transition-colors ${state === 'done' ? 'bg-forest text-white' : state === 'current' ? 'bg-terracotta text-white' : 'bg-white text-muted ring-1 ring-line'}`}>
              {state === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
            </span>
            <span className={state === 'todo' ? 'text-muted' : 'text-ink'}>{t(k)}</span>
            {n < 4 && <span className="mx-1 h-px w-5 bg-line sm:w-8" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function OptionCard({ to, onClick, icon, title, desc, tone, testId, selected, index = 0 }) {
  const { t } = useLang();
  const Icon = getIcon(icon);
  const shapes = ['rounded-blob', 'rounded-leaf', 'rounded-[2rem]', 'rounded-[2rem_.75rem_2rem_2rem]'];
  return (
    <Link to={to} onClick={onClick} data-testid={testId} aria-current={selected || undefined}
      className={`group surface relative flex items-center gap-4 p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-burnt/40 hover:shadow-lift sm:flex-col sm:items-center sm:p-7 sm:text-center ${shapes[index % 4]} ${selected ? 'border-terracotta ring-2 ring-terracotta/20' : ''}`}>
      <IconTile icon={Icon} tone={tone} size="lg" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold sm:text-xl">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{desc}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 sm:hidden" aria-label={t('common.seeDetail')} />
    </Link>
  );
}

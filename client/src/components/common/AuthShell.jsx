import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../common/Logo';
import { LangToggle } from '../layout/LangToggle';
import { TextInput } from '../common/Input';
import { useLang } from '../../context/LangContext';

export function AuthShell({ title, subtitle, children, testId }) {
  const { t } = useLang();
  return (
    <div className="grid min-h-dvh bg-soft lg:grid-cols-[1fr_1.1fr]" data-testid={testId}>
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/assets/hero-city.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" aria-hidden />
        <div className="absolute bottom-0 p-12 text-white">
          <h2 className="max-w-md text-3xl font-extrabold">{t('auth.sideTitle')}</h2>
          <p className="mt-3 max-w-md text-white/80">{t('auth.sideBody')}</p>
        </div>
      </div>
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Logo /><LangToggle /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="animate-rise rounded-[2.25rem] bg-peach/80 p-6 shadow-lift sm:p-9">
            <h1 className="text-center text-2xl font-extrabold text-brown sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-xs text-center text-[15px] text-ink/75">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PasswordInput({ id, error, ...rest }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <TextInput id={id} error={error} type={show ? 'text' : 'password'} {...rest}
      right={(
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={t(show ? 'auth.hide' : 'auth.show')} data-testid="password-visibility-toggle"
          className="rounded-full p-2 text-brown hover:bg-peach/60">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      )} />
  );
}

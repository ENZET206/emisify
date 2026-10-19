import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserRound, CalendarDays } from 'lucide-react';
import { AuthShell, PasswordInput } from '../../components/common/AuthShell';
import { Field, TextInput } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/Feedback';
import { GoogleButton } from '../../components/common/GoogleButton';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { fieldErrorText } from '../../utils/format';

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = { code: 'required' };
  else if (f.name.trim().length < 2) e.name = { code: 'nameMin' };
  if (f.age !== '') {
    const n = Number(f.age);
    if (!Number.isInteger(n)) e.age = { code: 'integer' };
    else if (n < 10) e.age = { code: 'ageMin' };
    else if (n > 100) e.age = { code: 'ageMax' };
  }
  if (!f.email.trim()) e.email = { code: 'required' };
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = { code: 'email' };
  if (!f.password) e.password = { code: 'required' };
  else if (f.password.length < 8) e.password = { code: 'passwordMin' };
  else if (!/[A-Za-z]/.test(f.password)) e.password = { code: 'passwordLetter' };
  else if (!/\d/.test(f.password)) e.password = { code: 'passwordNumber' };
  return e;
}

export default function RegisterPage() {
  const { t } = useLang();
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError(null);
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), password: form.password, ...(form.age ? { age: Number(form.age) } : {}) };
      const user = await register(body);
      toast.success(t('auth.registered', { name: user.name }));
      nav('/dashboard', { replace: true });
    } catch (err) {
      if (err.details?.fields) setErrors(err.details.fields);
      else setApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const err = (k) => fieldErrorText(errors[k], t);
  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} testId="register-page">
      <form onSubmit={submit} noValidate className="space-y-4" data-testid="register-form">
        <Field label={t('auth.name')} htmlFor="name" error={err('name')} required>
          <TextInput id="name" autoComplete="name" icon={UserRound} placeholder={t('auth.namePh')} value={form.name} onChange={set('name')} error={errors.name} data-testid="register-name-input" />
        </Field>
        <Field label={t('auth.age')} htmlFor="age" error={err('age')} optionalLabel={t('common.optional')}>
          <TextInput id="age" type="number" inputMode="numeric" min="10" max="100" icon={CalendarDays} placeholder={t('auth.agePh')} value={form.age} onChange={set('age')} error={errors.age} data-testid="register-age-input" />
        </Field>
        <Field label={t('auth.email')} htmlFor="email" error={err('email')} required>
          <TextInput id="email" type="email" autoComplete="email" icon={Mail} placeholder={t('auth.emailPh')} value={form.email} onChange={set('email')} error={errors.email} data-testid="register-email-input" />
        </Field>
        <Field label={t('auth.password')} htmlFor="password" error={err('password')} helper={t('auth.passwordHint')} required>
          <PasswordInput id="password" autoComplete="new-password" icon={Lock} placeholder={t('auth.passwordPh')} value={form.password} onChange={set('password')} error={errors.password} data-testid="register-password-input" />
        </Field>
        {apiError && <ErrorMessage error={apiError} />}
        <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading} iconRight={ArrowRight} data-testid="register-submit-button">{t('auth.register')}</Button>
        <p className="text-center text-sm text-ink/80">{t('auth.haveAccount')} <Link to="/login" className="font-bold text-terracotta hover:underline" data-testid="register-to-login-link">{t('auth.login')}</Link></p>
      </form>
      <GoogleButton />
    </AuthShell>
  );
}

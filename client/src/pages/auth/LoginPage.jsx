import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthShell, PasswordInput } from '../../components/common/AuthShell';
import { Field, TextInput } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/Feedback';
import { GoogleButton } from '../../components/common/GoogleButton';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { fieldErrorText } from '../../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = { code: 'required' };
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = { code: 'email' };
    if (!form.password) errs.password = { code: 'required' };
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError(null);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(t('auth.welcome', { name: user.name }));
      nav(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') setApiError({ message: t('auth.invalid') });
      else if (err.code === 'GOOGLE_ACCOUNT') setApiError({ message: t('auth.googleOnly') });
      else if (err.code === 'VALIDATION_ERROR') setErrors(err.details?.fields || {});
      else setApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} testId="login-page">
      <form onSubmit={submit} noValidate className="space-y-5" data-testid="login-form">
        <Field label={t('auth.email')} htmlFor="email" error={fieldErrorText(errors.email, t)} required>
          <TextInput id="email" type="email" autoComplete="email" icon={Mail} placeholder={t('auth.emailPh')} value={form.email} onChange={set('email')} error={errors.email} data-testid="login-email-input" />
        </Field>
        <Field label={t('auth.password')} htmlFor="password" error={fieldErrorText(errors.password, t)} required>
          <PasswordInput id="password" autoComplete="current-password" icon={Lock} placeholder={t('auth.passwordPh')} value={form.password} onChange={set('password')} error={errors.password} data-testid="login-password-input" />
        </Field>
        <div className="-mt-2 text-right"><Link to="/forgot-password" className="text-sm font-semibold text-terracotta hover:underline" data-testid="login-forgot-link">{t('auth.forgotLink')}</Link></div>
        {apiError && <ErrorMessage error={apiError} />}
        <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading} iconRight={ArrowRight} data-testid="login-submit-button">{t('auth.login')}</Button>
        <p className="text-center text-sm text-ink/80">{t('auth.noAccount')} <Link to="/register" className="font-bold text-terracotta hover:underline" data-testid="login-to-register-link">{t('auth.register')}</Link></p>
      </form>
      <GoogleButton />
    </AuthShell>
  );
}

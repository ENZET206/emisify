import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, KeyRound } from 'lucide-react';
import { AuthShell, PasswordInput } from '../../components/common/AuthShell';
import { Field } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage, Spinner } from '../../components/common/Feedback';
import { api } from '../../services/api';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { fieldErrorText } from '../../utils/format';

function check(pw, confirm) {
  const e = {};
  if (!pw) e.password = { code: 'required' };
  else if (pw.length < 8) e.password = { code: 'passwordMin' };
  else if (!/[A-Za-z]/.test(pw)) e.password = { code: 'passwordLetter' };
  else if (!/\d/.test(pw)) e.password = { code: 'passwordNumber' };
  if (!confirm) e.confirm = { code: 'required' };
  else if (confirm !== pw) e.confirm = { code: 'passwordMismatch' };
  return e;
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { t } = useLang();
  const toast = useToast();
  const nav = useNavigate();
  const [status, setStatus] = useState('checking');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) { setStatus('invalid'); return; }
    api.get(`/auth/reset-password/check?token=${token}`).then(() => setStatus('valid')).catch(() => setStatus('invalid'));
  }, [token]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const submit = async (e) => {
    e.preventDefault();
    const errs = check(form.password, form.confirm);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError(null);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success(t('auth.resetDone'));
      nav('/login', { replace: true });
    } catch (err) {
      if (err.code === 'INVALID_TOKEN') setStatus('invalid');
      else setApiError(err);
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')} testId="reset-password-page">
      {status === 'checking' && <Spinner label={t('common.loading')} />}
      {status === 'invalid' && (
        <div className="space-y-4 text-center" data-testid="reset-invalid">
          <ErrorMessage error={{ message: t('auth.resetInvalid') }} />
          <Button variant="dark" to="/forgot-password" className="w-full" data-testid="reset-request-new">{t('auth.requestNew')}</Button>
        </div>
      )}
      {status === 'valid' && (
        <form onSubmit={submit} noValidate className="space-y-4" data-testid="reset-password-form">
          <Field label={t('auth.newPassword')} htmlFor="password" error={fieldErrorText(errors.password, t)} helper={t('auth.passwordHint')} required>
            <PasswordInput id="password" autoComplete="new-password" icon={Lock} value={form.password} onChange={set('password')} error={errors.password} data-testid="reset-password-input" />
          </Field>
          <Field label={t('auth.confirmPassword')} htmlFor="confirm" error={fieldErrorText(errors.confirm, t)} required>
            <PasswordInput id="confirm" autoComplete="new-password" icon={Lock} value={form.confirm} onChange={set('confirm')} error={errors.confirm} data-testid="reset-confirm-input" />
          </Field>
          {apiError && <ErrorMessage error={apiError} />}
          <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading} iconRight={KeyRound} data-testid="reset-submit-button">{t('auth.saveNewPassword')}</Button>
          <p className="text-center text-sm"><Link to="/login" className="font-bold text-terracotta hover:underline">{t('auth.backToLogin')}</Link></p>
        </form>
      )}
    </AuthShell>
  );
}

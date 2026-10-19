import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, MailCheck } from 'lucide-react';
import { AuthShell } from '../../components/common/AuthShell';
import { Field, TextInput } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/Feedback';
import { api } from '../../services/api';
import { useLang } from '../../context/LangContext';
import { fieldErrorText } from '../../utils/format';

export default function ForgotPasswordPage() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setError({ code: 'required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError({ code: 'email' });
    setLoading(true);
    setApiError(null);
    try {
      await api.post('/auth/forgot-password', { email: v, lang });
      setSent(true);
    } catch (err) { setApiError(err); } finally { setLoading(false); }
  };

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} testId="forgot-password-page">
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center" data-testid="forgot-password-sent">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest"><MailCheck className="h-7 w-7" aria-hidden /></span>
          <p className="font-bold">{t('auth.forgotSentTitle')}</p>
          <p className="text-sm text-ink/80">{t('auth.forgotSentBody', { email: email.trim() })}</p>
          <Button variant="dark" to="/login" className="mt-2 w-full" data-testid="forgot-back-login">{t('auth.backToLogin')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5" data-testid="forgot-password-form">
          <Field label={t('auth.email')} htmlFor="email" error={fieldErrorText(error, t)} required>
            <TextInput id="email" type="email" autoComplete="email" icon={Mail} placeholder={t('auth.emailPh')} value={email} error={error}
              onChange={(e) => { setEmail(e.target.value); setError(null); }} data-testid="forgot-email-input" />
          </Field>
          {apiError && <ErrorMessage error={apiError} />}
          <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading} iconRight={Send} data-testid="forgot-submit-button">{t('auth.sendLink')}</Button>
          <p className="text-center text-sm"><Link to="/login" className="font-bold text-terracotta hover:underline" data-testid="forgot-to-login-link">{t('auth.backToLogin')}</Link></p>
        </form>
      )}
    </AuthShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { Spinner, ErrorMessage } from '../../components/common/Feedback';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const { setUser } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const nav = useNavigate();
  const [error, setError] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) { setError({ message: t('auth.googleCancelled') }); return; }
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    api.post('/auth/google/callback', { code, state, redirectUri: `${window.location.origin}/auth/google` })
      .then(({ user }) => { setUser(user); toast.success(t('auth.welcome', { name: user.name })); nav('/dashboard', { replace: true }); })
      .catch(setError);
  }, [params, setUser, t, toast, nav]);

  return (
    <div className="grid min-h-dvh place-items-center bg-soft px-6" data-testid="google-callback-page">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <Logo />
        {error ? (
          <>
            <ErrorMessage error={error} />
            <Button to="/login" data-testid="google-callback-back">{t('auth.backToLogin')}</Button>
          </>
        ) : <Spinner label={t('auth.googleProcessing')} />}
      </div>
    </div>
  );
}

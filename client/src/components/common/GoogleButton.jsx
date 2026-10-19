import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useLang } from '../../context/LangContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

// Shown only when the server has GOOGLE_CLIENT_ID/SECRET configured.
export function GoogleButton() {
  const { t } = useLang();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/auth/providers').then((p) => setEnabled(p.google)).catch(() => {}); }, []);
  if (!enabled) return null;

  const start = async () => {
    setBusy(true);
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const { url } = await api.post('/auth/google/url', { redirectUri: `${window.location.origin}/auth/google` });
      window.location.assign(url);
    } catch (err) {
      toast.error(errorMessage(err, t));
      setBusy(false);
    }
  };

  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted"><span className="h-px flex-1 bg-brown/15" />{t('auth.or')}<span className="h-px flex-1 bg-brown/15" /></div>
      <button type="button" onClick={start} disabled={busy} data-testid="google-login-button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white text-[15px] font-semibold text-ink shadow-soft transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-lift disabled:opacity-60">
        <GoogleIcon />{t('auth.google')}
      </button>
    </>
  );
}

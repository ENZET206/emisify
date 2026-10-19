import { Sprout } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';

export default function NotFoundPage() {
  const { t } = useLang();
  const { user } = useAuth();
  return (
    <div className="grid min-h-dvh place-items-center bg-soft px-6" data-testid="not-found-page">
      <div className="flex max-w-md flex-col items-center text-center">
        <Logo />
        <span className="mt-10 grid h-20 w-20 place-items-center rounded-[2rem_2rem_2rem_.6rem] bg-mint text-forest"><Sprout className="h-9 w-9 animate-sway" aria-hidden /></span>
        <p className="mt-6 text-6xl font-extrabold text-peach">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">{t('notFound.title')}</h1>
        <p className="mt-2 text-muted">{t('notFound.body')}</p>
        <Button className="mt-6" to={user ? '/dashboard' : '/'} data-testid="not-found-home-button">{t('notFound.cta')}</Button>
      </div>
    </div>
  );
}

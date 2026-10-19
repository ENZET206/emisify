import { ArrowRight, Calculator, TreeDeciduous, Sparkles, TrendingUp, Leaf, UserRound, Globe2, Car, AirVent, Laptop, Info } from 'lucide-react';
import { PublicNavbar, Footer } from '../../components/layout/PublicLayout';
import { Button } from '../../components/common/Button';
import { useLang } from '../../context/LangContext';

const FEATURES = [
  [Calculator, 'landing.f1', 'landing.f1d', 'bg-peach text-terracotta'],
  [TreeDeciduous, 'landing.f2', 'landing.f2d', 'bg-olive text-white'],
  [Sparkles, 'landing.f3', 'landing.f3d', 'bg-peach text-terracotta'],
  [TrendingUp, 'landing.f4', 'landing.f4d', 'bg-olive text-white'],
];

const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-8';
const CARD = 'rounded-[2rem] bg-cream p-6 shadow-soft sm:p-10';

function Tag({ children }) {
  return <span className="inline-flex rounded-full bg-peach px-3 py-1 text-xs font-bold text-terracotta">{children}</span>;
}

function SectionTitle({ title, accent = true, className = '' }) {
  return (
    <h2 className={`mt-4 text-3xl font-extrabold leading-tight sm:text-4xl ${className}`}>
      {title}{accent && <> <span className="text-terracotta">Emisify</span></>}
    </h2>
  );
}

function Hero() {
  const { t } = useLang();
  return (
    <section id="beranda" className="relative isolate overflow-hidden">
      <img src="/assets/hero-city.jpg" alt="Kota hijau di tepi air dengan pohon sakura" className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_center]" fetchpriority="high" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/25 sm:bg-gradient-to-r sm:from-ink/75 sm:via-ink/35 sm:to-transparent" aria-hidden />
      <div className={`${CONTAINER} flex min-h-[32rem] flex-col justify-center py-16 sm:min-h-[36rem] lg:min-h-[40rem]`}>
        <div className="stagger max-w-xl">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.06] text-white drop-shadow-sm sm:text-6xl lg:text-[4.1rem]" data-testid="landing-hero-title">
            {t('landing.title1')}<br /><span className="text-burnt">{t('landing.title2')}</span><br />{t('landing.title3')}
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/90 sm:text-lg">{t('landing.subtitle')}</p>
          <div className="mt-8">
            <Button size="lg" to="/register" iconRight={ArrowRight} data-testid="landing-hero-cta">{t('landing.cta')}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useLang();
  return (
    <section id="fitur" className={`${CONTAINER} py-14 sm:py-20`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {FEATURES.map(([Icon, title, desc, tone], i) => (
          <div key={title} className="group flex flex-col items-center text-center" data-testid={`landing-feature-${i + 1}`}>
            <span className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl shadow-soft transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6 ${tone}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-base font-bold sm:text-lg">{t(title)}</h3>
            <p className="mt-1 text-sm text-muted">{t(desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Split({ id, tag, title, body, img, alt, reverse }) {
  return (
    <section id={id} className={`${CONTAINER} py-3 sm:py-4`}>
      <div className={`${CARD} grid items-center gap-8 lg:gap-12 ${reverse ? 'lg:grid-cols-[1.25fr_1fr]' : 'lg:grid-cols-[1fr_1.25fr]'}`}>
        <div className={reverse ? 'lg:order-2' : ''}>
          <Tag>{tag}</Tag>
          <SectionTitle title={title} />
          <p className="mt-4 text-base leading-relaxed text-ink/80 sm:text-lg">{body}</p>
        </div>
        <div className="group overflow-hidden rounded-[1.5rem] shadow-soft">
          <img src={img} alt={alt} loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const { t } = useLang();
  const items = [[Leaf, 'landing.b1', 'bg-peach text-terracotta'], [UserRound, 'landing.b2', 'bg-olive text-white'], [Globe2, 'landing.b3', 'bg-peach text-terracotta']];
  return (
    <section className={`${CONTAINER} py-3 sm:py-4`}>
      <div className={`${CARD} grid items-center gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12`}>
        <div>
          <Tag>{t('landing.benefitTag')}</Tag>
          <SectionTitle title={t('landing.benefitTitle')} />
          <p className="mt-4 text-base leading-relaxed text-ink/80 sm:text-lg">{t('landing.benefitBody')}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-brown/20 border-t border-brown/15 pt-6 lg:border-0 lg:pt-0">
          {items.map(([Icon, key, tone]) => (
            <div key={key} className="flex flex-col items-center px-2 py-2 text-center">
              <span className={`mb-3 grid h-14 w-14 place-items-center rounded-full shadow-soft ${tone}`}><Icon className="h-6 w-6" aria-hidden /></span>
              <p className="max-w-[7rem] text-sm font-bold leading-snug">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const { t } = useLang();
  const items = [[Car, 'landing.p1'], [AirVent, 'landing.p2'], [Laptop, 'landing.p3']];
  return (
    <section className={`${CONTAINER} py-3 sm:py-4`}>
      <div className={CARD}>
        <Tag>{t('landing.problemTag')}</Tag>
        <SectionTitle title={t('landing.problemTitle')} accent={false} className="max-w-xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map(([Icon, key]) => (
            <div key={key} className="flex items-start gap-4 rounded-[1.5rem] bg-white p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1 sm:p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-peach text-terracotta"><Icon className="h-5 w-5" aria-hidden /></span>
              <p className="text-[15px] font-medium leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="cara-kerja" className={`${CONTAINER} py-3 sm:py-4`}>
      <div className={CARD}>
        <Tag>{t('landing.howTag')}</Tag>
        <SectionTitle title={t('landing.howTitle')} accent={false} />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="group flex flex-col rounded-[1.5rem] bg-white p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1" data-testid={`landing-step-${n}`}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-terracotta text-xl font-extrabold text-white shadow-soft transition-transform duration-300 group-hover:-rotate-6">{n}</span>
              <h3 className="mt-5 text-lg font-bold">{t(`landing.s${n}`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`landing.s${n}d`)}</p>
            </li>
          ))}
        </ol>
        <p id="asumsi" className="mt-6 flex items-start gap-2 text-sm text-muted"><Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />{t('landing.note')}</p>
      </div>
    </section>
  );
}

function Banner() {
  const { t } = useLang();
  return (
    <section className={`${CONTAINER} pb-14 pt-3 sm:pb-20 sm:pt-4`}>
      <div className="relative isolate overflow-hidden rounded-[2rem]">
        <img src="/assets/banner-bridge.jpg" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/10" aria-hidden />
        <div className="flex min-h-[13rem] flex-col items-start justify-center gap-5 p-8 sm:min-h-[15rem] sm:p-12">
          <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white sm:text-4xl">{t('landing.banner')}</h2>
          <Button size="lg" to="/register" iconRight={ArrowRight} data-testid="landing-banner-cta">{t('landing.bannerCta')}</Button>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { t } = useLang();
  return (
    <div className="min-h-dvh bg-soft">
      <PublicNavbar />
      <main>
        <Hero />
        <Features />
        <Split id="tentang" tag={t('landing.aboutTag')} title={t('landing.aboutTitle')} body={t('landing.aboutBody')} img="/assets/about-park.jpg" alt="Taman kota dengan gedung tinggi" />
        <Split tag={t('landing.goalTag')} title={t('landing.goalTitle')} body={t('landing.goalBody')} img="/assets/goal-transit.jpg" alt="Kereta melintas di kota" reverse />
        <Benefits />
        <Problem />
        <HowItWorks />
        <Banner />
      </main>
      <Footer />
    </div>
  );
}
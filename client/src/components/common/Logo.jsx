import { Link } from 'react-router-dom';

export function LeafMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path fill="#D9653F" d="M54 8C30 8 12 20 10 40c-.6 6 1 11 3 14 2-9 9-19 22-26-10 8-16 16-19 27 4 2 9 2 14 0 18-7 24-26 24-47z" />
      <path fill="#C94A2F" d="M35 28c-10 8-16 16-19 27 4 2 9 2 14 0C40 51 47 42 51 31 46 29 40 28 35 28z" opacity=".55" />
    </svg>
  );
}

export function Logo({ to = '/', size = 'md', testId = 'brand-logo' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-[1.6rem]';
  return (
    <Link to={to} data-testid={testId} className="inline-flex items-center gap-2 rounded-xl" aria-label="Emisify">
      <LeafMark className={size === 'lg' ? 'h-9 w-9' : 'h-8 w-8'} />
      <span className={`${text} font-extrabold tracking-tight text-ink`}>Emisify</span>
    </Link>
  );
}

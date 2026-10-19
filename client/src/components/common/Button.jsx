import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-terracotta text-white hover:bg-[#B5402A] active:bg-[#A13923] shadow-[0_8px_20px_-10px_rgba(201,74,47,.7)]',
  dark: 'bg-brown text-white hover:bg-[#5F3A27] active:bg-[#4F3020]',
  forest: 'bg-forest text-white hover:bg-[#355A40] active:bg-[#2C4C36]',
  outline: 'border border-line bg-white text-ink hover:border-brown/40 hover:bg-soft',
  ghost: 'text-brown hover:bg-peach/60',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-[#FDECEA]',
  dangerSolid: 'bg-danger text-white hover:bg-[#9A1E15]',
};
const SIZES = { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-12 px-6 text-base' };

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, iconRight: IconRight, className = '', to, href, children, disabled, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon && <Icon className="h-4 w-4" aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </>
  );
  if (href) { const { as, ...a } = rest; return <a href={href} className={`group ${cls}`} {...a}>{content}</a>; }
  if (to) return <Link to={to} className={`group ${cls}`} {...rest}>{content}</Link>;
  return <button type="button" className={`group ${cls}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>{content}</button>;
}

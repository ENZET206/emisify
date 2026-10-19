export function formatNumber(n, lang, digits = 1) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n ?? 0);
}

export const formatKg = (n, lang, digits = 1) => `${formatNumber(n, lang, digits)} kg CO₂e`;

export function formatDate(value, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { ...opts, timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : undefined }).format(d);
}

export function formatMonth(key, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${key}-15T12:00:00Z`));
}

export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Maps API error to a translated message (field errors are handled by forms).
export function errorMessage(err, t) {
  if (!err) return '';
  if (err.code === 'NETWORK_ERROR') return t('common.network');
  if (err.code === 'RATE_LIMITED') return err.message;
  return err.message || t('common.error');
}

export const fieldErrorText = (e, t) => (e ? t(`v.${e.code}`, e.params) : '');

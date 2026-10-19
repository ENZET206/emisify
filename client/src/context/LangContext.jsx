import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { id } from '../i18n/id';
import { en } from '../i18n/en';

const DICTS = { id, en };
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('emisify_lang') || 'id');

  useEffect(() => {
    localStorage.setItem('emisify_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, params) => {
    let s = DICTS[lang][key] ?? DICTS.id[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [lang]);

  // Picks the active language from bilingual API values like { id, en }.
  const pick = useCallback((v) => (v && typeof v === 'object' && 'id' in v ? v[lang] ?? v.id : v), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, pick, toggle: () => setLang((l) => (l === 'id' ? 'en' : 'id')) }), [lang, t, pick]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

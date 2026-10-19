import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'emisify_calc_draft';
const CalculatorContext = createContext(null);

// Keeps the multi-step calculator draft (activity → category → inputs → preview) across steps and reloads.
export function CalculatorProvider({ children }) {
  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
  });

  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(draft)); }, [draft]);

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft({}), []);
  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export const useCalculator = () => useContext(CalculatorContext);

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

// Loads a GET endpoint with loading/error state; `reload` refetches.
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const ctrl = useRef(null);

  const load = useCallback(() => {
    if (!path) return;
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(path, { signal: ctrl.current.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error }); });
  }, [path]);

  useEffect(() => {
    load();
    return () => ctrl.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

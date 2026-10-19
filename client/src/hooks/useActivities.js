import { useEffect, useState } from 'react';
import { api } from '../services/api';

let cached = null;

// Activity/category/field definitions come from the API so the form stays in sync with the server calculator.
export function useActivities() {
  const [state, setState] = useState({ data: cached, loading: !cached, error: null });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get('/activities/categories')
      .then((d) => { cached = d.activities; setState({ data: cached, loading: false, error: null }); })
      .catch((error) => setState({ data: null, loading: false, error }));
  };
  useEffect(() => { if (!cached) load(); }, []);
  return { ...state, reload: load };
}

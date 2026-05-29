import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/services/api';
import { Quiz } from '@/src/features/quizzes/types';

export function useQuizzes() {
  const [data, setData] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = () => {
    setLoading(true);
    setError(null);
    apiFetch<Quiz[]>('/api/v1/quizzes')
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return { data, loading, error, refetch: fetch };
}

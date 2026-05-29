import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/services/api';
import { QuizDetail } from '@/src/features/quizzes/types';

export function useQuizDetail(id: number | null) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch<QuizDetail>(`/api/v1/quizzes/${id}`)
      .then(setQuiz)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { quiz, loading, error };
}

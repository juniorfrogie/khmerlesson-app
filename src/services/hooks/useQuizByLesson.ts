import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/services/api';
import { Quiz } from '@/src/features/quizzes/types';

export function useQuizByLesson(lessonId: number | null) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!lessonId) { setLoading(false); return; }
    apiFetch<Quiz[]>('/api/v1/quizzes')
      .then(quizzes => setQuiz(quizzes.find(q => q.lessonId === lessonId) ?? null))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [lessonId]);

  return { quiz, loading, error };
}

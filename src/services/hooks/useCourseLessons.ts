import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { Lesson } from '@/src/features/lessons/types';

interface State {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
  forbidden: boolean;
}

export function useCourseLessons(courseId: number | null) {
  const [state, setState] = useState<State>({ lessons: [], loading: true, error: null, forbidden: false });
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    if (courseId === null || isNaN(courseId)) return;
    setState(s => ({ ...s, loading: true, error: null, forbidden: false }));
    apiFetch<Lesson[]>(`/api/v1/main-lessons/${courseId}/lessons`, accessToken)
      .then(lessons => setState({ lessons, loading: false, error: null, forbidden: false }))
      .catch(err => {
        const is403 = (err as Error & { status?: number }).status === 403;
        setState({ lessons: [], loading: false, error: is403 ? null : err.message, forbidden: is403 });
      });
  }, [courseId, accessToken]);

  return state;
}

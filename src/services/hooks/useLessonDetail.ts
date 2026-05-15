import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { LessonDetail } from '@/src/features/lessons/types';

interface State {
  lesson: LessonDetail | null;
  loading: boolean;
  error: string | null;
  forbidden: boolean;
}

export function useLessonDetail(lessonId: number | null) {
  const [state, setState] = useState<State>({ lesson: null, loading: true, error: null, forbidden: false });
  const [tick, setTick] = useState(0);
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    if (lessonId === null) return;
    setState(s => ({ ...s, loading: true, error: null, forbidden: false }));
    apiFetch<LessonDetail>(`/api/v1/lessons/${lessonId}`, accessToken)
      .then(lesson => setState({ lesson, loading: false, error: null, forbidden: false }))
      .catch(err => {
        const is403 = (err as Error & { status?: number }).status === 403;
        setState({ lesson: null, loading: false, error: is403 ? null : err.message, forbidden: is403 });
      });
  }, [lessonId, accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

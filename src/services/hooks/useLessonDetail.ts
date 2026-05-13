import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import type { LessonDetail } from '@/src/features/lessons/types';

interface State {
  lesson: LessonDetail | null;
  loading: boolean;
  error: string | null;
}

export function useLessonDetail(lessonId: number | null) {
  const [state, setState] = useState<State>({ lesson: null, loading: true, error: null });

  useEffect(() => {
    if (lessonId === null) return;
    setState(s => ({ ...s, loading: true, error: null }));
    apiFetch<LessonDetail>(`/api/v1/lessons/${lessonId}`)
      .then(lesson => setState({ lesson, loading: false, error: null }))
      .catch(err => setState({ lesson: null, loading: false, error: err.message }));
  }, [lessonId]);

  return state;
}

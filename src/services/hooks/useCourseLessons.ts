import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import type { Lesson } from '@/src/features/lessons/types';

interface State {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
}

export function useCourseLessons(courseId: number | null) {
  const [state, setState] = useState<State>({ lessons: [], loading: true, error: null });

  useEffect(() => {
    if (courseId === null || isNaN(courseId)) return;
    setState(s => ({ ...s, loading: true, error: null }));
    apiFetch<Lesson[]>(`/api/v1/main-lessons/${courseId}/lessons`)
      .then(lessons => setState({ lessons, loading: false, error: null }))
      .catch(err => setState({ lessons: [], loading: false, error: err.message }));
  }, [courseId]);

  return state;
}

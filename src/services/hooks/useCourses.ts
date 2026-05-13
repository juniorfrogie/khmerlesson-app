import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import type { Course } from '@/src/features/courses/types';
import { useAuthStore } from '@/src/features/auth/store/authStore';

interface State {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

export function useCourses() {
  const [state, setState] = useState<State>({ courses: [], loading: true, error: null });
  const [tick, setTick] = useState(0);
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    apiFetch<Course[]>('/api/v1/main-lessons', accessToken)
      .then(courses => setState({ courses, loading: false, error: null }))
      .catch(err => setState({ courses: [], loading: false, error: err.message }));
  }, [tick, accessToken]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

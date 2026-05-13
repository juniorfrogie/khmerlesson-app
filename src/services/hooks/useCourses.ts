import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import type { Course } from '@/src/features/courses/types';

interface State {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

export function useCourses() {
  const [state, setState] = useState<State>({ courses: [], loading: true, error: null });

  useEffect(() => {
    apiFetch<Course[]>('/api/v1/main-lessons')
      .then(courses => setState({ courses, loading: false, error: null }))
      .catch(err => setState({ courses: [], loading: false, error: err.message }));
  }, []);

  return state;
}

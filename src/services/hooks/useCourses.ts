import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import type { Course } from '@/src/features/courses/types';
import { useAuthStore } from '@/src/features/auth/store/authStore';

// Raw shape returned by GET /api/v1/main-lessons
interface ApiCourse {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  price?: number;
  productId?: string;
  hasPurchased?: boolean;
  lessonCount?: number;
}

function mapCourse(raw: ApiCourse): Course {
  return {
    ...raw,
    thumbnailUrl: raw.thumbnailUrl,
  };
}

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
    apiFetch<ApiCourse[]>('/api/v1/main-lessons', accessToken)
      .then(raw => setState({ courses: raw.map(mapCourse), loading: false, error: null }))
      .catch(err => setState({ courses: [], loading: false, error: err.message }));
  }, [tick, accessToken]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

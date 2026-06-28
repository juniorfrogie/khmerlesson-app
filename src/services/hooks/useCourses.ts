import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import type { Course } from '@/src/features/courses/types';
import { useAuthStore } from '@/src/features/auth/store/authStore';

// Raw shape returned by GET /api/v1/main-lessons.
// hasAccess and comingSoon are optional: new API fields that may not exist
// on older backend versions. mapCourse supplies safe fallbacks.
interface ApiCourse {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  hasAccess?: boolean;
  comingSoon?: boolean;
  lessonCount?: number;
  order?: number;
}

function mapCourse(raw: ApiCourse): Course {
  return {
    ...raw,
    // Free courses are always accessible regardless of what hasAccess says
    hasAccess: raw.isFree || (raw.hasAccess ?? false),
    comingSoon: raw.comingSoon ?? false,
  };
}

interface State {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

// Module-level cache populated by prefetchCourses() during onboarding so the
// home screen renders instantly with no loading spinner on first open.
let _courses: Course[] = [];

export function prefetchCourses(accessToken?: string): Promise<void> {
  return apiFetch<ApiCourse[]>('/api/v1/main-lessons', accessToken).then(raw => {
    _courses = raw.map(mapCourse);
  });
}

export function useCourses() {
  const [state, setState] = useState<State>({
    courses: _courses,
    loading: _courses.length === 0,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    // Only show loading spinner if there is nothing to display yet
    if (_courses.length === 0) setState(s => ({ ...s, loading: true }));

    apiFetch<ApiCourse[]>('/api/v1/main-lessons', accessToken)
      .then(raw => {
        _courses = raw.map(mapCourse);
        setState({ courses: _courses, loading: false, error: null });
      })
      .catch(err =>
        setState(s => ({
          ...s,
          loading: false,
          // Suppress error if cached data is already visible
          error: s.courses.length === 0 ? (err as Error).message : null,
        })),
      );
  }, [tick, accessToken]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

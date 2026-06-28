import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { Lesson } from '@/src/features/lessons/types';

type ForbiddenReason = 'tokenExpired' | 'subscription' | 'comingSoon' | null;

interface State {
  lessons: Lesson[];
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  forbiddenReason: ForbiddenReason;
}

function parseForbiddenReason(err: unknown): ForbiddenReason {
  const status = (err as Error & { status?: number }).status;
  const code = (err as Error & { code?: string }).code;
  const message = (err as Error).message ?? '';
  if (status === 401 || code === 'TOKEN_EXPIRED') return 'tokenExpired';
  if (message.toLowerCase().includes('not yet available')) return 'comingSoon';
  return 'subscription';
}

export function useCourseLessons(courseId: number | null) {
  const [state, setState] = useState<State>({
    lessons: [], loading: true, error: null, forbidden: false, forbiddenReason: null,
  });
  const [tick, setTick] = useState(0);
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    if (courseId === null || isNaN(courseId)) return;
    setState(s => ({ ...s, loading: true, error: null, forbidden: false, forbiddenReason: null }));
    apiFetch<Lesson[]>(`/api/v1/main-lessons/${courseId}/lessons`, accessToken)
      .then(lessons => setState({ lessons, loading: false, error: null, forbidden: false, forbiddenReason: null }))
      .catch(err => {
        const status = (err as Error & { status?: number }).status;
        const isForbidden = status === 401 || status === 403;
        setState({
          lessons: [],
          loading: false,
          error: isForbidden ? null : (err as Error).message,
          forbidden: isForbidden,
          forbiddenReason: isForbidden ? parseForbiddenReason(err) : null,
        });
      });
  }, [courseId, accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

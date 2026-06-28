import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { LessonDetail } from '@/src/features/lessons/types';

type ForbiddenReason = 'tokenExpired' | 'subscription' | 'comingSoon' | null;

interface State {
  lesson: LessonDetail | null;
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

export function useLessonDetail(lessonId: number | null) {
  const [state, setState] = useState<State>({
    lesson: null, loading: true, error: null, forbidden: false, forbiddenReason: null,
  });
  const [tick, setTick] = useState(0);
  const accessToken = useAuthStore(s => s.tokens?.accessToken);

  useEffect(() => {
    if (lessonId === null) return;
    setState(s => ({ ...s, loading: true, error: null, forbidden: false, forbiddenReason: null }));
    apiFetch<LessonDetail>(`/api/v1/lessons/${lessonId}`, accessToken)
      .then(lesson => setState({ lesson, loading: false, error: null, forbidden: false, forbiddenReason: null }))
      .catch(err => {
        const status = (err as Error & { status?: number }).status;
        const isForbidden = status === 401 || status === 403;
        setState({
          lesson: null,
          loading: false,
          error: isForbidden ? null : (err as Error).message,
          forbidden: isForbidden,
          forbiddenReason: isForbidden ? parseForbiddenReason(err) : null,
        });
      });
  }, [lessonId, accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

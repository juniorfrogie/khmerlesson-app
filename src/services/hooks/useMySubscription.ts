import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import type { Subscription } from '@/src/features/subscriptions/types';

interface State {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
}

export function useMySubscription() {
  const accessToken = useAuthStore(s => s.tokens?.accessToken);
  const { setSubscription, clearSubscription } = useSubscriptionStore();
  const [state, setState] = useState<State>({ subscription: null, loading: !!accessToken, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setState({ subscription: null, loading: false, error: null });
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    apiFetch<Subscription | null>('/api/v1/subscriptions/me', accessToken)
      .then(sub => {
        if (sub) {
          setSubscription(sub);
        } else {
          clearSubscription();
        }
        setState({ subscription: sub, loading: false, error: null });
      })
      .catch(err => {
        setState(s => ({ ...s, loading: false, error: (err as Error).message }));
      });
  }, [accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { ...state, refetch };
}

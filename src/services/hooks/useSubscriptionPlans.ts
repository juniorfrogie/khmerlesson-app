import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import type { SubscriptionPlan } from '@/src/features/subscriptions/types';

interface State {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
}

export function useSubscriptionPlans() {
  const [state, setState] = useState<State>({ plans: [], loading: true, error: null });

  useEffect(() => {
    apiFetch<SubscriptionPlan[]>('/api/v1/subscription-plans')
      .then(plans => setState({ plans, loading: false, error: null }))
      .catch(err => setState({ plans: [], loading: false, error: (err as Error).message }));
  }, []);

  return state;
}

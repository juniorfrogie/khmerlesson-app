import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Subscription } from '../types';

const STORAGE_KEY = 'subscription_state';

// Distinct from `Subscription['status']` (the server's trial/active/expired/
// cancelled on an actual subscription row) — this describes whether THIS
// STORE has synced with the server yet. `mySubscription === null` alone is
// ambiguous: it means either "never synced this session" or "synced, and
// confirmed the user has no subscription." `status` disambiguates it.
// UI must treat 'unknown'/'loading' as "don't lock content" — never as "no
// subscription" — only 'inactive' means a sync has actually confirmed that.
export type SubscriptionSyncStatus = 'unknown' | 'loading' | 'active' | 'inactive' | 'error';

interface PersistedState {
  mySubscription: Subscription | null;
  status: SubscriptionSyncStatus;
}

interface SubscriptionStore {
  mySubscription: Subscription | null;
  status: SubscriptionSyncStatus;
  error: string | null;

  setLoading: () => void;
  // Call only with the result of an actual server sync. `sub: null` here
  // means "server confirmed no subscription" — distinct from the initial
  // 'unknown' state, which means no sync has completed yet.
  setSubscription: (sub: Subscription | null) => void;
  setError: (message: string) => void;
  clearSubscription: () => void;
  hydrate: () => Promise<void>;
}

function deriveStatus(sub: Subscription | null): SubscriptionSyncStatus {
  if (!sub) return 'inactive';
  return sub.status === 'active' || sub.status === 'trial' ? 'active' : 'inactive';
}

function persist(state: PersistedState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  mySubscription: null,
  status: 'unknown',
  error: null,

  setLoading: () => set({ status: 'loading', error: null }),

  setSubscription: (sub) => {
    const status = deriveStatus(sub);
    set({ mySubscription: sub, status, error: null });
    persist({ mySubscription: sub, status });
  },

  setError: (message) => {
    // A failed sync must never downgrade a previously-confirmed subscription
    // (or a previously-confirmed "none") into something UI reads as locked —
    // leave mySubscription/status as they were, just surface the error.
    set({ status: 'error', error: message });
  },

  clearSubscription: () => {
    set({ mySubscription: null, status: 'inactive', error: null });
    persist({ mySubscription: null, status: 'inactive' });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return; // nothing cached — status stays 'unknown', correctly: we don't know yet

      const parsed = JSON.parse(raw);
      // Backward compat: older installs persisted the raw Subscription (or
      // null) directly at this key, not wrapped in { mySubscription, status }.
      if (parsed && typeof parsed === 'object' && 'mySubscription' in parsed) {
        const p = parsed as PersistedState;
        set({ mySubscription: p.mySubscription, status: p.status ?? deriveStatus(p.mySubscription) });
      } else {
        const sub = parsed as Subscription | null;
        set({ mySubscription: sub, status: deriveStatus(sub) });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));

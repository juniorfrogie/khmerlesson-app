import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Subscription } from '../types';

const STORAGE_KEY = 'subscription_state';

interface SubscriptionStore {
  mySubscription: Subscription | null;
  setSubscription: (sub: Subscription) => void;
  clearSubscription: () => void;
  hydrate: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  mySubscription: null,

  setSubscription: (sub) => {
    set({ mySubscription: sub });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sub)).catch(() => {});
  },

  clearSubscription: () => {
    set({ mySubscription: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ mySubscription: JSON.parse(raw) as Subscription });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));

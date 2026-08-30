import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentIdentityNamespace, subscribeToIdentityChange } from '@/src/shared/utils/identityNamespace';

const STORAGE_KEY_PREFIX = 'lesson_progress';

export interface LastAccessed {
  courseId: number;
  lessonId: number;
  courseTitle: string;
  lessonTitle: string;
}

interface ProgressStore {
  completedLessons: Record<number, number[]>; // courseId → lessonId[]
  lastAccessed: LastAccessed | null;

  markComplete: (courseId: number, lessonId: number) => void;
  setLastAccessed: (info: LastAccessed) => void;
  hydrate: () => Promise<void>;
}

// Tracks which identity's data is currently loaded, so persist() always
// writes to the right key even though it doesn't recompute the namespace
// itself (it's called synchronously from actions, not re-derived per call).
let activeNamespace = currentIdentityNamespace();

export const useProgressStore = create<ProgressStore>((set, get) => ({
  completedLessons: {},
  lastAccessed: null,

  markComplete: (courseId, lessonId) => {
    const existing = get().completedLessons[courseId] ?? [];
    if (existing.includes(lessonId)) return;
    const updated = { ...get().completedLessons, [courseId]: [...existing, lessonId] };
    set({ completedLessons: updated });
    persist(get());
  },

  setLastAccessed: (info) => {
    set({ lastAccessed: info });
    persist(get());
  },

  // Loads the CURRENTLY ACTIVE identity's progress — call at cold start
  // (after auth has hydrated — see app/index.tsx) and whenever the identity
  // changes (handled automatically by the subscription below). Resets to
  // empty when nothing is cached for that identity, so a previous user's
  // in-memory data never lingers visible after switching accounts.
  hydrate: async () => {
    activeNamespace = currentIdentityNamespace();
    try {
      const raw = await AsyncStorage.getItem(storageKey(activeNamespace));
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          completedLessons: parsed.completedLessons ?? {},
          lastAccessed: parsed.lastAccessed ?? null,
        });
      } else {
        set({ completedLessons: {}, lastAccessed: null });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));

function storageKey(namespace: string): string {
  return `${STORAGE_KEY_PREFIX}:${namespace}`;
}

function persist(state: Pick<ProgressStore, 'completedLessons' | 'lastAccessed'>) {
  AsyncStorage.setItem(storageKey(activeNamespace), JSON.stringify({
    completedLessons: state.completedLessons,
    lastAccessed: state.lastAccessed,
  })).catch(() => {});
}

// This is what actually fixes the account-boundary bug: rather than relying
// on authStore.signOut() to clear this store (which would also wipe a
// user's own progress if they log back in before cloud sync exists to
// restore it), each identity gets its own namespaced storage key, and this
// re-hydrates from the newly-active identity's key the moment it changes —
// covering login, logout, and switching accounts, not only cold start.
subscribeToIdentityChange(() => {
  useProgressStore.getState().hydrate();
});

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentIdentityNamespace, subscribeToIdentityChange } from '@/src/shared/utils/identityNamespace';

const STORAGE_KEY_PREFIX = 'lesson_progress';
// Pre-namespacing installs stored everything under this exact literal key
// (no `:namespace` suffix) — see the account-boundary fix this superseded.
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;
const LEGACY_MIGRATION_FLAG_KEY = 'lesson_progress_migrated_v1';

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
      await migrateLegacyIfNeeded();
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

// One-time migration for installs that had progress before per-user
// namespacing existed: the legacy data predates multi-account awareness, so
// it belongs to whoever is using the device right now (the active
// namespace at the moment this runs) — merged in, never overwriting
// anything already present for that identity. Runs at most once per
// device, guarded by LEGACY_MIGRATION_FLAG_KEY, regardless of how many
// identities hydrate() afterward.
async function migrateLegacyIfNeeded(): Promise<void> {
  try {
    const alreadyMigrated = await AsyncStorage.getItem(LEGACY_MIGRATION_FLAG_KEY);
    if (alreadyMigrated) return;

    const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        completedLessons?: Record<number, number[]>;
        lastAccessed?: LastAccessed | null;
      };
      const existingRaw = await AsyncStorage.getItem(storageKey(activeNamespace));
      const existing = existingRaw
        ? (JSON.parse(existingRaw) as { completedLessons?: Record<number, number[]>; lastAccessed?: LastAccessed | null })
        : {};

      const merged = {
        completedLessons: mergeCompletedLessons(existing.completedLessons ?? {}, legacy.completedLessons ?? {}),
        // Prefer whatever's already namespaced (this identity's own more
        // recent activity) over the legacy value.
        lastAccessed: existing.lastAccessed ?? legacy.lastAccessed ?? null,
      };
      await AsyncStorage.setItem(storageKey(activeNamespace), JSON.stringify(merged));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    await AsyncStorage.setItem(LEGACY_MIGRATION_FLAG_KEY, 'true');
  } catch {
    // Best-effort — a migration failure must not block hydrate() from
    // loading whatever namespaced data already exists.
  }
}

function mergeCompletedLessons(
  a: Record<number, number[]>,
  b: Record<number, number[]>,
): Record<number, number[]> {
  const merged: Record<number, number[]> = { ...a };
  for (const [courseIdStr, lessonIds] of Object.entries(b)) {
    const courseId = Number(courseIdStr);
    const existing = merged[courseId] ?? [];
    merged[courseId] = Array.from(new Set([...existing, ...lessonIds]));
  }
  return merged;
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

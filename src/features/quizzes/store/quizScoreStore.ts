import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentIdentityNamespace, subscribeToIdentityChange } from '@/src/shared/utils/identityNamespace';
import { logger, newTraceId } from '@/src/shared/utils/logger';

const STORAGE_KEY_PREFIX = 'quiz_scores';
// Pre-namespacing installs stored everything under this exact literal key
// (no `:namespace` suffix) — see progressStore.ts for the full rationale.
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;
const LEGACY_MIGRATION_FLAG_KEY = 'quiz_scores_migrated_v1';

interface ScoreEntry {
  quizId: number;
  score: number;
  total: number;
  completedAt: string; // ISO 8601 — lets setScore resolve local-vs-cloud conflicts by recency
}

interface QuizScoreStore {
  scores: Record<string, ScoreEntry>; // keyed by lessonId (string)
  setScore: (lessonId: string, quizId: number, score: number, total: number, completedAt?: string) => void;
  getScore: (lessonId: string) => ScoreEntry | undefined;
  hydrate: () => Promise<void>;
}

// See progressStore.ts for the full rationale — same per-identity
// namespacing pattern, applied here to quiz scores.
let activeNamespace = currentIdentityNamespace();

export const useQuizScoreStore = create<QuizScoreStore>((set, get) => ({
  scores: {},

  // `completedAt` defaults to now — always correct for a fresh local
  // completion. When called with an explicit (older) completedAt — e.g. by
  // the cloud-progress merge in src/features/progress/service.ts — an
  // existing local entry that's already newer is kept as-is. This is what
  // makes the cloud merge safe to call unconditionally on every session
  // restore without first checking whether a fresher local write (possibly
  // still queued for sync) exists.
  setScore: (lessonId, quizId, score, total, completedAt = new Date().toISOString()) => {
    const existing = get().scores[lessonId];
    if (existing && existing.completedAt > completedAt) return;
    const updated = { ...get().scores, [lessonId]: { quizId, score, total, completedAt } };
    set({ scores: updated });
    AsyncStorage.setItem(storageKey(activeNamespace), JSON.stringify(updated)).catch(() => {});
  },

  getScore: (lessonId) => get().scores[lessonId],

  hydrate: async () => {
    activeNamespace = currentIdentityNamespace();
    try {
      await migrateLegacyIfNeeded();
      const raw = await AsyncStorage.getItem(storageKey(activeNamespace));
      set({ scores: raw ? (JSON.parse(raw) as Record<string, ScoreEntry>) : {} });
    } catch {
      // ignore corrupt storage
    }
  },
}));

function storageKey(namespace: string): string {
  return `${STORAGE_KEY_PREFIX}:${namespace}`;
}

// One-time migration — see progressStore.ts's twin function for the full
// rationale. Legacy entries have no `quizId` (the pre-namespacing shape was
// just `{ score, total }`, keyed by lessonId) and no `completedAt`, so
// migrated entries get quizId -1 (an explicit "unknown/legacy" sentinel —
// harmless, since nothing reads it except a future sync payload, and
// retaking that quiz overwrites it with the real quizId) and completedAt of
// the epoch (deliberately older than any real timestamp, so a genuine cloud
// or local write for the same lesson naturally takes precedence via
// setScore's own recency check, rather than needing special-case logic here).
//
// Known gap: migrated entries are NOT proactively re-uploaded to the cloud
// here (would need a lessonId→quizId lookup this storage-only module
// doesn't have a clean way to make) — they stay local-only until the user
// retakes that quiz, at which point the real sync path picks them up
// normally. Flagged in context/progress-tracker.md rather than silently
// left incomplete.
async function migrateLegacyIfNeeded(): Promise<void> {
  try {
    const alreadyMigrated = await AsyncStorage.getItem(LEGACY_MIGRATION_FLAG_KEY);
    if (alreadyMigrated) return;

    const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, { score: number; total: number }>;
      const existingRaw = await AsyncStorage.getItem(storageKey(activeNamespace));
      const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, ScoreEntry>) : {};

      const merged: Record<string, ScoreEntry> = { ...existing };
      for (const [lessonId, entry] of Object.entries(legacy)) {
        if (merged[lessonId]) continue; // this identity already has a real (namespaced) entry — keep it
        merged[lessonId] = { quizId: -1, score: entry.score, total: entry.total, completedAt: new Date(0).toISOString() };
      }

      await AsyncStorage.setItem(storageKey(activeNamespace), JSON.stringify(merged));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      logger.info(newTraceId(), 'legacy_progress_migrated', { store: 'quiz', quizCount: Object.keys(legacy).length });
    }

    await AsyncStorage.setItem(LEGACY_MIGRATION_FLAG_KEY, 'true');
  } catch (err) {
    logger.warn(newTraceId(), 'legacy_progress_migration_failed', { store: 'quiz', message: (err as Error).message });
    // Best-effort — a migration failure must not block hydrate() from
    // loading whatever namespaced data already exists.
  }
}

subscribeToIdentityChange(() => {
  useQuizScoreStore.getState().hydrate();
});

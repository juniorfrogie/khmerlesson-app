import { useAuthStore } from '@/src/features/auth/store/authStore';

// Namespace key for per-user local storage. Any signed-in user gets their
// own bucket (keyed by userId); guests and the pre-login/anonymous state
// share one 'guest' bucket — there's no account to leak across in either of
// those, only *between different named accounts* on the same device, which
// is the actual bug this exists to fix (see progressStore.ts /
// quizScoreStore.ts: local lesson/quiz progress used to be stored under one
// global key with no user segregation at all, so a second account on the
// same device would inherit the first account's progress).
export function currentIdentityNamespace(): string {
  const { user } = useAuthStore.getState();
  return user?.id ? String(user.id) : 'guest';
}

// Registers `onIdentityChange` to fire whenever the active identity changes
// (login, logout, switching accounts) — not only at cold start. Returns the
// unsubscribe function. Used by any store that must re-hydrate from a
// different namespace the moment the active user changes.
export function subscribeToIdentityChange(onIdentityChange: () => void): () => void {
  let previous = currentIdentityNamespace();
  return useAuthStore.subscribe(() => {
    const next = currentIdentityNamespace();
    if (next !== previous) {
      previous = next;
      onIdentityChange();
    }
  });
}

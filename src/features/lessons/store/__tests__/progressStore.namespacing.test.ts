// Covers the account-boundary fix: local lesson progress must be
// per-identity, and must automatically reload when the active identity
// changes (not only at cold start) — see src/shared/utils/identityNamespace.ts.
//
// The mock's mutable state lives inside the factory's own closure (not a
// test-file-level `let`) — ES module imports are hoisted above other
// top-level statements even when written textually below a jest.mock()
// call, so a test-file-level variable can still be uninitialized by the
// time an eagerly-evaluating import (progressStore.ts computes its initial
// namespace at module load) first calls getState().
import { useProgressStore } from '../progressStore';

type MockAuthState = { user: { id: number } | null };

jest.mock('@/src/features/auth/store/authStore', () => {
  let state: { user: { id: number } | null } = { user: null };
  const listeners: (() => void)[] = [];
  return {
    useAuthStore: {
      getState: () => state,
      subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
          const i = listeners.indexOf(listener);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
    },
    __setMockAuthState: (next: { user: { id: number } | null }) => {
      state = next;
      listeners.slice().forEach((l) => l());
    },
  };
});

const { __setMockAuthState } = jest.requireMock('@/src/features/auth/store/authStore') as {
  __setMockAuthState: (next: MockAuthState) => void;
};

async function flushAsyncHydrate() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('progressStore — per-user namespacing', () => {
  beforeEach(async () => {
    __setMockAuthState({ user: null });
    await useProgressStore.getState().hydrate();
  });

  it('does not leak progress between two different accounts on the same device', async () => {
    __setMockAuthState({ user: { id: 1 } });
    await flushAsyncHydrate();
    useProgressStore.getState().markComplete(10, 100);
    expect(useProgressStore.getState().completedLessons[10]).toEqual([100]);

    // Switch to a different account — must NOT inherit user 1's progress.
    // This is the exact bug: previously nothing cleared/segregated this
    // store on account switch, so this would have failed before the fix.
    __setMockAuthState({ user: { id: 2 } });
    await flushAsyncHydrate();
    expect(useProgressStore.getState().completedLessons[10]).toBeUndefined();

    // Switch back — the original account's own progress must still be there.
    __setMockAuthState({ user: { id: 1 } });
    await flushAsyncHydrate();
    expect(useProgressStore.getState().completedLessons[10]).toEqual([100]);
  });

  it('guest progress is isolated from any signed-in account', async () => {
    __setMockAuthState({ user: null }); // guest / anonymous
    await flushAsyncHydrate();
    useProgressStore.getState().markComplete(20, 200);

    __setMockAuthState({ user: { id: 5 } });
    await flushAsyncHydrate();
    expect(useProgressStore.getState().completedLessons[20]).toBeUndefined();
  });
});

# Progress Tracker

Update this file after every meaningful implementation change. If bugs or any suggestion found, add it to Next Up.

## Current Phase

- In progress — investigation + planning complete for the next Improvement Roadmap cycle (auth/session reliability, subscription sync, cloud quiz progress, Google Play launch). No implementation has started yet; see "## KhmerLesson Improvement Roadmap" below.

## Current Goal

- Phase D complete — Subscription UX fixes shipped. Next: work the Improvement Roadmap below, in the dependency order it specifies, starting with Phase 1 (Authentication & Session Persistence).

## Completed

- Design system foundation: `src/shared/theme/index.ts` — Colors, Spacing, Radius, FontSize, FontWeight, Shadow tokens
- Shared UI components: Text, Button, Badge, ProgressBar (`src/shared/components/`)
- Course feature: `Course` type, `CourseCard` component (`src/features/courses/`)
- Lesson feature: `Lesson`, `LessonDetail`, `VocabItem` types, `LessonRow` component (`src/features/lessons/`)
- Mock data: courses and lessons with Khmer script (`context/mock-data/`)
- Home screen: greetings header, "Continue Learning", all courses list
- Explore screen: course browsing with level filter chips (All / Beginner / Intermediate / Advanced)
- Course detail screen (`app/course/[id].tsx`): hero header, progress bar, lesson list
- Lesson detail screen (`app/lesson/[id].tsx`): vocabulary cards, "Mark as Complete" action
- Tab bar updated: Home + Explore tabs using Ionicons
- Root layout: consistent header styling, dark status bar
- Onboarding screen (`app/onboarding.tsx`): 3-slide horizontal pager with icon, English + Khmer title, body copy; Skip / Next / Get Started actions
- First-launch gate in `app/index.tsx`: hydrates auth, checks onboarding flag, routes to onboarding / login / tabs accordingly
- Auth types (`src/features/auth/types.ts`): `User`, `AuthTokens`, `AuthState`, `AuthProvider`
- Zustand auth store (`src/features/auth/store/authStore.ts`): `setAuth`, `setGuest`, `signOut`, `hydrate` — persists to AsyncStorage
- Login screen (`app/auth/login.tsx`): Google + Apple buttons, "Continue as Guest" → tabs; `isGuest` state in store
- Onboarding "Get Started" / Skip now routes to `/auth/login` instead of tabs
- Apple Sign-In (`src/features/auth/service.ts` `signInWithApple`): calls `expo-apple-authentication`, exchanges identity token with `POST /api/auth/verify-apple-id-token`, stores user + tokens via auth store; cancel is silently ignored, other errors shown inline
- `apiPost<T>` and `apiPostForm<T>` added to `src/services/api.ts`; form-encoded variant used by Apple + Google + other auth endpoints
- Google Sign-In (`signInWithGoogle` in service.ts): `expo-auth-session` PKCE flow → Google userinfo API → `POST /api/auth/register-auth-service` (form-encoded, `registrationType: "google"`) → store; cancel/dismiss is silent, errors shown inline
- Me tab (`app/(tabs)/me.tsx`): replaces Explore tab; auth-guarded (unauthenticated → `/auth/login`); shows avatar initials, name, email, provider badge; Support (mailto), Privacy Policy (url), Log Out (alert confirm → signOut), Delete Account (alert confirm → TODO API)
- Tab layout: Explore hidden (`href: null`), Me tab added with person icon
- Purchase course flow (`app/course/purchase.tsx`, `src/features/courses/service/purchaseService.ts`): IAP via `react-native-iap` (deferred require for Expo Go safety); connects IAP, loads product price, handles new purchase + existing entitlement resume, records to `POST /api/v1/purchase-history`, finishes transaction; auto-refreshes expired access token during purchase
- Lesson progress store (`src/features/lessons/store/progressStore.ts`): Zustand store persisted to AsyncStorage; tracks completed lessons per course and last-accessed lesson; hydrated on app startup alongside auth store
- Completed lesson UI: `LessonRow` shows green checkmark icon when lesson is complete
- Continue Learning section on home screen: appears after first lesson visit; tapping resumes the last-accessed lesson directly
- Lesson tracking wired end-to-end: `lesson/[id].tsx` calls `setLastAccessed` on load and `markComplete` on Finish; `course/[id].tsx` passes courseId/courseTitle params and shows completed state per row
- Onboarding prefetch: `prefetchCourses()` called on onboarding mount; home screen renders instantly from module-level cache with no loading spinner; animated toast banner shows success / no-internet / server-unavailable as appropriate
- TTS: replaced `expo-speech` with backend proxy (`GET /api/tts?q=<text>`) played via `expo-av`; Khmer language hardcoded server-side; new service at `src/features/lessons/service/ttsService.ts`
- Quiz feature: `GET /api/v1/quizzes` + `GET /api/v1/quizzes/:id`; types at `src/features/quizzes/types.ts`; hooks `useQuizDetail`, `useQuizByLesson`; one-question-at-a-time quiz screen at `app/quiz/[id].tsx` with answer feedback and result screen; "Take the Quiz" banner appears on last lesson section when a quiz exists for that lesson
- **A1** · Course type updated (`hasAccess`, `comingSoon`, `order` added; old `price`/`productId`/`hasPurchased` kept optional for A6 cleanup); `ApiCourse` in `useCourses.ts` updated to new API response shape; `mobile-data-models.md` and `api-overview.md` updated to reflect subscription model
- **A2** · `SubscriptionPlan`, `Subscription`, `SubscriptionStatus` types at `src/features/subscriptions/types.ts`; Zustand store at `src/features/subscriptions/store/subscriptionStore.ts` (AsyncStorage key `subscription_state`); `hydrate()` added to `Promise.all` in `app/index.tsx`
- **A3** · `useSubscriptionPlans` (public, `GET /api/v1/subscription-plans`) and `useMySubscription` (auth-required, `GET /api/v1/subscriptions/me`, syncs result into subscription store) at `src/services/hooks/`
- **A4** · `purchaseService.ts` rewritten for subscription model: `loadSubscriptionProduct` (subs-type StoreKit lookup), `purchaseSubscription(planProductId, token) → Promise<Subscription>` (calls `POST /api/v1/subscriptions` with JWS); removed per-course helpers
- **A5** · `app/subscription/index.tsx` — new paywall screen; loads plans via `useSubscriptionPlans`, fetches StoreKit price, calls `purchaseSubscription` on tap, writes result to subscription store, `router.back()` on success; IAP-unavailable warning for Expo Go; `app/course/purchase.tsx` deleted (no longer referenced)
- **A6** · `CourseCard`: access logic switched to `hasAccess`/`comingSoon`; coming-soon cards non-tappable; price badge removed; "Coming Soon" tag added. `course/[id].tsx`: uses `hasAccess`/`comingSoon`; `handleSubscribe` navigates to `/subscription`; `useFocusEffect` now always refetches on focus; `purchased`/`hasPurchased`/`purchasedLocally` removed
- **A7** · `apiFetch` now parses error body for `message` and `code`. `useCourseLessons` + `useLessonDetail` expose `forbiddenReason: 'tokenExpired' | 'subscription' | 'comingSoon' | null`. `course/[id].tsx` + `lesson/[id].tsx` redirect to `/auth/login` on `tokenExpired`; lesson screen shows subscribe/coming-soon UI for the respective 403 reason
- **B1** · Quiz score store at `src/features/quizzes/store/quizScoreStore.ts`; persists to AsyncStorage key `quiz_scores`; keyed by `lessonId` string; methods `setScore`, `getScore`, `hydrate`; hydrated in `app/index.tsx` alongside auth/progress/subscription stores
- **B2** · Score saved on quiz completion: `quiz/[id].tsx` calls `setScore(quiz.lessonId, correctCount, total)` via `useEffect` when `showResult` becomes true
- **B3** · Color-coded quiz circle on `LessonRow`: left circle is independently tappable (`onQuizPress`); no score → empty outline ring; has score → filled with 4-band color (error/warning/warningDark/success); completion checkmark shown inside circle in score tint color; `course/[id].tsx` reads `quizScores` from store and passes `quizScore` + `onQuizPress` (→ `/quiz/select`) per row
- **B4** · Skipped — quiz circle on `LessonRow` navigates directly to the quiz; `course/[id].tsx` uses `useQuizzes` to build a `lessonId → quizId` map; circle is only tappable when a quiz exists for that lesson; "Take the Quiz" banner in `lesson/[id].tsx` navigates directly to `/quiz/[id]`
- **B5** · TTS speaker button on quiz questions (`quiz/[id].tsx`): toggles `playTTS`/`stopTTS`; icon animates between outline and filled; auto-stops on question change and screen unmount
- **D1** · Paywall "Your Plan" guard (`app/subscription/index.tsx`): `useMySubscription` called on mount; `activePlanId` derived from `planId` when status is `active` or `trial`; current-plan card rendered non-tappable (70% opacity, green checkmark, "Your Plan" badge) — expired/cancelled subscriptions remain selectable for renewal; auto-select skips the current plan
- **D2** · 7-day free trial UI (`app/subscription/index.tsx`): `isTrialEligible` flag set when `mySubscription === null` after subscription fetch resolves; green "7-day free trial for new subscribers" pill badge shown in hero; CTA button label switches to "Try Free for 7 Days"; terms line updates to show trial price breakdown; backend already sets `status: "trial"` via `isIntroductoryOffer` from StoreKit 2 JWS (`server/api.ts` line 441) — no backend changes needed

## In Progress

- None

## Next Up — Implementation Plan

Work these in order. Each item is one unit; run `npx tsc --noEmit` and update this file after each.

---

### Phase A — Subscription Model Migration ✅ Complete

### Phase B — Quiz 1 Improvements ✅ Complete

### Phase C — Support Contact ✅ Complete 

---

### Phase D — Subscription UX Fixes ✅ Complete

**D1 · Hide/disable already-purchased plan on paywall screen** ✅
- Bug: After purchasing Plan 1, the paywall (`app/subscription/index.tsx`) still shows Plan 1 as a purchasable option.
- Fix: In `subscription/index.tsx`, after loading `useMySubscription`, compare `subscription.planLevel` to each plan's `planLevel`. If they match and the subscription is `active` or `trial`, render the plan card as "Current Plan" (non-tappable, visually distinct — e.g. muted border + "Your Plan" badge) instead of showing the purchase CTA.
- Edge cases: expired/cancelled subscription should still show the plan as purchasable so the user can renew.

**D2 · 7-day free trial** ✅
- New feature: first-time subscribers get a 7-day free trial before being charged.
- Backend: `POST /api/v1/subscriptions` already handles `offerType === INTRODUCTORY_OFFER` from StoreKit 2 JWS payload and sets `status: "trial"` in the DB. Confirm `currentPeriodEndsAt` is set to trial end date (7 days from purchase) and `planLevel` is populated correctly.
- Frontend: On the paywall screen, show a "Start 7-day free trial" CTA instead of the price for users with no existing subscription. After trial starts, `useMySubscription` returns `status: "trial"` — subscription store and access gates already handle `trial` the same as `active`, so no other UI changes needed.
- Backend check: verify `server/services/iap/ios/storekit2/` correctly detects `offerType === INTRODUCTORY_OFFER` and routes to `status: "trial"`.

---

## KhmerLesson Improvement Roadmap

Investigated 2026-08-30. Four coordinated objectives: (1) auth/session reliability, (2) subscription restoration/sync, (3) cloud quiz progress, (4) Google Play launch. Not yet implemented — this is the planning breakdown. Findings below are grounded in the actual code (file:line references throughout); items with no confirmed answer are marked `[NEEDS INVESTIGATION]`, and Play policy items that need a live check are marked `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]`.

### Key architecture findings from investigation

- **Root cause of "logged out after a few days" (Phase 1) is confirmed and precise**: `src/services/api.ts`'s `apiFetch`/`apiPost`/`apiPostForm` have no token-refresh awareness at all. `useAuthStore.refreshTokens()` (`src/features/auth/store/authStore.ts:69-82`) exists and works, but is called from exactly **one** place in the whole app — `purchaseService.ts:113-121`, mid-purchase. Every other authenticated hook (`useCourseLessons`, `useLessonDetail`) just detects the backend's `code: "TOKEN_EXPIRED"` response and sets `forbiddenReason: 'tokenExpired'`, and the screens respond by redirecting straight to `/auth/login` — never attempting a silent refresh first. Backend-side, `server/auth/middleware/authenticate.ts:104-115` explicitly disables auto-refresh for Bearer-token (mobile) clients by design ("Mobile clients must call `POST /api/auth/refresh-token` explicitly") — so this is a client-side gap, not a backend bug.
- **This root cause also explains most of the Phase 2 subscription symptom**: `GET /api/v1/main-lessons` is in `SEMI_PUBLIC_PREFIXES` (`authenticate.ts:39-51`), so an expired/invalid access token does not 401 on it — the middleware falls through with `req.user` undefined, and the course list silently renders as if the user were logged out (`hasAccess: false` on every non-free course). So a large share of "subscription looks lost" is really "the access token expired and nothing refreshed it" — fixing Phase 1 should visibly shrink Phase 2's symptom, though Phase 2 still needs its own fix (see below) for the remaining gap: session **restoration** never proactively syncs subscription even with a valid token.
- **The task's assumption about logout deleting quiz progress is backwards** — verified `authStore.signOut()` (`authStore.ts:40-46`): it clears `auth_state` and calls `subscriptionStore.clearSubscription()`, but never touches `useProgressStore` (`lesson_progress`) or `useQuizScoreStore` (`quiz_scores`). Progress is **not** deleted on logout — it silently **persists across accounts on the same device**, since it's keyed only by `courseId`/`lessonId`, never by `userId`. This is a real, currently-shipping data-integrity bug independent of the cloud migration and is called out as its own P0 item below.
- **No user-scoped progress table exists in the backend at all.** `shared/schema.ts`'s only progress-adjacent table is `analytics` (aggregate `completions`/`averageScore` per lesson/quiz, not per-user). `POST /api/v1/quizzes/:id/submit` (`server/api.ts:373-422`) already grades server-side and enforces access control, but **persists nothing** and is **never called by the mobile app** — the app grades entirely client-side using the `correctAnswer` field the quiz-detail response already ships in plaintext. Phase 3 is a from-scratch build, not a wire-up of existing plumbing, though the `/submit` endpoint's grading/access-check logic can likely be extended rather than duplicated.
- **Subscription entitlement is already platform-agnostic in the DB.** `hasAccessToCourse` (`server/features/subscriptions/controller/controller.ts:32-45`) only reads `subscriptions.status`/`currentPeriodEndsAt` + the `subscription_plan_courses` join — `platform` is just a column, not a branch in the access logic, and `subscriptionPlans.productIdAndroid` already exists (unused). This means Phase 4.4 ("unified entitlement") is narrower than it might sound — it's mostly "make the Android verification path write into the same table the same way," not a new abstraction layer.
- **A full request-tracing pipeline already exists and is production-tested** (`src/shared/utils/logger.ts` ↔ `server/utils/trace-logger.ts` ↔ `debug_logs` table ↔ dashboard "Debug Logs" page, all keyed by `X-Correlation-ID`/`traceId`), built specifically to debug the subscription/purchase flow — see `context/subscription-debugging.md`. Phase 5 below is almost entirely about wiring new event types into this existing system, not building new infrastructure.
- **No automated test suite exists** in either repo (`khmerlesson-dashboard/CLAUDE.md`: "No test suite is configured"; nothing in this repo's `package.json` suggests one either). **Decided 2026-08-30**: add focused unit tests for this cycle's specific high-risk logic only (see the Testing section under P2 below) — everything else stays manual-checklist QA.
- **`khmerlesson-app/khmerlesson-app/ios/Pods/`** — a stray, one-level-too-deep CocoaPods artifacts folder was found during this investigation. `[NEEDS INVESTIGATION]` — looks like leftover from a misplaced `pod install`; not part of the tracked native config (`.gitignore:47` already ignores `/ios` and `/android` at the real root — this is a nested app inside itself). Confirm with the user before deleting.

### Recommended dependency order

1. Phase 1 — Auth/session reliability (foundational: Phase 2 and 3's "sync on restore" items need a valid, refreshed token to sync against)
2. Phase 2 — Subscription sync architecture + auto-restore
3. Phase 3 — Quiz progress backend/schema, then client sync
4. Phase 3A — Legacy local-progress migration
5. Phase 4.1 — Android application readiness (package name decision blocks almost everything else in Phase 4)
6. Phase 4.2 — Android authentication
7. Phase 4.3 — Google Play Billing
8. Phase 4.4 — Unified entitlement verification (mostly confirmation, not new build — see finding above)
9. Phase 4.5 — Cross-platform progress verification (QA, not new build — depends on Phase 3)
10. Phase 4.7 — Android QA
11. Phase 4.6 — Play Console / store compliance (can run in parallel with 4.1-4.5 once the package name is set, since most of it is non-code)
12. Phase 4.8 — Production release
13. Phase 5 — Observability wiring (additive throughout — each phase above should wire its own events as it lands, not as a separate final pass)

---

### P0 — Critical: Account & Data Reliability

#### Authentication & Session Persistence

Current architecture: Zustand store (`src/features/auth/store/authStore.ts`) persisted as plain JSON to `AsyncStorage` key `auth_state` (unencrypted). `hydrate()` just replays whatever was stored, with no expiry check. `refreshTokens()` exists and correctly rotates the refresh token but is invoked from exactly one call site (mid-purchase). `app/index.tsx:16-38` hydrates auth/progress/subscription/quiz stores in parallel at cold start and routes based on `isAuthenticated`/`isGuest` with no validation step in between.

* [x] Add a token-refresh interceptor to the shared API layer — **done 2026-08-31**
  * Implementation: `src/services/api.ts` — `rawApiFetch`/`rawApiPost`/`rawApiDelete`/`rawApiPostForm` hold the original request bodies; the exported `apiFetch`/`apiPost`/`apiDelete`/`apiPostForm` now wrap them with a new `withTokenRefresh()` helper that retries once on `code === 'TOKEN_EXPIRED'` after calling a new `refreshAccessToken()`, and rethrows the original error unchanged if the refresh itself fails (so `useCourseLessons`/`useLessonDetail`'s existing `forbiddenReason: 'tokenExpired'` handling still fires correctly for a genuinely dead session).
  * `refreshAccessToken()` reaches `authStore` via a deferred `require()` (`getAuthStore()`), matching the existing cycle-avoidance pattern already used by `logger.ts` (`authStore.ts` imports `api.ts` at the top level, so a top-level import the other way would cycle).
  * Verified: `./node_modules/.bin/tsc --noEmit` clean; `expo lint` shows no new errors/warnings (one new harmless "unused eslint-disable" warning, consistent with the same pre-existing pattern already present throughout `purchaseService.ts`).

* [x] Deduplicate concurrent refresh calls — **done 2026-08-31, same change as above**
  * Implementation: `refreshAccessToken()` in `src/services/api.ts` holds a module-level `refreshPromise`; concurrent callers hitting `TOKEN_EXPIRED` at the same time all await the same in-flight promise instead of each calling `refreshTokens()` independently. Cleared in a `.finally()` once the refresh settles.
  * Note: a `return refreshPromise ?? Promise.resolve(null)` was needed instead of a bare `return refreshPromise` — TypeScript won't narrow a module-level variable past a closure that reassigns it (the `.finally` callback), so the declared-nullable type leaks through; the `??` fallback is a no-op at runtime (the promise is always set by that point) but keeps the function's return type correct without fighting the narrowing limitation.

* [x] Validate/refresh session proactively at startup — **done 2026-08-31**
  * Implementation: `src/features/auth/store/authStore.ts`'s `hydrate()` now decodes the stored access token's `exp` claim (`isExpiredOrExpiringSoon()`, 30s skew) after loading it from `AsyncStorage`, and — if expired or expiring imminently — calls `refreshTokens()` before returning. `app/index.tsx` already `await`s `hydrate()` inside its startup `Promise.all` before routing, so this required no changes to `app/index.tsx` itself: the existing await already gates routing on the (now more thorough) hydrate promise.
  * Scoped down from the original plan: did **not** add a separate `authStatus` enum to the store — the existing `await Promise.all([hydrate(), ...])` → route pattern in `app/index.tsx` already provides the gating the enum was meant to provide, and `isAuthenticated`/`isGuest` remain suffient for every current call site. Revisit only if a future screen needs to distinguish "still restoring" from "done," which none does today.
  * Likely affected components actually touched: `src/features/auth/store/authStore.ts` only.
  * Verified: `tsc --noEmit` clean.

* [x] Foreground/background session revalidation — **done 2026-08-31**
  * Implementation: `authStore.ts`'s cold-start expiry-check/refresh logic was extracted into a shared `refreshIfNeeded(get, traceId, trigger)` helper (`trigger: 'cold_start' | 'foreground'`, so the two call sites are distinguishable in `debug_logs`), used by both `hydrate()` and a new `revalidateIfExpiring()` store method. `app/_layout.tsx` now registers an `AppState.addEventListener('change', ...)` listener that calls `revalidateIfExpiring()` whenever the app returns to `'active'`, cleaned up on unmount.
  * `revalidateIfExpiring()` is a no-op for guests/unauthenticated sessions (`isAuthenticated`/`tokens` guard) — only ever acts on an actual signed-in session.
  * Verified: `tsc --noEmit` and `eslint` both clean on the touched files.

* [x] Move auth tokens to secure storage — **done 2026-08-31**
  * Implementation: added `expo-secure-store` (`npx expo install expo-secure-store`, which also registered its config plugin in `app.json` automatically). New `src/features/auth/store/secureTokenStorage.ts` wraps `SecureStore.setItemAsync`/`getItemAsync`/`deleteItemAsync` under key `auth_tokens_secure`, falling back to `AsyncStorage` only on `Platform.OS === 'web'` (SecureStore has no web equivalent, and this app ships a `web` output target per `app.json`). `authStore.ts`'s `AUTH_STORAGE_KEY` (`auth_state`) now holds only the non-sensitive `{ user }` profile; `setAuth`/`refreshTokens`/`signOut` read/write tokens through the new module instead.
  * Backward compatibility: `hydrate()` migrates existing installs automatically — if `SecureStore` has no tokens yet but the legacy `auth_state` blob still has a `tokens` field (pre-this-change installs), it moves them into `SecureStore` once, rewrites `auth_state` to just `{ user }`, and logs `auth_tokens_migrated_to_secure_store`. This avoids silently signing out every existing installed user on update.
  * Likely affected components actually touched: `src/features/auth/store/authStore.ts`, new `src/features/auth/store/secureTokenStorage.ts`, `package.json`/`package-lock.json`, `app.json` (plugin auto-registered by `expo install`).
  * Verified: `tsc --noEmit` and `eslint` clean; confirmed via `grep` that no other file reads the `auth_state` AsyncStorage key directly (only `authStore.ts` touches it).
  * Not verified (cannot be, in this environment): actual Keychain/Keystore behavior on a real device/simulator — no device or emulator is available here. Flagged for the manual Auth regression QA pass.

* [x] Remove raw token values from console logs — **done 2026-08-31**
  * Implementation: `authStore.ts`'s `setAuth()` and `hydrate()` no longer log user/token payloads at all (superseded by the structured `logger.info(...)` calls added for the lifecycle-events item below, which log only booleans/counts). `service.ts:88`'s Apple verify-response log now logs `{ hasToken, hasUser, hasEmail }` booleans instead of `JSON.stringify(verifyResponse)`.
  * Verified: `grep -n "console.log" src/features/auth/store/authStore.ts` shows none left; `service.ts`'s remaining `console.error` calls (sign-in failure paths) already only logged error objects, not tokens — unchanged.

* [x] Wire session-lifecycle events into the existing debug-log pipeline — **done 2026-08-31, same change as the startup-validation item**
  * Implementation: `authStore.ts`'s `hydrate()` emits `session_restore_started` (with `found: boolean`), then `session_restored` (with `refreshed: boolean`) or `session_refresh_failed` (with the error message) through the existing `logger` from `src/shared/utils/logger.ts`, using a fresh `traceId` per restore attempt — flows into `debug_logs` exactly like existing purchase-flow traces.
  * Likely affected components actually touched: `src/features/auth/store/authStore.ts` only (no `app/index.tsx` change needed, per the note above).

* [BLOCKED — HUMAN ACTION REQUIRED: no physical device or simulator/emulator is available in this environment] Auth regression QA pass
  * All code-side Phase 1 items above are implemented and pass `tsc`/`eslint`; the pure-logic pieces (token-refresh retry/dedup) also get focused unit test coverage — see the Testing item under P2. What remains is genuinely device-dependent: real Keychain/Keystore behavior, real background/foreground transitions, and real Google/Apple sign-in flows can't be exercised from this sandboxed environment.
  * Target behavior (unchanged): manual checklist — fresh login (Google/Apple/Guest) → force-expire the access token → confirm silent refresh → let the refresh token itself expire → confirm graceful redirect to login → confirm logout clears `auth_state`/SecureStore correctly and does not incorrectly clear/leak other stores.
  * Action needed from a human: run this checklist on a real device or simulator once these commits are pulled.

#### Subscription Restoration & Synchronization

Current architecture: `useMySubscription` (`src/services/hooks/useMySubscription.ts`) is the only thing that calls `GET /api/v1/subscriptions/me` and writes into `useSubscriptionStore`; it's mounted in exactly two places — `app/(tabs)/me.tsx:21` and `app/subscription/index.tsx:37`. `subscriptionStore.hydrate()` (`src/features/subscriptions/store/subscriptionStore.ts:27-36`) only replays the last cached AsyncStorage value — no network call. `app/auth/login.tsx:36-43`'s `prefetchSubscription` DOES sync right after a **fresh** Google/Apple login — the gap is specifically session **restoration** (returning with an already-persisted session) and background return. `purchaseService.ts`'s `reconcileAvailablePurchases()` (only invoked via `initPurchaseFlow()` at `app/subscription/index.tsx:74` on mount) is what the task calls "visiting the Plan screen causes a backend subscription check." Course access itself (`hasAccess`/`comingSoon`) is computed server-side per request, not derived from the local store — see the root-cause finding above tying this to Phase 1.

* [x] Extract subscription sync into a reusable function — **done 2026-08-31**
  * Implementation: new `src/features/subscriptions/service.ts` exports `syncSubscription(accessToken)`, wrapping the fetch + store write. `useMySubscription.ts` is now a thin wrapper around it; `app/auth/login.tsx`'s `prefetchSubscription` and `app/index.tsx`'s restore-time sync (below) both call it directly.

* [x] Trigger subscription sync on session restoration — **done 2026-08-31**
  * Implementation: `app/index.tsx` calls `syncSubscription(tokens.accessToken)` right after the startup `Promise.all` resolves (so it runs with an already-refreshed token, per Phase 1), for any authenticated (non-guest) session. Deliberately **not awaited** before routing — this shouldn't add a network round trip to every cold start; it updates the shared store in the background, and the new `status` field (below) means no screen misreads "still syncing" as "no subscription" in the meantime.
  * Likely affected components actually touched: `app/index.tsx` only.

* [x] Introduce an explicit subscription status distinct from "no subscription" — **done 2026-08-31**
  * Implementation: `subscriptionStore.ts` gained a `status: 'unknown' | 'loading' | 'active' | 'inactive' | 'error'` field (named `SubscriptionSyncStatus` to avoid colliding with the existing `Subscription['status']` type in `types.ts`, which is the server's `trial`/`active`/`expired`/`cancelled`), plus an `error: string | null` field. Every write path (`setLoading`, `setSubscription`, `setError`, `clearSubscription`, `hydrate`) sets it explicitly. Persistence format changed from a raw `Subscription | null` to `{ mySubscription, status }`; `hydrate()` reads both the new shape and the legacy raw shape for backward compatibility with already-installed app versions.
  * Fixed the concrete conflation the roadmap flagged: `app/subscription/index.tsx`'s `isTrialEligible` now reads `(status === 'inactive' || status === 'active') && mySubscription === null` instead of the old `!subscriptionLoading && mySubscription === null` — a sync that hasn't completed yet (`status === 'unknown'`/`'loading'`) can no longer make the trial banner flash on and then off.
  * `app/(tabs)/me.tsx` was left unchanged — it only reads `subscription` (not the old `loading` boolean), so it's unaffected by this and needed no fix.
  * Likely affected components actually touched: `src/features/subscriptions/store/subscriptionStore.ts`, `src/services/hooks/useMySubscription.ts`, `app/subscription/index.tsx`.

* [x] Refresh course access after subscription sync resolves — **resolved as a no-op, 2026-08-31**
  * Finding: since subscription sync now happens (or is already in flight) *before* `app/index.tsx` routes into `(tabs)` (previous item), `useCourses`'s own mount-time fetch (`src/services/hooks/useCourses.ts`) already runs with a token whose entitlement state is current by the time the course list screen exists — no extra explicit `refetch()` call was needed. Verified by inspection, not by running the app (no simulator available in this environment) — flagged as a QA check, not a further code change.

* [x] Manual "Restore Purchases" affordance — **done 2026-08-31, decided to add it**
  * Implementation: `reconcileAvailablePurchases` in `purchaseService.ts` is now `export`ed (only the export keyword changed — **its internals were deliberately left untouched**, since `context/subscription-debugging.md` flags this file as fragile, recently-fixed purchase-flow code). `app/subscription/index.tsx` adds a "Restore Purchases" text button below the terms text (hidden when IAP is unavailable, e.g. Expo Go). Since `reconcileAvailablePurchases()` always resolves `void` and never rejects (all its error paths log and swallow internally, by design), the button infers outcome by snapshotting `mySubscription` before the call, then calling `syncSubscription()` directly afterward and comparing `id`/`status` — reports "Purchases Restored" / "Nothing to Restore" / "Restore Failed" accordingly, with a loading spinner while in flight.
  * Likely affected components actually touched: `src/features/courses/service/purchaseService.ts` (one-line export), `app/subscription/index.tsx`.

* [x] Subscription sync error handling — **done 2026-08-31, same change as the status-field item**
  * Implementation: `syncSubscription()`'s catch block calls `store.setError(message)`, which sets `status: 'error'` while leaving `mySubscription` (and its previously-derived `status`, before the error) untouched — a failed sync never downgrades previously-confirmed access into "locked."

* [x] Subscription sync diagnostics — **done 2026-08-31, same change**
  * Implementation: `syncSubscription()` emits `subscription_sync_started`, then `subscription_active` / `subscription_sync_completed_none` (with the server `status`), or `subscription_sync_failed`, through the existing `logger` — same `debug_logs` pipeline as everything else.

Verified (all items above): `tsc --noEmit` and `eslint` clean across every touched file; only pre-existing warnings remain, identical to the pre-change baseline.

#### Account-Scoped Progress Cloud Sync (Quiz Scores + Lesson Completion)

**Scope decided 2026-08-30**: covers both quiz scores and lesson completion, as one account-scoped cloud progress architecture. Quiz progress is **final score + completion state only** — no resumable/per-question attempts, since current UX has no resume concept and none is being added this cycle.

Current architecture: local-only, split across two independent stores keyed by `courseId`/`lessonId` (never `userId`) — `useProgressStore` (lesson completion, AsyncStorage key `lesson_progress`) and `useQuizScoreStore` (final quiz score only, AsyncStorage key `quiz_scores`, `src/features/quizzes/store/quizScoreStore.ts`). Grading happens entirely client-side in `app/quiz/[id].tsx` (`handleSelect`) because the quiz-detail API response already ships each question's `correctAnswer` in plaintext (`src/features/quizzes/types.ts`) — no server round-trip occurs during a quiz today. Only the **final** score is ever persisted (`quiz/[id].tsx:35-38`, fires once `showResult` is true). Backend: `POST /api/v1/quizzes/:id/submit` (`server/api.ts:373-422`) already grades server-side and checks access, but writes nothing to the database and is never called by the mobile client. No user-scoped progress table exists in `shared/schema.ts` today.

**Important correction to the task's stated problem**: logout does *not* currently delete local progress (see root-cause finding above) — the real bug is that progress persists **across accounts** on a shared device.

* [x] Namespace local progress storage by user — **done 2026-08-31**
  * Implementation: new `src/shared/utils/identityNamespace.ts` exports `currentIdentityNamespace()` (a signed-in user's `String(userId)`, or `'guest'` for guest/anonymous — the two are merged into one bucket since neither has an account to leak across) and `subscribeToIdentityChange(cb)` (wraps `useAuthStore.subscribe`, firing `cb` only when the resolved namespace actually changes). Both `progressStore.ts` and `quizScoreStore.ts` now key their AsyncStorage entry as `<prefix>:<namespace>` instead of a single global key, and both call `subscribeToIdentityChange(() => hydrate())` at module load so they automatically reload from the correct namespace on login/logout/account-switch — not only at cold start. `hydrate()` in both stores now also explicitly resets in-memory state to empty when nothing is cached for the active namespace, so a previous identity's data can't keep rendering after a switch just because nothing overwrote it.
  * Ordering fix required: `app/index.tsx` previously hydrated `authStore` and the namespaced stores inside the same `Promise.all` — a race, since the namespaced stores would read whatever identity was in `authStore`'s state *at that instant*, which could still be the default "no user" if auth's own hydrate hadn't finished yet. Now `await hydrate()` (auth) resolves fully before `useProgressStore`/`useQuizScoreStore`/`useSubscriptionStore` hydrate.
  * Deliberately **not** clear-on-logout, per the resolved scope decision: `authStore.signOut()` was left untouched (still doesn't touch these two stores) — namespacing alone is the fix, so a user's own progress survives being signed out and back in, even before cloud sync exists to restore it from the server.
  * Likely affected components actually touched: new `src/shared/utils/identityNamespace.ts`, `src/features/lessons/store/progressStore.ts`, `src/features/quizzes/store/quizScoreStore.ts`, `app/index.tsx` (hydrate ordering only — `authStore.ts` itself was not modified).
  * Verified: `tsc --noEmit` and `eslint` clean (only pre-existing warnings in `app/index.tsx`, unrelated to this change). Focused unit tests for this logic are tracked under Testing (P2) below, not yet written.

* [ ] Design the cloud progress schema + migration (quiz scores + lesson completion)
  * Current behavior: no such tables exist; `analytics` is aggregate, not per-user.
  * Target behavior: two new tables, following the existing Drizzle conventions in `shared/schema.ts` (serial PK, `references()` with `onDelete: 'cascade'`, `timestamp` columns — matches `subscriptions`/`analytics`):
    - `quiz_attempts`: `id, userId → users (cascade), lessonId → lessons, quizId → quizzes, score, total, correctAnswers, completedAt, createdAt, updatedAt`. **No resumable/in-progress columns** — decided scope is final score + completion state only.
    - `lesson_completions`: `id, userId → users (cascade), lessonId → lessons, courseId → mainLessonId, completedAt, createdAt, updatedAt` — mirrors what `useProgressStore.markComplete()` already tracks locally (`completedLessons: Record<courseId, lessonId[]>`).
  * New migration `migrations/0004_<name>.sql` (next after `0003_debug_logs.sql`), via `npm run db:migrate`.
  * Likely affected components: `khmerlesson-dashboard/shared/schema.ts`, new migration file.
  * Dependencies: none — foundational for the rest of this phase.
  * Acceptance criteria: schema reviewed and migration applies cleanly against the dev database.

* [ ] Backend progress API (quiz + lesson)
  * Current behavior: `POST /api/v1/quizzes/:id/submit` grades and access-checks but persists nothing; no lesson-completion endpoint exists at all; no read endpoint exists for either.
  * Target behavior: `GET /api/v1/progress` (current user's quiz attempts + lesson completions, or two endpoints if cleaner given the two tables) and corresponding `POST` upserts, as a new `server/features/progress/` module matching the existing two-layer `controller/route` pattern, mounted in `server/routes.ts`, requiring `authenticateToken` (not semi-public — progress is always user-owned). `[NEEDS INVESTIGATION]`: whether to extend the existing `/submit` endpoint to persist quiz attempts (it already grades + access-checks) rather than add a parallel endpoint.
  * Likely affected components: new `server/features/progress/` (or extended `server/api.ts` submit route), `server/routes.ts`.
  * Dependencies: schema (above).
  * Acceptance criteria: an authenticated request can write and then read back both a quiz attempt and a lesson completion.

* [ ] Ownership/authorization on progress endpoints
  * Target behavior: every read/write scoped to `req.user.id` from the verified JWT, never a client-supplied `userId` — mirrors how `hasAccessToCourse` always derives `userId` from the authenticated caller.
  * Likely affected components: new progress controller.
  * Dependencies: backend API (above).
  * Acceptance criteria: one user cannot read or write another user's progress by manipulating request parameters.

* [ ] Client-side sync for quiz completion — cloud becomes authoritative, local becomes cache
  * Current behavior: `quiz/[id].tsx:35-38` writes only to `useQuizScoreStore` (namespaced AsyncStorage, per the item above).
  * Target behavior: on completion, call the new progress endpoint in addition to (not instead of) the local write.
  * Likely affected components: `app/quiz/[id].tsx`, `src/features/quizzes/store/quizScoreStore.ts` (or a new service wrapping it).
  * Dependencies: backend API + ownership checks; namespacing item (above).
  * Acceptance criteria: a completed quiz is visible via the new `GET` endpoint immediately after completion.

* [ ] Client-side sync for lesson completion — same pattern as quiz sync
  * Current behavior: `useProgressStore.markComplete()` (`src/features/lessons/store/progressStore.ts:26-32`), called from `app/lesson/[id].tsx` on Finish, writes only to local AsyncStorage.
  * Target behavior: on `markComplete`, also call the new lesson-completion endpoint, mirroring the quiz sync item above.
  * Likely affected components: `src/features/lessons/store/progressStore.ts`, `app/lesson/[id].tsx`.
  * Dependencies: backend API + ownership checks; namespacing item (above).
  * Acceptance criteria: a completed lesson is visible via the new `GET` endpoint immediately after completion.

* [ ] Fetch cloud progress on session restoration/login (both types)
  * Target behavior: alongside the subscription-sync-on-restore item above, fetch cloud quiz attempts + lesson completions and merge into the two local stores on restore/login, so progress from another device or after reinstall appears without redoing anything.
  * Likely affected components: `app/index.tsx`, `src/features/quizzes/store/quizScoreStore.ts`, `src/features/lessons/store/progressStore.ts`.
  * Dependencies: backend API; Phase 1's startup validation; namespacing item (so the fetched data lands in the right user's namespace).
  * Acceptance criteria: logging into a fresh install shows previously-completed lessons and quiz scores.

* [ ] Offline write buffering + retry
  * Target behavior: if a progress write fails (offline), keep the local write and retry later. `[NEEDS INVESTIGATION]` for the exact retry/queue mechanism — note `logger.ts`'s `flushLogs()` re-buffer-on-failure pattern (`src/shared/utils/logger.ts:94-101`) is a proven precedent already in this codebase that a similar mechanism could reuse.
  * Likely affected components: both client-side sync items (above).
  * Dependencies: client-side sync (both).
  * Acceptance criteria: completing a quiz or lesson offline does not lose the record, and it syncs once connectivity returns.

* [ ] Conflict handling between local cache and cloud
  * Target behavior: define the merge rule — this overlaps directly with the legacy-migration rules in Phase 3A below; likely the same rule set applies to steady-state multi-device conflicts, not just the first migration. Since scope is final-state-only (no resumable attempts), conflicts reduce to "which side has a completion recorded" and "which completion timestamp is newer" — no partial-vs-partial merge logic needed.
  * Likely affected components: both client-side sync items.
  * Dependencies: offline buffering.
  * Acceptance criteria: a documented, testable rule exists for every conflict case (cloud empty, cloud newer, local newer).

* [ ] Progress sync diagnostics
  * Target behavior: emit `quiz_progress_sync_started` / `quiz_progress_synced` / `quiz_progress_sync_failed` and `lesson_progress_sync_started` / `lesson_progress_synced` / `lesson_progress_sync_failed` through the existing `logger`.
  * Likely affected components: both client-side sync items.
  * Dependencies: client-side sync (both).
  * Acceptance criteria: a progress-sync trace is queryable in `debug_logs`.

* [ ] Focused unit tests for the namespacing + merge logic — **decided scope, see Testing below**
  * Target behavior: cover the per-user namespace switch (namespacing item above) and the cloud/local conflict-resolution rule (above) with targeted unit tests — these are exactly the kind of easy-to-silently-regress, hard-to-manually-verify-every-time logic the testing decision below calls out as high-risk.
  * Dependencies: namespacing item, conflict handling item.

---

### Phase 3A — Existing Local Progress Migration

Covers both quiz scores and lesson completion, per the Phase 3 scope decision above. Note this migration only matters for pre-existing local data (from before namespacing lands) — since progress storage becomes namespaced by `userId` (see the namespacing item above), a migration only needs to run once per already-signed-in user to move their un-namespaced legacy data into their namespace and up to the cloud; it is not an ongoing per-login concern.

* [ ] Detect legacy (pre-namespacing, pre-cloud) local progress on first cloud-aware launch
  * Target behavior: on first authenticated sync after this feature ships, check for un-namespaced `lesson_progress`/`quiz_scores` AsyncStorage entries not yet reflected in a "migrated" flag.
  * Likely affected components: `src/features/quizzes/store/quizScoreStore.ts`, `src/features/lessons/store/progressStore.ts`.
  * Dependencies: Account-Scoped Progress Cloud Sync items above (namespacing + backend API).

* [ ] One-time migration flag
  * Target behavior: reuse the existing AsyncStorage-flag idiom already in this codebase (`ONBOARDING_COMPLETE_KEY`, `app/onboarding.tsx` / `app/index.tsx:6,24`) to prevent re-uploading on every launch.
  * Likely affected components: same as above.
  * Dependencies: detection (above).

* [ ] Upload-if-cloud-empty / merge-if-both-present logic
  * Target behavior: cloud empty + local present → upload; cloud present and newer → keep cloud; local newer → sync local. Since scope is final-state-only (no resumable attempts), this reduces to a straightforward "most recent completion wins, never delete a completion" rule — no partial-attempt merge logic needed, per the resolved Phase 3 scope.
  * Likely affected components: same as above.
  * Dependencies: migration flag; the conflict-handling rule defined in the cloud sync section above (same rule applies here).

* [ ] Test the upgrade path from the currently-released build
  * Current behavior: `[NEEDS INVESTIGATION]` — no automated upgrade-path testing exists. Current released version is `1.0.1` (build `19`) per `app.json`.
  * Target behavior: manual QA installing the released build, generating local progress, then upgrading in place to confirm migration behavior.
  * Dependencies: all items above.

---

### P1 — Google Play Launch

#### Phase 4.1 — Android Application Readiness

Current state: fully managed Expo workflow — no `android/` native directory exists in the repo (`.gitignore:47` ignores it, and none is present), so all Android config flows through `app.json` + Expo config plugins. `app.json`'s `android` block already has all three adaptive-icon layers (`foreground`/`background`/`monochrome`), `edgeToEdgeEnabled: true`, and `predictiveBackGestureEnabled: false` — but **no `android.package` is set**, which blocks any Android build. `eas.json` has `appVersionSource: "remote"`, so EAS should auto-manage `versionCode` once builds start. A stray `khmerlesson-app/khmerlesson-app/ios/Pods/` folder exists one level too deep — see root-cause findings above.

* [x] Set `android.package` in `app.json` — **done 2026-08-30**
  * Confirmed application ID: `com.digital606.khmerlesson` (intentionally matches `ios.bundleIdentifier`, per explicit business decision).
  * Change made: added `"package": "com.digital606.khmerlesson"` to `app.json`'s `android` block (`app.json:35`, alongside `adaptiveIcon`/`edgeToEdgeEnabled`/`predictiveBackGestureEnabled`).
  * Repo-wide audit before changing anything — searched both `khmerlesson-app` and `khmerlesson-dashboard` for any existing package/bundle-ID references:
    - `app.json:14` `ios.bundleIdentifier` — matches, left as-is (source of truth this mirrors).
    - `context/feature-specs/03-purchase-logic.md:154` — a **spec doc**, not live config; references `"bundleId": "com.digital606.khmerlesson"` in an example payload — already correct, no change needed.
    - `src/features/courses/service/purchaseService.ts:10` `KHMER_SUBSCRIPTION_PREFIX = 'com.khmerlesson.subscription.'` — this is the **IAP product-ID prefix** (a separate namespace for subscription SKUs), not the app's package/application ID. Confirmed not conflicting and left unchanged — do not confuse this with `android.package` when doing future Android IAP work (Phase 4.3).
    - No `android/` native directory, no `google-services.json`, no `AndroidManifest.xml`/`build.gradle` exist anywhere in the repo (fully managed Expo workflow, confirmed via `.gitignore:47` and an empty search) — so `app.json` was the only file requiring a config change.
    - `khmerlesson-dashboard` (backend/CORS/OAuth config) has no hardcoded references to the iOS bundle ID or any package ID — confirmed via grep across `server/` and `shared/`; nothing there needed updating.
    - `eas.json` has no package-identity fields (only per-profile env vars) — nothing to change there either.
  * Still open / blocked on this value, not yet done: Google Cloud Console Android OAuth client + SHA-1 fingerprint registration (Phase 4.2), Play Console app creation using this package name (Phase 4.6), first Android build to confirm the value actually produces a valid build (Phase 4.1's other items).
  * Acceptance criteria: met — `android.package` is set consistently; no conflicting placeholder values were found anywhere in either repo.

* [ ] Confirm versionName/versionCode strategy
  * Current behavior: `eas.json`'s `appVersionSource: "remote"` should auto-increment `versionCode`; no manual `android.versionCode` is set in `app.json`.
  * Target behavior: verify this produces valid, monotonically increasing version codes for Play Console once builds start.
  * Dependencies: package name set.

* [ ] Verify production API/network config works on Android
  * Current behavior: `eas.json`'s `build.production.env` points at `https://khmerlessons.app` (HTTPS already), so likely fine, but `[NEEDS INVESTIGATION]` — Android's Network Security Config defaults are stricter than iOS's ATS in some edge cases.
  * Dependencies: first Android build.

* [ ] Verify icon/adaptive-icon rendering
  * Current behavior: assets already exist (`assets/images/android-icon-{foreground,background,monochrome}.png`).
  * Target behavior: confirm correct rendering across launcher icon shapes on a real device/emulator.
  * Dependencies: first Android build.

* [ ] Verify splash screen rendering on Android
  * Current behavior: `expo-splash-screen` plugin config in `app.json` is shared cross-platform.
  * Dependencies: first Android build.

* [ ] Verify hardware back-button behavior
  * Target behavior: confirm `expo-router`/`react-navigation`'s default back-button mapping behaves correctly, especially mid-quiz (`app/quiz/[id].tsx`, currently only has an explicit `X` close button at line 123-125, no confirm-before-exit) and on the paywall (`app/subscription/index.tsx`).
  * Dependencies: first Android build.

* [ ] Investigate `predictiveBackGestureEnabled: false`
  * Current behavior: explicitly disabled in `app.json`. `[NEEDS INVESTIGATION]` whether this was deliberate (e.g. a screen-transition bug) or just an Expo default — predictive back is increasingly expected on recent Android by Play review.
  * Dependencies: none.

* [ ] Verify audio/TTS playback on Android
  * Current behavior: `expo-audio` (`src/features/lessons/service/ttsService.ts`) proxies TTS through the backend; `error.md` documents iOS-only playback glitches from the now-superseded `expo-av`. No Android-specific verification has happened.
  * Dependencies: first Android build.

* [ ] Verify `react-native-iap` Android setup
  * Current behavior: the plugin is already listed in `app.json`'s `plugins`; whether it correctly injects Play Billing permissions/dependencies during a managed build is unverified — no Android build has been produced yet.
  * Dependencies: first Android build; feeds directly into Phase 4.3.

* [ ] Resolve the stray `khmerlesson-app/khmerlesson-app/ios/Pods/` directory
  * Current behavior: `[NEEDS INVESTIGATION]` — appears to be a misplaced `pod install` artifact, not part of tracked config.
  * Target behavior: confirm with the user, then remove if indeed stray.
  * Dependencies: none.

* [ ] Produce first Android development build
  * Target behavior: `eas build --profile development --platform android` (or `npx expo run:android`) to validate the whole config end-to-end before deeper Android work continues.
  * Dependencies: package name set; feeds every other item in this section.

#### Phase 4.2 — Android Authentication

Current state: Google Sign-In (`app/auth/login.tsx:7,46-52`) uses `expo-auth-session/providers/google` configured with `webClientId` and `iosClientId` env vars — **no `androidClientId`**. Additionally, `.env.example` doesn't document `EXPO_PUBLIC_WEB_CLIENT_ID`, `EXPO_PUBLIC_IOS_CLIENT_ID`, or `EXPO_PUBLIC_REVERSED_IOS_CLIENT_ID` at all, even though `login.tsx:21-22,28` reads them — presumably set in an untracked `.env`/EAS secrets. Apple Sign-In is already correctly gated to iOS only (`Platform.OS === 'ios'`, `login.tsx:163`).

* [ ] Register an Android OAuth client + SHA-1 fingerprint(s)
  * Target behavior: register in Google Cloud Console for the chosen package name; needs both the debug keystore's SHA-1 and, critically, Play App Signing's release SHA-1 (only known after Play Console upload-key setup — sequencing dependency with Phase 4.6).
  * Likely affected components: Google Cloud Console config (external), Phase 4.6's Play App Signing item.
  * Dependencies: Phase 4.1 package name; Phase 4.6 Play App Signing enrollment.

* [ ] Add `androidClientId` to the Google auth request
  * Target behavior: pass the new Android OAuth client ID into `Google.useAuthRequest(...)` at `app/auth/login.tsx:46-52`.
  * Dependencies: item above.

* [ ] Document Android env vars
  * Target behavior: add the Android-specific client ID vars to `.env.example` and to `eas.json`'s Android build profiles, alongside the existing iOS ones (currently also missing from `.env.example`).
  * Dependencies: none.

* [ ] Re-verify session persistence/logout on Android specifically
  * Current behavior: the AsyncStorage/SecureStore-backed store code is already cross-platform, but device-level behavior is unverified.
  * Dependencies: Phase 1 items; first Android build.

#### Phase 4.3 — Google Play Billing

Current state: `purchaseService.ts` already targets `react-native-iap`'s unified API — the purchase request already has a `google: { skus: [productId] }` branch stubbed in (`purchaseService.ts:300-306`), and `extractJws()` (`purchaseService.ts:84-91`) already falls through to `purchase.purchaseToken` for non-iOS platforms. None of this has been tested on Android. Backend verification (`server/services/iap/ios/storekit2/`) is entirely Apple-specific; no Google Play equivalent exists. `shared/schema.ts`'s `subscriptions.platform` and `subscriptionPlans.productIdAndroid` already anticipate this, unused today.

* [ ] Create Google Play subscription products
  * Target behavior: mirror the existing 3 iOS plans in Play Console; write resulting product IDs into `subscription_plans.productIdAndroid` via the existing dashboard admin UI (column already exists).
  * Dependencies: Play Console app creation (Phase 4.6).

* [ ] Build the Google Play verification service
  * Target behavior: new `server/services/iap/android/playbilling/` (mirroring the shape of `server/services/iap/ios/storekit2/`) implementing purchase/subscription verification via the Play Developer API. `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]` for the currently-recommended verification approach (Real-time Developer Notifications + `purchases.subscriptions.get`, vs. newer Play Billing Library APIs).
  * Dependencies: product creation.

* [ ] Route `POST /api/v1/subscriptions` by platform
  * Target behavior: branch to the new Android verification service based on `platform`, alongside the existing iOS JWS path.
  * Dependencies: verification service.

* [ ] Purchase acknowledgement
  * Target behavior: confirm `react-native-iap`'s `finishTransaction` (already used at `purchaseService.ts:134,143,211`) performs Google's required acknowledgement (purchases unacknowledged after 3 days are auto-refunded), or add a separate ack call if not.
  * Dependencies: first Android purchase test.

* [ ] Pending purchase state
  * Current behavior: `[NEEDS INVESTIGATION]` — no equivalent concept in the current iOS-only flow (Google Play supports pending transactions, e.g. cash/carrier billing).
  * Dependencies: verification service.

* [ ] Cancelled/expired/renewal handling for Android
  * Target behavior: mirror the existing upsert-and-expire-other-rows logic (`context/subscription-debugging.md`: "now expires the user's other active/trial rows") for the Android path.
  * Dependencies: routing by platform.

* [ ] Purchase restoration/reconciliation on Android
  * Current behavior: `reconcileAvailablePurchases()` (`purchaseService.ts:181-223`) already uses the platform-generic `iap.getAvailablePurchases()`, so it's likely to work largely as-is once `extractJws`/backend support Android — verify, don't rewrite.
  * Dependencies: verification service.

* [ ] Billing error handling on Android
  * Current behavior: `handlePurchaseError` (`purchaseService.ts:154-167`) already checks cancellation generically (`iap.isUserCancelledError?.(error) ?? error.code === iap.ErrorCode?.UserCancelled`), not iOS-specific — verify Android error codes surface correctly through the same path.
  * Dependencies: first Android purchase test.

* [ ] Interrupted-purchase polling — Android applicability
  * Current behavior: the existing polling fallback (`ENTITLEMENT_POLL_INTERVAL_MS`, `purchaseService.ts:314-353`) was built specifically for a documented *iOS* StoreKit event-delivery-lag bug (`context/subscription-debugging.md` root cause #3). `[NEEDS INVESTIGATION]` whether Google Play has an equivalent lag, or whether polling can stay iOS-only to save Android battery/network.
  * Dependencies: verification service.

* [ ] Set up Google Play license testers
  * Target behavior: Play Console internal testing track + license tester accounts, before real-money verification testing.
  * Dependencies: Play Console app creation.

#### Phase 4.4 — Unified Subscription Entitlement

Current state (see root-cause finding above): `hasAccessToCourse` already only reads `subscriptions`/`subscription_plan_courses`, with `platform` as a plain column, not a branch in the logic — entitlement is **already** platform-independent by construction. This phase is narrower than its original framing suggests.

* [ ] Confirm (not rebuild) `createOrUpdateSubscription` accepts a Google Play-verified purchase unmodified
  * Current behavior: keyed by `originalTransactionId` (unique) + `platform`. `[NEEDS INVESTIGATION]` exact field mapping — Google's purchase token/orderId plays the same semantic role as Apple's `originalTransactionId` but differs in format/length; verify the column accommodates it.
  * Dependencies: Phase 4.3's routing item.

* [ ] Cross-platform login QA
  * Target behavior: a user who purchased on iOS and installs the Android app under the same account should see correct access immediately, since access derives from `userId` not device — should already work; verify as part of Phase 4.7 rather than building anything new.
  * Dependencies: Phase 4.7.

* [ ] Account linking across providers
  * Current behavior: `[NEEDS INVESTIGATION]` — backend registration (`register-auth-service`) already keys users by email, so a user signing in with Google on Android and Apple on iOS under the same email likely already unifies correctly; needs explicit verification, not an assumption.
  * Dependencies: Phase 4.7.

#### Phase 4.5 — Cross-Platform Quiz Progress

* [ ] Verify — not build — cross-platform progress
  * Current behavior: once Phase 3's API exists, it's inherently platform-independent (same REST API, same `userId` scoping); the client-side sync code (Phase 3) has no iOS-specific APIs.
  * Target behavior: QA verification only (folded into Phase 4.7) that completing a quiz on iOS and logging into Android with the same account shows the progress, and vice versa.
  * Dependencies: Phase 3 (cloud quiz progress) fully shipped.

#### Phase 4.6 — Google Play Console & Store Requirements

**Play Console Setup**
* [ ] Create the application in Play Console — package name must match Phase 4.1's decision (irreversible once set).
* [ ] Play App Signing enrollment — `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]` (Google's now-default policy for new apps).
* [ ] Upload key / keystore setup — `[NEEDS INVESTIGATION]` whether to use EAS-managed Android credentials or a manually generated keystore; `eas.json` shows no Android credentials config yet.
* [ ] Internal testing track setup.
* [ ] Closed/open testing — `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]` whether Google's closed-testing prerequisite (currently ~20 testers for 14 days for new developer accounts) applies here; `[NEEDS INVESTIGATION]` whether this is a new or an existing Play Console developer account.
* [ ] Production track submission.

**Store Listing**
* [ ] App name, short/full description, category, contact/support email, website — `[NEEDS INVESTIGATION]`, not yet drafted anywhere in this repo.
* [ ] Icon/screenshots/feature graphic — phone screenshots can be captured once an Android build runs; no tablet-specific Android layout work has been verified (`supportsTablet: true` exists only in `app.json`'s `ios` block).
* [ ] Privacy policy — already exists and is live: `GET /privacy-policy` on the dashboard (`attached_assets/khmer-privacy-policy.html`), already linked from `app/auth/login.tsx:24,221` and `app/(tabs)/me.tsx`. Reuse the same URL for Play Console.
* [ ] Khmer localization of the listing — `[NEEDS INVESTIGATION]`, business decision (audience is likely English-speaking learners of Khmer, not Khmer speakers).

**Compliance**
* [ ] Data Safety form — needs an audit of what's actually collected: auth email/name via Google/Apple, plus the debug-log pipeline's `context` payloads (can include `userId`/`platform`, per `shared/schema.ts`'s `debugLogs.context: jsonb`). `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]` for the current form's categories.
* [ ] Content rating questionnaire.
* [ ] Target audience declaration — `[NEEDS INVESTIGATION]`, business decision.
* [ ] Ads declaration — no ad SDK found in `package.json`; should be a straightforward "no ads" declaration, but confirm nothing was added elsewhere.
* [ ] App access / reviewer credentials — Apple's live rejection (`error-app-review.md`, Guideline 2.1(b)) was specifically about reviewers being unable to locate/use the IAP flow; carry that lesson into the Play submission notes explicitly (working test-purchase instructions).
* [ ] Subscription disclosures — Apple's same rejection (`error-app-review.md`, Guideline 3.1.2(c)) flagged missing in-app subscription length/price/ToU/privacy-policy-link disclosures. Google Play has an analogous requirement. `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]`, but recommend fixing this in `app/subscription/index.tsx` regardless of platform — it's currently blocking the live App Store submission and the same fix likely satisfies both stores.
* [x] Account deletion — **done 2026-08-31, and corrected from an earlier stale claim in this tracker**
  * **[MOBILE + BACKEND]**. Correction: the "no backend call" note above (from the original Completed log, written before this Play-launch investigation) was already stale — `me.tsx`'s Delete Account handler *did* call a real endpoint, `DELETE /api/users/:id`. The actual bug, found on closer inspection: that route is mounted behind `requireAdmin` (`khmerlesson-dashboard/server/features/users/route/route.ts:10,115` — `router.use(requireAdmin)` applies to the whole router), so every non-admin caller — i.e. every real mobile user — got silently rejected. The button existed and called something real; it just couldn't have worked for an actual user.
  * Backend (`khmerlesson-dashboard`, commit `aef1c3e`): new `DELETE /api/v1/me` in `server/api.ts`, self-scoped to `req.user.id` (never a client-supplied id) so no admin check is needed; reuses the existing `UserController.deleteUser` and blacklists the caller's token afterward via the same `blacklistToken` logout uses. Purely additive — the admin-only route is untouched, so the dashboard's own user-management UI is unaffected. Verified with `DATABASE_URL=<placeholder> npm run check` (tsc), clean.
  * Mobile (`khmerlesson-app`): `app/(tabs)/me.tsx` now calls `apiDelete('/api/v1/me', accessToken)` instead of the admin-only route.
  * Backward compatibility: the currently-released iOS app never called `DELETE /api/v1/me` (it didn't exist), so this change can't break it; the admin-only `/api/users/:id` route it's replacing usage of remains available unchanged for the dashboard.
  * Not verified (no DB/device access in this environment): an actual end-to-end delete against a running backend + device. Flagged for the manual QA pass, same as everything else requiring live infrastructure.

#### Phase 4.7 — Android Testing

**Authentication**: fresh login · logout · re-login · app restart · session restoration · expired session · failed token refresh · Android Google Sign-In client (Phase 4.2) specifically.

**Subscription**: new subscription · existing subscriber · restoration · renewal · cancellation · expiration · purchase failure · interrupted purchase · backend verification failure · offline startup · login on another device · cross-platform entitlement (Phase 4.4).

**Quiz Progress**: start quiz · partial progress (once in scope) · complete quiz · app restart · logout/login · reinstall · different device · iOS → Android restoration · Android → iOS restoration · offline progress · sync after reconnect · legacy migration (Phase 3A).

**Device/UI**: small/large Android phones · screen densities · supported Android versions · keyboard · navigation/back behavior · audio/media (TTS via `expo-audio`) · poor network · airplane/offline mode · **Khmer text rendering** — `khmerlesson-app/CLAUDE.md`'s "Khmer Text" section documents a ~1.6× `lineHeight`/`fontSize` ratio tuned to prevent "Khmer stacked-glyph clipping," presumably tuned against iOS's text rendering; Android's text engine can differ, so this needs explicit re-verification, not an assumption the same ratio holds.

#### Phase 4.8 — Release Pipeline

`Development → Android Local Build → Internal Testing → Regression Testing → Closed Testing (if required) → Production Candidate → Play Pre-launch Report → Production/Staged Rollout → Post-release Monitoring`

* [ ] Configure Android submission — `eas.json`'s `submit.production` is currently an empty `{}` for iOS too; `[NEEDS INVESTIGATION]` whether iOS submission is done via `eas submit` CLI flags rather than `eas.json` config, and whether the same approach works for Android or whether a Play Console service-account JSON needs adding to `eas.json`'s `submit.production.android`.
* [ ] Document rollback/hotfix process — `[NEEDS INVESTIGATION]` whether one exists informally for iOS today; none is documented in this repo for either platform.

---

### P2 — Release Quality

#### Observability

Current state: a full trace-id logging pipeline already exists and is actively used in production debugging (`src/shared/utils/logger.ts` ↔ `server/utils/trace-logger.ts` ↔ `debug_logs` table ↔ dashboard "Debug Logs" page — see `context/subscription-debugging.md`). No crash reporting SDK (Sentry/Crashlytics/Bugsnag) exists in `package.json` — uncaught exceptions and native crashes are not captured anywhere today.

**Decided 2026-08-30**: no new vendor (Sentry or otherwise) this cycle — reuse and extend the existing logging/trace pipeline instead.

* [ ] Wire uncaught-exception capture into the existing pipeline (crash-reporting substitute)
  * Current behavior: the `debug_logs` pipeline is best-effort and buffer-then-flush-on-interval (`FLUSH_INTERVAL_MS = 15000`, `src/shared/utils/logger.ts:34`) — fine for request-scoped tracing, but a hard crash can kill the JS thread before the next scheduled flush, losing the log.
  * Target behavior: register a global JS error handler (`ErrorUtils.setGlobalHandler` in React Native, plus a top-level React Error Boundary around the app root) that calls `logger.error(...)` with the error/stack and then immediately calls `flushLogs()` (bypassing the 15s interval) before the error is allowed to propagate/crash — reusing the existing transport, not a new one.
  * Likely affected components: `app/_layout.tsx` (init point / error boundary), `src/shared/utils/logger.ts` (already exports `flushLogs()` for exactly this kind of ad-hoc immediate flush, currently only used on a natural flow completion in `purchaseService.ts`).
  * Dependencies: none.
  * Acceptance criteria: an uncaught JS exception during a manual test produces a row in `debug_logs` with a stack trace, without needing to wait for the periodic flush.
  * Known limitation to document, not solve this cycle: this approach cannot capture native (non-JS) crashes the way a dedicated crash SDK would — acceptable tradeoff for staying vendor-free this cycle, per the decision above.

* [ ] Wire new lifecycle events from Phases 1-3 into the existing pipeline
  * Target behavior: `session_restore_started/restored/refresh_failed`, `subscription_sync_started/active/failed`, `quiz_progress_sync_started/synced/failed`, `legacy_progress_migrated` — almost entirely additive; transport/buffering/viewer already exist.
  * Dependencies: the respective phases landing.

* [ ] Extend billing-failure tracing to the Android verification path
  * Current behavior: `traceLogger` is already wired into every branch of `POST /api/v1/subscriptions`'s iOS path (per `context/subscription-debugging.md`).
  * Target behavior: identical coverage for the new Android verification path (Phase 4.3).
  * Dependencies: Phase 4.3.

* [ ] Log migration failures (Phase 3A) the same way.

* [ ] Confirm redaction discipline on all new events
  * Current behavior: existing code generally avoids logging sensitive values (e.g. `purchaseService.ts` logs `productId`/`transactionId`/status, not raw JWS) — the one known violation is the raw-token `console.log`s under Phase 1, already tracked above.
  * Target behavior: no access/refresh tokens, purchase JWS/purchase-token values, or other sensitive payloads in any new `context` object.
  * Dependencies: none — apply as each new event is added.

#### Testing

**Decided 2026-08-30**: yes, but narrowly — focused unit tests around this cycle's high-risk logic only, not a new test framework/suite buildout, and not component/navigation/E2E coverage. Neither repo has any test tooling installed today (`khmerlesson-app/package.json` has no `jest`/`jest-expo`/testing-library; `khmerlesson-dashboard/CLAUDE.md` confirms "No test suite is configured"), so a minimal `jest-expo` setup (the standard, Expo-supported test runner for this stack) is the smallest addition that satisfies the decision — install it for exactly the targets below, not as general-purpose scaffolding.

High-risk targets identified during this investigation (pure logic, no rendering/navigation — the kind of thing that regresses silently and is tedious to re-verify by hand every time):

* [ ] Unit tests: token-refresh interceptor + dedup (Phase 1) — expired-token retry succeeds once refreshed; concurrent callers trigger exactly one refresh call; invalid refresh token surfaces the correct failure path.
  * Likely affected components: `src/services/api.ts`, `src/features/auth/store/authStore.ts`.
  * Dependencies: Phase 1's interceptor + dedup items being implemented.

* [ ] Unit tests: subscription status derivation (Phase 2) — `unknown`/`loading` never collapses into "no subscription" in the store's status logic.
  * Likely affected components: `src/features/subscriptions/store/subscriptionStore.ts`.
  * Dependencies: Phase 2's explicit-status item being implemented.

* [ ] Unit tests: per-user storage namespacing + identity-switch rehydration (Phase 3 account-boundary fix) — switching the active user never leaks the previous user's cached progress, and a returning user's own cached progress reappears.
  * Likely affected components: `src/features/lessons/store/progressStore.ts`, `src/features/quizzes/store/quizScoreStore.ts`.
  * Dependencies: the namespacing item being implemented.

* [ ] Unit tests: local/cloud progress conflict-resolution rule (Phase 3 + 3A) — cloud-empty/local-present, cloud-newer, local-newer cases all resolve per the documented rule.
  * Likely affected components: the client-side progress sync services (Phase 3).
  * Dependencies: the conflict-handling item being implemented.

Explicitly out of scope for this cycle: component tests, navigation/routing tests, E2E device tests, and any Android-specific automated testing (Phase 4.7 stays a manual QA checklist).

---

## Acceptance Criteria (per objective)

- **Authentication**: a valid returning user can reopen KhmerLesson and have their session restored/refreshed without an unnecessary login prompt.
- **Subscription**: an existing subscriber can open the app or log back in and have entitlement restored automatically, without visiting the Plan screen.
- **Progress (Quiz + Lesson Completion)**: both belong to the user's cloud account and survive logout/login, reinstall, and supported cross-device usage; existing local progress migrates safely; and — new finding from this investigation — progress no longer leaks across accounts sharing one device (fixed via per-user namespacing, not clearing on logout).
- **Android**: a production Android build installs through a Google Play testing track with all core functionality working.
- **Google Play Subscription**: an Android user can purchase a plan through Google Play, have it securely verified, and receive correct course entitlement.
- **Cross-platform**: authentication, entitlement, and quiz progress are account-level, not unnecessarily device-bound.

## Definition of Done for this improvement cycle

1. Authentication/session restoration is reliable.
2. Subscription entitlement restores automatically.
3. Course locking accurately reflects subscription state.
4. Quiz progress and lesson completion are both persisted in the cloud.
5. Existing local quiz/lesson progress migrates safely; the account-boundary leak is fixed via per-user namespacing.
6. Quiz progress and lesson completion survive logout/login and device changes.
7. Android production build is stable.
8. Google Play Billing works correctly.
9. Android subscriptions integrate with backend entitlement.
10. Required Play Store compliance information is complete.
11. Required Play testing is completed.
12. Production Android release is approved and deployed.
13. The high-risk logic called out under Testing (token refresh, subscription status, storage namespacing, progress conflict resolution) has focused automated unit test coverage; everything else remains documented manual QA.
14. Production failures — including uncaught exceptions, via the new global-error-handler wiring — can be diagnosed through the existing (now extended) logging pipeline, without a new crash-reporting vendor.

---

## Open Questions

- **Quiz 2**: Deferred — client wants a cost estimate first. Show "in progress" placeholder (B4 above). Full implementation (retry-wrong-answers loop) is a separate scope item.
- **`order` field on Course**: `GET /api/v1/main-lessons` now returns `order`. Should the home screen sort courses by `order`? Assume yes unless backend already returns them sorted.
- **Subscription + guest users**: `GET /api/v1/subscriptions/me` requires auth. Guest users have no subscription. Course list with no token still works (free courses show `hasAccess: true`). Locked course tap for a guest → navigate to `/auth/login` first, then `/subscription` after login? Clarify UX if needed.

### Improvement Roadmap — decisions needed before implementation (2026-08-30)

All six items below were open as of 2026-08-30 and resolved the same day:

- ~~**Android application ID**~~ — **resolved**: `com.digital606.khmerlesson`, set in `app.json`. See the checked-off item under Phase 4.1 above for the full audit of what was/wasn't changed.
- ~~**Quiz Phase 3 scope**~~ — **resolved**: final score + completion state only. No resumable/per-question attempts unless the current UX already supported it (it doesn't) — see the "Scope decided" note at the top of the Account-Scoped Progress Cloud Sync section above.
- ~~**Lesson-completion progress**~~ — **resolved**: yes, included in the same account-scoped cloud progress architecture as quiz scores — see the same section above (now covers both `quiz_attempts` and `lesson_completions`).
- ~~**Account-boundary bug fix approach**~~ — **resolved**: per-user namespaced local storage, not clear-on-logout — see the "Namespace local progress storage by user" item above.
- ~~**Crash reporting**~~ — **resolved**: no vendor (Sentry or otherwise) this cycle; reuse and extend the existing `debug_logs`/`logger` pipeline with a global-error-handler hook instead — see the Observability section above.
- ~~**Automated testing**~~ — **resolved**: yes, but narrowly — focused unit tests on this cycle's specific high-risk logic only (token refresh, subscription status derivation, storage namespacing, progress conflict resolution), no new test-framework buildout beyond a minimal `jest-expo` install for those targets — see the Testing section above.

Still open:
- **In-app subscription disclosures**: Apple's live rejection (`error-app-review.md`, Guideline 3.1.2(c)) requires subscription length/price/ToU/privacy-policy links directly in the purchase flow (`app/subscription/index.tsx`), not just the login footer. This blocks the current App Store submission independent of Android work — worth prioritizing regardless of sequencing, since Google Play likely has an analogous requirement.
- **Stray nested `khmerlesson-app/khmerlesson-app/ios/Pods/` folder**: looks like a misplaced `pod install` artifact — confirm before deleting.

## Architecture Decisions

- Theme tokens live in `src/shared/theme/` (not `constants/`) to align with the `src/` folder structure defined in architecture.md
- Old `constants/theme.ts` and boilerplate components kept untouched; new screens use the new design system only
- Mock data lives in `context/mock-data/` until API/SQLite layer is ready
- SQLite offline caching deferred until API-only layer is proven (see earlier recommendation — premium offline adds complexity around entitlement caching)
- Subscription entitlement (`hasAccessToCourse`, `server/features/subscriptions/controller/controller.ts`) is already platform-independent by construction — `platform` is a data column, not branching logic — so the Google Play launch's "unified entitlement" work (Phase 4.4) is scoped as verification, not a new abstraction layer

## Session Notes

- All new screens are under `app/course/[id].tsx` and `app/lesson/[id].tsx`
- `@/src/...` imports work via the existing `@/*` path alias in tsconfig.json
- `react-native-iap` on StoreKit 2 (iOS) returns `purchase.transactionReceipt` as a JWS string — used directly as the `jws` field for `POST /api/v1/subscriptions`

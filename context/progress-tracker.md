# Progress Tracker

Update this file after every meaningful implementation change. If bugs or any suggestion found, add it to Next Up.

## Two-Phase Release Plan (decided 2026-08-31)

Remaining work is split into two phases so iOS can ship independently of Android:

- **Phase 1 — iOS App Store: shipped and live.** The full P0 roadmap (auth/session reliability, subscription sync, cloud quiz/lesson progress) plus P2 (observability, testing) is implemented, migrated against a live database, and integration-tested — see "Database Migration Verification & Live Integration Test" and "Phase 1 Close-Out Fixes" below. **Update 2026-08-31**: Apple's Guideline 2.1(b)/3.1.2(c) rejection is resolved — **1.0.2 (build 21) was approved and is now live** on the App Store (see "iOS Release 1.0.2 (21) — Approved & Live" below). No further Phase 1 action is required to ship what's already out; the device/simulator QA checklist remains open as regression coverage for the *next* iOS build, not a blocker for the current one. **Update 2026-08-31 (later session)**: a real, previously-unknown production bug was found and fixed — see "Null Data-Envelope Bug Fix & 1.0.3 Rebuild" below. Version bumped to **1.0.3**; a build (23) has already gone through TestFlight once (before the fix, on staging by mistake) and a corrected rebuild is now in progress.
- **Phase 2 — Google Play/Android: greenlit 2026-09-01.** See "Android First Play Build" below — first local release AAB produced and verified; `READY WITH EXTERNAL BLOCKERS` (Android SDK/keystore/Play Console credentials still needed from a human before actual upload).

## Current Phase

- Phase 1 (iOS) shipped and live (1.0.2, build 21; 1.0.3 rebuild in progress separately). Phase 2 (Android/Google Play): first local release AAB produced and verified 2026-09-01 — see "Android First Play Build" below.

## Current Goal

- Android: first Play-ready AAB produced locally and verified (package ID, versioning, signing state, permissions). Next: human provides Play Console/keystore/Google OAuth credentials (see "Credentials / Configuration Needed From User" in "Android First Play Build" below), then upload.

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

* [x] Design the cloud progress schema + migration (quiz scores + lesson completion) — **done 2026-08-31 [BACKEND]**
  * Implementation (`khmerlesson-dashboard`, commit `c7ae914`): `quiz_attempts` (`id, userId → users cascade, lessonId → lessons cascade, quizId → quizzes cascade, score, total, completedAt, createdAt, updatedAt`, unique on `(userId, quizId)`) and `lesson_completions` (`id, userId → users cascade, mainLessonId → main_lessons cascade, lessonId → lessons cascade, completedAt, createdAt, updatedAt`, unique on `(userId, lessonId)`) added to `shared/schema.ts`. Scoped down from a log-of-attempts to one upserted row per user+quiz (or user+lesson) — matches both the decided final-state-only scope and what the mobile local cache already holds (one score per lesson, not a history).
  * Migration `migrations/0004_cloud_progress.sql` — **hand-authored, matching this repo's existing style for 0001-0003** (idempotent `IF NOT EXISTS`/`DO $$ ... EXCEPTION WHEN duplicate_object`), since no `DATABASE_URL`/live database is reachable in this environment to run `drizzle-kit generate`. `migrations/meta/_journal.json` updated with the corresponding entry, matching how 0001-0003 were registered (no per-migration snapshot file exists for any of them either — this repo's established convention, not a shortcut invented here).
  * `[BLOCKED — HUMAN ACTION REQUIRED: no DATABASE_URL/database is reachable in this environment]` — the migration has **not been applied to any database**. A human needs to run `npm run db:migrate` (or review-then-apply the SQL directly) against dev/staging before these tables actually exist; until then, the new API endpoints below will fail against a live server.
  * Verified: `DATABASE_URL=<placeholder> npm run check` (tsc) clean — schema types compile; the SQL itself has not been executed anywhere.

* [x] Backend progress API (quiz + lesson) — **done 2026-08-31 [BACKEND]**
  * Implementation (`khmerlesson-dashboard`, commit `c7ae914`): new `server/features/progress/controller/controller.ts` (`ProgressController` — `getQuizAttempts`, `getLessonCompletions`, `upsertQuizAttempt`, `upsertLessonCompletion`, using Drizzle's `onConflictDoUpdate` against the unique constraints above). Routes added inline in `server/api.ts` (matching this file's existing convention: mobile-facing `/api/v1/*` endpoints live here, not in a separate `route/route.ts` — see `GET /me`, `POST /subscriptions`, etc. already in this file) — resolved the `[NEEDS INVESTIGATION]` in favor of new endpoints over extending `/submit`, since `/submit`'s existing contract (stateless grading, no auth requirement beyond `getQuizAccess`) is meaningfully different from a persistence write:
    - `GET /api/v1/progress` → `{ quizAttempts, lessonCompletions }` for the caller.
    - `POST /api/v1/quiz-progress` → upsert one attempt.
    - `POST /api/v1/lesson-progress` → upsert one completion.
  * All three require authentication (not added to `SEMI_PUBLIC_PREFIXES`) and 401 with no `req.user` — progress is always user-owned, unlike course/quiz listings.
  * Backward compatibility: purely additive new routes; nothing existing changed, so the currently-released iOS app is unaffected regardless of whether this deploys.
  * Verified: `DATABASE_URL=<placeholder> npm run check` clean. Not verified against a live database (blocked, see schema item above) — request/response shapes reviewed by inspection against what the mobile client (below) actually sends.

* [x] Ownership/authorization on progress endpoints — **done 2026-08-31 [BACKEND], same change as above**
  * Implementation: every handler reads `userId` from `req.user?.id` (the verified JWT payload) and 401s if absent; the Zod schemas (`insertQuizAttemptSchema`/`insertLessonCompletionSchema`) `omit({ userId: true, ... })` so a client-supplied `userId` in the request body is structurally impossible to smuggle through — `userId` is only ever attached server-side via `{ ...parsed, userId }`.

* [x] Client-side sync for quiz completion — **done 2026-08-31 [MOBILE]**
  * Implementation (`khmerlesson-app`): new `src/features/progress/service.ts` exports `syncQuizAttempt(accessToken, { lessonId, quizId, score, total })`, called from `app/quiz/[id].tsx` right after the existing local `setScore()` write (still unconditional — cloud sync is additive, never a replacement, per the task's explicit requirement). Guest users (no `accessToken`) simply skip the cloud call; the local score still applies.
  * `quizScoreStore`'s `ScoreEntry` gained `quizId` and `completedAt` fields (previously just `{ score, total }`) — needed so the sync payload has a `quizId` to key the backend's unique constraint on, and so cloud-vs-local conflicts (below) can be resolved by recency. `setScore()`'s call signature changed to `(lessonId, quizId, score, total, completedAt?)`; the one real call site (`quiz/[id].tsx`) was updated — confirmed via `grep` that no other file calls `setScore` directly (`(tabs)/quiz.tsx` and `course/[id].tsx` only read the `scores` record, passing entries through without destructuring, so the additive fields don't break them).
  * Acceptance criteria met by construction: `GET /api/v1/progress` reflects a quiz attempt as soon as `POST /api/v1/quiz-progress` (called synchronously from the sync above) resolves — not independently verified end-to-end against a live server (blocked, see schema item).

* [x] Client-side sync for lesson completion — **done 2026-08-31 [MOBILE], same pattern**
  * Implementation: `syncLessonCompletion(accessToken, { mainLessonId, lessonId })` in the same new service, called from `app/lesson/[id].tsx`'s `handleNext` right after the existing `useProgressStore.getState().markComplete(courseId, lesson.id)` call — again additive, not a replacement.

* [x] Fetch cloud progress on session restoration/login (both types) — **done 2026-08-31 [MOBILE]**
  * Implementation: `fetchAndMergeCloudProgress(accessToken)` (same service) calls `GET /api/v1/progress` and merges both arrays into the local namespaced stores. Wired into `app/index.tsx` alongside the subscription-sync-on-restore call — same fire-and-forget treatment (not awaited before routing), same reasoning: the already-hydrated local stores render correctly in the interim, and `debug_logs` traces make a slow/failed merge diagnosable after the fact.
  * Acceptance criteria: by construction, a fresh install that logs into an existing account will show previously-completed lessons/quizzes once the merge resolves — not verified against a live server (blocked, see schema item).

* [x] Offline write buffering + retry — **done 2026-08-31 [MOBILE], resolved the `[NEEDS INVESTIGATION]`**
  * Implementation: `src/features/progress/service.ts` maintains a single pending-write queue in AsyncStorage (`pending_progress_sync`, a JSON array of `{ type: 'quiz' | 'lesson', body }`) — a failed `syncQuizAttempt`/`syncLessonCompletion` call appends to it instead of discarding the write. `flushPendingProgress(accessToken)` retries every queued item and drops only the ones that actually succeed. This does directly reuse the precedent flagged in the original TODO: the re-buffer-on-failure shape mirrors `logger.ts`'s `flushLogs()` (append on failure, drop on success), adapted from a fixed-size ring buffer to an unbounded persisted queue since progress writes are far lower-volume than log lines.
  * Flush is triggered from two points: after every `fetchAndMergeCloudProgress` call (session restore/login — network connectivity is most likely just been (re)confirmed by the fetch that preceded it), and on every app-foreground transition (`app/_layout.tsx`'s existing `AppState` listener, alongside the Phase 1 token-revalidation call already there).
  * Acceptance criteria: a quiz/lesson completed while offline keeps its local write immediately (unaffected either way) and is queued for cloud sync rather than silently dropped; not verified against a live server (blocked, see schema item) or real airplane-mode device testing (no device available).

* [x] Conflict handling between local cache and cloud — **done 2026-08-31 [MOBILE]**
  * Implementation: for quiz scores, `quizScoreStore.setScore()` itself now enforces the rule — an incoming write (from cloud merge or from a local completion) is applied unless a *newer* `completedAt` is already present locally, using ISO-8601 string comparison (safe for chronological ordering since `completedAt` is always produced by `new Date().toISOString()`, a consistent format). This is what makes `fetchAndMergeCloudProgress` safe to call unconditionally without first checking whether a fresher local write (possibly still sitting in the pending queue above) exists — it can't be clobbered by a stale cloud snapshot. For lesson completion, no timestamp comparison is needed at all: completion is boolean, and `markComplete()` was already idempotent (`if (existing.includes(lessonId)) return;`), so applying a cloud completion the device already has locally is a safe no-op in either direction.
  * This is the same rule documented for Phase 3A's legacy migration below — one rule, two call sites (steady-state sync vs. one-time migration).

* [x] Progress sync diagnostics — **done 2026-08-31 [MOBILE], same change**
  * Implementation: `quiz_progress_sync_started/synced/failed`, `lesson_progress_sync_started/synced/failed`, `progress_fetch_started/fetched/failed`, and `pending_progress_flushed` all emitted through the existing `logger` from `src/features/progress/service.ts`.

Verified (all items above): `tsc --noEmit`/`npm run check` and `eslint` clean in both repos across every touched file — only pre-existing warnings remain. **Not verified**: any of this against a running backend + real database, since no `DATABASE_URL` is reachable in this environment (see the `[BLOCKED]` schema item) — this is the single largest gap in this phase's verification and should be the first thing checked once a human applies the migration.

* [x] Focused unit tests for the namespacing + merge logic — **done 2026-08-31**, see `src/features/lessons/store/__tests__/progressStore.namespacing.test.ts` and `src/features/quizzes/store/__tests__/quizScoreStore.test.ts` under the Testing section below for the actual implementation.

---

### Phase 3A — Existing Local Progress Migration

Covers both quiz scores and lesson completion, per the Phase 3 scope decision above. Note this migration only matters for pre-existing local data (from before namespacing lands) — since progress storage becomes namespaced by `userId` (see the namespacing item above), a migration only needs to run once per already-signed-in user to move their un-namespaced legacy data into their namespace and up to the cloud; it is not an ongoing per-login concern.

* [x] Detect legacy (pre-namespacing) local progress + one-time migration flag — **done 2026-08-31 [MOBILE]**
  * Implementation: both `progressStore.ts` and `quizScoreStore.ts` gained a `migrateLegacyIfNeeded()`, called at the top of `hydrate()` (so it runs before the namespaced read on every cold start, but only actually does anything once). Each checks its own flag (`lesson_progress_migrated_v1` / `quiz_scores_migrated_v1`) — reuses the same AsyncStorage-flag idiom as `ONBOARDING_COMPLETE_KEY`, per the original plan. Legacy data lived under the exact literal keys `lesson_progress`/`quiz_scores` (no `:namespace` suffix — that's what "legacy" means here, it predates the namespacing commit earlier in this same session). If found, it's merged into whichever identity is active *right now* (the legacy data predates multi-account awareness, so it belongs to whoever is using the device post-update) and the old un-namespaced key is removed so it can't be re-discovered and merged into a second identity later.

* [x] Upload-if-cloud-empty / merge-if-both-present logic — **done 2026-08-31 [MOBILE], partially — see gap below**
  * Lesson completions: fully implemented as local-merge only (no separate cloud-upload step needed at migration time for these — every completion, migrated or not, already gets picked up by the normal `markComplete()`-triggered sync path the next time it's touched; migration itself just makes sure `completedLessons` isn't empty going forward).
  * Quiz scores: local merge only implemented (`mergeCompletedLessons`-style union, "never overwrite an already-namespaced entry" — i.e. cloud-fetched or freshly-namespaced data always wins over legacy). **Known gap, not silently left incomplete**: migrated quiz-score entries are **not** proactively re-uploaded to the cloud during migration. The legacy local shape (`{ score, total }` keyed by `lessonId`) has no `quizId`, and getting one would require a `GET /api/v1/quizzes` lookup + lessonId match (`useQuizByLesson.ts`'s existing pattern) from inside what's otherwise a pure-storage module — judged not worth the added cross-cutting complexity for this pass. Migrated entries stay local-only (visible in the UI, not lost) until the user retakes that specific quiz, at which point the normal sync path picks them up with a real `quizId`. If a human wants this closed, it needs a small follow-up in `src/features/progress/service.ts` (which already has `apiFetch` access) rather than in the storage-only stores.
  * Merge rule actually implemented (both stores): the same recency rule as steady-state cloud sync — a migrated legacy entry never overwrites an already-present namespaced entry; quiz-score migrated entries get `completedAt: new Date(0).toISOString()` (deliberately older than any real timestamp), so a later real cloud/local write for the same lesson naturally supersedes it via `setScore`'s existing conflict check, with no separate migration-specific merge logic needed.

* [BLOCKED — HUMAN ACTION REQUIRED: no physical device or simulator/emulator is available in this environment] Test the upgrade path from the currently-released build
  * The migration code itself is implemented and passes `tsc`/`eslint`, but exercising a real upgrade (install the released `1.0.1`/build `19`, generate local progress, then update in place to this branch's build and confirm the migration runs correctly) needs an actual device or simulator with the prior version installable on it.

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
  * **Correction, 2026-08-31**: `com.digital606.khmerlesson` turned out to already be taken on the Play Store — Android package names are globally unique across every developer account (unlike iOS bundle IDs, which only need to be unique within your own Apple Developer account, which is why the same string was fine for `ios.bundleIdentifier`). Changed `android.package` (only) to **`com.digital606.khmerlessons`** (pluralized) — `ios.bundleIdentifier` is untouched and stays `com.digital606.khmerlesson` (already live on the App Store, cannot and should not change). The two platforms now intentionally have slightly different identifiers; this is normal and expected, not a bug to reconcile. Same reminder as above applies to the new value: irreversible once used to create the app in Play Console.

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

* [x] Document the existing (iOS) Google Sign-In env vars — **done 2026-08-31 [MOBILE]**, Android var still blocked
  * Implementation: `.env.example` now documents `EXPO_PUBLIC_WEB_CLIENT_ID`, `EXPO_PUBLIC_IOS_CLIENT_ID`, `EXPO_PUBLIC_REVERSED_IOS_CLIENT_ID` — all three were already read by `app/auth/login.tsx` but undocumented.
  * `[BLOCKED — HUMAN ACTION REQUIRED]` for the Android-specific var: can't document (or add to `eas.json`'s Android build profile) an `EXPO_PUBLIC_ANDROID_CLIENT_ID` that doesn't exist yet — creating it requires the Google Cloud Console Android OAuth client registration above, which is itself blocked on that same external action. Documenting a placeholder for a var the code doesn't read yet would be actively misleading, not merely incomplete.

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

* [x] Purchase acknowledgement — **question resolved by inspecting the library, 2026-08-31; the code change itself is deferred**
  * Answer: `finishTransaction` does **not** perform Google Play acknowledgement — `react-native-iap` exposes it as a distinct function, `acknowledgePurchaseAndroid(purchaseToken): Promise<boolean>` (`node_modules/react-native-iap/src/index.ts:1894`, `types.ts:592`; deprecated alias `acknowledgePurchase`). Confirmed by reading the library's own source/types, not by running a purchase.
  * Not implemented yet, deliberately: adding just this one call now would be unverifiable, disconnected code — every other layer Phase 4.3 needs (real Google Play product IDs from Play Console, the backend's Android verification service, a live Android build to actually purchase against) is still blocked, so a call to `acknowledgePurchaseAndroid()` would sit dead until those exist. When Phase 4.3 actually gets built, it needs to call `acknowledgePurchaseAndroid(purchase.purchaseToken)` for Android specifically, alongside (not instead of) the existing `finishTransaction` calls in `purchaseService.ts:134,143,211`.
  * `[BLOCKED — HUMAN ACTION REQUIRED]`: implementing and testing this for real needs Play Console products + a live Android build, per the rest of Phase 4.3.

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

* [x] Confirm (not rebuild) `createOrUpdateSubscription` accepts a Google Play-verified purchase unmodified — **resolved by inspection, 2026-08-31**
  * Checked: `subscriptions.originalTransactionId` is `varchar("original_transaction_id")` (`khmerlesson-dashboard/shared/schema.ts:83`) — a Postgres `varchar` with **no length modifier**, which behaves identically to `text` (unbounded) for storage purposes, unlike MySQL where a bare `varchar` would need an explicit length. A Google Play purchase token/orderId (which can run well over 100 characters, versus Apple's shorter numeric `originalTransactionId`) fits without any schema change.
  * `createOrUpdateSubscription`'s own logic (`server/features/subscriptions/controller/controller.ts:47+`) keys strictly on this column value plus `userId`/`allowTransfer`, never branching on its format/length — no platform-specific assumption baked in. Confirmed no code or schema change is needed here; Phase 4.3's Android verification service just needs to populate `originalTransactionId` with the Google Play purchase token when calling this function, same as the iOS path already does with Apple's.
  * Still genuinely dependent on Phase 4.3 existing at all (can't functionally test against a real Google Play purchase without it) — this item just confirms the *target* function needs no changes, not that end-to-end Android billing works yet.

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
* [x] Subscription disclosures — **app-side question already resolved (2026-08-31), see the corrected note in Open Questions above**: `app/subscription/index.tsx` already has title/description/price/renewal-cadence/ToU/privacy-policy-link on-screen — no code gap. `[VERIFY CURRENT GOOGLE PLAY REQUIREMENT]` still applies to whatever Play Console's own listing-level disclosure fields require, which is a Play Console action, not a repository one.
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

* [x] Wire uncaught-exception capture into the existing pipeline (crash-reporting substitute) — **done 2026-08-31 [MOBILE]**
  * Implementation: two layers, per the original plan.
    - New `src/shared/components/ErrorBoundary.tsx` — a class-component React Error Boundary (`getDerivedStateFromError`/`componentDidCatch`) wrapping the `<Stack>` in `app/_layout.tsx`. Logs `uncaught_render_error` (message, stack, component stack) via `logger.error` + an immediate `flushLogs()`, then renders a minimal "please restart" fallback instead of a blank/crashed screen.
    - `app/_layout.tsx` also registers a global handler via React Native's `ErrorUtils.setGlobalHandler` — **at module load, not inside the component's `useEffect`**, since this is a process-wide hook, not tied to `RootLayout`'s mount lifecycle. Catches what the Error Boundary structurally cannot: errors in event handlers, async code, and timers (the actual "hard crash" case `flushLogs()`'s 15s interval was blind to). Logs `uncaught_exception` the same way, then **chains to the previously-registered handler** (`previousHandler?.(error, isFatal)`) so default RN behavior — the dev red screen, or the production crash itself — is preserved; this only adds logging in front of it, never suppresses it.
  * Acceptance criteria: met by construction (verified via `tsc`/`eslint`, not a live device — no simulator available in this environment to trigger a real uncaught exception and inspect `debug_logs`).
  * Known limitation, as originally documented: still can't capture native (non-JS) crashes — unchanged tradeoff, correct per the no-new-vendor decision.

* [x] Wire new lifecycle events from Phases 1-3 into the existing pipeline — **done, incrementally, across this session's earlier commits**
  * `session_restore_started/restored/refresh_failed` — `authStore.ts` (Phase 1 commit).
  * `subscription_sync_started/active/subscription_sync_completed_none/subscription_sync_failed` — `src/features/subscriptions/service.ts` (Phase 2 commit).
  * `quiz_progress_sync_started/synced/failed`, `lesson_progress_sync_started/synced/failed`, `progress_fetch_started/fetched/failed`, `pending_progress_flushed` — `src/features/progress/service.ts` (Phase 3 commit).
  * `legacy_progress_migrated`/`legacy_progress_migration_failed` — `progressStore.ts`/`quizScoreStore.ts`, added just now alongside the crash-capture item above (this was the one lifecycle event still missing a failure-path log — the success path already existed from the Phase 3A commit, but the `catch` blocks were silent).
  * `uncaught_exception`/`uncaught_render_error` — this item, above.

* [ ] Extend billing-failure tracing to the Android verification path
  * Current behavior: `traceLogger` is already wired into every branch of `POST /api/v1/subscriptions`'s iOS path (per `context/subscription-debugging.md`).
  * Target behavior: identical coverage for the new Android verification path (Phase 4.3).
  * Dependencies: **[BLOCKED — HUMAN ACTION REQUIRED: depends on Phase 4.3's Google Play Billing verification service, which itself depends on Play Console app creation and Google Play Developer API credentials]**.

* [x] Log migration failures (Phase 3A) the same way — **done 2026-08-31 [MOBILE]**, see the lifecycle-events item above (`legacy_progress_migration_failed`, with a `store: 'lesson' | 'quiz'` field to tell the two stores' migrations apart in `debug_logs`).

* [x] Confirm redaction discipline on all new events — **confirmed 2026-08-31**
  * Reviewed every `logger.*`/`traceLogger.*` call added this session (auth lifecycle, subscription sync, progress sync, migration, crash capture): none log a raw access/refresh token, purchase JWS/purchase-token value, or password. The `uncaught_exception`/`uncaught_render_error` events log `error.stack`, which is a legitimate exception — see the one deliberate exception below.
  * One judgment call, not a violation: `error.stack`/`error.message` from an arbitrary uncaught exception *could*, in principle, incorporate interpolated values from whatever code threw (e.g. a request URL). This is an inherent tradeoff of generic crash logging (the same tradeoff any crash-reporting SDK makes) — accepted as reasonable given the no-new-vendor decision, but noted here rather than silently assumed clean, since it's not the same class of guarantee as the other events, which log only explicitly-chosen fields.

#### Testing

**Decided 2026-08-30**: yes, but narrowly — focused unit tests around this cycle's high-risk logic only, not a new test framework/suite buildout, and not component/navigation/E2E coverage. Neither repo has any test tooling installed today (`khmerlesson-app/package.json` has no `jest`/`jest-expo`/testing-library; `khmerlesson-dashboard/CLAUDE.md` confirms "No test suite is configured"), so a minimal `jest-expo` setup (the standard, Expo-supported test runner for this stack) is the smallest addition that satisfies the decision — install it for exactly the targets below, not as general-purpose scaffolding.

High-risk targets identified during this investigation (pure logic, no rendering/navigation — the kind of thing that regresses silently and is tedious to re-verify by hand every time):

* [x] Test harness — **done 2026-08-31 [MOBILE]**
  * Implementation: `jest-expo` + `jest` + `@types/jest` installed via `npx expo install jest-expo jest --dev` (SDK-compatible versions). `package.json` gained a minimal `"jest": { "preset": "jest-expo", "setupFiles": ["./jest.setup.js"], "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" }, ... }` block and a `"test": "jest"` script. New `jest.setup.js` mocks `@react-native-async-storage/async-storage` with its own official jest mock. `eslint.config.js` gained a scoped override (`files: ['jest.setup.js', '**/__tests__/**/*.{ts,tsx,js}']`) teaching the linter about Jest globals, rather than disabling the rule project-wide.
  * Deliberately minimal, per the decision: no component-testing library (e.g. `@testing-library/react-native`), no coverage thresholds, no CI wiring — just enough to run the four target suites below.

* [x] Unit tests: token-refresh interceptor + dedup (Phase 1) — `src/services/__tests__/api.test.ts`, 4 tests — **done 2026-08-31 [MOBILE]**
  * Covers: expired-token retry succeeds once refreshed; concurrent callers (`Promise.all` of 3) trigger exactly one `refreshTokens()` call; a refresh failure surfaces the *original* `TOKEN_EXPIRED` error unchanged; no accessToken means no refresh attempt at all.
  * `authStore` is mocked (`jest.mock('@/src/features/auth/store/authStore', ...)`) — safe to reference test-file-level `let` state here specifically because `api.ts` reaches it via a *deferred* `require()` inside a function body, called only during test execution (after the test file's own top-level code has already run), not at import time.

* [x] Unit tests: subscription status derivation (Phase 2) — `src/features/subscriptions/store/__tests__/subscriptionStore.test.ts`, 6 tests — **done 2026-08-31 [MOBILE]**
  * Covers: fresh store starts at `'unknown'`, never `'inactive'`; `setLoading()` doesn't touch `mySubscription`; `active`/`expired`/`null` subscriptions derive the correct `status`; `setError()` moves to `'error'` **without** downgrading a previously-confirmed subscription (the concrete regression this field exists to prevent).

* [x] Unit tests: per-user storage namespacing + identity-switch rehydration (Phase 3 account-boundary fix) — `src/features/lessons/store/__tests__/progressStore.namespacing.test.ts`, 2 tests — **done 2026-08-31 [MOBILE]**
  * Covers: switching from account 1 → account 2 never leaks account 1's completed lessons; switching back to account 1 restores its own progress; guest progress stays isolated from any signed-in account.
  * Notable implementation subtlety, documented in the test file: the mock's mutable state has to live *inside* `jest.mock()`'s own factory closure, not a test-file-level `let` — `progressStore.ts` computes its initial namespace eagerly at module load, and ES import evaluation is hoisted above other top-level statements regardless of source order, so an outer `let` can still be uninitialized at that moment. (`quizScoreStore` shares the identical namespacing implementation via the same `identityNamespace.ts` helper — one test suite covers both by construction, so a second near-duplicate suite wasn't added.)

* [x] Unit tests: local/cloud progress conflict-resolution rule (Phase 3 + 3A) — `src/features/quizzes/store/__tests__/quizScoreStore.test.ts`, 5 tests — **done 2026-08-31 [MOBILE]**
  * Covers: a fresh local write applies; a newer write overwrites an older one; the core fix — an older (e.g. stale cloud) write does **not** clobber a newer local one; a write with no existing entry always applies regardless of timestamp; `completedAt` defaults correctly to "now" on the normal local-completion path.

Verified: `npx jest` → 4 suites, 18 tests, all passing. `tsc --noEmit` and `expo lint` both clean (lint's full-project baseline — 5 pre-existing errors in `app/quiz-guide.tsx`, 32 pre-existing warnings, none in files this session touched — is unchanged from before this session started, confirmed by diffing against the first lint run of this session).

Explicitly out of scope for this cycle, per the original decision: component tests, navigation/routing tests, E2E device tests, and any Android-specific automated testing (Phase 4.7 stays a manual QA checklist). Backend (`khmerlesson-dashboard`) tests were not added — no DB is reachable in this environment to run anything meaningful against, and the backend logic added this cycle (progress controller, account-deletion route) is thin CRUD over Drizzle with no comparable "easy to silently regress" pure logic the way the four mobile targets above have.

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

- ~~**Android application ID**~~ — **resolved 2026-08-30, corrected 2026-08-31**: `com.digital606.khmerlessons` (with `s` — differs from iOS), set in `app.json`. Originally set to `com.digital606.khmerlesson` (matching iOS) but that string was already taken on the Play Store; see "Confirmed Platform Identifiers" below for the final, locked-in mapping. See the checked-off item under Phase 4.1 above for the full audit of what was/wasn't changed.
- ~~**Quiz Phase 3 scope**~~ — **resolved**: final score + completion state only. No resumable/per-question attempts unless the current UX already supported it (it doesn't) — see the "Scope decided" note at the top of the Account-Scoped Progress Cloud Sync section above.
- ~~**Lesson-completion progress**~~ — **resolved**: yes, included in the same account-scoped cloud progress architecture as quiz scores — see the same section above (now covers both `quiz_attempts` and `lesson_completions`).
- ~~**Account-boundary bug fix approach**~~ — **resolved**: per-user namespaced local storage, not clear-on-logout — see the "Namespace local progress storage by user" item above.
- ~~**Crash reporting**~~ — **resolved**: no vendor (Sentry or otherwise) this cycle; reuse and extend the existing `debug_logs`/`logger` pipeline with a global-error-handler hook instead — see the Observability section above.
- ~~**Automated testing**~~ — **resolved**: yes, but narrowly — focused unit tests on this cycle's specific high-risk logic only (token refresh, subscription status derivation, storage namespacing, progress conflict resolution), no new test-framework buildout beyond a minimal `jest-expo` install for those targets — see the Testing section above.

Resolved by re-inspection (2026-08-31), not by a code change:
- ~~**In-app subscription disclosures**~~ — **correction to this tracker's earlier claim**: re-reading `app/subscription/index.tsx` closely against Apple's exact Guideline 3.1.2(c) checklist (`error-app-review.md`) shows the original note above was wrong — the purchase flow already has all of it: plan title (`plan.name`) and description (`plan.description`) on every card, price + explicit `/year` cadence (on the card, the CTA button label, and the terms sentence — "renews automatically for $X/year until cancelled" / "Renews annually"), and working `Terms of Use`/`Privacy Policy` links in the same screen's footer (`app/subscription/index.tsx`'s `styles.terms` block) — not only on the login screen as originally (incorrectly) claimed here.
  - `[NEEDS INVESTIGATION]` — genuinely open, but a **business/content** question rather than a code gap: whether each plan's admin-entered `description` (dashboard-configured, not verified here) adequately describes "content or services provided during each subscription period" per Apple's specific wording — that's data-entry content in the dashboard, not something a code change can fix.
  - `[BLOCKED — HUMAN ACTION REQUIRED]` — replying to the actual App Store Connect rejection (with the screen recording Apple asked for) is an App Store Connect action, not a repository change, regardless of whether the code needed fixing.
- **Stray nested `khmerlesson-app/khmerlesson-app/ios/Pods/` folder**: looks like a misplaced `pod install` artifact — confirm before deleting.

## Architecture Decisions

- Theme tokens live in `src/shared/theme/` (not `constants/`) to align with the `src/` folder structure defined in architecture.md
- Old `constants/theme.ts` and boilerplate components kept untouched; new screens use the new design system only
- Mock data lives in `context/mock-data/` until API/SQLite layer is ready
- SQLite offline caching deferred until API-only layer is proven (see earlier recommendation — premium offline adds complexity around entitlement caching)
- Subscription entitlement (`hasAccessToCourse`, `server/features/subscriptions/controller/controller.ts`) is already platform-independent by construction — `platform` is a data column, not branching logic — so the Google Play launch's "unified entitlement" work (Phase 4.4) is scoped as verification, not a new abstraction layer

### Confirmed Platform Identifiers (2026-08-31) — final for this implementation cycle

- **iOS bundle identifier**: `com.digital606.khmerlesson` — already live on the App Store. Never change it.
- **Android application/package ID**: `com.digital606.khmerlessons` (with an `s`) — intentionally different because `com.digital606.khmerlesson` is not available for the Android application on the Play Store.
- Do not reconcile these into matching strings in either direction — this is a deliberate, permanent mapping, not a bug.
- `com.digital606.khmerlessons` is the single value to use consistently for: Expo `android.package` (already set, `app.json:35`), the Android `applicationId`, the generated Android native project (none exists yet — fully managed Expo workflow), the Google Play Console application, Android OAuth client configuration, Google Sign-In package configuration, Google Play Developer API verification, Play Billing purchase verification, Android App Links/deep links where package identity matters, release signing configuration references, and Google Play testing/release configuration.
- When Phase 4.3's Google Play verification service is built, it must **not** assume the Apple bundle ID and Android package name are identical: Apple-side verification (JWS `bundleId` field) checks against `com.digital606.khmerlesson`; Google Play-side verification checks against `com.digital606.khmerlessons`.
- Repo-wide audit (2026-08-31) for any Android-context reference still using the wrong (`khmerlesson`, no `s`) value: only two stale mentions found, both in this file's own historical log (the "Android application ID" resolved-item under "Improvement Roadmap — decisions needed" and the "Android package ID" line under "Autonomous Run Summary") — both corrected in place to point here. The one other repo-wide occurrence, `context/feature-specs/03-purchase-logic.md:154`, is a real Apple StoreKit 2 JWS example payload (`bundleId` field) — correctly iOS-scoped, left unchanged. No source file (`app.json`, code, config) had the wrong value.

## Session Notes

- All new screens are under `app/course/[id].tsx` and `app/lesson/[id].tsx`
- `@/src/...` imports work via the existing `@/*` path alias in tsconfig.json
- `react-native-iap` on StoreKit 2 (iOS) returns `purchase.transactionReceipt` as a JWS string — used directly as the `jws` field for `POST /api/v1/subscriptions`

---

## Autonomous Run Summary (2026-08-31)

Ran the Improvement Roadmap above autonomously across both repositories (`khmerlesson-app` and `khmerlesson-dashboard`, both on branch `feature/khmerlesson-improvements`), implementing every repository-implementable TODO in dependency order, self-reviewing and verifying each with `tsc`/`npm run check` + `eslint` (and, once added, `jest`) before committing, and updating this tracker as the work landed.

### What shipped

**Phase 1 — Authentication & Session Persistence** (fully implemented, `khmerlesson-app`): transparent token-refresh interceptor with request dedup (`src/services/api.ts`), proactive expiry check + refresh at cold start and on app-foreground (`authStore.ts`, `app/_layout.tsx`), auth tokens moved from plain AsyncStorage to `expo-secure-store` with an automatic legacy-data migration for existing installs, raw token values removed from console logs, and the full session lifecycle wired into the existing `debug_logs` trace pipeline.

**Phase 2 — Subscription Restoration & Sync** (fully implemented, `khmerlesson-app`): subscription sync extracted into a reusable `syncSubscription()`, triggered automatically on session restoration (not only on login or a Plan-screen visit), an explicit `SubscriptionSyncStatus` field added so "still syncing" can never be misread as "confirmed no subscription" (and the one place that bug actually existed — the paywall's trial-eligibility check — was fixed), a user-facing Restore Purchases button, and sync failures wired into the status instead of discarded.

**Phase 3 — Cloud Quiz Progress + Lesson Completion** (fully implemented, `[MOBILE + BACKEND]`): new `quiz_attempts`/`lesson_completions` tables and three new `/api/v1` endpoints (`khmerlesson-dashboard`), consumed by new client-side sync services (`khmerlesson-app`) with an offline pending-write queue and a recency-based local/cloud conflict rule. Scope was narrowed per your decision to final-state-only (no resumable attempts) and expanded per your decision to cover lesson completion, not just quizzes.

**Phase 3A — Legacy Progress Migration** (fully implemented, `khmerlesson-app`): one-time migration of pre-namespacing local data into the new per-user namespaced storage, with one honestly-documented gap (migrated quiz scores aren't proactively re-uploaded to the cloud — see the item's own note).

**Account-boundary bug** (fully implemented, `khmerlesson-app`): local lesson/quiz progress is now namespaced per signed-in identity rather than a single global key, per your explicit instruction to namespace rather than clear-on-logout.

**Account deletion bug, found during cross-repo inspection** (fully implemented, `[MOBILE + BACKEND]`): the mobile "Delete Account" button was calling an admin-only backend route that silently rejected every real user. Added a proper self-service `DELETE /api/v1/me` and repointed the client at it.

**Phase 5 — Observability** (fully implemented for everything not blocked on Android, `khmerlesson-app`): a global JS error handler + React Error Boundary now capture uncaught exceptions through the existing `debug_logs` pipeline instead of a paid vendor (per your decision), every lifecycle event planned across Phases 1-3 is wired in, and migration failures are now logged instead of silently swallowed.

**Testing** (fully implemented per your decided scope, `khmerlesson-app`): a minimal `jest-expo` harness and four focused unit-test suites (18 tests) covering exactly the high-risk logic you specified — token-refresh/dedup, subscription status derivation, progress namespacing/identity-switch rehydration, and local/cloud conflict resolution. No component/E2E/framework buildout.

**Android package ID**: set (`com.digital606.khmerlesson` at the time), with a full audit confirming no conflicting references existed anywhere in either repo. **Superseded 2026-08-31**: that value was taken on the Play Store; corrected to `com.digital606.khmerlessons`. See "Confirmed Platform Identifiers" below.

**Miscellaneous**: documented the previously-undocumented Google Sign-In env vars in `.env.example`; resolved three Phase 4 `[NEEDS INVESTIGATION]` items by code/library inspection alone (no schema change needed for a Google Play purchase token; `react-native-iap` needs a separate `acknowledgePurchaseAndroid()` call, not just `finishTransaction`); corrected an inaccurate earlier tracker claim about in-app subscription disclosures after re-reading the actual current code against Apple's rejection checklist.

### Commit trail

`khmerlesson-app`: 14 commits (`f4621e9`..`1a062e0`) — one per logical unit, each preceded by a `tsc`/`eslint`/`jest` pass.
`khmerlesson-dashboard`: 3 commits (`aef1c3e`, `c7ae914`, plus the account-deletion route) — each preceded by a `tsc` (`npm run check`) pass.

Nothing was pushed to any remote — all commits are local to each repo's `feature/khmerlesson-improvements` branch, per standing instructions not to push without being asked.

### What's genuinely blocked, not merely unaddressed

Every remaining unchecked item in this tracker falls into one of these buckets — verified individually, not assumed:

1. **Requires a real Android device/emulator/build** — icon/splash rendering, back-button behavior, `predictiveBackGestureEnabled` investigation, audio playback, `react-native-iap`'s Android config, the first Android build itself, and everything downstream of it (production network config verification, session-persistence re-verification on Android).
2. **Requires Google Cloud Console / Play Console access this environment doesn't have** — Android OAuth client + SHA-1 registration, Play Console app creation, Play App Signing, keystore/upload-key setup, internal/closed testing tracks, Google Play Billing product creation, license testers, and the entire store-listing/compliance checklist (Data Safety form, content rating, target audience, ads declaration).
3. **Requires a business/content decision only a human can make** — store listing copy, target audience, Khmer localization of the listing, whether resumable quiz attempts matter enough later to justify closing the one documented migration gap.
4. **Requires human institutional knowledge** — whether an informal iOS rollback process already exists, how iOS submission is actually configured today (CLI flags vs. `eas.json`).
5. **Requires the database migration to actually be applied** — no `DATABASE_URL` was reachable in this environment at any point, so `migrations/0004_cloud_progress.sql` (hand-authored, matching this repo's existing style for prior migrations) has not been run against any database. This is the single biggest gap in this session's verification: the entire Phase 3 backend was type-checked but never exercised against a live database.
6. **Downstream of the above** — the remaining Phase 4.3 Google Play Billing edge cases (pending purchases, cancelled/expired/renewal handling, restoration, error handling, interrupted-purchase polling, billing-failure tracing) all genuinely need Phase 4.3's foundation (Play Console products + a live Android build) to exist before they can be built or tested for real, not just designed on paper.

### Recommended next actions for a human

1. Apply `migrations/0004_cloud_progress.sql` to a dev database (`npm run db:migrate` in `khmerlesson-dashboard`, or review-then-apply the SQL directly), then confirm the three new `/api/v1` progress endpoints actually work against it.
2. Run the manual QA checklists flagged `[BLOCKED — HUMAN ACTION REQUIRED]` in this tracker on a real device/simulator (auth session restore/refresh, the upgrade-path/legacy-migration test).
3. Register the Android package name in Google Cloud Console + Play Console to unblock the rest of Phase 4.
4. Decide the open business/content items (store listing copy, target audience, Khmer localization) whenever Play Console work starts.

The repository is left in a working state on both sides: all commits are clean, self-contained, and pass their respective type-checkers/linters/tests; nothing was pushed or deployed.

---

## Integration Validation (2026-08-31)

Session goal: integration-readiness review of the above run, not new feature work. Reviewed both repos on `feature/khmerlesson-improvements` (both clean, no stray uncommitted changes) via static inspection + three parallel deep-review passes (backend/migration, mobile auth/subscription, mobile progress-sync/legacy-migration), since no device/simulator/database was reachable in this environment.

### Migration

* `migrations/0004_cloud_progress.sql` reviewed in full against `shared/schema.ts` (`quiz_attempts`/`lesson_completions`) — exact match on columns, types, PKs, FKs/cascade, unique constraints, indexes, nullability, defaults.
* Idempotent — same `CREATE TABLE/INDEX IF NOT EXISTS` + `DO $$ ... EXCEPTION WHEN duplicate_object` convention as `0001`-`0003`; confirmed by diffing against `0003_debug_logs.sql`. Safe to run twice.
* Purely additive — no `ALTER`/`DROP`/`RENAME` on any existing table/column; cannot affect existing user/subscription/quiz/course data.
* **Environment**: `DATABASE_URL` unavailable (no `.env` in either repo, confirmed without printing any value; `drizzle.config.ts` throws immediately without it) — same as the prior run found. Per the standing safety rule, this blocks migration execution entirely (not a production/uncertain-environment case — there is simply no reachable database here).
* `[BLOCKED — DATABASE ENVIRONMENT REQUIRES HUMAN CONFIRMATION]` — migration **not applied**. Resulting schema **not verified** against a live database (still the single largest unverified gap, as the prior run also flagged).

### Backend

* **Progress persistence**: controller queries match schema column-for-column; `upsertQuizAttempt`/`upsertLessonCompletion` use `onConflictDoUpdate` keyed on the actual unique constraints — retried/duplicate client calls update in place, never duplicate rows.
* **Authorization**: `GET /api/v1/progress`, `POST /api/v1/quiz-progress`, `POST /api/v1/lesson-progress` all derive `userId` solely from `req.user?.id`; Zod insert schemas `.omit()` `userId`, so it can't be smuggled through a request body even before the server-side overwrite. No cross-account read/write path found by inspection.
* **Account deletion**: `DELETE /api/v1/me` (`server/api.ts`) is self-scoped to `req.user.id`, never a client-supplied id. Cascade traced: `subscriptions`/`quiz_attempts`/`lesson_completions` all `ON DELETE CASCADE` to `users.id` (deleted with the account); `debug_logs.userId` is `ON DELETE SET NULL` (rows orphan intentionally, logs retained). No FK lacks an explicit `onDelete` action, so no accidental delete-blocked-by-FK failure mode.
* **Backward compatibility**: both new-endpoint commits (`aef1c3e`, `c7ae914`) confirmed purely additive via `git show --stat` — no existing route or response shape modified. The currently-released iOS app is unaffected regardless of whether this deploys.
* `npm run check` (tsc): clean.

### Mobile

* **Authentication**: token-refresh retry-once + dedup logic traced end-to-end — no infinite-loop path found; concurrent callers correctly share one in-flight refresh via the module-level `refreshPromise` cleared in `.finally()`. No raw token values found in any log call. Legacy AsyncStorage→SecureStore token migration is idempotent and non-destructive (new namespaced write always precedes the old key's removal in the analogous progress-store migrations; the auth migration's own gap is described below and fixed). Logout correctly clears SecureStore tokens; deliberately leaves `progressStore`/`quizScoreStore` untouched (namespacing, not clear-on-logout, confirmed to match the documented intent).
* **Subscription**: `unknown`/`loading`/`inactive`/`error` confirmed as genuinely distinct states, never collapsed; the original bug (trial banner flashing under `unknown`) stays fixed. `main-lessons`' semi-public token-expiry gap is covered in practice — `app/index.tsx` awaits the auth store's proactive refresh before any course-list fetch, and foreground resume is separately covered by `revalidateIfExpiring()`. Restore Purchases confirmed to call the existing `reconcileAvailablePurchases()`/`syncSubscription()` unmodified — no parallel purchase-verification path.
* **Two real defects found and fixed** (both directly inside this cycle's explicit verification list — see below).
* **One additional defect found and fixed**: interrupted SecureStore migration could leave plaintext legacy tokens stuck in `AsyncStorage` forever (see below).
* `tsc --noEmit`: clean. `expo lint`: same 5 pre-existing errors in `app/quiz-guide.tsx` (predates this improvement cycle, commit `ed5edcb`) and pre-existing warnings only — no new lint issues. `jest`: **7 suites, 27 tests, all passing** (was 4/18 before this session; +3 new suites/9 tests for the fixes below).

### Issues Found — all fixed, tested, and committed

1. **Network failure during proactive token refresh incorrectly forced sign-out** (`src/features/auth/store/authStore.ts`, `refreshIfNeeded`). Task-relevant: Phase 2 explicitly required verifying "network failure is not incorrectly treated as invalid credentials" — it was. Any thrown error from `refreshTokens()` (including a plain network/timeout failure with no HTTP response at all) was treated identically to the backend explicitly rejecting the refresh token, calling `signOut()` either way. Fixed: only sign out when the thrown error actually carries a `status` (meaning the backend responded, e.g. 401 on a genuinely invalid/expired/blacklisted refresh token); a network/timeout failure now leaves the session untouched so a later cold-start/foreground attempt can retry. New tests: `src/features/auth/store/__tests__/authStore.refresh.test.ts` (3 tests).
2. **Offline-queued quiz score could later overwrite a newer, already-synced score** (`src/features/progress/service.ts`, `flushPendingProgress`). Scenario: a quiz attempt fails to sync while offline and is queued; the same quiz is retaken online and syncs successfully, updating both the local store and the cloud to a newer `completedAt`; a later foreground flush replayed the stale queued item, silently regressing the cloud row back to the older score (the backend upsert has no recency check of its own). Fixed: before sending a queued quiz item, it's now checked against the local store's already-tracked `completedAt` for that lesson (the same recency rule `quizScoreStore.setScore()` already applies to its own writes) and dropped rather than replayed if superseded. Lesson completions needed no equivalent guard — already boolean-idempotent. New tests: `src/features/progress/__tests__/service.flush.test.ts` (3 tests).
3. **Interrupted SecureStore migration could leave plaintext legacy tokens stuck in AsyncStorage indefinitely** (`authStore.ts`, `hydrate()`). The original migration wrote tokens to SecureStore and stripped the legacy AsyncStorage field in one branch, gated on "SecureStore is currently empty." A crash between those two steps left SecureStore populated but the plaintext copy un-stripped — and every subsequent launch would find SecureStore already populated, so the cleanup branch would never run again, leaving the plaintext tokens there permanently (data wasn't lost, but the encryption-at-rest goal of the migration was silently defeated for that install). Fixed: cleanup is now a separate step, gated only on "the legacy blob still has a `tokens` field and SecureStore now has tokens" (true whether they arrived via this run's migration or a prior run's), so an interrupted install finishes the cleanup on its next hydrate. New tests: `src/features/auth/store/__tests__/authStore.migration.test.ts` (3 tests).

None of these three fixes touch backend code, add new endpoints, or change any request/response shape — no backward-compatibility impact.

### Legacy Migration (Phase 13)

* Reviewed both `progressStore.ts`/`quizScoreStore.ts`'s legacy migration and the auth SecureStore migration (above) for idempotency, non-destructiveness, and crash-safety.
* Progress-store legacy migration: correctly writes the new namespaced key before deleting the old un-namespaced key (crash between the two leaves both copies present, never a data hole); flag-gated so it only runs once; a previously-completed lesson/quiz score cannot become incomplete or regress through the merge (pure union for lesson completion; recency-gated for quiz scores) or through the cloud-merge path, which reuses the identical recency rule.
* **Minor unresolved concern, not fixed this session** (low severity, edge case): `progressStore.ts`/`quizScoreStore.ts` each hold `activeNamespace` as a single shared module-level variable reassigned synchronously at the top of every `hydrate()`, with no per-call snapshot/generation guard. A rapid double account-switch that causes two overlapping `hydrate()` calls could theoretically interleave reads/writes against the wrong namespace mid-migration. Not exercised by the existing namespacing tests. Flagged for a human decision on whether it's worth a generation-counter guard, since reproducing the race requires genuinely concurrent identity switches that don't occur in the app's normal single-threaded navigation flow.

### Offline Synchronization (Phase 15)

* Local writes (`setScore`/`markComplete`) happen unconditionally before any network attempt — a completed lesson/quiz is never lost regardless of connectivity.
* Failed syncs are queued (`pending_progress_sync`), not discarded; the queue is only cleared of an item after a confirmed success response, never optimistically.
* Duplicate delivery is safe by construction (backend upsert keyed on the real unique constraints).
* The one real conflict-handling gap found (stale queued write replaying over a newer synced one) is fixed — see Issue #2 above.

### Tests

* `khmerlesson-dashboard`: `npm run check` — clean. No live-database tests possible (no `DATABASE_URL`).
* `khmerlesson-app`: `npx tsc --noEmit` — clean. `npx expo lint` — 5 pre-existing errors (`app/quiz-guide.tsx`, predates this cycle) + pre-existing warnings only, no new issues. `npx jest` — **7 suites / 27 tests, all passing**.

### Remaining Blockers (unchanged from the prior run, plus the one new minor item above)

* Real iOS/Android device or simulator required — Keychain/Keystore behavior, background/foreground transitions, real Google/Apple sign-in, the upgrade-path/legacy-migration test against a real previous build, first Android build.
* Database setup — no `DATABASE_URL` reachable in this environment; migration application and live-database verification of the new progress endpoints, account deletion, and authorization checks are all still pending a human running them against a real dev/staging database.
* Google Cloud Console / Play Console access — Android OAuth client + SHA-1 registration, Play Console app creation, Play Billing setup (all pre-existing blockers, unchanged).
* Human decision on the namespacing-race edge case above (low priority).

---

## Database Migration Verification & Live Integration Test (2026-08-31, follow-up session)

`.env` became available in `khmerlesson-dashboard` between sessions (user-provided, `DATABASE_URL=postgresql://postgres@localhost:5434/dev`). This closes the single biggest gap the prior session flagged: the entire migration + Phase 3 backend had been type-checked but never exercised against a live database. This session did that.

### Environment identity

Local Postgres 12 (Postgres.app) on `localhost:5434`. The `dev` database did not exist on the server at session start — created fresh (`CREATE DATABASE dev`) and schema-initialized via `drizzle-kit push` from `shared/schema.ts` earlier in this session, before this validation task began. Unambiguously local/dev: newly created, empty of any real user data, matches the project's own documented dev connection string format. Not production, not uncertain — migration execution was not blocked.

### Migration — now applied and verified live

* `migrations/0004_cloud_progress.sql` re-confirmed to match `shared/schema.ts` exactly (already reviewed by the prior session).
* Applied directly (`psql -f migrations/0004_cloud_progress.sql`) — real run, not the earlier `db:push` (which had already created the same tables from the current `schema.ts` before this migration file was executed, since `db:push` diffs the live schema file directly rather than replaying migration files).
* **Idempotency proven, not just inferred**: ran the file a second time; every `CREATE TABLE`/`CREATE INDEX` emitted `NOTICE: ... already exists, skipping`, zero errors.
* Resulting schema inspected via `\d quiz_attempts` / `\d lesson_completions` — columns, types, nullability, defaults, PK, unique constraints, indexes, and all 6 FK `ON DELETE CASCADE` clauses match the migration file and `shared/schema.ts` exactly.
* **New finding, not previously known**: the dashboard's `server/index.ts` runs Drizzle's `migrate()` against the `migrations/` folder automatically on every server boot, before accepting traffic (`await migrate(db, { migrationsFolder: "./migrations" })`, `server/index.ts:55`). Confirmed live — starting `npm run dev` against the fresh `dev` DB logged `Database migrations applied` and populated `drizzle.__drizzle_migrations` with all 5 entries (0000–0004) automatically. **Practical implication: no manual `db:migrate` step is needed for production either** — migration 0004 will apply itself automatically and safely on the next production deploy, the same way it just did here, as long as production's `__drizzle_migrations` table already has entries for 0000–0003 (which it should, being the currently-running app).

### Live backend integration test (real HTTP requests against the running dev server + migrated DB, not just code inspection)

Registered two real test users (A, B) via `POST /api/auth/register`, plus minimal fixture content (one main_lesson, lesson, quiz) inserted directly for FK satisfaction. Then, over real HTTP:

* **Progress persistence**: `POST /api/v1/lesson-progress` and `POST /api/v1/quiz-progress` correctly persisted rows; `GET /api/v1/progress` returned them back correctly shaped.
* **Authorization / account isolation**: user B's `GET /progress` returned empty while A had data; **B's attempt to inject `"userId":1` (A's id) into a `POST /lesson-progress` body was ignored** — the row was correctly created under B's own authenticated id (server-side `req.user.id` override confirmed live, not just by reading the code).
* **Unauthenticated requests**: `GET /progress`, `POST /quiz-progress`, `DELETE /me` all correctly returned 401 with no token.
* **Account deletion cascade**: B (who had progress rows) called `DELETE /api/v1/me` → succeeded, B's `quiz_attempts`/`lesson_completions` rows were gone from the DB (cascade confirmed by direct query), B's just-used token was blacklisted (reuse → 401), and **A's account and progress rows were completely untouched** — confirmed by DB query after the deletion.
* **Backward compatibility, confirmed with diff evidence**: `git diff e3e2464..HEAD -- server/api.ts` (the pre-Phase-3 baseline vs. now) shows the only removed line across all dashboard changes is an `import` statement being replaced by a longer one — every other change is a pure addition. `GET /api/v1/main-lessons` re-tested live and still returns the exact pre-existing response shape (`hasAccess`/`comingSoon`/etc.), unaffected by the new tables/routes.
* Backend `npm run check` (tsc): clean, re-confirmed against the now-migrated DB.

### Independent cross-check of the mobile-side review (second reviewer, fresh read of current code, no access to the prior session's conclusions)

Commissioned a second, independent code review of the same high-risk mobile logic (auth refresh/dedup, SecureStore migration, subscription state modeling, legacy progress migration, offline sync queue) to check the prior session's self-review. Result: **confirms every claim in the prior session's "Issues Found — all fixed" and "Mobile" sections** — refresh dedup, network-vs-invalid-token handling, SecureStore migration crash-safety, logout completeness, subscription status modeling, legacy-migration idempotency/non-destructiveness, and Restore Purchases code reuse all independently re-verified against current code with matching file:line evidence. No regressions found.

It also surfaced **two new non-blocking findings** the prior session's report did not carry, plus a refinement of one existing claim:

1. **Refinement, not a contradiction**: the prior report stated the `main-lessons` semi-public token-expiry gap is "covered in practice" because proactive refresh runs before the course-list fetch. That's true for the common case, but the cross-check traced a genuine gap in the *reactive fallback*: `GET /api/v1/main-lessons` (semi-public, `khmerlesson-dashboard/server/auth/middleware/authenticate.ts`) never throws on an actually-expired/invalid token — it silently falls through to anonymous (`req.user` undefined), returning HTTP 200 with `hasAccess: false` for non-free courses instead of a `401 TOKEN_EXPIRED`. Since the mobile client (`src/services/api.ts`) only triggers its refresh-and-retry on a *thrown* `TOKEN_EXPIRED` error, a 200 response never triggers a retry, so if the proactive refresh is ever late or fails (not the common path, but not impossible), a stale "locked" course list can get cached (`src/services/hooks/useCourses.ts`) with no automatic self-correction short of an explicit refetch. **Non-blocking** — defense-in-depth gap, not an active bug in normal operation. Proposed fix: either have the server return `401 TOKEN_EXPIRED` for an invalid (not just absent) token on this route, or have `useCourses` retry once after any auth-state transition.
2. **New**: `src/features/progress/service.ts`'s offline pending-sync queue (`getPending`/`setPending`) does a non-atomic read-modify-write. If a new item is queued (`syncQuizAttempt`/`syncLessonCompletion`, its own independent read-modify-write) while `flushPendingProgress` is still mid-flight (plausible — flush awaits real network round-trips, during which the user can complete another lesson/quiz while still offline), the flush's final write can silently overwrite storage with a snapshot that doesn't know about the new item, **losing that queue entry** (the underlying local progress itself is unaffected — only its cloud-sync retry entry can vanish). **Non-blocking**, narrow timing window. Proposed fix: make queue mutation atomic (re-read-immediately-before-write, or a serialized `updatePending(fn)` helper).
3. Related, lower-severity: `flushPendingProgress` triggered from foreground-resume (`app/_layout.tsx`) skips the cloud-fetch-before-flush step that the cold-start path does, so its local-only staleness check can't detect a case where another device already synced a newer completion for the same lesson/quiz — a narrow multi-device timing window could let a stale local queue entry overwrite a newer cross-device cloud value. **Cosmetic/non-blocking**. Proposed fix: run a cloud fetch/merge before flushing on foreground resume too.

None of these three require immediate action; none are backward-compatibility or data-loss risks in normal single-device operation. Flagged for a human decision alongside the pre-existing namespacing-race item, not fixed in this session (this was a validation session, not a feature-development one, and the prior session — which was in scope to make fixes — already closed the three defects that were actually blocking).

### Updated Remaining Blockers (supersedes the "Database setup" line above)

* ~~Database setup~~ — **resolved**: migration applied, schema verified, and live HTTP integration tests (persistence, authorization/isolation, account deletion cascade, backward compatibility) all passed against a real migrated dev database.
* Real iOS/Android device or simulator still required (unchanged) — Keychain/Keystore behavior, background/foreground transitions, real Google/Apple sign-in, the upgrade-path/legacy-migration test against a real previous build, first Android build.
* Google Cloud Console / Play Console access still required (unchanged).
* Four low-priority, non-blocking edge cases await a human decision on whether/when to address: the namespacing-race condition (prior session), the `main-lessons` reactive-refresh gap, the offline-queue lost-update race, and the foreground-flush staleness-check gap (all three new, this session).

---

## Phase 1 Close-Out Fixes (2026-08-31)

Closed all four non-blocking edge cases from the section above, plus two small pieces of housekeeping, as part of "fix everything before iOS submission." All are additive/non-destructive and backward-compatible with the currently-released app.

* **`main-lessons` expired-token defense-in-depth gap** — **fixed [MOBILE + BACKEND]**. `khmerlesson-dashboard/server/auth/middleware/authenticate.ts`'s semi-public fallback now sets `req.tokenInvalid = true` when a Bearer token was presented but failed verification (distinct from no token at all, which is unaffected). `server/api.ts`'s `GET /main-lessons` handler sets an `X-Token-Status: invalid` response header when that flag is set — scoped to this one route, not all six semi-public prefixes, since it's the only one that personalizes its response. Chose a header over changing the HTTP status specifically to stay backward-compatible with the currently-released app (no refresh/retry logic, depends on the existing 200-anonymous-fallback behavior). `khmerlesson-app/src/services/api.ts`'s `rawApiFetch` now treats that header (only when an access token was actually sent) as a synthetic `TOKEN_EXPIRED` error, reusing the *existing* `withTokenRefresh` retry machinery unchanged. Live-verified against the migrated dev database: no token → 200, no header; invalid token → 200, `X-Token-Status: invalid`; valid token → 200, no header, correct `hasAccess`. New test: `src/services/__tests__/api.test.ts` ("treats a 200 response with X-Token-Status: invalid as TOKEN_EXPIRED...").
* **Offline pending-queue lost-update race** — **fixed [MOBILE]**. `src/features/progress/service.ts`'s `getPending`/`setPending` are now private `getPendingRaw`/`setPendingRaw`, with a new `updatePending(fn)` that serializes every queue mutation (both sync functions' append-on-failure, and `flushPendingProgress`'s "remove what was resolved" step) onto a single module-level promise chain, so no two mutations ever read-modify-write from the same stale snapshot. `flushPendingProgress` now removes exactly the items it resolved (succeeded or dropped-as-stale) from whatever the queue currently holds, rather than blindly overwriting storage with a pre-concurrency snapshot. New test: `src/features/progress/__tests__/service.flush.test.ts` ("preserves an item queued concurrently while a flush is still in flight").
* **Foreground-flush missing cloud-fetch-before-flush** — **fixed [MOBILE]**. `app/_layout.tsx`'s foreground `AppState` handler now calls `fetchAndMergeCloudProgress` (fetch-then-flush) instead of `flushPendingProgress` directly — matches the cold-start ordering in `app/index.tsx` exactly, so the queue's local-only staleness check always has fresh cloud state to compare against, closing the narrow multi-device overwrite window.
* **Namespacing double-hydrate race** — **fixed [MOBILE]**. Both `progressStore.ts` and `quizScoreStore.ts` gained a generation-counter guard: `hydrate()` captures a local generation id, and only commits its result (`set(...)`) if no newer `hydrate()` call has started by the time its async work resolves. `migrateLegacyIfNeeded()` in both stores now takes the namespace as an explicit parameter instead of reading the shared mutable `activeNamespace` variable, so an overlapping call can't cause it to read/write the wrong identity's key mid-migration.
* **Housekeeping** — removed the single stray tracked file `khmerlesson-app/ios/Pods/Target Support Files/Pods-KhmerLessons/ExpoModulesProvider.swift` (confirmed: an accidental `pod install`-from-wrong-directory artifact from old pre-cycle commit `b6fce5b`, unrelated to the real gitignored `ios/` native project). Fixed the 5 pre-existing `react/no-unescaped-entities` lint errors in `app/quiz-guide.tsx` — `expo lint` is now fully clean (0 errors, same pre-existing warning baseline).

**Verified**: `npx tsc --noEmit` (both repos) clean. `npm run check` (dashboard) clean. `npx expo lint` — 0 errors (down from 5), same pre-existing warnings. `npx jest` — **7 suites, 29 tests, all passing** (was 27; +2 new tests for the two fixes above with dedicated regression coverage). Backend changes live-tested against the already-migrated dev database (see above) plus a smoke re-check that account isolation, progress persistence, and unrelated protected routes are unaffected by the `authenticate.ts` change.

**Not fixed, flagged separately (unrelated to this cycle)**: `app.json`'s `ios.buildNumber` was found changed locally (`"19"` → `"22"`, plus a stripped trailing newline) at the start of this session, with no corresponding action taken by this session that would explain it (no `eas`/`expo` build process was run, and no command used here touches `buildNumber`). Left untouched and excluded from this session's commit — recommend checking `git diff app.json` and your own recent local tooling/EAS activity before your next iOS build, since an unexpected build-number mismatch with App Store Connect will reject the upload. **Update 2026-08-31: explained, see "iOS Release 1.0.2 (21) — Approved & Live" below** — this was `eas build`'s remote auto-increment, not an anomaly.

**Remaining before Phase 1 (iOS) is actually submittable — human actions only, unchanged from above**: ~~real-device/simulator QA pass, `eas build`/`eas submit` + App Store Connect upload (Apple Developer credentials), replying to Apple's Guideline 2.1(b) rejection, confirming subscription-plan descriptions against Apple 3.1.2(c)~~. **Superseded 2026-08-31 — see below: the submission happened, the rejection is resolved, and the build is live.**

---

## iOS Release 1.0.2 (21) — Approved & Live (2026-08-31, per user confirmation)

Supersedes the Apple rejection recorded in `error-app-review.md` (which covered build **1.0.1 (19)**) and the "Remaining before Phase 1 is submittable" line directly above. Not independently verified by any session here (no App Store Connect access from this environment) — recorded per direct user confirmation, and cross-checked against the repository evidence below.

- **Guideline 2.1(b)** (reviewer couldn't locate the IAP products in the sandbox) — resolved: replied to Apple with steps to reach the purchase flow and confirmed sandbox IAP configuration + Paid Apps Agreement acceptance.
- **Guideline 3.1.2(c)** (missing required subscription info) — resolved: the in-app side was already confirmed correct by code review (see the "In-app subscription disclosures" correction under Open Questions above — `app/subscription/index.tsx` already had title/description/price/cadence/ToU/privacy-policy links). The actual gap Apple flagged was **App Store Connect metadata** (a Terms of Use/EULA link in the App Description or EULA field, and the Privacy Policy field) — filled in directly in App Store Connect; not a repository change.
- **Repository evidence consistent with this**: `app.json`'s `version` is now `1.0.2` (bumped from `1.0.1`, committed `1d59d07`); `ios.buildNumber` reads `22` locally — one ahead of the live `21`, consistent with `eas.json`'s `appVersionSource: "remote"` + `build.production.autoIncrement: true` advancing the remote counter (and writing it back into `app.json`) on every `eas build` run, independent of what's committed to git. This is what explains the previously-flagged "unexplained buildNumber jump" two sessions ago — it wasn't unexplained, it's expected EAS behavior, and there's no actual conflict with the live build.

**Phase 1 (iOS) is now fully complete: shipped and live.** The device/simulator QA checklist elsewhere in this tracker remains open as regression coverage for whatever ships *next*, not a blocker for what's already live.

---

## Staging CORS Fix (2026-08-31) [BACKEND — khmerlesson-dashboard]

**Bug**: `server/routes.ts`'s CORS origin check only read `DEV_ORIGIN` inside the `NODE_ENV === "development"` branch. DigitalOcean's staging deployment runs with `NODE_ENV=production` (same as prod), so staging's own origin had no way to get onto the allow-list at all — every staging-origin request was rejected regardless of `DEV_ORIGIN`.

**Fix**: new `server/utils/cors-origins.ts` exports `buildAllowedOrigins(env)`, a pure function extracted from the inline ternary that used to live directly in `routes.ts`. Behavior:
- The existing dev/prod branch is unchanged: `NODE_ENV === "development"` still gets the 4 localhost origins + `DEV_ORIGIN`; anything else still gets the 2 hard-coded production origins (`cambodianlesson.netlify.app`, `khmerlessons.app`).
- New: a comma-separated `ALLOWED_ORIGINS` env var is parsed (trimmed, empty entries dropped, `*` never honored — `credentials: true` forbids a wildcard origin anyway) and **appended in both branches**, not gated by `NODE_ENV` — this is what actually fixes staging, since it's additive regardless of which mode the process is running in.
- `routes.ts` now calls `buildAllowedOrigins({ NODE_ENV, DEV_ORIGIN, ALLOWED_ORIGINS })` once and reuses the result in the existing `cors()` origin callback — no change to the callback's own allow/reject logic or to `credentials`/`allowedHeaders`/`methods`.
- (Originally placed under `server/config/` — discovered that whole directory is gitignored in this repo (pre-existing rule, unrelated to this change) and would never have been committed; moved to `server/utils/` instead, alongside `trace-logger.ts` etc.)

**Tests**: this repo had zero test tooling installed. Rather than add a new framework for one test file, used Node's built-in test runner via `tsx --test` (already a dependency) — `npm test` now runs `server/utils/__tests__/cors-origins.test.ts` (8 focused tests: prod/dev defaults unchanged, `DEV_ORIGIN` still works, `ALLOWED_ORIGINS` appended in both prod and dev, whitespace/empty-entry trimming, wildcard rejection, unset-`NODE_ENV` fallback). All 8 pass. `npm run check` (tsc) clean — test files are already excluded from the main typecheck via the existing `tsconfig.json` `**/*.test.ts` exclude.

**Live-verified** against a running dev server (`NODE_ENV=development` + `ALLOWED_ORIGINS` set to two fake staging-style URLs): both `ALLOWED_ORIGINS` entries and the existing localhost origin got `Access-Control-Allow-Origin` echoed back; an unrelated origin got no CORS header at all (rejected, as before).

**Staging action required**: add `ALLOWED_ORIGINS=<the actual staging URL>` (comma-separate more than one if needed) to the DigitalOcean staging app's environment variables — no code change needed for additional origins going forward, just this env var.

---

## Null Data-Envelope Bug Fix & 1.0.3 Rebuild (2026-08-31, later session)

Started from a device-testing request (`rm -rf ios` + rebuild for a physical-device TestFlight run) and surfaced a real, previously-unknown production bug along the way, plus two staging-only config issues that aren't bugs in the app itself.

### iOS native rebuild + TestFlight (1.0.3)

- `app.json` bumped `version` **1.0.2 → 1.0.3**; `ios.buildNumber` bumped to `23` locally, though — consistent with the EAS remote-auto-increment behavior already documented above — it was later found reverted back to `22` in the working tree by some subsequent `expo`/EAS-aware command; the actual archived TestFlight build's `Info.plist` still correctly showed `23`, so the discrepancy is cosmetic (source-of-truth drift in `app.json`, not a wrong shipped build) but worth rechecking before the *next* archive.
- A build (23) was uploaded to TestFlight, installed, and **all data failed to load** — root cause below.
- Separately hit and worked around an Expo-CLI-only bug: `npx expo run:ios --device` builds cleanly but its own USB device-install step (`LockdowndClient.startSession`) throws `TypeError: Cannot convert object to primitive value` against this iOS 26 device — a known incompatibility, not a project bug. Workaround: build via `expo run:ios`/`xcodebuild` as normal, then install + launch directly with `xcrun devicectl device install app` / `device process launch`, bypassing Expo's own installer. Metro still needs to be started separately (`expo start --dev-client`) since the device-install path skips it.
- Also hit a real concurrency issue (self-inflicted): two overlapping `xcodebuild` invocations against the same `DerivedData` produced `error: unable to attach DB ... database is locked`. Not a project bug — just don't run two builds against the same `ios/` at once; clearing the stale `XCBuildData/build.db` and retrying with a single build resolved it.

### Staging config issues found (not app bugs — staging-only, DigitalOcean env config)

1. **Transient API-key rejection** — staging briefly returned `401 Valid API key required` for the mobile app's actual configured key; self-resolved (almost certainly a pending-deploy timing issue, not a real key mismatch — re-tested minutes later with the identical key and got `200`).
2. **Dummy bucket storage placeholder leaking into API responses** — **fixed [BACKEND]**. Staging intentionally sets `BUCKET_ORIGIN_END_POINT`/`BUCKET_ACCESS_KEY`/`BUCKET_SECRET_ACCESS_KEY`/`BUCKET_NAME` to placeholder/`"dummy"` values (no real Spaces storage configured there) to satisfy startup — by design, per explicit user confirmation, not a misconfiguration to "fix" at the infra level. But `MainLessonController.getPublishedMainLessons()` (`khmerlesson-dashboard/server/features/main-lessons/controller/controller.ts`) unconditionally concatenated `BUCKET_ORIGIN_END_POINT` into every `thumbnailUrl`, baking a dead `https://example.invalid/...` URL into `/api/v1/main-lessons` responses instead of `null`. Fixed with a new `isBucketStorageConfigured()` check (treats the `"dummy"` sentinel — the project's own existing placeholder convention — as "not configured") that nulls `thumbnailUrl` instead; the mobile client already falls back gracefully to a local `book-cover.png` placeholder for a null `thumbnailUrl` (`CourseCard.tsx`), so this required no mobile-side change at all.

### The real bug: null data-envelope unwrapping (`src/services/api.ts`)

User report: "quiz progress is saved after logout and re-login, but subscription recovery doesn't." Traced via live Metro console logs (no DB access was available/authorized this session) rather than guessing from static code:

- `service.ts`'s own diagnostic log line (`subscription_active {"status": undefined}`) proved `syncSubscription()`'s `sub` was truthy but had no real `.status` — impossible for an actual `Subscription | null` value.
- Root cause: `rawApiFetch`/`rawApiPost`/`rawApiPostForm` all did `return (json?.data ?? json) as T`. `??` treats an explicit `data: null` (a *legitimate* envelope value — e.g. "no active subscription found") exactly the same as `data` being absent entirely, and falls back to the **whole envelope object** (`{success, data}`) instead of `null`. That object is truthy, so any caller expecting `T | null` (chiefly `syncSubscription`) silently received a garbage non-null, non-`Subscription` object instead of a clean "not subscribed" state.
- **Fix**: new `unwrapEnvelope<T>(json)` helper — checks for the `data` *key's presence* (`'data' in json`), not its value, so `{data: null}` correctly unwraps to `null` while a response with no envelope at all still falls back to the raw body. Replaces all 4 call sites.
- Confirmed live end-to-end after the fix: `subscription_sync_completed_none` (was mislabeled `subscription_active` before) for the true "no subscription" case; then a real plan-1 purchase (which itself hit a one-off Apple **sandbox** transaction-state error unrelated to this bug — `"Finished an inactive subscription transaction"`, resolved by retrying, exactly as the error message said to) correctly registered and immediately showed `subscription_active {"status": "active"}` on a fresh cold start with **no manual navigation required** — the actual regression is fixed, not just the symptom.
- **Regression tests added**: `src/services/__tests__/api.test.ts` — new `describe('api.ts — envelope unwrapping')` block, 2 tests (`data: null` → `null`; no-envelope response → raw body passthrough). Also fixed a latent test-isolation bug found while adding these: an earlier test in the same file permanently reassigned `global.fetch`, leaking into whatever ran after it — extracted the shared mock into a named `mainFetchMock` function, reset in every `beforeEach`. **31/31 tests pass** (was 29 before this session's dashboard CORS-fix baseline — 2 new).

### Merged to `main` (both repos) — scoped to just this session's fixes, not the whole feature branch

`main` was 18+ commits behind `feature/khmerlesson-improvements` in the app repo (5 in the dashboard repo) — explicitly **not** merging the whole branch, per user decision, only today's 3 fixes:

- **khmerlesson-app** `main`: `47f2bc4` (version bump 1.0.3) + `71313f6` (null-envelope fix). The envelope fix could not cherry-pick cleanly — `main`'s `api.ts` still has the **pre-refactor** structure (no `withTokenRefresh`/`rawApiFetch` split, predates the whole token-refresh interceptor work above), so the equivalent fix was hand-ported directly onto that older structure instead (same `unwrapEnvelope` concept, applied to `main`'s 4 call sites). **`main`'s `api.ts` still lacks the token-refresh interceptor entirely** — that's a separate, much larger piece of unmerged work, not something this session added to `main`.
  - **Not pushed** — `git push origin main` was denied (403): the authenticated GitHub account (`juniorfrogies`) does not have write access to `juniorfrogie/khmerlesson-app` (note the account-name mismatch, not a generic auth failure — the *same* account successfully pushed the dashboard repo below). **Human action needed**: add `juniorfrogies` as a collaborator on `juniorfrogie/khmerlesson-app`, or push from an account/token that already has access.
- **khmerlesson-dashboard** `main`: `0e95175` (thumbnailUrl null fix) — cherry-picked cleanly, **pushed to `origin/main` successfully**.
- Both repos' `feature/khmerlesson-improvements` branches were left exactly as they were (stashed before switching to `main`, popped back after) — including pre-existing uncommitted work on that branch not from this session: an Android IAP purchase-flow addition (`purchaseService.ts` + new `productId.ts`, offer-token handling + purchase-phase tracking) and a `CLAUDE.md` doc update for the `progress` feature — neither touched or committed by this session.

### Verified against production (`https://khmerlessons.app`) after switching `.env`

- ✅ Session restore, subscription sync (`subscription_active`) — confirms the API key, auth, and the plan-1 purchase all correctly resolve against production's real database.
- ❌ **Expected gap, not a bug**: `/api/v1/progress` fails with `JSON Parse error: Unexpected character: <` against production — the cloud quiz/lesson-progress feature (`c7ae914`, Phase 3 above) only exists on `feature/khmerlesson-improvements`, never merged to `main`, so production has no matching route at all; the request falls through to the dashboard's static-file SPA fallback (serves `index.html` for any unmatched path) instead of a JSON 404. Will resolve automatically once/if that feature is merged and deployed — not something to chase as a bug in the meantime.

### Remaining / next steps

- Push `khmerlesson-app`'s 2 local `main` commits once GitHub collaborator access is fixed.
- Rebuild (bump `ios.buildNumber` past the already-used `23`) and re-submit to TestFlight now that `.env` correctly points at production and the null-envelope fix is in — **in progress as of this entry**.
- Decide (separately, not yet decided) whether/when the `progress` cloud-sync feature should also ship to `main`/production.

---

## Android First Play Build (2026-09-01)

Goal: produce and verify a first local Android release AAB to unlock subscription-product creation in Play Console (Play requires the app's first build before its monetization section becomes usable). Explicitly stopped short of any upload. Picked up a pre-existing, uncommitted, half-finished Android IAP change (`purchaseService.ts` + `productId.ts` — offer-token handling, purchase-phase tracking, platform-aware product ID selection) left on this branch from an earlier session and finished wiring it in, on top of the new build-readiness work below.

### Package identity (Phase 4.1, continued)

Audit re-confirmed: `com.digital606.khmerlessons` (Android) vs `com.digital606.khmerlesson` (iOS) is the correct, intentional, already-documented split (see `CLAUDE.md` and the "Confirmed Platform Identifiers" section below). No stray references to the old/wrong value found anywhere in either repo. The generated native project (`android/app/build.gradle`) correctly uses `com.digital606.khmerlessons` for both `namespace` and `applicationId` — verified directly in the built AAB's manifest (see below), not just the source config.

### Android product ID selection (Phase 5) — fixed a real bug

- **Bug found**: `app/subscription/index.tsx` called `plan.productIdIos` unconditionally in both the product-availability check and the actual purchase call, regardless of platform — so Android would have tried to buy the *iOS* App Store SKU. Not a hardcoded literal, but functionally the same problem: the wrong API-provided field was being read on Android.
- **Fix**: wired in the pre-existing (uncommitted) `src/features/subscriptions/productId.ts`'s `getStoreProductId(plan)` — reads `plan.productIdIos` or `plan.productIdAndroid` based on `Platform.OS`, both of which come from the backend's `GET /api/v1/subscription-plans` response (`subscriptionPlans.productIdAndroid` column already existed server-side, previously unused — confirmed via `db.select().from(subscriptionPlans)`, no field-stripping). **Nothing is hardcoded** — this was an explicit ask mid-session, confirmed satisfied.
- `MissingStoreProductIdError` (plan has no product ID configured for the current platform — expected right now, since no Android products exist in Play Console yet) is now caught in the availability-check effect and surfaces as the same "unavailable" state already used for an Apple-side lookup miss, instead of throwing.
- Also fixed two hardcoded iOS-only UI strings to be platform-aware while touching this screen: "Not available from App Store" → "…from App Store/Google Play", and the Expo-Go warning's `expo run:ios` hint → `expo run:android` on Android.

### Android IAP compile readiness (Phase 6) — finished the pre-existing partial work

`purchaseService.ts` had dead, unused exports left from an interrupted earlier session (`resolveAndroidOfferToken`, `acknowledgeIfAndroid`, `setPurchasePhase`/`getPurchasePhase`/`subscribeToPurchasePhase` — zero call sites, confirmed via grep). Wired all of them in rather than leaving them unused or deleting them:
- Play Billing v5+ requires an `offerToken` (not just the SKU) to purchase a subscription — `requestPlanPurchase` now resolves one via `resolveAndroidOfferToken` on Android only and passes it as `google.subscriptionOffers` in the `requestPurchase` call (confirmed the correct shape — `{ sku, offerToken }` — against `node_modules/react-native-iap`'s own `.d.ts`, since `iap` is untyped `any` here and would not have caught a wrong shape at compile time).
- `acknowledgeIfAndroid` (Play Billing requires acknowledging a purchase within 3 days or it auto-refunds) is now called after a successful backend registration, both on a fresh purchase and on passive reconcile.
- `PurchasePhase` state machine now actually transitions (`purchasing` → `verifying` → `active`/`cancelled`/`failed`) around the real purchase flow instead of sitting unused; no new UI consumes it yet (out of scope for this pass — the screen's existing local `purchasing`/`restoring` booleans already cover the UI need).
- iOS purchase flow is provably unchanged: every new/changed code path is gated behind `Platform.OS === 'android'` or only touches the `google` half of the `requestPurchase` call object.

### Android microphone permission removed (Phase 9)

- **Finding**: the generated Android manifest declared `RECORD_AUDIO` plus a microphone foreground service (`AudioRecordingService`), sourced from `expo-audio`'s own config plugin — this app only ever plays TTS audio (`src/features/lessons/service/ttsService.ts`), it never records. Sensitive/dangerous permission, would need justifying in Play's Data Safety section for a feature the app doesn't have.
- **Fix**: `app.json`'s `expo-audio` plugin entry now passes `{ "recordAudioAndroid": false }` — expo-audio's own plugin (`node_modules/expo-audio/plugin/build/withAudio.js`) supports this flag natively, so no custom manifest-patching config plugin was needed. **Android-only** — deliberately left the `microphonePermission` option untouched, so iOS's `NSMicrophoneUsageDescription` (already live in the shipped 1.0.2 build) is unaffected. Verified in the built AAB: `RECORD_AUDIO` is gone; iOS `Info.plist` still has the unchanged mic-usage string.
- **Remaining permissions in the built release AAB** (verified via `bundletool dump manifest`, not just source config): `INTERNET`, `MODIFY_AUDIO_SETTINGS` (expo-audio, playback — legitimate), `READ_EXTERNAL_STORAGE` (capped `maxSdkVersion=32` in the final merge — expo-image/Glide's legacy-storage need, correctly scoped), `WRITE_EXTERNAL_STORAGE` (expo-file-system, uncapped — functionally a no-op above API 29's scoped storage but cosmetically broader than needed; `[NEEDS INVESTIGATION]`, low priority), `com.android.vending.BILLING` (correct, required for Play Billing).
  - `[NEEDS INVESTIGATION]` **`SYSTEM_ALERT_WINDOW`** — present in this local release AAB, traced to `node_modules/react-native/ReactAndroid/src/debug/AndroidManifest.xml` (RN's own dev-overlay tooling manifest fragment), which should only merge into `debug` builds, not `release`. This local build was a raw `./gradlew bundleRelease`, not an EAS build — it's possible EAS's actual `production` profile excludes `expo-dev-launcher`'s native module entirely (this app has `expo-dev-client` as a real dependency, for internal dev-client builds) and would not have this leak; not confirmed either way. Low severity (not a "dangerous"/runtime-prompted permission, no Play Data Safety declaration needed) — flagged for a human to verify against an actual EAS production build before worrying about a fix.

### Native project generated (Phase 3) + build config confirmed (Phase 4)

- No `android/` existed (fully managed Expo workflow, as documented) — generated via `npx expo prebuild -p android --clean` (safe: nothing native/manual existed to lose, this is the first time `android/` has ever been generated on this branch). `android/` stays gitignored, as before — regenerate via the same command rather than hand-editing anything under it.
- Resolved (auto-detected by Expo's own `ExpoRootProject` config, not guessed): `compileSdk 36`, `targetSdk 36`, `minSdk 24`, `buildTools 36.0.0`, `ndk 27.1.12297006`, `kotlin 2.1.20`.
- `versionName` in the generated project correctly reads `1.0.3` from `app.json`. `versionCode` is `1` (prebuild's local default — **not** representative of what an actual EAS build would assign; `eas.json`'s `appVersionSource: "remote"` means EAS auto-increments this remotely, so the *next* real EAS-built AAB will carry whatever remote count Expo's servers are already at, not `1`. No action needed here — just don't read anything into this local build's `versionCode`).
- API environment this build's JS bundle targets: **production**, `https://khmerlessons.app` — the only uncommented `EXPO_PUBLIC_API_BASE_URL` in the local `.env` at build time. This matches what the currently-live iOS app already talks to, so it's consistent, not a new risk — just worth recording since Phase 4 asks for it explicitly.
- No cleartext traffic override, no `android:debuggable` in the release manifest — confirmed via `bundletool dump manifest` on the actual built AAB, not inferred from source.

### Build environment set up (this machine had none)

- No Android SDK/Studio existed on this machine at all. Installed via `brew install --cask android-commandlinetools`, then `sdkmanager`: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006` (build-tools 35.0.0 also auto-pulled by a transitive dependency during the build). `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`.
- Hit repeated build-lock contention from the IDE's own Java/Gradle extension auto-importing the newly-generated `android/` folder in the background (up to 6 concurrent Gradle daemons at once, racing the same `node_modules/*/build/` output directories) — resolved with the user's explicit go-ahead to stop the daemons (`gradle --stop` per version found running); not a code issue.
- Hit real local disk-space exhaustion mid-build twice (a 4-ABI debug build attempt consumed ~10GB in native `.cxx` CMake intermediates alone) — recovered by clearing `~/Library/Developer/Xcode/DerivedData` (6.3GB, pure regenerable Xcode cache), `~/Library/Caches/Google` and `~/Library/Caches/CocoaPods` (regenerable caches), and by restricting subsequent local builds to `-PreactNativeArchitectures=arm64-v8a` (the architecture that matters for both real devices and Play distribution's most common target) to keep local verification builds affordable on this machine. **This ABI restriction is a local-verification-only shortcut** — the real Play upload artifact (built via EAS, per this project's existing `eas.json`, on infrastructure without this machine's disk constraint) should build the full architecture set unless a deliberate decision is made to ship arm64-v8a-only.

### Build results (Phase 11–13)

- **Debug** (`:app:assembleDebug`, arm64-v8a only): `BUILD SUCCESSFUL`. Gradle sync, Kotlin/Java compile, CMake/NDK native linking (react-native-reanimated, worklets, gesture-handler, nitro-modules, react-native-iap, expo-modules-core) all succeeded.
- **Release** (`:app:bundleRelease`, arm64-v8a only): `BUILD SUCCESSFUL` in 4m53s. JS bundling (Metro, `expo-router/entry.js`) + Hermes + R8/dex + signing all ran and succeeded.
- **AAB produced**: `android/app/build/outputs/bundle/release/app-release.aab` — 40,559,811 bytes.
  - Package: `com.digital606.khmerlessons` ✅
  - `versionName`: `1.0.3`, `versionCode`: `1` (local-build artifact of prebuild defaults — see note above, not what EAS would assign)
  - `compileSdkVersion`/`platformBuildVersionCode`: `36`, `minSdkVersion`: `24`, `targetSdkVersion`: `36`
  - Signed: yes (`META-INF/ANDROIDD.{RSA,SF}` present) — **with the standard Android debug keystore** (`android/app/debug.keystore`, the RN template default; well-known public fingerprint `SHA1 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`, not a secret). This is intentionally the "verify release compiles" key, not a real distribution key — Google Play will reject an upload signed with it. See Signing below.
  - No `android:debuggable`, no cleartext override — release-appropriate.
- **Note on scope**: this AAB is a **local single-ABI (arm64-v8a) verification build**, produced to prove the package identity, IAP/Google-Sign-In code, and permission set are all upload-ready — it is not itself the artifact that should be uploaded to Play Console. The actual first upload should come from an EAS build (this project's existing, already-configured path — `eas.json`'s `production` profile) once a human provides the credentials below.

### Signing (Phase 10)

- Current state: release build type signs with the debug keystore (see above) — deliberately unchanged, matches React Native's own template default, sufficient only to prove release-variant compilation. No secrets invented, none committed.
- **Human action still required before any real upload**: generate a real upload keystore (`keytool -genkeypair ...` or let EAS generate/manage one — `eas credentials`), and decide whether to enroll in Play App Signing (recommended — Google then manages the actual distribution key from your upload key, so losing the upload key later isn't catastrophic). Do this via `eas credentials` for the `production` profile rather than hand-rolling a local keystore, since that's how this project's existing EAS setup expects to sign release builds.

### Google Sign-In (Phase 7) — compile-clean, runtime config still needed

- Code path already handles both providers generically (`registrationType: "google"` via `expo-auth-session` PKCE); nothing Android-specific needed changing for compile-readiness — it compiled cleanly as part of the release build above.
- **Blocked — human action required**: an Android-specific Google OAuth client ID (separate from the existing iOS client ID) and its SHA-1/SHA-256 signing-certificate fingerprints need to be registered in Google Cloud Console before Google Sign-In will work at runtime on Android. Once the real release keystore exists (see Signing above), its fingerprint (`keytool -list -v -keystore <path>`) is what needs registering. **Do not reuse the existing iOS client ID for Android** — confirmed the existing `EXPO_PUBLIC_IOS_CLIENT_ID`/`EXPO_PUBLIC_WEB_CLIENT_ID` env vars are iOS/web-scoped; see `.env.example` for the new Android-specific variable to add once issued.

### Backend Android purchase contract (Phase 15)

- Confirmed unchanged/compiles: `npm run check` and `npm test` both clean in `khmerlesson-dashboard` (8/8 tests pass, pre-existing baseline). No Android-specific server-side purchase verification exists yet (`server/services/iap/` only has `ios/storekit2/`) — **`[BLOCKED — CREDENTIAL REQUIRED: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON]`**, real Play purchase verification can't be built/tested without a live Play Console app + service account, which doesn't exist until after this AAB's first upload. Not attempted this session, correctly out of scope for the "first AAB" milestone per the task's own instructions.

### Automated validation (Phase 17)

- **Mobile**: `npx tsc --noEmit` clean. `npx expo lint` — 0 errors, 34 pre-existing-pattern warnings (same baseline as before this session's changes, no new warnings introduced). `npx jest` — 7 suites / 31 tests, all pass.
- **Backend**: `npm run check` clean. `npm test` — 8/8 pass.

### iOS backward compatibility (Phase 16)

- `ios.bundleIdentifier` unchanged (`com.digital606.khmerlesson`). iOS product IDs untouched. Apple purchase flow untouched (see Phase 6 note above — every Android-specific change is platform-gated). `NSMicrophoneUsageDescription` unchanged. Backend API contracts unchanged (no backend code touched this session). Mobile jest suite (covers shared auth/subscription/progress store logic used by both platforms) passes clean.

### Credentials / Configuration Needed From User

| Environment Variable / Item | Required For | Where To Get It | Secret? | Environment |
|---|---|---|---|---|
| Real Android release/upload keystore | Signing the actual Play Console upload (debug keystore will be rejected by Play) | `eas credentials` (recommended, lets EAS generate + manage it) or `keytool -genkeypair` locally | Yes (the keystore + its passwords) | Production build/signing |
| `GOOGLE_ANDROID_CLIENT_ID` | Google Sign-In on Android | Google Cloud Console → Credentials → new OAuth client, type "Android", using the release keystore's SHA-1/SHA-256 | Not secret itself (client IDs are public), but ties to the keystore above | Runtime, all environments once issued |
| Release keystore SHA-1/SHA-256 fingerprint | Registering the Android OAuth client above, and Play Console's App Signing setup | `keytool -list -v -keystore <release-keystore-path>` once the keystore exists | No | Same as above |
| `GOOGLE_PLAY_PACKAGE_NAME` | Backend Play Billing purchase verification (Phase 15, not yet built) | Already known: `com.digital606.khmerlessons` — just needs adding to backend `.env` when that work starts | No | Backend, when Phase 15 starts |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Backend Play Billing purchase verification (Phase 15, not yet built) | Google Play Console → Setup → API access → create a service account with Play Android Developer API access | Yes | Backend, when Phase 15 starts |
| Play Console app creation | Unlocks subscription-product creation (the whole point of this milestone) | Create the app in Play Console using package `com.digital606.khmerlessons`, upload a real (non-debug-signed) AAB — either rebuild this one with a real keystore, or run a fresh EAS `production` build | No | Play Console |

None of the above blocked any of this session's work — everything that could be verified without them was (compile-readiness, permission audit, package identity, product-ID selection logic, local release build). They're listed together here per the task's instructions, to be handled once, not one-by-one.

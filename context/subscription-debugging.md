# Subscription Flow — Debugging & Rework Notes (2026-07-02)

Status: **improved but NOT fully working yet** — plan switching in sandbox still fails intermittently.
This doc records what was built, what was found, and where to pick up.

---

## The end-to-end tracing system (new)

Built so failures can be diagnosed from data instead of manual log copying.

- **`debug_logs` table** (dashboard repo, `shared/schema.ts`, migration `0003_debug_logs.sql`):
  one row per log line, from server or mobile, keyed by `trace_id` — the same value as the
  `X-Correlation-ID` header. Query one trace id to reconstruct a request across both sides.
- **Server**: `server/utils/trace-logger.ts` (`traceLogger.info/warn/error(traceId, msg, context?, userId?, source?)`).
  Wired into: auth middleware anomalies, all `/api/v1` catch blocks, the global error handler,
  and every branch of `POST /api/v1/subscriptions`.
- **Mobile**: `src/shared/utils/logger.ts` — buffers logs, flushes to `POST /api/v1/debug-logs`
  every 15s (endpoint is semi-public so guest/expired-token flushes still land).
  Every `apiFetch/apiPost/...` call sends a fresh traceId as `X-Correlation-ID`.
- **Admin dashboard**: new "Debug Logs" page (sidebar → Debug Logs) — filter by trace id / level / source.
- Query directly:
  ```sql
  select created_at, source, level, message, context
  from debug_logs where trace_id = '<id>' order by created_at;
  ```

## Root causes actually found (all confirmed in traces)

1. **"Stuck loading" button** — `purchaseSubscription` had paths that never settled its promise.
   Fixed: timeouts + guaranteed `finally` in the screen.
2. **Replayed transactions** — the old code re-ran `initConnection()` on every purchase attempt,
   which resets react-native-iap's replay dedup (`dedupeTransactionIOS` only works within one
   connection session). StoreKit then redelivered already-finished transactions of the *previous*
   plan while waiting for the new one. Fixed by the restructure (one connection per screen mount).
3. **"Payment successful but fail to subscribe"** — proven in logs: Apple confirms payment
   instantly, but the StoreKit event can arrive **minutes later** (plan3 arrived ~5 min late),
   long after the 90s wait. Payment real, registration never happened → false "failed".
4. **Plan 3 product itself is fine** — the new availability check confirmed
   `product found on App Store {plan3, $14.99}`. Earlier "plan3 is broken" theory was wrong;
   it was the late-delivery problem above.
5. **Duplicate "active" subscription rows per user** — upsert key is `original_transaction_id`;
   Apple mints a new chain per fresh purchase, old rows never expired. Fixed (see below).
6. **Timezone mix in `subscriptions` (NOT fixed yet)** — `created_at` (Postgres `defaultNow()`,
   local UTC+7) vs `updated_at`/`current_period_ends_at` (Node JS Dates, UTC) in
   `timestamp without time zone` columns. Rows look internally inconsistent by ~7h.
   Proper fix: `{ withTimezone: true }` migration (also affects `debug_logs` and date filters).

## Current purchase flow (after restructure)

`src/features/courses/service/purchaseService.ts` — rewritten. Key design:

- `initPurchaseFlow()` / `disposePurchaseFlow()` — connection + listeners live for the
  **screen's lifetime** (mount/unmount), never re-created per tap. Do not change this;
  re-connecting per attempt is what caused the replay bug.
- `requestPlanPurchase(productId, token)` — one pending purchase at a time; resolved by
  **any of three channels**:
  1. the StoreKit purchase event (normal path),
  2. **entitlement polling** every 10s (`getAvailablePurchases`, compared against a
     pre-purchase snapshot of transactionIds) — catches paid purchases whose event is late,
  3. **reconcile on next screen open** — registers the newest unregistered entitlement
     (this is what rescued the "lost" plan3 purchase, subscriptions row 93).
- All channels funnel into one idempotent `registerWithBackend()` → `POST /api/v1/subscriptions`
  → updates `useSubscriptionStore`.
- Timeout = 90s → error `PURCHASE_TIMEOUT`; the screen shows "Confirmation Pending"
  (not "Failed") because payment usually DID succeed and reconcile will pick it up.
- Screen also checks each plan against the App Store on open and shows a
  "Not available from App Store" badge + disabled button if Apple doesn't know the product.

Backend: `createOrUpdateSubscription` now **expires the user's other active/trial rows**
after every upsert → exactly one current plan per user. (Verified against real data in a
rolled-back transaction; applies for real on the next registration.)

Settings → new "Subscription" section (`app/(tabs)/me.tsx`) → opens the plan screen, which
shows "Your Plan" badge and switch-plan UI when already subscribed.

## Still broken / open

- **User reports testing "still doesn't work well"** — plan switching in sandbox remains
  unreliable even after all fixes. Next session: reproduce once, then pull the trace
  (`debug_logs`) and check WHICH channel failed (event? poll? reconcile? backend?).
  The poll should have made late deliveries invisible — if it didn't, look at the
  poll logs (`entitlement found by polling…` should appear) and whether
  `getAvailablePurchases` reflects the new transaction at all during the window.
- Timezone/`timestamptz` migration (item 6 above) — agreed useful, not done.
- **Production recommendation, not started**: Apple **App Store Server Notifications V2** —
  Apple calls the backend directly on subscribe/renew/cancel, removing the app as the only
  courier. Backend already has `@apple/app-store-server-library`; needs a public HTTPS
  endpoint + App Store Connect config.
- App Store Connect: all 5 plans show "Missing Metadata" (normal pre-submission state);
  Plan 3 is missing review screenshot + notes (plans 1/2 have them). Not proven related.
- Sandbox test data is heavily polluted (multiple transaction chains per tester).
  Prefer a fresh Sandbox Tester for meaningful runs; real signal ultimately needs
  TestFlight/production (dev-mode backend skips Apple verification entirely —
  `NODE_ENV=development` decodes the JWS without calling Apple).

## How to test / observe

1. Backend: `npm run dev` in `khmerlesson-dashboard` (port 5001). App must point at the
   Mac's LAN IP (`EXPO_PUBLIC_API_BASE_URL` in `.env`; re-check `ipconfig getifaddr en0`).
2. Native build required (`npm run ios`) — IAP doesn't work in Expo Go.
3. Reproduce, then read the trace: dashboard → Debug Logs, or query `debug_logs` by time/trace id.
4. Every purchase attempt logs: `purchase attempt started` → (event/poll/reconcile breadcrumbs)
   → `backend registration succeeded` / `purchase timed out` → `handleSubscribe finally`.
   A missing `finally` line means the promise never settled (bug).

import { Platform } from 'react-native';
import { apiPost } from '@/src/services/api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { logger, newTraceId, flushLogs } from '@/src/shared/utils/logger';
import type { Subscription } from '@/src/features/subscriptions/types';

export const IAP_NOT_AVAILABLE = 'IAP_NOT_AVAILABLE';

const KHMER_SUBSCRIPTION_PREFIX = 'com.khmerlesson.subscription.';
const PURCHASE_TIMEOUT_MS = 90000;
const ENTITLEMENT_POLL_INTERVAL_MS = 10000;

// All react-native-iap imports are deferred via require() so the module loads
// safely in Expo Go (NitroModules only work in native builds).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIAP(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-iap');
  } catch {
    throw new Error(IAP_NOT_AVAILABLE);
  }
}

export interface SubscriptionProduct {
  displayPrice: string;
}

export async function loadSubscriptionProduct(
  productIdIos: string,
  traceId: string = newTraceId(),
): Promise<SubscriptionProduct | null> {
  const iap = getIAP();
  try {
    const result = await iap.fetchProducts({ skus: [productIdIos], type: 'subs' });
    const products = Array.isArray(result) ? result : result ? [result] : [];
    if (products[0]) {
      logger.info(traceId, 'product found on App Store', { productId: productIdIos, displayPrice: products[0].displayPrice });
      return { displayPrice: products[0].displayPrice };
    }
    logger.warn(traceId, 'product NOT found on App Store — fetchProducts returned empty', { productId: productIdIos });
  } catch (e) {
    logger.warn(traceId, 'fetchProducts threw', { productId: productIdIos, message: (e as Error)?.message });
  }
  return null;
}

/**
 * Purchase flow — connection and listeners live for as long as the
 * subscription screen is mounted (initPurchaseFlow on mount, disposePurchaseFlow
 * on unmount). They are NOT re-created per purchase attempt.
 *
 * This matters: react-native-iap's own replay protection (dedupeTransactionIOS,
 * on by default) only suppresses a transaction ID "already emitted during the
 * current connection session." Tearing the connection down and rebuilding it
 * on every tap — which this file used to do — silently disables that
 * protection, so StoreKit redelivers an already-finished transaction as if it
 * were new. Keeping one connection + one pair of listeners for the screen's
 * lifetime is both simpler and lets the library's own dedup actually work.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let iap: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let purchaseSub: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let errorSub: any = null;

interface PendingPurchase {
  productId: string;
  traceId: string;
  accessToken: string;
  resolve: (subscription: Subscription) => void;
  reject: (error: Error) => void;
}
let pending: PendingPurchase | null = null;

let lastTraceId: string | null = null;
export function getLastPurchaseTraceId(): string | null {
  return lastTraceId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJws(purchase: any): string {
  const jws = Platform.OS === 'ios'
    ? (purchase.transactionReceipt ?? purchase.purchaseToken ?? null)
    : (purchase.purchaseToken ?? null);
  if (!jws) throw new Error('No JWS token found in purchase object');
  return jws;
}

// `claim` distinguishes an explicit purchase (true — the user just paid, so
// the subscription may transfer to their app account even if another account
// registered this Apple transaction chain before) from a passive sync
// (false — reconcile on screen open; the backend refuses cross-account
// transfer with SUBSCRIPTION_OWNED_BY_OTHER_ACCOUNT so a fresh login can
// never silently inherit the device Apple ID's subscription).
async function registerWithBackend(jws: string, accessToken: string, traceId: string, claim: boolean): Promise<Subscription> {
  const call = (token: string) => apiPost<Subscription>('/api/v1/subscriptions', { jws, claim }, token, traceId);

  let result: Subscription;
  try {
    logger.info(traceId, 'calling backend to register subscription');
    result = await call(accessToken);
  } catch (err: unknown) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'SUBSCRIPTION_OWNED_BY_OTHER_ACCOUNT') {
      // Expected outcome of a claim:false sync — not a failure, so don't log
      // at error level (console.error triggers the red LogBox bar in dev).
      throw err;
    }
    if (code !== 'TOKEN_EXPIRED') {
      logger.error(traceId, 'backend registration failed', { message: (err as Error).message });
      throw err;
    }
    logger.warn(traceId, 'access token expired mid-purchase — refreshing and retrying');
    await useAuthStore.getState().refreshTokens();
    const freshToken = useAuthStore.getState().tokens?.accessToken ?? '';
    result = await call(freshToken);
  }

  logger.info(traceId, 'backend registration succeeded', { status: result.status, planId: result.planId });
  useSubscriptionStore.getState().setSubscription(result);
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePurchaseUpdate(purchase: any): Promise<void> {
  if (!pending || purchase.productId !== pending.productId) {
    // Not what we're waiting for — a replayed or unrelated transaction.
    // Finish it so it stops sitting in the local queue; it's not our result.
    logger.info(pending?.traceId ?? 'no-active-purchase', 'ignoring unrelated purchase event', { productId: purchase.productId });
    try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch { /* already finished */ }
    return;
  }

  const { traceId, accessToken, resolve, reject } = pending;
  pending = null; // clear before awaiting so a duplicate delivery can't double-process this

  try {
    const subscription = await registerWithBackend(extractJws(purchase), accessToken, traceId, true);
    try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch { /* already finished */ }
    logger.info(traceId, 'purchase flow resolved');
    flushLogs();
    resolve(subscription);
  } catch (err) {
    logger.error(traceId, 'purchase flow rejected', { message: (err as Error).message });
    flushLogs();
    reject(err as Error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handlePurchaseError(error: any): void {
  logger.warn(pending?.traceId ?? 'no-active-purchase', 'purchaseErrorListener fired', {
    code: error.code,
    message: error.message,
    responseCode: error.responseCode,
    debugMessage: error.debugMessage,
  });
  if (!pending) return; // stray error unrelated to an active request
  const { reject } = pending;
  pending = null;
  const isCancel = iap.isUserCancelledError?.(error) ?? error.code === iap.ErrorCode?.UserCancelled;
  reject(new Error(isCancel ? 'CANCELED' : (error.message ?? 'Purchase failed')));
}

// Re-registers a purchase StoreKit already knows about but our backend may
// not — e.g. payment succeeded, then the app was killed (or the purchase
// event arrived after the timeout) before registration finished. Runs once
// when the flow initializes; the backend upsert is idempotent, so it's safe
// to repeat. Only the NEWEST entitlement is registered — a user has exactly
// one current plan, and registering older transaction chains too would let
// a stale plan overwrite the current one on the backend.
// Transactions the backend already told us belong to another app account —
// no point re-asking on every screen open. In-memory on purpose: a claim by
// this user (explicit purchase) or an app restart naturally resets it.
const deniedTransactionIds = new Set<string>();

async function reconcileAvailablePurchases(): Promise<void> {
  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (!accessToken) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const available: any[] = await iap.getAvailablePurchases().catch(() => []);
  const ours = (available ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.productId?.startsWith(KHMER_SUBSCRIPTION_PREFIX))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b.transactionDate ?? 0) - (a.transactionDate ?? 0));
  const newest = ours[0];
  if (!newest || deniedTransactionIds.has(newest.transactionId)) return;

  const traceId = newTraceId();
  try {
    logger.info(traceId, 'reconciling newest entitlement found on init', { productId: newest.productId, candidates: ours.length });
    await registerWithBackend(extractJws(newest), accessToken, traceId, false);
    for (const purchase of ours) {
      try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch { /* already finished */ }
    }
  } catch (err) {
    if ((err as Error & { code?: string }).code === 'SUBSCRIPTION_OWNED_BY_OTHER_ACCOUNT') {
      // Expected when the device's Apple ID subscription belongs to a
      // different app account — do nothing, this user is simply not subscribed.
      deniedTransactionIds.add(newest.transactionId);
      logger.info(traceId, 'device entitlement belongs to another app account — not claiming', { productId: newest.productId });
      return;
    }
    logger.warn(traceId, 'reconcile failed for existing entitlement', { productId: newest.productId, message: (err as Error).message });
  }
}

export async function initPurchaseFlow(): Promise<void> {
  iap = getIAP();
  try {
    await iap.initConnection();
  } catch {
    iap = null;
    throw new Error(IAP_NOT_AVAILABLE);
  }

  purchaseSub = iap.purchaseUpdatedListener(handlePurchaseUpdate, { dedupeTransactionIOS: true });
  errorSub = iap.purchaseErrorListener(handlePurchaseError);

  reconcileAvailablePurchases().catch(() => {});
}

export function disposePurchaseFlow(): void {
  purchaseSub?.remove();
  errorSub?.remove();
  purchaseSub = null;
  errorSub = null;
  pending = null;
  iap?.endConnection?.().catch(() => {});
  iap = null;
}

export function requestPlanPurchase(productId: string, accessToken: string): Promise<Subscription> {
  if (!iap) return Promise.reject(new Error(IAP_NOT_AVAILABLE));
  if (pending) return Promise.reject(new Error('A purchase is already in progress.'));

  const traceId = newTraceId();
  lastTraceId = traceId;
  logger.info(traceId, 'purchase attempt started', { productId, platform: Platform.OS });

  return new Promise<Subscription>((resolve, reject) => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (pollTimer) clearInterval(pollTimer);
      fn();
    };

    // Safety net: fires even if a purchase event DID arrive but the backend
    // registration then hung — anything that hasn't settled by now becomes a
    // clear error instead of a stuck spinner. (If registration completes in
    // the background after this fires, the store still gets updated and the
    // reconcile pass heals the rest.)
    const timeout = setTimeout(() => {
      if (settled) return;
      if (pending?.productId === productId) pending = null;
      logger.error(traceId, 'purchase timed out — no confirmation from the store', { ms: PURCHASE_TIMEOUT_MS });
      flushLogs();
      settle(() => reject(new Error('PURCHASE_TIMEOUT')));
    }, PURCHASE_TIMEOUT_MS);

    pending = {
      productId,
      traceId,
      accessToken,
      resolve: (sub) => settle(() => resolve(sub)),
      reject: (err) => settle(() => reject(err)),
    };

    (async () => {
      // Snapshot entitlements before purchasing, so polling below can tell a
      // genuinely new transaction apart from a pre-existing one (relevant
      // when switching plans: the old plan's entitlement is still listed).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const before: any[] = await iap.getAvailablePurchases().catch(() => []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preExisting = new Set((before ?? []).map((p: any) => p.transactionId));

      await iap.requestPurchase({
        request: {
          apple: { sku: productId, andDangerouslyFinishTransactionAutomatically: false },
          google: { skus: [productId] },
        },
        type: 'subs',
      });

      // Don't rely on the purchase event alone: Apple's payment sheet can
      // confirm ("You're all set") while the StoreKit event arrives minutes
      // later — observed directly in sandbox, and the cause of "payment
      // successful but subscription failed". The entitlement list updates
      // server-side as soon as payment completes, so poll it and treat a new
      // matching transaction as the purchase result.
      pollTimer = setInterval(async () => {
        if (pending?.productId !== productId) {
          if (pollTimer) clearInterval(pollTimer);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const avail: any[] = await iap.getAvailablePurchases().catch(() => []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fresh = (avail ?? []).find((p: any) => p.productId === productId && !preExisting.has(p.transactionId));
        if (fresh && pending?.productId === productId) {
          logger.info(traceId, 'entitlement found by polling — purchase event was late', { productId, transactionId: fresh.transactionId });
          handlePurchaseUpdate(fresh);
          return;
        }

        // No new transaction — check whether Apple DEFERRED the switch
        // instead. When the requested plan is a lower service level in the
        // subscription group, Apple schedules the change for the next renewal
        // and creates NO transaction now; the only trace of it is in the
        // current subscription's renewal info. Without this check, a
        // scheduled change looks identical to a silent failure.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any[] = await (iap.getActiveSubscriptions?.() ?? Promise.resolve([])).catch(() => []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deferred = (active ?? []).find((s: any) =>
          s.productId !== productId &&
          (s.renewalInfoIOS?.pendingUpgradeProductId === productId ||
            s.renewalInfoIOS?.autoRenewPreference === productId));
        if (deferred && pending?.productId === productId) {
          const current = pending;
          pending = null;
          logger.info(traceId, 'plan change scheduled at next renewal — Apple deferred the switch, no transaction now', {
            from: deferred.productId,
            to: productId,
            renewalDate: deferred.renewalInfoIOS?.renewalDate,
          });
          flushLogs();
          current.reject(new Error('PURCHASE_SCHEDULED'));
        }
      }, ENTITLEMENT_POLL_INTERVAL_MS);
    })().catch((err: unknown) => {
      // Dispatch-level rejection (store not ready, validation failure).
      // Real purchase results arrive via the listeners or the poll above.
      const current = pending;
      if (current?.productId === productId) {
        pending = null;
        logger.warn(traceId, 'requestPurchase rejected at dispatch', { message: (err as Error)?.message });
        current.reject(err as Error);
      }
    });
  });
}

import { Platform } from 'react-native';
import { apiPost } from '@/src/services/api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { Subscription } from '@/src/features/subscriptions/types';

export const IAP_NOT_AVAILABLE = 'IAP_NOT_AVAILABLE';

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

export async function connectIAP(): Promise<void> {
  const iap = getIAP();
  try {
    await iap.initConnection();
  } catch {
    throw new Error(IAP_NOT_AVAILABLE);
  }
}

export async function disconnectIAP(): Promise<void> {
  try {
    const iap = getIAP();
    await iap.endConnection();
  } catch {
    // ignore
  }
}

export interface SubscriptionProduct {
  displayPrice: string;
}

export async function loadSubscriptionProduct(
  productIdIos: string,
): Promise<SubscriptionProduct | null> {
  const iap = getIAP();
  try {
    const result = await iap.fetchProducts({ skus: [productIdIos], type: 'subs' });
    const products = Array.isArray(result) ? result : result ? [result] : [];
    if (products[0]) {
      return { displayPrice: products[0].displayPrice };
    }
  } catch (e) {
    console.log('[IAP] fetchProducts (subs) error:', e);
  }
  return null;
}

export function purchaseSubscription(
  planProductId: string,
  accessToken: string,
): Promise<Subscription> {
  const iap = getIAP();

  return new Promise<Subscription>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let purchaseSub: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorSub: any = null;
    let settled = false;
    let processing = false;

    function cleanup() {
      purchaseSub?.remove();
      errorSub?.remove();
    }

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    }

    let tokenToUse = accessToken;

    const callWithRefresh = async (jws: string): Promise<Subscription> => {
      try {
        return await apiPost<Subscription>('/api/v1/subscriptions', { jws }, tokenToUse);
      } catch (err: unknown) {
        if ((err as Error & { code?: string }).code === 'TOKEN_EXPIRED') {
          console.log('[IAP] token expired — refreshing and retrying');
          await useAuthStore.getState().refreshTokens();
          tokenToUse = useAuthStore.getState().tokens?.accessToken ?? '';
          return await apiPost<Subscription>('/api/v1/subscriptions', { jws }, tokenToUse);
        }
        throw err;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isKhmerSubscription = (productId: string) =>
      productId?.startsWith('com.khmerlesson.subscription.');

    async function processPurchase(purchase: any) {
      if (purchase.productId !== planProductId) {
        // Finish and skip — either unrelated product or a replayed old-plan transaction.
        // We only register the plan the user explicitly selected.
        console.log('[IAP] skipping non-matching productId, finishing:', purchase.productId);
        try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch {}
        return;
      }
      if (processing) {
        console.log('[IAP] already processing, skipping duplicate event');
        return;
      }
      processing = true;

      try {
        // StoreKit 2 JWS is in transactionReceipt; restored purchases use purchaseToken
        const jws = Platform.OS === 'ios'
          ? (purchase.transactionReceipt ?? purchase.purchaseToken ?? null)
          : (purchase.purchaseToken ?? null);

        console.log('[IAP] processPurchase — jws present:', !!jws, 'productId:', purchase.productId);

        if (!jws) throw new Error('No JWS token found in purchase object');

        const subscription = await callWithRefresh(jws);
        console.log('[IAP] subscription registered —', JSON.stringify(subscription));

        try {
          await iap.finishTransaction({ purchase, isConsumable: false });
        } catch {
          console.log('[IAP] finishTransaction skipped (already closed)');
        }

        settle(() => resolve(subscription));
      } catch (err) {
        const e = err as Error & { code?: string; status?: number };
        console.log('[IAP] error — status:', e.status, '| code:', e.code, '| message:', e.message);
        settle(() => reject(err));
      }
    }

    function startRequestPurchase() {
      console.log('[IAP] calling requestPurchase — productId:', planProductId);
      iap.requestPurchase({
        request: {
          apple: { sku: planProductId, andDangerouslyFinishTransactionAutomatically: false },
          google: { skus: [planProductId] },
        },
        type: 'subs',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).then((purchase: any) => {
        if (purchase?.productId) {
          console.log('[IAP] requestPurchase resolved — productId:', purchase.productId);
          processPurchase(purchase);
        }
      }).catch((err: unknown) => {
        console.log('[IAP] requestPurchase threw:', err);
        settle(() => reject(err as Error));
      });
    }

    // initConnection FIRST — v15 resets the payment queue observer on connect, which
    // drops any listeners registered before this call.
    iap.initConnection()
      .catch(() => {})
      .then(() => {
        console.log('[IAP] connection ready — registering listeners');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purchaseSub = iap.purchaseUpdatedListener((purchase: any) => {
          console.log('[IAP] purchaseUpdatedListener — productId:', purchase.productId);
          processPurchase(purchase);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorSub = iap.purchaseErrorListener((error: any) => {
          console.log('[IAP] purchaseErrorListener — code:', error.code, 'message:', error.message);
          const { ErrorCode } = iap;
          settle(() => {
            if (error.code === ErrorCode?.UserCancelled) {
              reject(new Error('CANCELED'));
            } else {
              reject(new Error(error.message ?? 'Purchase failed'));
            }
          });
        });

        return iap.getAvailablePurchases();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(async (available: any[]) => {
        if (settled) return;
        console.log('[IAP] getAvailablePurchases — count:', (available ?? []).length);
        (available ?? []).forEach((p: any) =>
          console.log('[IAP] available:', p.productId, '| transactionId:', p.transactionId),
        );
        // Finish any stale transactions for other plans so they stop replaying.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const others = (available ?? []).filter((p: any) => p.productId !== planProductId && isKhmerSubscription(p.productId));
        for (const stale of others) {
          try {
            console.log('[IAP] finishing stale plan transaction:', stale.productId);
            await iap.finishTransaction({ purchase: stale, isConsumable: false });
          } catch { /* already finished */ }
        }

        // Re-register only the requested plan if it already has an entitlement
        // (e.g. purchase completed but backend registration was interrupted).
        // If no matching plan found, start a new purchase request.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = (available ?? []).find((p: any) => p.productId === planProductId);
        if (existing) {
          console.log('[IAP] found existing entitlement — re-registering with backend:', existing.productId);
          processPurchase(existing);
        } else {
          startRequestPurchase();
        }
      })
      .catch((err: unknown) => {
        console.log('[IAP] init/getAvailablePurchases error — falling through:', (err as Error).message);
        if (!settled) startRequestPurchase();
      });
  });
}

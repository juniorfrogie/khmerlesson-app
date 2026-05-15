import { Platform } from 'react-native';
import { apiPost } from '@/src/services/api';
import { useAuthStore } from '@/src/features/auth/store/authStore';

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
    // initConnection throws in Expo Go because NitroModules aren't available
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

export interface CourseProduct {
  displayPrice: string;
  isSubscription: boolean;
}

// SKUs containing these tokens are subscriptions regardless of store lookup result
const SUBSCRIPTION_KEYWORDS = ['yearly', 'monthly', 'weekly', 'annual', 'subscription'];

export function isSubscriptionProductId(productId: string): boolean {
  const lower = productId.toLowerCase();
  return SUBSCRIPTION_KEYWORDS.some(kw => lower.includes(kw));
}

export async function loadCourseProduct(
  productId: string,
): Promise<CourseProduct | null> {
  const iap = getIAP();

  // Try non-consumable / one-time IAPs first. SKU naming (e.g. "yearly") is not
  // a reliable signal — a non-consumable yearly-access product would be misclassified.
  try {
    const iapResult = await iap.fetchProducts({ skus: [productId], type: 'in-app' });
    // v15 may return a single object instead of an array
    const iapProducts = Array.isArray(iapResult) ? iapResult : iapResult ? [iapResult] : [];
    if (iapProducts[0]) {
      return { displayPrice: iapProducts[0].displayPrice, isSubscription: false };
    }
  } catch (e) {
    console.log('[IAP] fetchProducts (in-app) error:', e);
  }

  // v15 drops the connection after fetchProducts — reinitialize before the subs fallback.
  try { await iap.initConnection(); } catch { /* ignore */ }

  // Fall back to auto-renewable subscription lookup.
  try {
    const subResult = await iap.fetchProducts({ skus: [productId], type: 'subs' });
    const subs = Array.isArray(subResult) ? subResult : subResult ? [subResult] : [];
    if (subs[0]) {
      return { displayPrice: subs[0].displayPrice, isSubscription: true };
    }
  } catch (e) {
    console.log('[IAP] fetchProducts (subs) error:', e);
  }

  return null;
}

export interface PurchaseCourseParams {
  courseId: number;
  productId: string;
  isSubscription: boolean;
  price: number;
  accessToken: string;
}

export function purchaseCourse(params: PurchaseCourseParams): Promise<void> {
  const { courseId, productId, isSubscription, price, accessToken } = params;
  const iap = getIAP();

  console.log('[IAP] purchaseCourse start — productId:', productId, 'isSubscription:', isSubscription);
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const exp = payload.exp ? new Date(payload.exp * 1000).toISOString() : null;
      const expired = payload.exp ? Date.now() > payload.exp * 1000 : null;
      console.log('[IAP:TOKEN]', JSON.stringify({ present: true, length: accessToken.length, userId: payload.sub ?? payload.userId ?? payload.id, exp, expired }));
    } else {
      console.log('[IAP:TOKEN]', JSON.stringify({ present: !!accessToken, length: accessToken.length, decoded: false }));
    }
  } catch {
    console.log('[IAP:TOKEN]', JSON.stringify({ present: !!accessToken, length: accessToken?.length ?? 0, decoded: false }));
  }

  return new Promise<void>((resolve, reject) => {
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

    const callWithRefresh = async (path: string, payload: object) => {
      try {
        await apiPost(path, payload, tokenToUse);
      } catch (err: unknown) {
        if ((err as Error & { code?: string }).code === 'TOKEN_EXPIRED') {
          console.log('[IAP] token expired — refreshing and retrying');
          await useAuthStore.getState().refreshTokens();
          tokenToUse = useAuthStore.getState().tokens?.accessToken ?? '';
          await apiPost(path, payload, tokenToUse);
        } else {
          throw err;
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function processPurchase(purchase: any) {
      if (purchase.productId !== productId) {
        console.log('[IAP] productId mismatch, skipping');
        return;
      }
      // v15 may fire both the listener and resolve the promise — only process once
      if (processing) {
        console.log('[IAP] already processing, skipping duplicate event');
        return;
      }
      processing = true;

      // ── FULL STOREKIT PURCHASE OBJECT (share with backend team) ──────────────
      console.log('[IAP:PURCHASE_OBJECT]', JSON.stringify({
        // identifiers
        productId:                        purchase.productId,
        transactionId:                    purchase.transactionId,
        originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
        // dates
        transactionDate:                  purchase.transactionDate,
        // receipts / tokens
        transactionReceipt:               purchase.transactionReceipt
                                            ? `<JWS ${purchase.transactionReceipt.length} chars>`
                                            : null,
        purchaseToken:                    purchase.purchaseToken,
        // state
        transactionStateIOS:              purchase.transactionStateIOS,
        quantityIOS:                      purchase.quantityIOS,
        // android fields (null on iOS)
        isAcknowledgedAndroid:            purchase.isAcknowledgedAndroid,
        purchaseStateAndroid:             purchase.purchaseStateAndroid,
        dataAndroid:                      purchase.dataAndroid,
        signatureAndroid:                 purchase.signatureAndroid,
        // platform
        platform: Platform.OS,
      }, null, 2));
      // ─────────────────────────────────────────────────────────────────────────

      try {
        const jws = Platform.OS === 'ios'
          ? (purchase.transactionReceipt ?? purchase.purchaseToken ?? null)
          : null;
        const receipt = Platform.OS === 'ios' ? jws : (purchase.purchaseToken ?? null);
        const purchaseDate = purchase.transactionDate
          ? new Date(purchase.transactionDate).toISOString()
          : new Date().toISOString();
        const rawId = purchase.transactionId ?? purchase.id ?? purchase.purchaseToken ?? null;
        const purchaseId = (!rawId || rawId === '0') ? productId : rawId;

        // Extract actual price from JWS. Apple stores price in milliunits (1000 = $1.00).
        // Divide by 1000 to get major currency units as the backend expects.
        let purchaseAmount = price;
        try {
          if (jws) {
            const seg = jws.split('.')[1];
            const padded = seg.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - seg.length % 4) % 4);
            // eslint-disable-next-line no-undef
            const jwsPayload = JSON.parse(atob(padded));
            if (typeof jwsPayload.price === 'number') {
              purchaseAmount = jwsPayload.price / 1000; // milliunits → major currency units
            }
          }
        } catch { /* keep fallback */ }

        const { user } = useAuthStore.getState();
        const historyPayload = {
          userId: user?.id ?? '',
          mainLessonId: courseId,
          purchaseId,
          platformType: Platform.OS,
          purchaseAmount,
          purchaseDate,
          paymentStatus: 'completed',
          jws,
          receipt,
        };
        console.log('[IAP:HISTORY_PAYLOAD]', JSON.stringify(historyPayload, null, 2));
        await callWithRefresh('/api/v1/purchase-history', historyPayload);
        console.log('[IAP] purchase history recorded');

        try {
          await iap.finishTransaction({ purchase, isConsumable: false });
        } catch {
          console.log('[IAP] finishTransaction skipped (already closed)');
        }
        console.log('[IAP] transaction finished — resolving');
        settle(() => resolve());
      } catch (err) {
        const e = err as Error & { code?: string; status?: number; responseBody?: string };
        console.log('[IAP] error processing purchase — status:', e.status, '| code:', e.code, '| message:', e.message);
        console.log('[IAP:ERROR_RESPONSE]', e.responseBody ?? '(no body)');
        settle(() => reject(err));
      }
    }

    // For existing entitlements found in getAvailablePurchases: the original purchase was
    // already verified — skip re-verification and only record history + finish + resolve.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function resumeEntitlement(purchase: any) {
      if (processing) return;
      processing = true;
      console.log('[IAP] resuming existing entitlement for:', productId);

      // On iOS, the JWS signed transaction is in purchaseToken (transactionReceipt is null
      // for restored purchases in react-native-iap v15).
      const jws = Platform.OS === 'ios'
        ? (purchase.transactionReceipt ?? purchase.purchaseToken ?? null)
        : null;

      const purchaseDate = purchase.transactionDate
        ? new Date(purchase.transactionDate).toISOString()
        : new Date().toISOString();
      const rawId = purchase.transactionId || purchase.id || null;
      const purchaseId = (!rawId || rawId === '0') ? productId : rawId;

      // ── DECODED JWS PAYLOAD (share with backend team) ────────────────────────
      try {
        if (jws) {
          const parts = jws.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString('utf8'),
            );
            console.log('[IAP:JWS_PAYLOAD]', JSON.stringify(payload, null, 2));
          }
        }
      } catch { /* ignore decode errors */ }
      // ─────────────────────────────────────────────────────────────────────────

      const receipt = Platform.OS === 'ios' ? jws : (purchase.purchaseToken ?? null);
      const { user } = useAuthStore.getState();
      const historyPayload = {
        userId: user?.id ?? '',
        mainLessonId: courseId,
        purchaseId,
        platformType: Platform.OS,
        purchaseAmount: price,
        purchaseDate,
        paymentStatus: 'completed',
        jws,
        receipt,
      };

      try {
        await callWithRefresh('/api/v1/purchase-history', historyPayload);
        console.log('[IAP] purchase history recorded');
      } catch (err) {
        console.log('[IAP] purchase history failed:', (err as Error).message);
      }

      try {
        await iap.finishTransaction({ purchase, isConsumable: false });
      } catch {
        console.log('[IAP] finishTransaction skipped (already closed)');
      }

      settle(() => resolve());
    }

    function startRequestPurchase() {
      const productType = isSubscription ? 'subs' : 'in-app';
      console.log('[IAP] calling requestPurchase — type:', productType);

      iap.requestPurchase({
        request: {
          apple: { sku: productId, andDangerouslyFinishTransactionAutomatically: false },
          google: { skus: [productId] },
        },
        type: productType,
      }).then((purchase: any) => {
        // v15: requestPurchase resolves directly with the purchase in addition to firing the listener
        if (purchase?.productId) {
          console.log('[IAP] requestPurchase promise resolved — productId:', purchase.productId);
          processPurchase(purchase);
        }
      }).catch((err: unknown) => {
        console.log('[IAP] requestPurchase threw:', err);
        settle(() => reject(err as Error));
      });
    }

    // initConnection FIRST — v15 resets the payment queue observer on connect, which
    // drops any listeners registered before this call. Set up listeners only after
    // the connection is live so they are registered on the active observer.
    iap.initConnection()
      .catch(() => {})
      .then(() => {
        console.log('[IAP] connection ready — registering listeners');

        purchaseSub = iap.purchaseUpdatedListener((purchase: any) => {
          console.log('[IAP] purchaseUpdatedListener — purchase.productId:', purchase.productId);
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
      .then((available: any[]) => {
        if (settled) return;
        console.log('[IAP] getAvailablePurchases — count:', (available ?? []).length, 'skus:', (available ?? []).map((p: any) => p.productId));
        const existing = (available ?? []).find((p: any) => p.productId === productId);
        if (existing) {
          console.log('[IAP] found existing entitlement — resuming');
          resumeEntitlement(existing);
        } else {
          startRequestPurchase();
        }
      })
      .catch((err: unknown) => {
        console.log('[IAP] init/getAvailablePurchases error — falling through to requestPurchase:', (err as Error).message);
        if (!settled) startRequestPurchase();
      });
  });
}

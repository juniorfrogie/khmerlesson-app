import { Platform } from 'react-native';
import { apiPost } from '@/src/services/api';

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
    const iapProducts = Array.isArray(iapResult) ? iapResult : [];
    if (iapProducts[0]) {
      return { displayPrice: iapProducts[0].displayPrice, isSubscription: false };
    }
  } catch (e) {
    console.log('[IAP] fetchProducts (in-app) error:', e);
  }

  // Fall back to auto-renewable subscription lookup.
  try {
    const subResult = await iap.fetchProducts({ skus: [productId], type: 'subs' });
    const subs = Array.isArray(subResult) ? subResult : [];
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
  userId: string;
  userEmail: string;
}

export function purchaseCourse(params: PurchaseCourseParams): Promise<void> {
  const { courseId, productId, isSubscription, price, accessToken, userId, userEmail } = params;
  const iap = getIAP();

  console.log('[IAP] purchaseCourse start — productId:', productId, 'isSubscription:', isSubscription);

  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let purchaseSub: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorSub: any = null;
    let settled = false;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    purchaseSub = iap.purchaseUpdatedListener(async (purchase: any) => {
      console.log('[IAP] purchaseUpdatedListener — purchase.productId:', purchase.productId, 'expected:', productId);

      if (purchase.productId !== productId) {
        console.log('[IAP] productId mismatch, skipping');
        return;
      }

      try {
        const jws = Platform.OS === 'ios'
          ? (purchase.transactionReceipt ?? purchase.purchaseToken ?? null)
          : null;
        const receipt = purchase.purchaseToken ?? null;
        const purchaseDate = purchase.transactionDate
          ? new Date(purchase.transactionDate).toISOString()
          : new Date().toISOString();
        const purchaseId = purchase.transactionId ?? purchase.id ?? receipt;

        console.log('[IAP] verifying with backend — purchaseId:', purchaseId);

        await apiPost(
          '/api/v1/verify-purchase',
          {
            userId,
            userEmail,
            mainLessonId: courseId,
            purchaseId,
            platformType: Platform.OS,
            purchaseAmount: price,
            purchaseDate,
            paymentStatus: 'completed',
            receipt,
            jws,
          },
          accessToken,
        );

        console.log('[IAP] backend verified — finishing transaction');
        await iap.finishTransaction({ purchase, isConsumable: false });
        console.log('[IAP] transaction finished — resolving');
        settle(() => resolve());
      } catch (err) {
        console.log('[IAP] error in purchase listener:', err);
        settle(() => reject(err));
      }
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

    const productType = isSubscription ? 'subs' : 'in-app';
    console.log('[IAP] calling requestPurchase — type:', productType);

    iap.requestPurchase({
      request: {
        apple: { sku: productId, andDangerouslyFinishTransactionAutomatically: false },
        google: { skus: [productId] },
      },
      type: productType,
    }).catch((err: unknown) => {
      console.log('[IAP] requestPurchase threw:', err);
      settle(() => reject(err as Error));
    });
  });
}

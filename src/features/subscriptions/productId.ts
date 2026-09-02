import { Platform } from 'react-native';
import type { SubscriptionPlan } from './types';

// Centralizes store product ID selection so no call site can accidentally
// reuse the iOS field on Android (or vice versa) just because it was
// written with one platform in mind. The backend/admin dashboard remains
// the sole source of truth for productIdIos/productIdAndroid — this never
// derives or guesses an ID from the plan name.
export class MissingStoreProductIdError extends Error {
  constructor(planId: number, platform: string) {
    super(`Plan ${planId} has no store product ID configured for platform "${platform}"`);
    this.name = 'MissingStoreProductIdError';
  }
}

export function getStoreProductId(plan: SubscriptionPlan): string {
  const id = Platform.OS === 'ios' ? plan.productIdIos : plan.productIdAndroid;
  if (!id) throw new MissingStoreProductIdError(plan.id, Platform.OS);
  return id;
}

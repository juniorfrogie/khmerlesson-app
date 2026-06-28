export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: number;
  name: string;
  /** Price in cents (e.g. 900 = $9.00) */
  price: number;
  productIdIos: string;
  productIdAndroid: string | null;
  description: string;
  isActive: boolean;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  platform: string;
  productId: string;
  originalTransactionId: string;
  status: SubscriptionStatus;
  currentPeriodEndsAt: string;
  createdAt: string;
  updatedAt: string;
}

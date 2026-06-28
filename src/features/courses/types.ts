export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  /** True = no login or subscription needed */
  isFree: boolean;
  /** User can open this course (free OR plan includes it) */
  hasAccess: boolean;
  /** Visible but not yet openable */
  comingSoon: boolean;
  lessonCount?: number;
  order?: number;
  // Kept optional during migration — removed in A6 UI cleanup
  price?: number;
  productId?: string;
  hasPurchased?: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  price?: number;
  productId?: string;
  hasPurchased?: boolean;
  lessonCount?: number;
}

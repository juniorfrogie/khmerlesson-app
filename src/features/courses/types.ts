export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  price?: number;
  hasPurchased?: boolean;
  lessonCount?: number;
}

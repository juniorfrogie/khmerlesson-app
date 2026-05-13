export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  isFree: boolean;
  lessonCount?: number;
}

export type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface LessonSection {
  title: string;
  content: string;
  html?: string;
  items?: VocabItem[];
}

export interface VocabItem {
  english: string;
  phonemic: string;
  khmer: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  level: LessonLevel;
  type: string;
}

export interface LessonDetail extends Lesson {
  sections: LessonSection[];
}

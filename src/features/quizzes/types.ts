export interface Quiz {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizDetail extends Quiz {
  questions: Question[];
}

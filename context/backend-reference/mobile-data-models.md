# Mobile Data Models

## Course Model

Maps from:
- main_lessons

Frontend shape:

```ts
type Course = {
  id: number
  title: string
  description: string
  thumbnailUrl: string
  /** True = no login or subscription needed */
  isFree: boolean
  /** User can open this course (free OR their plan includes it) */
  hasAccess: boolean
  /** Visible in the list but not yet openable */
  comingSoon: boolean
  lessonCount?: number
  order?: number
}
```

UI access logic:
```
if comingSoon  → show lock + "Coming Soon" label, non-tappable
if hasAccess   → open normally
else           → show lock + "Subscribe" button → /subscription
```

---

## Lesson Model

Maps from:
- lessons

```ts
type Lesson = {
  id: number
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  sections: LessonSection[]
}
```

---

## Lesson Section

```ts
type LessonSection = {
  title: string
  content: string
}
```

---

## Quiz Model

```ts
type QuizQuestion = {
  id: number
  question: string
  options: string[]
  correctAnswer: string
}
```
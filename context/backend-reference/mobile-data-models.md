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
  imageCover: string
  free: boolean
  price?: number
}
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
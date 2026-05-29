## Add Quiz Feature

Implement a Quiz feature for the Khmer learning platform.

## Objective

Allow users to:

+ View all quizzes
+ View quiz details by ID
+ Answer multiple choice questions (QCM style)
+ Link quizzes to lessons
+ API Endpoints

1. Get All Quizzes
Request

GET /api/v1/quizzes

Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Greeting Test",
      "description": "Choose the correct meaning",
      "lessonId": 1,
      "createdAt": "2026-05-29T15:26:07.354Z",
      "updatedAt": "2026-05-29T15:26:07.354Z"
    }
  ],
  "total": 1
}
2. Get Quiz by ID
Request

GET /api/v1/quizzes/:id

Response
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Greeting Test",
    "description": "Choose the correct meaning",
    "lessonId": 1,
    "questions": [
      {
        "id": 1,
        "options": [
          "You",
          "I / me",
          "Name",
          "Happy"
        ],
        "question": "What does [ខ្ញុំ] mean?",
        "correctAnswer": "I / me"
      },
      {
        "id": 2,
        "options": [
          "Thank",
          "Fine",
          "Luck",
          "Meet"
        ],
        "question": "What does [សំណាង] mean?",
        "correctAnswer": "Luck"
      },
      {
        "id": 3,
        "options": [
          "Time",
          "Age",
          "Next time",
          "Happy"
        ],
        "question": "What does [អាយុ] mean?",
        "correctAnswer": "Age"
      },
      {
        "id": 4,
        "options": [
          "អ្នក",
          "អរគុណ",
          "របស់ខ្ញុំ",
          "សំណាង"
        ],
        "question": "How do you say “my / mine”?",
        "correctAnswer": "របស់ខ្ញុំ"
      },
      {
        "id": 5,
        "options": [
          "សុខសប្បាយ",
          "ពេល",
          "ថ្ងៃនេះ",
          "អ្នក"
        ],
        "question": "How do you say “you”?",
        "correctAnswer": "អ្នក"
      }
    ],
    "createdAt": "2026-05-29T15:26:07.354Z",
    "updatedAt": "2026-05-29T15:26:07.354Z"
  }
}
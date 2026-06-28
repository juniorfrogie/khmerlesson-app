## List of API

##  Authentication APIs (Public)
- POST /api/auth/login - User login with email/password
- POST /api/auth/register - User registration
- POST /api/auth/register-auth-service - Register with external auth service
- POST /api/auth/refresh-token - Refresh access token
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password with token
- POST /api/auth/verify-apple-id-token - Verify Apple ID token

## Public Content APIs (Some require API key in production)
- GET /api/v1/main-lessons - List all published main lessons
- GET /api/v1/main-lessons/:id/lessons - List lessons for a specific main lesson
- GET /api/v1/lessons/:id - Get detailed lesson content
- GET /api/v1/lessons/level/:level - Get lessons filtered by level (Beginner/Intermediate/Advanced)
- GET /api/v1/quizzes - List all active quizzes
- GET /api/v1/quizzes/:id - Get quiz with questions
- GET /api/v1/quizzes/lesson/:lessonId - Get quizzes for a specific lesson
- POST /api/v1/quizzes/:id/submit - Submit quiz answers for scoring
- GET /api/v1/stats - Get platform statistics
- GET /api/v1/search - Search lessons and quizzes

## Subscription APIs
- GET /api/v1/subscription-plans - List all active plans (public, no auth)
- POST /api/v1/subscriptions - Register/renew subscription with Apple JWS token (auth required); body: { jws: string }
- GET /api/v1/subscriptions/me - Get current user's active/trial subscription or null (auth required)

## User Profile APIs (Require Authentication)
- GET /api/me - Get current user profile information

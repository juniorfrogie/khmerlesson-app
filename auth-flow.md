  Google Auth:
  1. GoogleAuthenticationServicePlatform().signIn() calls Google SDK
  2. On success → calls Authentication().registerWithAuthService(registrationType: 
  "google_service") → POST /auth/register-auth-service
  3. API saves session (token + user) via UserAuth().saveSession()
  4. If response is true → navigates to HomePage

  Apple Auth:
  1. SignInWithApple.getAppleIDCredential() gets the Apple credential
  2. Calls Authentication().verifyAppleToken(idToken: ...) → POST
  /auth/verify-apple-id-token (to get the user's email)
  3. Then calls Authentication().registerWithAuthService(registrationType: "apple_service")
  → POST /auth/register-auth-service
  4. API saves session → navigates to HomePage
  
  So Apple makes 2 API calls (verify token + register), while Google makes 1 (register).
  Both save the session token locally before navigating to HomePage. The backend
  /register-auth-service endpoint handles both new registrations and existing logins (it
  accepts 200 or 201 status codes).
# Architecture Overview

## Frontend
Mobile App:
- React Native + Expo
- Expo Router
- Zustand
- SQLite
- TypeScript

Admin Dashboard:
- Next.js
- TypeScript

Backend:
- Express.js
- PostgreSQL
- Drizzle ORM

---

## Mobile Folder Structure

src/
  features/
    courses/
    lessons/
    vocabulary/
    auth/
    purchases/

  shared/
    components/
    theme/
    hooks/
    utils/

  database/
  services/
  store/

---

## Data Flow

API -> Sync Service -> SQLite -> Zustand -> UI

---

## Offline Strategy

- Free lessons cached locally
- Premium lessons cached after purchase
- Guest users can access free content
- Premium access expires after 1 year
- Sync occurs when internet is available
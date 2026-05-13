# Offline Sync Strategy

## Goal

Allow free lessons to work offline after download.

Premium lessons:
- require authentication
- require active purchase

---

# Sync Flow

API
-> sync service
-> SQLite
-> Zustand
-> UI

---

# Cached Content

Store locally:
- courses
- lessons
- lesson sections
- quizzes

Optional:
- audio files

---

# Sync Rules

Guest users:
- can cache free lessons

Authenticated users:
- can cache purchased premium lessons

---

# Purchase Validation

Premium access expires after:
- 1 year

App should:
- revalidate purchases periodically
- remove expired premium access locally
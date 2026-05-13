# AI Workflow Rules

## General Rules
- Never modify unrelated files
- Never refactor existing architecture without permission
- Prefer reusable components
- Use feature-based architecture
- Keep components small and composable
- Use TypeScript strictly
- Avoid unnecessary abstractions
- Prioritize clean UI implementation first
- Mock data first before API integration

## Mobile Stack
- React Native + Expo
- Expo Router
- Zustand
- SQLite
- TypeScript

## Styling Rules
- Use centralized theme
- Reuse typography and spacing tokens
- Minimal clean UI
- Primary color: dark blue
- Avoid inline hardcoded colors

## Data Rules
- Use mock data during UI phase
- API integration comes later
- Store synced lessons in SQLite
- Free lessons accessible offline
- Premium lessons require authentication

## File Safety
- Only touch files related to current task
- Never rename folders unless requested
- Ask before changing architecture

## Feature Development Flow
1. Create UI
2. Add mock data
3. Add local state
4. Add SQLite persistence
5. Add API integration
6. Add sync handling

## Component Rules
- Shared UI components go in /shared/components
- Feature-specific components stay inside feature folder

## State Management
- Zustand store per feature when possible
- Avoid giant global stores

## Navigation
- Use Expo Router conventions

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` passes

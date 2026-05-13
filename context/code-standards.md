# Code Standards

## TypeScript
- No any types
- Use interfaces for API models
- Strong typing everywhere

## Components
- One component per file
- Keep files under 300 lines if possible

## Naming
- PascalCase for components
- camelCase for functions
- kebab-case for folders

## Zustand
- Keep stores feature-specific
- Avoid storing UI-only state globally

## SQLite
- Database logic separated into repository/services layer

## Styling
- Use theme tokens
- Avoid duplicated styles
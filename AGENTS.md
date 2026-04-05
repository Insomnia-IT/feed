# AGENTS.md - Coding Guidelines for AI Assistants

## Development Commands

### Root Monorepo

- **Install dependencies**: `npm install`
- **Build all packages**: `npm run build`
- **Lint all**: `npm run lint`
- **Fix linting**: `npm run lint-fix:js`
- **Run type checking**: `npm run tc`

## TypeScript/JavaScript Conventions

### Function Parameters

**Rule: If a function accepts more than 2 arguments, use an object with named fields instead of positional arguments.**

#### Bad (positional arguments):
```typescript
function createUser(name: string, age: number, email: string, role: string, isActive: boolean) {
    // ...
}
```

#### Good (object argument):
```typescript
function createUser(params: {
    name: string;
    age: number;
    email: string;
    role: string;
    isActive: boolean;
}) {
    // ...
}
```

This rule improves:
- **Readability**: Named parameters are self-documenting
- **Maintainability**: Adding new parameters doesn't require changing call sites
- **Type Safety**: Easier to validate and understand parameter shapes

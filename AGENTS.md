# AGENTS.md - Coding Guidelines for AI Assistants

## Development Commands

### Root Monorepo

- **Install dependencies**: `npm install`
- **Build all packages**: `npm run build`
- **Lint all**: `npm run lint`
- **Fix linting**: `npm run lint-fix:js`
- **Run type checking**: `npm run tc`

### Backend (Django)

- **Environment**: Use a virtual environment (`cd backend && python3 -m venv venv && . ./venv/bin/activate`)
- **Run server**: `python manage.py runserver localhost:8000` (from `backend/`)
- **Migrate DB**: `python manage.py migrate`
- **Create migrations**: `python manage.py makemigrations`
- **Load initial data**: `python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types`
- **Create initial user**: `python manage.py shell < create_user.py`

### Frontend (Admin & Scanner)

- **Admin Dev**: `cd packages/admin && npm run dev` (uses local backend)
- **Admin Dev (Stage)**: `cd packages/admin && npm run dev:stage` (uses stage backend)
- **Scanner Dev**: `cd packages/scanner && npm run dev`
- **Scanner Dev (Stage)**: `cd packages/scanner && npm run dev:stage`
- **Build package**: `npm run build` (within the package directory)

## Architecture & Structure

This is a monorepo for the "Insight/Feed" system, used for managing volunteers, their arrivals, and meal tracking (typically for the Insomnia festival).

### Project Layout

- `backend/`: Django application providing a REST API and admin interface.
    - `feeder/`: Main application logic, models, and views.
    - `config/`: Django project configuration.
- `packages/admin/`: React administrator dashboard built with the **Refine** framework and Ant Design.
    - `src/dataProvider.ts`: Custom Refine data provider for the Django API.
    - `src/authProvider.ts`: Authentication logic.
    - `src/acl.ts`: Access control definitions.
- `packages/scanner/`: React-based PWA for scanning volunteer QR codes at kitchens.
    - Uses `dexie` for local storage and offline capabilities.
    - Uses `qr-scanner` and `onscan.js` for input.
- `android/`: Native Android application wrapper/companion.

### Tech Stack Highlights

- **Backend**: Python/Django/SQLite (Dev)/PostgreSQL (Prod).
- **Frontend**: React, TypeScript, Vite (Admin), Craco/Webpack (Scanner), Refine (Admin framework).
- **Monorepo Tools**: Lerna and Nx for task orchestration.

### Key Models (Backend)

- `Volunteer`: Central entity with personal info, QR code, and status.
- `Arrival`/`Departure`: Tracks when volunteers are present on-site.
- `FeedTransaction`: Records of meals provided to volunteers/groups.
- `Direction`: Locations or services volunteers belong to.
- `Kitchen`: Feeding points.

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

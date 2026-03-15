# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (Python/Django)

```bash
# Set up virtual environment and install dependencies
cd backend
python3 -m venv venv
. ./venv/bin/activate
pip install -r requirements.txt

# Apply migrations and load initial fixtures
python manage.py migrate
python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types

# Create a test user (example)
python manage.py shell < create_user.py

# Run the development server
python manage.py runserver localhost:8000
```

#### Database migrations

```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

#### Running backend tests

The repository contains UI‑level tests under `tests/`. To run them:

```bash
# Install test requirements (run from repository root)
pip install -r tests/requirements.txt

# Run all pytest tests
python -m pytest

# Run a specific test file
python -m pytest tests/test_regress.py
```

#### Lint / Formatting (backend)

No explicit lint script is provided. Use standard Python tools (`ruff`, `flake8`, `black`) if desired.

### Frontend (JavaScript/TypeScript)

All frontend packages live under `packages/`. Install all JS dependencies once from the repo root:

```bash
npm install
```

#### Admin UI (`packages/admin`)

```bash
cd packages/admin
# Development server (local backend)
npm run dev

# Development server (stage backend)
npm run dev:stage

# Production build
npm run build

# Lint & auto‑fix JavaScript/TypeScript
npm run lint-fix:js

# Lint & auto‑fix CSS
npm run lint-fix:css
```

#### Scanner UI (`packages/scanner`)

```bash
cd packages/scanner
# Development server (local backend)
npm run dev

# Development server (stage backend)
npm run dev:stage

# Production build
npm run build

# Lint & auto‑fix JavaScript/TypeScript
npm run lint-fix:js

# Lint & auto‑fix CSS
npm run lint-fix:css
```

### Docker / Local Development

```bash
# Linux/macOS
./local-dev.sh      # builds and starts all services via docker-compose

# Windows (PowerShell)
.\local-dev.cmd
```

### Running UI Tests in Docker

```bash
./run_tests.sh   # pulls test Docker image and runs pytest with Selenium
```

## High‑Level Architecture Overview

```
repo/
├── backend/                 # Python/Django server
│   ├── config/              # Django settings, URL routing, OpenTelemetry config
│   ├── feeder/              # Core domain models, serializers, viewsets
│   ├── history/             # Model change‑history tracking
│   ├── synchronization/     # External system sync (Notion, AgreeMod, etc.)
│   ├── cron_tasks/          # Periodic jobs (python‑crontab)
│   └── manage.py            # Django CLI entry point
├── packages/
│   ├── admin/               # Admin UI – React + Refine + Ant Design
│   │   └── src/…            # Application source, Vite dev server
│   ├── scanner/             # Scanner UI – React (CRA) + Dexie, Workbox
│   │   └── src/…            # Application source, CRACO dev server
│   └── core/                # Shared tooling / utilities (mostly node_modules)
├── docs/
│   └── overview.md          # Technical overview (stack, component list)
├── tests/                   # Selenium + pytest UI regression tests
└── README.md                # Project‑level install & run instructions
```

### Backend Summary
- **Framework**: Django 5.x with Django REST Framework.
- **Authentication**: Token auth plus custom QR‑code and kitchen‑pin authenticators (`feeder/authentication.py`).
- **API**: Auto‑generated OpenAPI via `drf‑spectacular`; Swagger UI at `/feedapi/v1`.
- **Data**: SQLite by default (configurable via `DB_*` env vars); initial fixtures loaded on setup.
- **Observability**: OpenTelemetry instrumentation; optional Sentry integration.
- **Periodic Tasks**: Defined in `cron_tasks/` and scheduled via `python-crontab` (e.g., `auto_sync.py`).

### Frontend Summary
- **Admin**: Refine provides CRUD scaffolding on top of Ant Design. API base URL set via `VITE_NEW_API_URL_ENV`. Built with Vite.
- **Scanner**: QR‑code and barcode scanner (`qr-scanner`, `onscan.js`). Offline storage via Dexie (IndexedDB) and sync through Workbox service worker. Built with Create‑React‑App + CRACO.
- **Build System**: Vite for admin, CRACO (CRA) for scanner. TypeScript is primary language; linting via ESLint and Stylelint.

## Important Files & Entry Points

| Component | Path | Primary Entry |
|-----------|------|---------------|
| Django settings | `backend/config/settings.py` | `backend/manage.py` |
| API URLs | `backend/config/urls.py` | – |
| Admin UI entry | `packages/admin/src/main.tsx` (Vite) | `npm run dev` |
| Scanner UI entry | `packages/scanner/src/index.tsx` (CRA) | `npm run dev` |
| UI tests | `tests/` | `python -m pytest` |
| Docker compose for dev | `docker-compose.yml` (repo root) | `./local-dev.sh` |

## Linting / Code Quality

- **Frontend**: `npm run lint-fix:js` (ESLint) and `npm run lint-fix:css` (Stylelint) automatically fix most issues.
- **Backend**: No built‑in lint script; use standard Python linters (`ruff`, `flake8`, `black`) as needed.

## Running a Single Test

```bash
# From the repository root
python -m pytest tests/test_regress.py::TestClass::test_name
```

Or, using the Docker test runner:

```bash
./run_tests.sh tests/test_regress.py
```

---

*This CLAUDE.md gives Claude Code concise, actionable knowledge about the repository’s structure, common commands, and key entry points, without repeating generic development advice already present elsewhere.*
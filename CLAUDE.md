# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The repository is a **monorepo** that contains:

* **Backend** – a Django project located in `backend/` (Python 3.10, virtualenv).
* **Frontend packages** – two React‑based applications under `packages/`:
  * `admin` – the main UI (`@feed/admin`) built with Vite, Ant Design Mobile, Refine, and React 18.
  * `scanner` – a QR‑code scanner UI (`@feed/scanner`) built with Vite, React 18, Dexie (IndexedDB), and Workbox (PWA support).
* **Build orchestration** – `npm` workspaces (`packages/*`), **Lerna**, **Nx**, and **husky** for Git hooks.
* **CI/CD** – GitHub Actions in `.github/workflows/` for linting, tests, and deployment.

The codebase follows a clear separation: the backend is a pure Python/Django service exposing a REST API, while the frontend packages are pure JavaScript/TypeScript applications that consume that API.

## Common Commands (run from the repository root)

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies (runs `npm ci` for reproducible builds). |
| `npm run bootstrap` | Alias for `npm ci`; ensures a clean install. |
| `npm run build` | Build both `admin` and `scanner` for production (`lerna run build`). |
| `npm run build:since` | Incremental build of affected packages (Nx). |
| `npm run dep` | Open the Nx dependency graph (visual overview of package relationships). |
| `npm run lint` | Run all linting (`lint:js`, `lint:css`, `lint:ts`). |
| `npm run lint-fix` | Auto‑fix lint errors where possible. |
| `npm run lint:js` | ESLint for JavaScript/TypeScript. |
| `npm run lint-fix:js` | ESLint with `--fix`. |
| `npm run lint:css` | Stylelint for CSS/SCSS/LESS files. |
| `npm run lint-fix:css` | Stylelint with `--fix`. |
| `npm run lint:ts` | Run TypeScript type‑checking (`lerna run tc`). |
| `npm run tc` | Alias for TypeScript compiler check (`npm run lint:ts`). |
| `npm run todo` | Generate a TODO list from source comments (`leasot`). |
| `npm run stat` | Code statistics via `tokei`. |
| `npm run madge` | Visualize module dependency circles (`madge`). |
| `npm run bl` | Update Browserslist database (`npx update-browserslist-db`). |
| `npm run prepare` | Install Husky Git hooks (run automatically after install). |

### Package‑specific dev commands

* **Admin (`packages/admin`)**
  * `cd packages/admin && npm run dev` – start Vite dev server (local API: `http://localhost:8000/feedapi/v1`).
  * `npm run dev:stage` – dev server against the staging backend.
  * `npm run build` – TypeScript compile + Vite production build.

* **Scanner (`packages/scanner`)**
  * `cd packages/scanner && npm run dev` – start Vite dev server on port 3001.
  * `npm run dev:stage` – dev server against the staging backend.
  * `npm run build` – TypeScript compile + Vite production build.

### Backend commands (run inside `backend/`)

```bash
# activate virtualenv
. ./venv/bin/activate # on Windows: .\venv\Scripts\activate

# Install Python deps
pip install -r requirements.txt

# DB migrations & seed data
python manage.py migrate
python manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
python manage.py shell < create_user.py

# Run development server
python manage.py runserver localhost:8000
```

## High‑Level Architecture

```
repo/
 ├─ backend/                # Django REST API
 │   ├─ manage.py
 │   └─ (Django apps, migrations, .env)
 ├─ packages/
 │   ├─ admin/              # Vite + React UI
 │   │   ├─ src/
 │   │   └─ vite.config.ts
 │   └─ scanner/            # Vite + React UI + Workbox PWA
 │       ├─ src/
 │       └─ vite.config.ts
 ├─ package.json           # Root npm workspaces, Lerna/Nx orchestration
 ├─ nx.json                # Nx task runner config (caching, parallelism)
 ├─ .github/               # CI workflows (lint, tests, deploy)
 └─ other tooling (Docker, .gitignore, etc.)
```

* **Monorepo tooling** – `npm` workspaces define the package boundaries; `lerna` provides script propagation across packages; `nx` adds intelligent task caching and affected‑project detection.
* **Frontend stack** – both apps use Vite for fast dev builds and ESBuild for production bundling.
  * `admin` leverages **Refine**, **Ant Design Mobile**, and **React‑Query‑style** data fetching.
  * `scanner` uses **Dexie** for offline data storage, **onscan.js** & **qr-scanner** for barcode processing, and **Workbox** for service‑worker caching.
* **Backend** – standard Django project with `dj_rest_auth` for authentication and a set of domain models (colors, feed types, etc.). The API is versioned under `/feedapi/v1/`.
* **Environment separation** – API URLs are injected via environment variables (`VITE_NEW_API_URL_ENV` for admin, `CLIENT_ENV` for scanner). The README describes the required `.env` files for both backend and frontend.
* **CI/CD** – GitHub Actions run linting (`npm run lint`), TypeScript checks, and Jest tests (if present). Deploy workflows target staging and production environments.

## Handy References

* **Root README** – installation steps for Node, backend, and Docker (`README.md`).
* **Package READMEs** – each package inherits the root scripts; custom scripts are listed in their respective `package.json`.
* **Nx docs** – `nx graph` (run via `npm run dep`) visualizes dependencies.
* **Lerna docs** – `lerna run <script>` executes a script across all workspaces.

## Suggested Workflow for Claude Code

1. **Setup** – follow the root README to install Node (≥ 18) and Python (3.10) dependencies.
2. **Run lint** – `npm run lint` ensures code quality before making changes.
3. **Develop** – start the relevant dev server (`npm run dev` in `admin` or `scanner`).
4. **Build** – use `npm run build` for a production bundle; verify with `npm run build:since` for incremental builds.
5. **Backend** – activate the virtualenv, run migrations, and start the Django server.
6. **CI** – rely on the existing GitHub Actions; local lint and type‑checking mimic CI steps.

---

*This file is intended for Claude Code to quickly locate common tooling commands and understand the repository’s structure without enumerating every file.*
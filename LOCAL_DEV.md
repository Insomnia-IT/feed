# Local development (MacOS)

## Prerequisites

- **Python 3.10+** (required for Django 5). Your system has Python 3.8; install a newer version:

  ```bash
  # Option A: Homebrew (fix permissions if needed: sudo chown -R $(whoami) /usr/local/Cellar /usr/local/Homebrew ...)
  brew install python@3.12
  brew link python@3.12

  # Option B: Installer from https://www.python.org/downloads/
  ```

- Node.js (for the admin frontend)

## One-command run

After Python 3.10+ is available:

```bash
./run-local.sh
```

This will: create backend venv, copy `.env`, install deps, migrate, load fixtures, create admin user, start backend on **http://localhost:8000** and admin on **http://localhost:3002**. Login: **admin** / **Kolombina25**.

**If the script says the app is on 3003, 3007, etc.** — something else is already using 3002. Stop it, then run again:
```bash
# Free ports 3002 and 8000 (Mac/Linux):
for port in 3002 8000; do lsof -ti :$port | xargs kill -9 2>/dev/null; done
./run-local.sh
```
Then open **http://localhost:3002** only; your edits will hot-reload there and the table will load from the backend.

## Manual run

### Backend

```bash
cd backend
cp .env.sample .env
python3.12 -m venv venv   # or python3 if it’s 3.10+
. ./venv/bin/activate
pip install -r requirements.txt
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types
./manage.py shell < create_user.py
./manage.py runserver localhost:8000
```

### Frontend (with local backend)

```bash
cd packages/admin
npm run dev
```

Open http://localhost:3002 and log in with **admin** / **Kolombina25**.

## If your changes don’t appear in the browser

You might be looking at a **different version** of the app than the one you’re editing.

1. **Use the dev server, not the built app**
   - Run **`npm run dev`** in `packages/admin` (or use `./run-local.sh`). That serves the live source from **http://localhost:3002**.
   - Do **not** use **`npm run preview`**: it serves the **production build** from `dist/`. That bundle only updates when you run `npm run build`, so edits to source won’t show until you build again.

2. **Use the correct URL**
   - Admin UI (the one you edit) = **http://localhost:3002**
   - Backend API + Django admin = **http://localhost:8000** (different app; don’t use this for the React admin).

3. **Check which port is actually open**
   - In the terminal where you ran `npm run dev`, confirm it says something like `Local: http://localhost:3002`. If the port changed (e.g. 3003 because 3002 was busy), open that URL instead.

4. **One dev server at a time**
   - If you start the frontend both via `./run-local.sh` and manually in another terminal, you get two processes. Edit in one place but open the other tab = no visible changes. Use a single way to run (e.g. only `./run-local.sh` or only `cd packages/admin && npm run dev`).

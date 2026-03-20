#!/usr/bin/env bash
# Run backend + admin frontend locally (MacOS/Linux).
# Uses project .pyenv Python 3.12 if present, or system Python 3.10+.

set -e
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

# Find Python 3.10+ (project .pyenv first, then PATH)
PYTHON=
if [ -d "$REPO_ROOT/.pyenv/versions" ]; then
  for py in "$REPO_ROOT"/.pyenv/versions/3.*/bin/python; do
    [ -x "$py" ] && PYTHON="$py" && break
  done
fi
if [ -z "$PYTHON" ]; then
  for p in python3.12 python3.11 python3.10 python3; do
    if command -v "$p" &>/dev/null; then
      ver=$("$p" -c 'import sys; print(sys.version_info >= (3,10))' 2>/dev/null || echo "False")
      if [ "$ver" = "True" ]; then
        PYTHON="$p"
        break
      fi
    fi
  done
fi
if [ -z "$PYTHON" ]; then
  echo "Python 3.10+ is required (Django 5). Run: PYENV_ROOT=$REPO_ROOT/.pyenv $REPO_ROOT/.pyenv/bin/pyenv install 3.12"
  exit 1
fi
echo "Using: $($PYTHON --version)"

# Backend setup
cd "$REPO_ROOT/backend"
[ ! -f .env ] && cp .env.sample .env && echo "Created backend/.env"
[ ! -d venv ] && $PYTHON -m venv venv && echo "Created venv"
. ./venv/bin/activate
pip install -q -r requirements.txt
mkdir -p ../db
./manage.py migrate
./manage.py loaddata colors feed_types kitchens access_roles volunteer_roles engagement_roles transports genders statuses direction_types 2>/dev/null || true
./manage.py shell < create_user.py 2>/dev/null || true
echo "Backend ready. Starting server on http://localhost:8000"
./manage.py runserver localhost:8000 &
BACKEND_PID=$!
cd "$REPO_ROOT"

# Frontend
cd packages/admin
npm run dev &
FRONTEND_PID=$!
cd "$REPO_ROOT"

echo "Backend PID: $BACKEND_PID  Frontend PID: $FRONTEND_PID"
echo "Admin UI: http://localhost:3002  (or port shown above)"
echo "Login: admin / Kolombina25"
echo "Press Ctrl+C to stop both."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait

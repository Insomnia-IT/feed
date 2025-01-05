# syntax=docker/dockerfile:experimental

FROM node:18-alpine as base

# ENV NODE_ENV=development
ENV husky_skip_init="1"
ENV HUSKY_DEBUG="1"
#ENV NODE_OPTIONS="--max_old_space_size=4000 --openssl-legacy-provider"
ENV NODE_OPTIONS="--max_old_space_size=4000"

#TODO review env varables

ARG HOST
ENV HOST=${HOST}

ARG CI
ENV CI_ENV=${CI}

WORKDIR /app

FROM base as builder

RUN apk add --no-cache curl python3
RUN curl -sf https://gobinaries.com/tj/node-prune | sh
RUN echo "npm cache clean --force && node-prune" > /usr/local/bin/node-clean && chmod +x /usr/local/bin/node-clean

RUN apk add --no-cache build-base libffi-dev icu-dev sqlite-dev

COPY nginx.conf /app/

ARG NEW_API_URL
ENV VITE_NEW_API_URL_ENV=${NEW_API_URL}
ENV REACT_APP_NEW_API_URL_ENV=${NEW_API_URL}

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

COPY ./packages/admin/package.json /app/packages/admin/package.json
COPY ./packages/scanner/package.json /app/packages/scanner/package.json

RUN --mount=type=cache,sharing=locked,target=/root/.npm \
    npm ci

COPY ./backend/icu/icu.c /app/backend/icu/
RUN gcc -fPIC -shared backend/icu/icu.c `pkg-config --libs --cflags icu-uc icu-io` -o backend/icu/libSqliteIcu.so
RUN ls -1al /app/backend/icu

COPY . /app

RUN echo $(date +"%Y-%m-%dT%H:%M:%S") > /app/pwa-ver.txt

RUN --mount=type=cache,sharing=locked,target=/root/.npm \
    npm run build

# RUN npm prune --production

# RUN /usr/local/bin/node-clean

FROM base as runner

EXPOSE 3000
EXPOSE 80

RUN apk add --no-cache nginx python3 py3-pip tzdata curl
RUN apk add --no-cache icu-dev
COPY nginx.conf /etc/nginx/nginx.conf

ARG NEW_API_URL
ENV NEW_API_URL_ENV=${NEW_API_URL}
ENV REACT_APP_NEW_API_URL_ENV=${NEW_API_URL}
ARG ADMIN_BASE_PATH
ENV ADMIN_BASE_PATH_ENV=${ADMIN_BASE_PATH}

COPY --from=builder /app/entry.sh /app

COPY --from=builder /app/postcss.config.js /app/
COPY --from=builder /app/tsconfig.json /app/
COPY --from=builder /app/tsconfig.paths.json /app/
COPY --from=builder /app/package.json /app/

COPY --from=builder /app/packages/core/package.json /app/packages/core/
COPY --from=builder /app/packages/core/webpack/ /app/packages/core/webpack/

COPY --from=builder /app/packages/admin/dist/ /app/packages/admin/dist/

COPY --from=builder /app/packages/scanner/package.json /app/packages/scanner/
COPY --from=builder /app/packages/scanner/build/ /app/packages/scanner/build/

COPY --from=builder /app/nginx.conf /etc
COPY --from=builder /app/backend/icu/libSqliteIcu.so /app/backend/icu/
RUN ls -1al /app/backend/icu

# jango backend
WORKDIR /app

RUN mkdir backend/logs/ backend/data/

ENV PYTHONUNBUFFERED 1

ARG ENABLE_SYNC_TO_NOTION
ENV IS_SYNC_TO_NOTION_ON=${ENABLE_SYNC_TO_NOTION}

COPY ./backend/requirements.txt /app/backend

RUN --mount=type=cache,target=/root/.cache/pip \
    cd backend && pip install --break-system-packages -r requirements.txt

COPY ./backend/config /app/backend/config
COPY ./backend/feeder /app/backend/feeder
COPY ./backend/history /app/backend/history
COPY ./backend/synchronization /app/backend/synchronization
COPY ./backend/initial /app/backend/initial
COPY ./backend/.gitignore /app/backend/
COPY ./backend/manage.py /app/backend/
COPY ./backend/create_user.py /app/backend/
COPY ./backend/cron_tasks /app/cron_tasks
COPY ./backend/cron_config.py /app/backend/
COPY ./backend/.env.sample /app/backend/.env

ARG SYNC_URL
ENV SYNCHRONIZATION_URL=${SYNC_URL}

ARG SYNC_LOGIN
ENV SYNCHRONIZATION_LOGIN=${SYNC_LOGIN}

ARG SYNC_PASSWORD
ENV SYNCHRONIZATION_PASSWORD=${SYNC_PASSWORD}

ENTRYPOINT ["/app/entry.sh"]

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
RUN echo "yarn cache clean --force && node-prune" > /usr/local/bin/node-clean && chmod +x /usr/local/bin/node-clean

RUN apk add --no-cache build-base libffi-dev icu-dev sqlite-dev
COPY ./packages/api/icu/icu.c /app/packages/api/icu/
RUN gcc -fPIC -shared packages/api/icu/icu.c `pkg-config --libs --cflags icu-uc icu-io` -o packages/api/icu/libSqliteIcu.so
RUN ls -1al /app/packages/api/icu

ENV YARN_CACHE_FOLDER=/root/.yarn
COPY nginx.conf /app/

ARG API_URL
ARG NEW_API_URL
ENV API_URL_ENV=${API_URL}
ENV NEW_API_URL_ENV=${NEW_API_URL}
ENV REACT_APP_NEW_API_URL_ENV=${NEW_API_URL}

COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

COPY ./packages/admin/package.json /app/packages/admin/package.json
COPY ./packages/admin/next-i18next.config.mjs /app/packages/admin/next-i18next.config.mjs
COPY ./packages/admin/next.config.mjs /app/packages/admin/next.config.mjs
COPY ./packages/api/package.json /app/packages/api/package.json
COPY ./packages/core/package.json /app/packages/core/package.json
COPY ./packages/ui/package.json /app/packages/ui/package.json
COPY ./packages/scanner/package.json /app/packages/scanner/package.json

RUN --mount=type=cache,sharing=locked,target=/root/.yarn \
    yarn --frozen-lockfile

COPY . /app

RUN echo $(date +"%Y-%m-%dT%H:%M:%S") > /app/pwa-ver.txt

RUN --mount=type=cache,sharing=locked,target=/root/.yarn \
    yarn build

# RUN yarn --prod --frozen-lockfile

# RUN /usr/local/bin/node-clean


FROM base as runner

EXPOSE 3000
EXPOSE 4301
EXPOSE 80

RUN apk add --no-cache nginx python3 py3-pip tzdata curl
COPY nginx.conf /etc/nginx/nginx.conf

ARG API_URL
ARG NEW_API_URL
ENV API_URL_ENV=${API_URL}
ENV NEW_API_URL_ENV=${NEW_API_URL}
ENV REACT_APP_NEW_API_URL_ENV=${NEW_API_URL}
ARG ADMIN_BASE_PATH
ENV ADMIN_BASE_PATH_ENV=${ADMIN_BASE_PATH}

COPY --from=builder /app/entry.sh /app

COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/postcss.config.js /app/
COPY --from=builder /app/tsconfig.json /app/
COPY --from=builder /app/tsconfig.paths.json /app/
COPY --from=builder /app/package.json /app/

COPY --from=builder /app/packages/api/.env.example /app/packages/api/.env
COPY --from=builder /app/packages/api/package.json /app/packages/api/
COPY --from=builder /app/packages/api/dist/ /app/packages/api/dist/
COPY --from=builder /app/packages/api/tsconfig.json /app/packages/api/
COPY --from=builder /app/packages/api/seed.js /app/packages/api/

COPY --from=builder /app/packages/core/package.json /app/packages/core/
COPY --from=builder /app/packages/core/webpack/ /app/packages/core/webpack/

COPY --from=builder /app/packages/admin/next-i18next.config.mjs /app/packages/admin/
COPY --from=builder /app/packages/admin/next.config.mjs /app/packages/admin/
COPY --from=builder /app/packages/admin/.next/ /app/packages/admin/.next/
COPY --from=builder /app/packages/admin/public/ /app/packages/admin/public/

COPY --from=builder /app/packages/ui/package.json /app/packages/ui/

COPY --from=builder /app/packages/scanner/package.json /app/packages/scanner/
COPY --from=builder /app/packages/scanner/build/ /app/packages/scanner/build/

COPY --from=builder /app/nginx.conf /etc

# jango backend
WORKDIR /app

COPY ./backend/icu/icu.c /app/backend/icu/
RUN gcc -fPIC -shared backend/icu/icu.c `pkg-config --libs --cflags icu-uc icu-io` -o backend/icu/libSqliteIcu.so
RUN ls -1al app/backend/icu

RUN mkdir backend/ backend/logs/ backend/data/

ENV PYTHONUNBUFFERED 1

ARG ENABLE_SYNC_TO_NOTION
ENV IS_SYNC_TO_NOTION_ON=${ENABLE_SYNC_TO_NOTION}

COPY ./backend/requirements.txt /app/backend
RUN --mount=type=cache,target=/root/.cache/pip \
    cd backend && pip install -r requirements.txt

COPY ./backend/config /app/backend/config
COPY ./backend/feeder /app/backend/feeder
COPY ./backend/initial /app/backend/initial
COPY ./backend/.gitignore /app/backend/
COPY ./backend/manage.py /app/backend/
COPY ./backend/create_user.py /app/backend/
COPY ./backend/.env.sample /app/backend/.env

ENTRYPOINT ["/app/entry.sh"]

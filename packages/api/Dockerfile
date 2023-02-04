FROM node:18-alpine as base

ENV TZ=Europe/Moscow

EXPOSE 4000

WORKDIR /app

ENV LANG ru_RU.UTF-8
ENV LANGUAGE ru_RU:ru
ENV LC_ALL ru_RU.UTF-8

RUN apk add --no-cache build-base libffi-dev icu-dev sqlite-dev

COPY icu/icu.c /app/icu/

RUN gcc -fPIC -shared icu/icu.c `pkg-config --libs --cflags icu-uc icu-io` -o icu/libSqliteIcu.so

RUN ls -1al /app/icu/

ENV NODE_ENV=development
ENV YARN_CACHE_FOLDER=/root/.yarn

FROM base as builder

COPY package.json /app/
COPY ../../yarn.lock /app/
RUN yarn --production=false --frozen-lockfile
RUN yarn build
RUN yarn --production=true --frozen-lockfile

RUN /usr/local/bin/node-clean

COPY . /app

CMD '/app/docker-entry.sh'

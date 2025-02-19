FROM node:18-alpine as base

WORKDIR /app

FROM base as runner

EXPOSE 80

RUN apk add --no-cache nginx

COPY ./nginx.conf /etc/nginx/nginx.conf

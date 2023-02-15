#!/bin/sh

cd /app/packages/api
yarn run db:seed
ls -1al /app/packages/api/_db
PORT=4262 /app/node_modules/.bin/nest start &

cd /app/packages/admin
PORT=4301 /app/node_modules/.bin/next start &

nginx

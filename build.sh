mkdir ./feeddb
docker rm -f admin
docker compose build \
    --build-arg NEW_API_URL=http://localhost:8888/feedapi/v1 \
    --build-arg SYNC_URL=https://agreemod-dev.insomniafest.ru/api/v1/feeder/

DB_DIR=./feeddb SKIP_BACK_SYNC=True PORT=8888 docker compose up -d --remove-orphans

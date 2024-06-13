FROM python:3.9.9-slim


RUN apt-get update && apt-get install gnupg2 curl -y

RUN apt-get update
RUN apt-get install nano net-tools inetutils-ping mc build-essential python3-dev libsasl2-dev python-dev \
    libssl-dev postgresql-client -y  && \
    pip install --upgrade pip

RUN apt-get install -y cron

WORKDIR /app
copy . .

#COPY requirements.txt /app

RUN mkdir logs/ data/

ENV PYTHONUNBUFFERED 1

RUN apt-get install libicu-dev libsqlite3-dev -y
#COPY ./icu/icu.c /app/icu/
RUN gcc -fPIC -shared icu/icu.c -licui18n -licuuc -licudata -L/usr/local/lib -o icu/libSqliteIcu.so

RUN pip install -r requirements.txt --no-cache-dir

#COPY ./config /app/config
#COPY ./feeder /app/feeder
#COPY ./.gitignore /app/
#COPY ./manage.py /app/
#COPY ./Dockerfile /app/
#COPY ./docker-compose.yaml /app/
#COPY ./.env /app/
#COPY ./create_user.py /app/
#COPY ./initial /app/initial

EXPOSE 8000

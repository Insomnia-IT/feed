FROM python:3.9.9-slim


RUN apt-get update && apt-get install gnupg2 curl -y

RUN apt-get update
RUN apt-get install nano net-tools inetutils-ping mc build-essential python3-dev libsasl2-dev python-dev \
    libssl-dev postgresql-client -y  && \
    pip install --upgrade pip

WORKDIR /app

COPY requirements.txt /app

RUN mkdir logs/ data/

ENV PYTHONUNBUFFERED 1

RUN pip install -r requirements.txt --no-cache-dir

COPY ./config /app/config
COPY ./feeder /app/feeder
COPY ./.gitignore /app/
COPY ./manage.py /app/
COPY ./Dockerfile /app/
COPY ./docker-compose.yaml /app/
COPY ./.env.sample /app/

EXPOSE 8000

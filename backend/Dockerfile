FROM python:3.10.11-slim

RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    nano \
    net-tools \
    inetutils-ping \
    mc \
    build-essential \
    python3-dev \
    libsasl2-dev \
    libssl-dev \
    cron \
    libicu-dev \
    libsqlite3-dev \
    && pip install --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt --no-cache-dir
RUN pip install debugpy

COPY icu/ ./icu/

RUN mkdir logs/ data/

ENV PYTHONUNBUFFERED 1

EXPOSE 8000
EXPOSE 5678

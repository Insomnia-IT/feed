FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app

RUN pip install -r requirements.txt
RUN python -m playwright install --with-deps chromium

# Not really needed
RUN apt-get update -y
RUN apt-get install -y iputils-ping

COPY ./*.py /app

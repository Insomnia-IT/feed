#!/bin/bash

NAME=yclins-client

docker build -t $NAME .
docker rm -f $NAME
docker run --restart=always --network=apps -d -p 9000:80 --name $NAME $NAME

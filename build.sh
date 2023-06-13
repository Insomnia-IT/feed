mkdir ~/feeddb
docker rm -f admin
docker build \
    --progress=plain \
    --build-arg API_URL=http://localhost:8080/oldapi \
    --build-arg NEW_API_URL=http://localhost:4000/feedapi/v1 \
    -t admin \
    .
docker run -it --name admin -p 4301:4301 -p 4262:4262 -p 8888:80 -v ~/feeddb:/app/db admin

mkdir ~/feeddb
docker rm -f admin
docker build \
    --progress=plain \
    --build-arg NEW_API_URL=http://localhost:4000/feedapi/v1 \
    -t admin \
    .
docker run -it --name admin -p 8888:80 -v ~/feeddb:/app/db admin

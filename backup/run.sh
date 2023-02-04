NAME=feed-db-backup
WD=/root/feeddb/

echo $WD

docker rm -f $NAME
docker build -t $NAME .
docker run -d --restart=always -v ${WD}/db:/db --name $NAME $NAME

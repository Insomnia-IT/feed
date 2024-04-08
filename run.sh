./run-admin.sh &
pid_admin=$!
./run-server.sh

wait $pid_admin

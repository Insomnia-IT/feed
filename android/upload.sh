echo 'uploading debug...'
/opt/ydcmd/ydcmd.py --token=${YA_DISK_TOKEN} put /upload/app-debug.apk /ins/
echo 'uploading release...'
/opt/ydcmd/ydcmd.py --token=${YA_DISK_TOKEN} put /upload/app-release-unsigned.apk /ins/
echo 'DONE'

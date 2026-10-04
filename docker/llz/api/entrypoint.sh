#!/bin/sh
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p /data/mail-outbox
  if [ ! -f /data/laden.db ]; then
    cp /seed/laden.db /data/laden.db
  fi
  chown -R labz:labz /data
  exec su -s /bin/sh labz -c 'exec python3 /app/server.py'
fi
exec python3 /app/server.py

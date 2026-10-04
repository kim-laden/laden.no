#!/bin/sh
set -e
if [ ! -f /usr/share/nginx/html/.seeded ]; then
  mkdir -p /usr/share/nginx/html
  cp -a /seed/html/. /usr/share/nginx/html/
  touch /usr/share/nginx/html/.seeded
fi
exec /docker-entrypoint.sh nginx -g 'daemon off;'

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY html/ /seed/html/
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh \
    && sed -i 's/listen       80;/listen 8080;/' /etc/nginx/conf.d/default.conf || true
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]

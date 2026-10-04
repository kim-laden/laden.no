FROM python:3.13-slim-bookworm
RUN pip install --no-cache-dir "bcrypt==5.0.0" "PyJWT==2.10.1" \
    && useradd --uid 1000 --home-dir /home/labz --create-home --shell /usr/sbin/nologin labz
WORKDIR /app
COPY server.py schema.sql /app/
COPY seed/laden.db /seed/laden.db
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh && chown -R labz:labz /app /seed
ENV LADEN_DB=/data/laden.db \
    LADEN_HOST=0.0.0.0 \
    LADEN_PORT=18790 \
    LADEN_PUBLIC_PREFIX=/labs/api \
    LADEN_MAIL_OUTBOX=/data/mail-outbox \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 18790
ENTRYPOINT ["/entrypoint.sh"]

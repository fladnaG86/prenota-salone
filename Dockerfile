FROM python:3.12-slim

# No build dependencies needed: the backend is pure Python standard library.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    BARBERIA_HOST=0.0.0.0 \
    BARBERIA_PORT=8899 \
    BARBERIA_DB_PATH=/data/bookings.db \
    BARBERIA_LOG_PATH=stdout

WORKDIR /app

# Runtime files only (see .dockerignore).
COPY srv.py panel_hash.py index.html app.js panel.html privacy.html ./
COPY salons.json panel_users.json ./
COPY og ./og

# Run as a non-root user; keep app files read-only, put all state in /data.
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /data \
    && chown -R 10001:0 /data \
    && chmod -R a-w /app

USER 10001

VOLUME ["/data"]
EXPOSE 8899

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request as u,sys; sys.exit(0 if u.urlopen('http://127.0.0.1:8899/salon?slug=demo',timeout=3).status==200 else 1)" || exit 1

CMD ["python3", "srv.py"]

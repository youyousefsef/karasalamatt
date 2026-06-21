FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev


FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    adduser --disabled-password --gecos "" appuser

WORKDIR /app

COPY --from=builder /app/.venv ./.venv

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8001

CMD ["sh", "-c", "python seed_admin.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
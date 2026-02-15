# ---------- STAGE 1: build ----------
FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Se pip.ini existir (Nexus corporativo), copia; senao usa PyPI padrao
COPY requirements.txt .
RUN if [ -f pip.ini ]; then cp pip.ini /etc/pip.conf; fi

RUN pip install --upgrade pip \
    && pip wheel --no-cache-dir -r requirements.txt -w /wheels


# ---------- STAGE 2: runtime ----------
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

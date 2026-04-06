FROM node:22-alpine

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git make python3 postgresql-dev gcc musl-dev \
    && corepack enable \
    && corepack prepare pnpm@10.33.0 --activate

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /workspaces/hookdiff

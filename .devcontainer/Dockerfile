FROM node:22-alpine

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git make \
    && corepack enable \
    && corepack prepare pnpm@10.33.0 --activate

WORKDIR /workspaces/hookdiff

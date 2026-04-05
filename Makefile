.PHONY: help dev test build check format install

help:
	@echo "hookdiff — available make targets:"
	@echo "  make dev      start the frontend dev server"
	@echo "  make test     run frontend tests once"
	@echo "  make build    build the frontend for production"
	@echo "  make check    run biome lint + format check"
	@echo "  make format   auto-fix biome lint + format issues"
	@echo "  make install  install frontend dependencies"

dev:
	pnpm --dir frontend dev

test:
	pnpm --dir frontend test:run

build:
	pnpm --dir frontend build

check:
	pnpm --dir frontend check

format:
	pnpm --dir frontend format

install:
	pnpm --dir frontend install

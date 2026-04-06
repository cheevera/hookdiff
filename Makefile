.PHONY: help dev dev-front dev-back test test-back coverage coverage-back build check check-front check-back format format-front format-back install migrate

help:
	@echo "hookdiff — available make targets:"
	@echo ""
	@echo "  Frontend:"
	@echo "    make dev-front    start the Vite dev server on port 5173"
	@echo "    make test         run frontend tests once"
	@echo "    make coverage     run frontend tests with coverage gate"
	@echo "    make build        build the frontend for production"
	@echo "    make check-front  run biome lint + format check"
	@echo "    make format-front auto-fix biome lint + format issues"
	@echo "    make install      install frontend dependencies"
	@echo ""
	@echo "  Backend:"
	@echo "    make dev-back      start Django dev server via Daphne on port 8000"
	@echo "    make test-back     run backend tests once"
	@echo "    make coverage-back run backend tests with coverage gate"
	@echo "    make check-back    run ruff lint + format check"
	@echo "    make format-back   auto-fix ruff lint + format issues"
	@echo "    make migrate       run Django migrations"
	@echo ""
	@echo "  Combined:"
	@echo "    make dev           start frontend + backend concurrently"
	@echo "    make check         run biome + ruff checks"
	@echo "    make format        run biome + ruff fixes"

# Frontend
dev-front:
	pnpm --dir frontend dev

test:
	pnpm --dir frontend test:run

coverage:
	pnpm --dir frontend test:coverage

build:
	pnpm --dir frontend build

check-front:
	pnpm --dir frontend check

format-front:
	pnpm --dir frontend format

install:
	pnpm --dir frontend install

# Backend
dev-back:
	cd backend && uv run daphne -b 0.0.0.0 -p 8000 hookdiff.asgi:application

test-back:
	cd backend && uv run pytest

coverage-back:
	cd backend && uv run pytest --cov --cov-report=term-missing --cov-fail-under=100

check-back:
	cd backend && uv run ruff check . && uv run ruff format --check .

format-back:
	cd backend && uv run ruff check --fix . && uv run ruff format .

migrate:
	cd backend && uv run python manage.py migrate

# Combined
dev:
	pnpm --dir frontend exec concurrently --kill-others --names "front,back" --prefix-colors "cyan,magenta" "make -C $(CURDIR) dev-front" "make -C $(CURDIR) dev-back"

check: check-front check-back

format: format-front format-back

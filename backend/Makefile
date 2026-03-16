IMAGE_NAME  = dai-app-backend
IMAGE_TAG   = latest
PORT        = 8001

.PHONY: help install dev migrate build run stop logs clean

help:
	@echo ""
	@echo "  LOCAL"
	@echo "  -----"
	@echo "  make install    Install dependencies with uv"
	@echo "  make dev        Run dev server locally (port $(PORT), hot-reload)"
	@echo "  make migrate    Run alembic migrations (local venv)"
	@echo ""
	@echo "  DOCKER"
	@echo "  ------"
	@echo "  make build      Build Docker image  →  $(IMAGE_NAME):$(IMAGE_TAG)"
	@echo "  make run        Run via docker-compose (image must be built first)"
	@echo "  make stop       Stop docker-compose services"
	@echo "  make logs       Tail docker-compose logs"
	@echo "  make clean      Remove Docker image"
	@echo ""

# ─── local ────────────────────────────────────────────────────────────────────

install:
	uv sync

dev:
	uv run uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload

migrate:
	uv run alembic upgrade head

# ─── docker ───────────────────────────────────────────────────────────────────

build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

run:
	docker compose up -d

stop:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG)

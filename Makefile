.PHONY: dev logs down build

dev:
	docker compose up --build -d

logs:
	docker compose logs -f

down:
	docker compose down

build:
	docker compose build

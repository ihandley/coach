.PHONY: help install test typecheck dev build start session-start

help:
	@echo "Available commands:"
	@echo "  make install            Install dependencies"
	@echo "  make test               Run workspace tests"
	@echo "  make typecheck          Run workspace typecheck"
	@echo "  make dev                Start the web app dev server"
	@echo "  make build              Build the web app"
	@echo "  make start              Start the built web app"
	@echo "  make session-start N=44 Start a new issue session"

install:
	pnpm install

test:
	pnpm --filter @coach/core exec vitest run
	pnpm --filter @coach/db exec vitest run
	pnpm --filter job-coach-web exec vitest run

typecheck:
	pnpm --filter @coach/core typecheck
	pnpm --filter @coach/db typecheck
	pnpm --filter job-coach-web typecheck

dev:
	pnpm --filter job-coach-web dev

build:
	pnpm --filter job-coach-web build

start:
	pnpm --filter job-coach-web start

session-start:
	@test -n "$(N)" || (echo "Usage: make session-start N=<issue-number>" && exit 1)
	./scripts/session-start.sh $(N)

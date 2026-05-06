.PHONY: help install test typecheck dev prd build-prd build start issue-checkpoint session-handoff

help:
	@echo "Available commands:"
	@echo "  make install            Install dependencies"
	@echo "  make test               Run workspace tests"
	@echo "  make typecheck          Run workspace typecheck"
	@echo "  make dev                Start the web app dev server"
	@echo "  make build-prd          Build the production-like web app"
	@echo "  make prd                Start the production-like web app on port 3001"
	@echo "  make build              Build the web app"
	@echo "  make start              Start the built web app"
	@echo "  make issue-checkpoint N=44 Start or checkpoint an issue session"
	@echo "  make session-handoff N=44 Compatibility alias for issue-checkpoint"

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
	@echo "Starting Supabase..."
	supabase start >/dev/null 2>&1 || true
	@echo "Job Coach DEV — http://localhost:3000"
	SUPABASE_URL="http://127.0.0.1:54321" \
	SUPABASE_URL_DEV="http://127.0.0.1:54321" \
	SUPABASE_SERVICE_ROLE_KEY="$$(supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2 | tr -d '\"')" \
	SUPABASE_SERVICE_ROLE_KEY_DEV="$$(supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2 | tr -d '\"')" \
	NEXT_PUBLIC_APP_ENV=development \
	APP_ENV=development \
	PORT=3000 \
	pnpm --filter job-coach-web dev

build-prd:
	pnpm build:job-coach:prd

prd:
	pnpm prd:job-coach

build:
	pnpm --filter job-coach-web build

start:
	pnpm --filter job-coach-web start

issue-checkpoint:
	@test -n "$(N)" || (echo "Usage: make issue-checkpoint N=<issue-number>" && exit 1)
	./scripts/issue-checkpoint.sh $(N)

session-handoff: issue-checkpoint

.PHONY: help install test typecheck dev build start session-handoff

help:
	@echo "Available commands:"
	@echo "  make install            Install dependencies"
	@echo "  make test               Run workspace tests"
	@echo "  make typecheck          Run workspace typecheck"
	@echo "  make dev                Start the web app dev server"
	@echo "  make build              Build the web app"
	@echo "  make start              Start the built web app"
	@echo "  make session-handoff N=44 Start or hand off an issue session"

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

.PHONY: prd

prd:
	NEXT_PUBLIC_APP_ENV=production \
	JOB_COACH_APP_URL="http://localhost:3001" \
	SUPABASE_URL="https://akmlurgldseksxgvksut.supabase.co" \
	SUPABASE_SERVICE_ROLE_KEY="$$(security find-generic-password -s SUPABASE_SERVICE_ROLE_KEY -w)" \
	OPENAI_API_KEY="$$(security find-generic-password -s OPENAI_API_KEY -w)" \
	NODE_ENV=production \
	PORT=3001 \
	pnpm --filter job-coach-web start

build:
	pnpm --filter job-coach-web build

start:
	pnpm --filter job-coach-web start

session-handoff:
	@test -n "$(N)" || (echo "Usage: make session-handoff N=<issue-number> OR make session-handoff" && exit 1)
	./scripts/session-handoff.sh $(N)

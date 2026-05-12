.PHONY: \
	build \
	build-prd \
	clean \
	dev \
	fix \
	format \
	help \
	install \
	issue-checkpoint \
	lint \
	lint-fix \
	prd \
	session-handoff \
	start \
	test \
	typecheck

# Lookup a secret from macOS Keychain
# Usage:
#   $(call keychain,OPENAI_API_KEY)
#   $(call keychain,SUPABASE_SERVICE_ROLE_KEY_PRD)
keychain = $(shell security find-generic-password -a "$$USER" -s "$(1)" -w 2>/dev/null)

help:
	@echo "Available commands:"
	@echo "  make build              Build the web app"
	@echo "  make build-prd          Build the production-like web app"
	@echo "  make clean              Remove local build/cache artifacts"
	@echo "  make dev                Start the web app dev server"
	@echo "  make fix                Run lint/prettier auto-fixes"
	@echo "  make format             Format files with Prettier"
	@echo "  make install            Install dependencies"
	@echo "  make issue-checkpoint N=44 Start or checkpoint an issue session"
	@echo "  make lint               Run lint checks"
	@echo "  make lint-fix           Run lint auto-fixes"
	@echo "  make prd                Start the production-like web app on port 3001"
	@echo "  make session-handoff N=44 Compatibility alias for issue-checkpoint"
	@echo "  make start              Start the built web app"
	@echo "  make test               Run lint, typecheck, unit tests, and Playwright"
	@echo "  make typecheck          Run workspace typecheck"
	
build:
	pnpm --filter job-coach-web build

build-prd:
	pnpm build:job-coach:prd

clean:
	rm -rf apps/job-coach-web/.next
	rm -rf node_modules/.cache

# Helper: prefer keychain value, fallback to .env file
define env_or_keychain
$$(security find-generic-password -a "$$USER" -s "$(1)" -w 2>/dev/null || \
grep '^$(1)=' $(2) 2>/dev/null | cut -d= -f2- | tr -d '"')
endef

dev:
	@echo "Starting Supabase..."
	supabase start >/dev/null 2>&1 || true
	@echo "Job Coach DEV — http://localhost:3000"

	@SUPABASE_URL="http://127.0.0.1:54321" \
	SUPABASE_URL_DEV="http://127.0.0.1:54321" \
	SUPABASE_SERVICE_ROLE_KEY="$$(supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2 | tr -d '\"')" \
	SUPABASE_SERVICE_ROLE_KEY_DEV="$$(supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2 | tr -d '\"')" \
	OPENAI_API_KEY="$(call env_or_keychain,OPENAI_API_KEY,apps/job-coach-web/.env.local)" \
	NEXT_PUBLIC_APP_ENV=development \
	APP_ENV=development \
	PORT=3000 \
	pnpm --filter job-coach-web dev

fix: lint-fix format

format:
	pnpm prettier --write .

install:
	pnpm install

issue-checkpoint:
	@test -n "$(N)" || (echo "Usage: make issue-checkpoint N=<issue-number>" && exit 1)
	./scripts/issue-checkpoint.sh $(N)

lint:
	pnpm lint

lint-fix:
	pnpm lint --fix

prd:
	@APP_ENV=production \
	NEXT_PUBLIC_APP_ENV=production \
	PORT=3001 \
	OPENAI_API_KEY="$(call env_or_keychain,OPENAI_API_KEY,apps/job-coach-web/.env.local)" \
	SUPABASE_URL="$(call keychain,SUPABASE_URL_PRD)" \
	SUPABASE_URL_PRD="$(call keychain,SUPABASE_URL_PRD)" \
	SUPABASE_SERVICE_ROLE_KEY="$(call keychain,SUPABASE_SERVICE_ROLE_KEY_PRD)" \
	SUPABASE_SERVICE_ROLE_KEY_PRD="$(call keychain,SUPABASE_SERVICE_ROLE_KEY_PRD)" \
	NEXT_PUBLIC_SUPABASE_URL="$(call keychain,NEXT_PUBLIC_SUPABASE_URL)" \
	NEXT_PUBLIC_SUPABASE_ANON_KEY="$(call keychain,NEXT_PUBLIC_SUPABASE_ANON_KEY)" \
	pnpm tsx scripts/run-job-coach-prd.ts start

session-handoff: issue-checkpoint

start:
	pnpm --filter job-coach-web start

test: lint typecheck
	pnpm --filter @coach/core exec vitest run
	pnpm --filter @coach/db exec vitest run
	pnpm --filter job-coach-web exec vitest run
	pnpm --filter job-coach-web exec playwright test

typecheck:
	pnpm --filter @coach/core typecheck
	pnpm --filter @coach/db typecheck
	pnpm --filter job-coach-web typecheck

# Deployment Flow

## Overview

- PRs → run tests only (no deploy)
- Merge to main → automatically deploys to DEV
- PRD deployment → requires manual approval via GitHub environment

## Environments

### development

- Auto deploys on push to main
- No approval required
- Uses development-scoped secrets

### production

- Requires manual approval in GitHub Actions UI
- Uses production-scoped secrets
- Only runs after DEV deployment succeeds

## How to Deploy to Production

1. Push/merge to main
2. Go to Actions → latest "Deploy" run
3. Find "Deploy to PRD"
4. Click "Review deployments"
5. Click "Approve and deploy"

## Notes

- Only one deployment per environment runs at a time (concurrency)
- PRD secrets are not accessible until approval is granted

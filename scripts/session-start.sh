#!/usr/bin/env bash

echo "===== SESSION HANDOFF ====="
echo ""
echo "Paste everything below into a new ChatGPT session"
echo ""

echo "----- REPO -----"
pwd
echo "Branch: $(git branch --show-current)"
echo ""
git status --short

echo ""
echo "----- RECENT COMMITS -----"
git log --oneline -5

echo ""
echo "----- OPEN ISSUES -----"
gh issue list --state open --limit 10

echo ""
echo "----- AGENT RULES (.ai/AGENT.md) -----"
cat .ai/AGENT.md

echo ""
echo "===== END HANDOFF ====="

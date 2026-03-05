#!/bin/bash
# Deploy from Cursor: commits, pushes to clean-main, triggers Vercel auto-deploy

set -e

MSG="${1:-Deploy from Cursor}"
BRANCH="clean-main"
REMOTE="${2:-origin}"

echo "🚀 Deploying JobPool frontend..."
echo "   Branch: $BRANCH"
echo "   Message: $MSG"
echo ""

# Ensure we're in the repo root (has .git)
if [ ! -d .git ]; then
  echo "❌ Run from repo root (jobpoolfrontendsept)"
  exit 1
fi

# Check for changes
if git diff --staged --quiet 2>/dev/null && git diff --quiet 2>/dev/null; then
  echo "⚠️  No changes to commit. Working tree is clean."
  echo "   To push only: git push origin clean-main"
  exit 0
fi

git add -A
git status
echo ""
git commit -m "$MSG"
git push "$REMOTE" "$BRANCH"

echo ""
echo "✅ Deployed! Vercel is building from $BRANCH."
echo "   Check: https://vercel.com/dashboard"

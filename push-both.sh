#!/bin/bash
# Push both frontend and backend repos

set -e

FRONTEND_DIR="/Users/joshuabayagalla/jobpoolfrontendsept"
BACKEND_DIR="/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend"

echo "📤 Pushing frontend (joshua-jpfrontend)..."
cd "$FRONTEND_DIR"
git push || { echo "❌ Frontend push failed"; exit 1; }

echo ""
echo "📤 Pushing backend (Klughire/jobpoolbackend)..."
cd "$BACKEND_DIR"
git push || { echo "❌ Backend push failed"; exit 1; }

echo ""
echo "✅ Both repos pushed successfully!"

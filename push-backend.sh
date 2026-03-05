#!/bin/bash
# Push backend repo only

set -e

BACKEND_DIR="/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend"

echo "📤 Pushing backend (Klughire/jobpoolbackend)..."
cd "$BACKEND_DIR"
git push origin main
echo ""
echo "✅ Backend pushed successfully!"

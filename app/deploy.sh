#!/bin/bash
set -e

echo "🚀 Starting JobPool Frontend Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the app directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Build the application
echo "🔨 Building application..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check if build was successful
if [ -d ".next" ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build Summary:"
    echo "   - Build output: .next/"
    echo "   - Static pages generated"
    echo ""
    echo "🚀 Ready to deploy!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. For Vercel: Push to GitHub and import to Vercel"
    echo "   2. For Docker: Run 'docker build -t jobpool-frontend .'"
    echo "   3. For PM2: Run 'pm2 start npm --name jobpool-frontend -- start'"
    echo ""
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi


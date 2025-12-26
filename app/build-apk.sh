#!/bin/bash

# JobPool APK Build Script
# This script automates the process of building the Android APK

set -e  # Exit on error

echo "🚀 Starting JobPool APK Build Process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the app directory.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Step 1: Install dependencies (if needed)
echo -e "${YELLOW}📦 Step 1: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi
echo ""

# Step 2: Build Next.js for mobile
echo -e "${YELLOW}🔨 Step 2: Building Next.js for mobile...${NC}"
npm run build:mobile

if [ ! -d "out" ]; then
    echo -e "${RED}❌ Error: Build failed - 'out' directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Next.js build completed${NC}"
echo ""

# Step 3: Sync Capacitor
echo -e "${YELLOW}🔄 Step 3: Syncing Capacitor...${NC}"
npm run cap:sync

echo -e "${GREEN}✅ Capacitor sync completed${NC}"
echo ""

# Step 4: Check Android directory
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Error: Android directory not found. Run 'npx cap add android' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Android project found${NC}"
echo ""

# Step 5: Instructions for Android Studio
echo -e "${YELLOW}📱 Step 4: Opening Android Studio...${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Build preparation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "1. Android Studio will open automatically"
echo "2. Wait for Gradle sync to complete (may take a few minutes)"
echo "3. Once sync is done, go to:"
echo "   ${YELLOW}Build → Build Bundle(s) / APK(s) → Build APK(s)${NC}"
echo ""
echo "4. The APK will be generated at:"
echo "   ${GREEN}android/app/build/outputs/apk/release/app-release.apk${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: For testing, you can use the debug APK:${NC}"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""

# Open Android Studio
echo "Opening Android Studio..."
npm run cap:android

echo ""
echo -e "${GREEN}🎉 Done! Android Studio should be opening now.${NC}"


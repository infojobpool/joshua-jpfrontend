# 🚀 JobPool Frontend Deployment Guide

## Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended - Easiest)

**Prerequisites:**
- GitHub account
- Vercel account (free at https://vercel.com)

**Steps:**
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `app` (if repo root) or leave blank if deploying from app folder
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

5. **Environment Variables** (Add in Vercel dashboard):
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.jobpool.in/api/v1
   NODE_ENV=production
   ```

6. Click **Deploy**

**Vercel will automatically:**
- Build your app
- Deploy to production
- Provide HTTPS URL
- Set up automatic deployments on git push

---

### Option 2: Deploy with Docker

**Prerequisites:**
- Docker installed
- Docker Hub account (optional, for registry)

**Local Docker Build & Run:**
```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept/app

# Build Docker image
docker build -t jobpool-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.jobpool.in/api/v1 \
  -e NODE_ENV=production \
  jobpool-frontend
```

**Deploy to Cloud (DigitalOcean, AWS, etc.):**
```bash
# Tag image
docker tag jobpool-frontend your-registry/jobpool-frontend:latest

# Push to registry
docker push your-registry/jobpool-frontend:latest

# On server, pull and run
docker pull your-registry/jobpool-frontend:latest
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.jobpool.in/api/v1 \
  -e NODE_ENV=production \
  --name jobpool-frontend \
  your-registry/jobpool-frontend:latest
```

---

### Option 3: Deploy with Docker Compose

```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept/app

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### Option 4: Deploy to Traditional Server (Node.js)

**Prerequisites:**
- Node.js 18+ installed
- PM2 (process manager) installed: `npm install -g pm2`

**Steps:**
```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept/app

# Install dependencies
npm install

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "jobpool-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

**Environment Variables:**
Create `.env.production`:
```
NEXT_PUBLIC_API_BASE_URL=https://api.jobpool.in/api/v1
NODE_ENV=production
```

---

## Pre-Deployment Checklist

- [ ] Test build locally: `npm run build`
- [ ] Verify environment variables are set
- [ ] Check API endpoints are accessible
- [ ] Test authentication flow
- [ ] Verify PWA functionality
- [ ] Check mobile responsiveness
- [ ] Test all critical user flows

---

## Environment Variables

### Required:
- `NEXT_PUBLIC_API_BASE_URL` - Your backend API URL (default: `https://api.jobpool.in/api/v1`)

### Optional:
- `NODE_ENV` - Set to `production` for production builds
- `BUILD_MOBILE` - Set to `true` for mobile static export

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Mobile build (static export)
npm run build:mobile
```

---

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check CORS settings on backend
- Verify API rewrites in `next.config.ts`

### PWA Not Working
- Ensure HTTPS is enabled (required for PWA)
- Check `public/manifest.json` exists
- Verify service worker is registered

---

## Post-Deployment

1. **Test the live site:**
   - Check all pages load correctly
   - Test authentication
   - Verify API calls work
   - Test on mobile devices

2. **Monitor:**
   - Check error logs
   - Monitor API response times
   - Check user feedback

3. **Update DNS** (if using custom domain):
   - Point domain to deployment URL
   - Configure SSL certificate

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Build
echo "📦 Building application..."
npm run build

# Test build
if [ -d ".next" ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Ready to deploy!"
echo "📝 Next steps:"
echo "   1. Push to GitHub"
echo "   2. Deploy via Vercel or your preferred platform"
```

Make it executable: `chmod +x deploy.sh`

---

## Support

For issues or questions:
- Check logs: `npm run build` output
- Review Next.js docs: https://nextjs.org/docs
- Check Vercel docs: https://vercel.com/docs


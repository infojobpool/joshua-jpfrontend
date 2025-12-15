# 🚀 Vercel Deployment Guide

## Step-by-Step Instructions

### Step 1: Commit and Push Changes ✅
Your changes are ready to be committed. Run:
```bash
git commit -m "Fix build issues and add deployment configuration"
git push origin clean-main
```

### Step 2: Deploy on Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com/new
   - Sign in with GitHub (if not already signed in)

2. **Import Repository**
   - Click "Import Project"
   - Select your repository: `infojobpool/joshua-jpfrontend`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `app` ⚠️ IMPORTANT: Set this to `app`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables** (Click "Environment Variables")
   Add these:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://api.jobpool.in/api/v1
   NODE_ENV = production
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live! 🎉

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from app directory)
cd app
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? jobpool-frontend
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://api.jobpool.in/api/v1

# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

After deployment:
1. ✅ Check the deployment URL (provided by Vercel)
2. ✅ Test the homepage loads
3. ✅ Test sign in/sign up
4. ✅ Verify API calls work
5. ✅ Check mobile responsiveness

### Step 4: Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain (e.g., `app.jobpool.in`)
4. Follow DNS configuration instructions

---

## 🔧 Troubleshooting

### Build Fails on Vercel

**Issue**: Build errors
**Solution**: 
- Check build logs in Vercel dashboard
- Ensure `Root Directory` is set to `app`
- Verify environment variables are set

### API Not Connecting

**Issue**: API calls fail
**Solution**:
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check CORS settings on backend
- Review network tab in browser console

### 404 Errors

**Issue**: Pages return 404
**Solution**:
- Ensure `trailingSlash: true` in `next.config.ts` (already set)
- Check route structure matches file structure

---

## 📊 Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works (sign in/sign up)
- [ ] API calls succeed
- [ ] Mobile view works
- [ ] PWA features work (if applicable)
- [ ] All routes accessible
- [ ] Performance is good (check Lighthouse score)

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Production**: Deploys from `main` or `clean-main` branch
- **Preview**: Creates preview deployments for pull requests

To trigger a new deployment:
```bash
git push origin clean-main
```

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support

---

## ✅ Your Deployment URL

After deployment, Vercel will provide you with a URL like:
- `https://your-project.vercel.app`

You can share this URL or configure a custom domain!


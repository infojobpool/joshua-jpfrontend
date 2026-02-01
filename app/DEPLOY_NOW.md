# Deploy now

Build completed successfully. Choose how you deploy:

---

## Option A: Vercel (if you use Vercel for www.jobpool.in)

1. **Commit and push** (from repo root or from `app` if that’s your repo root):
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept
   git add .
   git commit -m "In-app notifications, FCM token registration, notifications page fix"
   git push origin main
   ```
2. Vercel will build and deploy from your connected repo.
3. In Vercel dashboard, ensure **Environment Variables** include:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://api.jobpool.in/api/v1`
4. If the project root is the **app** folder, set **Root Directory** to `app` in Vercel project settings.

---

## Option B: Same machine / your own server

1. **Build** (already done):
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept/app
   npm run build
   ```
2. **Run in production**:
   ```bash
   npm start
   ```
   App runs at http://localhost:3000. Use a process manager (e.g. PM2) and a reverse proxy (e.g. Nginx) for a real domain.
3. **Or use the deploy script**:
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept/app
   chmod +x deploy.sh
   ./deploy.sh
   ```
   Then start with: `pm2 start npm --name jobpool-frontend -- start` (after `npm install -g pm2` if needed).

---

## Option C: Docker

```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept/app
docker build -t jobpool-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.jobpool.in/api/v1 \
  -e NODE_ENV=production \
  jobpool-frontend
```

---

## After deploy

- Open **https://www.jobpool.in** (or your live URL).
- Sign in → **Notifications** → click **“Test in-app notification”** to confirm the new behavior is live.

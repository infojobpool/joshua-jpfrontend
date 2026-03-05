# Auto Deploy from Cursor

Deploy to production by pushing from Cursor. Vercel auto-deploys when you push to `clean-main`.

## One-command deploy

From the repo root (in Cursor terminal):

```bash
./scripts/deploy.sh "Brief description of your changes"
```

This will:
1. Stage all changes
2. Commit with your message
3. Push to `clean-main`
4. Vercel automatically deploys from GitHub

## One-time setup

### 1. Connect Vercel to GitHub

If not already done:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `infojobpool/joshua-jpfrontend`
3. Set **Root Directory** to `app`
4. Add env vars: `NEXT_PUBLIC_API_BASE_URL`, etc.

### 2. Fix Git auth (if push fails)

If you see permission errors when pushing:
```bash
gh auth login
# or use HTTPS: git remote set-url origin https://github.com/infojobpool/joshua-jpfrontend.git
```

## Manual deploy

```bash
git add -A
git commit -m "Your message"
git push origin clean-main
```

---

Production branch: `clean-main` → www.jobpool.in

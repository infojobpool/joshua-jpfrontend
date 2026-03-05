# Push from Two Different GitHub Accounts (Frontend + Backend)

Your setup:
- **Frontend** → `infojobpool/joshua-jpfrontend` (Account 1)
- **Backend** → `Klughire/jobpoolbackend` (Account 2)

Follow these steps **once** to push both from Cursor without switching accounts.

---

## Step 1: Create two SSH keys

Open Terminal and run:

```bash
# Key for FRONTEND account (infojobpool / Klughire / whatever you use)
ssh-keygen -t ed25519 -C "your-frontend-email@example.com" -f ~/.ssh/id_ed25519_frontend -N ""

# Key for BACKEND account (Joshua-bayagalla)
ssh-keygen -t ed25519 -C "your-backend-email@example.com" -f ~/.ssh/id_ed25519_backend -N ""
```

---

## Step 2: Add keys to GitHub

**Frontend key:**
```bash
cat ~/.ssh/id_ed25519_frontend.pub
```
Copy the output → GitHub (Account 1) → Settings → SSH and GPG keys → New SSH key → Paste

**Backend key:**
```bash
cat ~/.ssh/id_ed25519_backend.pub
```
Copy the output → GitHub (Account 2) → Settings → SSH and GPG keys → New SSH key → Paste

---

## Step 3: Create SSH config

Run this (it creates ~/.ssh/config):

```bash
cat >> ~/.ssh/config << 'EOF'

# Frontend (infojobpool)
Host github-frontend
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_frontend

# Backend (Klughire)
Host github-backend
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_backend
EOF
chmod 600 ~/.ssh/config
```

---

## Step 4: Update Git remotes

```bash
# Frontend
cd /Users/joshuabayagalla/jobpoolfrontendsept
git remote set-url origin git@github-frontend:infojobpool/joshua-jpfrontend.git

# Backend
cd "/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend"
git remote set-url origin git@github-backend:Klughire/jobpoolbackend.git
```

---

## Step 5: Test

```bash
# Test frontend
ssh -T git@github-frontend

# Test backend
ssh -T git@github-backend

# Push both
/Users/joshuabayagalla/jobpoolfrontendsept/push-both.sh
```

---

## Notes

- Each repo will use the correct account automatically.
- No more logging in when pushing.
- `push-both.sh` will work for both repos once this is set up.

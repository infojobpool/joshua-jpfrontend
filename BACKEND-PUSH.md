# Backend Push Guide

## Path
```
/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend
```

## Option 1: Quick push (already committed)
```bash
cd "/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend"
git push origin main
```

## Option 2: Using script (from frontend folder)
```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept
./push-backend.sh
```

## Option 3: Full flow (add, commit, push)
```bash
cd "/Users/joshuabayagalla/backend jobppol sept/jobpoolbackend"

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Your commit message here"

# Push
git push origin main
```

## Remote
- **Repo:** Klughire/jobpoolbackend
- **Remote:** origin → git@github-backend:Klughire/jobpoolbackend.git
- **Branch:** main

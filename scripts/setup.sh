#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# JANGJIN Plus — one-shot local setup
#
# Run this once from your Mac terminal:
#   cd ~/Documents/Claude/Projects/jangjin-plus
#   bash scripts/setup.sh
#
# It will:
#   1. Remove the partial .git/ Cowork created (sandbox couldn't finish it)
#   2. git init, set main branch, configure user
#   3. Add the GitHub remote: sovorent/jangjin-plus
#   4. npm install (this is fast on your machine vs. the sandbox)
#   5. Make the initial commit
#   6. Push to origin/main
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/sovorent/jangjin-plus.git"
BRANCH="main"
GIT_USER_NAME="${GIT_USER_NAME:-Sun}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-bj.sunzz@gmail.com}"

cd "$(dirname "$0")/.."   # repo root

# 1. Wipe the partial .git Cowork left behind ────────────────────
if [ -d .git ]; then
  echo "→ Removing partial .git/ from sandbox setup"
  rm -rf .git
fi

# 2. Init ────────────────────────────────────────────────────────
echo "→ git init"
git init -b "$BRANCH"
git config user.name  "$GIT_USER_NAME"
git config user.email "$GIT_USER_EMAIL"

# 3. Remote ──────────────────────────────────────────────────────
echo "→ git remote add origin $REPO_URL"
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# 4. Install ─────────────────────────────────────────────────────
echo "→ npm install"
npm install --no-audit --no-fund

# 5. Commit ──────────────────────────────────────────────────────
echo "→ Initial commit"
git add -A
git commit -m "feat: initial Next.js scaffold per PRD v1.0

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase clients (browser, server, middleware) wired for cookie-based auth (PRD REQ-NFR-09)
- Auth gate middleware redirects unauthenticated users to /login (PRD REQ-AUTH-04)
- next-intl scaffold with th.json/en.json messages (PRD REQ-NFR-11)
- shadcn/ui components.json (new-york, Tailwind v4, lucide icons)
- PRD design tokens applied to globals.css (REQ-UX-05)
- Sarabun (Thai) + Inter (English) fonts wired in layout (REQ-UX-06)"

# 6. Push ────────────────────────────────────────────────────────
echo "→ git push -u origin $BRANCH"
echo "  (If the GitHub repo doesn't exist yet, create it at:"
echo "   https://github.com/new — name: jangjin-plus, owner: sovorent, do NOT initialize"
echo "   with a README/license/.gitignore, then re-run this script.)"
git push -u origin "$BRANCH"

echo
echo "✓ Done. Next:"
echo "   cp .env.example .env.local   # add Supabase creds"
echo "   npm run dev                  # http://localhost:3000"

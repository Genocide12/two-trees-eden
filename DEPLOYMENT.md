# Two Trees: Eden — Deployment Guide

This guide walks you through deploying the **Two Trees: Eden** game in three connected pieces:

1. **Web app** — Next.js, deployed to **Vercel**
2. **GitHub repository** — connected to Vercel via the **GitHub REST API**
3. **Telegram bot** — autonomous, runs the same game in chat + sets the menu button to open the web app

All three together form one game, accessible from any browser or from Telegram.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Push the project to GitHub](#step-1--push-the-project-to-github)
4. [Step 2 — Deploy the Next.js app to Vercel](#step-2--deploy-the-nextjs-app-to-vercel)
5. [Step 3 — Connect Vercel to GitHub via API](#step-3--connect-vercel-to-github-via-api)
6. [Step 4 — Create & deploy the Telegram bot](#step-4--create--deploy-the-telegram-bot)
7. [Step 5 — Wire the bot's menu button to the Vercel app](#step-5--wire-the-bots-menu-button-to-the-vercel-app)
8. [Step 6 — Verify everything works](#step-6--verify-everything-works)
9. [Updating the game](#updating-the-game)
10. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

```
                 ┌────────────────────────┐
                 │   GitHub repository    │
                 │  (your source code)    │
                 └──────────┬─────────────┘
                            │ push / commit
                            ▼
                 ┌────────────────────────┐         ┌───────────────────────┐
                 │   Vercel deployment    │◄────────│  Vercel × GitHub API  │
                 │  (Next.js web app)     │  webhook│   (auto-deploy on     │
                 └──────────┬─────────────┘         │    main branch push)  │
                            │                       └───────────────────────┘
                            │ https://yourapp.vercel.app
                            ▼
            ┌───────────────────────────────────────┐
            │            End user                   │
            │  ┌────────────┐   ┌────────────────┐  │
            │  │  Browser    │   │  Telegram app  │  │
            │  │  (web)      │   │  (bot + webapp)│  │
            │  └────────────┘   └────────┬───────┘  │
            └───────────────────────────┼──────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                ┌──────────────────┐       ┌──────────────────────┐
                │  Telegram bot    │       │  Telegram Web App    │
                │  (text mode)     │       │  (opens Vercel URL   │
                │  long-polling    │       │   in Telegram's      │
                └──────────────────┘       │   in-app browser)    │
                                           └──────────────────────┘
```

The bot and the web app share the same game logic. The bot plays inside the chat;
the web app is the full visual version opened from Telegram's menu button or
from a direct link.

---

## 2. Prerequisites

You will need accounts / tokens for:

| Service | What you need | Where to get it |
|---|---|---|
| GitHub | account + Personal Access Token (PAT) with `repo` scope | https://github.com/settings/tokens |
| Vercel | account + Vercel token | https://vercel.com/account/tokens |
| Telegram | a bot token from @BotFather | https://t.me/BotFather |

Local tools:

- Node.js ≥ 18 (for the bot)
- Git
- `curl` (to call the GitHub API from the command line)

---

## Step 1 — Push the project to GitHub

### 1a. Create an empty repository on GitHub

Use the GitHub REST API (no UI needed):

```bash
GH_USER="your-github-username"
GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxx"   # PAT with `repo` scope
REPO_NAME="two-trees-eden"

curl -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Two Trees: Eden — stoic strategy game\"}"
```

Note the `clone_url` returned in the response — you'll need it next.

### 1b. Initialize the local repo and push

From the project root (the folder containing `package.json`, `src/`, etc.):

```bash
git init
git branch -M main

# Add a .gitignore so we don't push build artifacts
cat > .gitignore <<'EOF'
node_modules/
.next/
out/
.env
.env.local
*.log
.DS_Store
.vercel/
EOF

git add .
git commit -m "Initial commit: Two Trees: Eden"

git remote add origin "https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git push -u origin main
```

### 1c. Verify the push

```bash
curl -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/repos/$GH_USER/$REPO_NAME/contents
```

You should see the file listing in JSON.

---

## Step 2 — Deploy the Next.js app to Vercel

### 2a. Install the Vercel CLI

```bash
npm install -g vercel
# or: bun add -g vercel
```

### 2b. Log in

```bash
vercel login
```

Follow the email confirmation flow.

### 2c. Deploy from the project root

```bash
cd /path/to/two-trees-eden
vercel --yes --prod
```

- Vercel auto-detects Next.js and uses the default build settings.
- The first deploy gives you a URL like `https://two-trees-eden-xxxx.vercel.app`.
- Subsequent deploys from `main` will update the same production URL once GitHub integration is connected (Step 3).

### 2d. Save the production URL

You'll need it for the bot:

```bash
export WEBAPP_URL="https://two-trees-eden-xxxx.vercel.app"
echo "$WEBAPP_URL"
```

---

## Step 3 — Connect Vercel to GitHub via API

This step wires Vercel's auto-deploy hook into your GitHub repo so every push to
`main` triggers a new production deployment.

### 3a. Get your Vercel access token

1. Go to https://vercel.com/account/tokens
2. Create a token with scope "Full account"
3. Save it: `export VERCEL_TOKEN="vercel_xxxxxxxxxxxxx"`

### 3b. Find your Vercel team/user ID

```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v2/user
```

Save `user.uid` (or `user.email` if deploying under personal account).

### 3c. Create a Git integration via the Vercel API

Vercel's official API path for connecting a project to a Git repo is:

```bash
PROJECT_ID="prj_xxxxxxxxxxxxx"   # find via: curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v9/projects
REPO_FULL="$GH_USER/two-trees-eden"

curl -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -d "{
    \"link\": {
      \"type\": \"github\",
      \"repo\": \"$REPO_FULL\",
      \"productionBranch\": \"main\"
    }
  }"
```

From now on, every `git push origin main` will automatically trigger a new
production deployment on Vercel. You can watch them at
`https://vercel.com/dashboard`.

### 3d. (Alternative) Use a GitHub webhook + Vercel deploy hook

If you prefer not to grant Vercel full GitHub access, use a **Deploy Hook**:

1. In Vercel dashboard → your project → Settings → Git → Deploy Hooks
2. Create a hook for branch `main`, copy the URL
3. In GitHub, set up a webhook manually via API:

```bash
WEBHOOK_URL="https://api.vercel.com/v1/integrations/deploy/xxxxx"

curl -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$GH_USER/$REPO_NAME/hooks" \
  -d "{
    \"name\":\"web\",
    \"active\":true,
    \"events\":[\"push\"],
    \"config\":{\"url\":\"$WEBHOOK_URL\",\"content_type\":\"json\"}
  }"
```

Both approaches give you auto-deploy-on-push. Pick whichever fits your
permission model.

---

## Step 4 — Create & deploy the Telegram bot

### 4a. Get a bot token

1. Open https://t.me/BotFather
2. Send `/newbot`
3. Pick a name (e.g. `Two Trees: Eden`) and a username ending in `bot` (e.g. `two_trees_eden_bot`)
4. Save the token: `export BOT_TOKEN="123456789:ABCdefGhiJklMnoPqrStuVwxYz"`

### 4b. Disable privacy (so the bot sees commands in groups, optional)

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/setPrivacy" -d "disabled=true"
```

### 4c. Deploy the bot

The bot source lives in `scripts/telegram-bot/bot.mjs` — a single self-contained
Node.js file with **zero external dependencies**.

**Option A — Render / Railway / fly.io (recommended, free tier OK)**

1. Push the whole repo to GitHub (Step 1 already did this).
2. Create a new Web Service on Render, pointing at the same repo.
3. Set the **Root Directory** to `scripts/telegram-bot`.
4. Set the **Build Command** to `npm install` (or empty).
5. Set the **Start Command** to `npm start`.
6. Add environment variables:
   - `BOT_TOKEN` = your bot token
   - `WEBAPP_URL` = the Vercel URL from Step 2d
7. Deploy. The service must be **always-on** (long-polling).

**Option B — VPS / your own server**

```bash
git clone https://github.com/$GH_USER/$REPO_NAME.git
cd $REPO_NAME/scripts/telegram-bot
npm install

# Use a process manager so it auto-restarts
BOT_TOKEN=$BOT_TOKEN WEBAPP_URL=$WEBAPP_URL pm2 start bot.mjs --name eden-bot
pm2 save
pm2 startup
```

**Option C — Webhook mode (for serverless)**

If you must deploy on Vercel/Cloudflare Functions, convert the bot from
long-polling to webhook mode:

1. Replace `poll()` in `bot.mjs` with an HTTP server (use `node:http` or express).
2. Expose a single POST endpoint, e.g. `/webhook`.
3. Register the webhook with Telegram:

```bash
BOT_HOST="https://your-bot-host.example.com"
curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$BOT_HOST/webhook"
```

4. Make sure your host can handle concurrent requests (Telegram retries on 5xx).

### 4d. Verify the bot is alive

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"
```

You should see:

```json
{ "ok": true, "result": { "id": ..., "username": "two_trees_eden_bot", ... } }
```

Send `/start` to your bot in Telegram. You should see the side-select screen
with inline buttons.

---

## Step 5 — Wire the bot's menu button to the Vercel app

The bot already calls `setChatMenuButton` on startup to make the Telegram menu
button (bottom-left of the chat input) open the web app. To set it manually:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{
    \"menu_button\": {
      \"type\": \"web_app\",
      \"text\": \"Eden\",
      \"web_app\": { \"url\": \"$WEBAPP_URL\" }
    }
  }"
```

Now, in your bot's Telegram chat, the menu button (☰ → "Eden") opens the full
visual web app inside Telegram's in-app browser. The web app and the chat bot
share the same game engine — but each runs its own session.

### Optional: pretty Web App preview

Send a message with an inline keyboard that opens the web app:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"<your-chat-id>\",
    \"text\": \"Open the full visual version of Two Trees: Eden:\",
    \"reply_markup\": {
      \"inline_keyboard\": [[
        { \"text\": \"🌑 Enter Eden\", \"web_app\": { \"url\": \"$WEBAPP_URL\" } }
      ]]
    }
  }"
```

---

## Step 6 — Verify everything works

Run through this checklist:

- [ ] Open `https://yourapp.vercel.app` in a browser → game loads, side-select screen visible.
- [ ] Click **Свет** or **Тьма** → game board appears.
- [ ] Take a few actions → humanity bars shift, chronicle updates, AI takes its turn.
- [ ] Reach the final epoch → ending modal appears.
- [ ] In Telegram: send `/start` to your bot → side-select buttons appear in chat.
- [ ] Pick a side → game state renders as a Markdown message with action buttons.
- [ ] Tap an action → AI responds; turn advances.
- [ ] Tap **🌐 EN/RU** → text switches language.
- [ ] Tap **Open web version** button → web app opens inside Telegram's in-app browser.
- [ ] Tap the menu button (☰) → "Eden" → web app opens.

---

## Updating the game

Once everything is wired, the update flow is simply:

```bash
# edit code, then:
git add .
git commit -m "Tweak: rebalance plague effect"
git push origin main
```

- **Vercel** auto-rebuilds and deploys the web app (≈30–60s).
- **Telegram bot** auto-restarts on Render/Railway if you've enabled auto-deploy.
  On a VPS, `pm2 reload` after `git pull`.

For game-balance changes, remember to update **both**:
- `src/lib/game/*` (Next.js app)
- `scripts/telegram-bot/bot.mjs` (the inline copy of the engine)

To avoid divergence, you can refactor `bot.mjs` to import from a shared
package — but for a single-author project, the inline copy is simpler.

---

## Troubleshooting

### Bot doesn't respond to `/start`

- Check the bot process is running: `pm2 status` / Render dashboard logs.
- Check the token is correct: `curl https://api.telegram.org/bot$BOT_TOKEN/getMe`.
- Long-polling requires a continuous process — Render free tier sleeps after
  15 min idle. Upgrade to a paid plan or use webhook mode.

### Web app opens in Telegram but looks broken

- Telegram's in-app browser is WebKit-based; make sure no Chrome-only APIs are used.
- Check the viewport meta tag is set (Next.js handles this by default).
- Test with the Telegram Desktop client too — its WebView differs from mobile.

### Vercel deploy fails

- Check the build log on Vercel dashboard.
- Common cause: missing env vars. The Next.js app currently doesn't require any,
  but if you add Prisma later, set `DATABASE_URL`.
- `bun install` should succeed; if not, try `npm install` and commit `package-lock.json`.

### Auto-deploy from GitHub doesn't trigger

- Verify the Git link in Vercel dashboard → Project → Settings → Git.
- Verify the deploy hook webhook is active: GitHub repo → Settings → Webhooks.
- Check the webhook delivery history on GitHub for 4xx/5xx responses.

### Menu button doesn't open the web app

- The URL must be HTTPS (Vercel gives you this for free).
- The URL must be on a public domain — `localhost` will not work.
- Re-run the `setChatMenuButton` curl command from Step 5.

---

## Quick reference — environment variables

| Service | Variable | Value | Where to set |
|---|---|---|---|
| Web app (Vercel) | _(none required)_ | — | — |
| Telegram bot | `BOT_TOKEN` | `123456789:ABC...` | Render/Railway/VPS env |
| Telegram bot | `WEBAPP_URL` | `https://two-trees-eden.vercel.app` | Render/Railway/VPS env |
| GitHub PAT | `GH_TOKEN` | `ghp_...` | your local shell only |
| Vercel token | `VERCEL_TOKEN` | `vercel_...` | your local shell only |

---

## Quick reference — REST API calls used in this guide

### GitHub

| Action | Method & URL |
|---|---|
| Create repo | `POST https://api.github.com/user/repos` |
| List repo contents | `GET https://api.github.com/repos/{owner}/{repo}/contents` |
| Add webhook | `POST https://api.github.com/repos/{owner}/{repo}/hooks` |

### Vercel

| Action | Method & URL |
|---|---|
| Get user | `GET https://api.vercel.com/v2/user` |
| List projects | `GET https://api.vercel.com/v9/projects` |
| Link project to Git | `POST https://api.vercel.com/v9/projects/{projectId}` with `link` body |

### Telegram Bot API

| Action | Method & URL |
|---|---|
| Get bot info | `GET https://api.telegram.org/bot{token}/getMe` |
| Set menu button | `POST https://api.telegram.org/bot{token}/setChatMenuButton` |
| Send message | `POST https://api.telegram.org/bot{token}/sendMessage` |
| Set webhook | `POST https://api.telegram.org/bot{token}/setWebhook` |
| Get updates (polling) | `GET https://api.telegram.org/bot{token}/getUpdates` |

---

_End of guide._

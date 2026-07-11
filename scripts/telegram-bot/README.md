# Two Trees: Eden — Telegram Bot

A standalone text-mode Telegram bot for the game **Two Trees: Eden**.

The bot:
- Plays the full game inside the chat (inline buttons for actions)
- Bilingual (RU / EN), toggle with the 🌐 button
- Sets the Telegram **menu button** to open the full web-app version (Vercel URL)
- Uses long-polling — no webhook setup needed

---

## 1. Requirements

- Node.js ≥ 18
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- The deployed Vercel URL of the web app (for the menu button)

## 2. Install

```bash
cd telegram-bot
npm install        # or: bun install / pnpm install
```

(There are no runtime dependencies — only Node's built-in `https` module.)

## 3. Configure

Create `.env` (or set env vars in your process manager / hosting dashboard):

```bash
BOT_TOKEN=123456789:ABCdefGhiJklMnoPqrStuVwxYz     # from @BotFather
WEBAPP_URL=https://your-vercel-app.vercel.app      # deployed Next.js app URL
```

## 4. Run locally

```bash
npm start
# or with auto-restart on file change:
npm run dev
```

You should see:

```
Menu button set to open https://your-vercel-app.vercel.app
Bot @your_bot_username is running. Long-polling…
```

Open your bot in Telegram, send `/start`, and play.

## 5. Commands inside Telegram

| Command  | Action                              |
|----------|-------------------------------------|
| `/start` | New game (back to side selection)   |
| `/new`   | Same as `/start`                    |
| `/lang`  | Toggle RU / EN                      |
| `/help`  | Short help text                     |

## 6. Deploy

### Option A — Always-on host (recommended for long-polling)

Use **Render**, **Railway**, **fly.io**, or any VPS:

1. Push the `telegram-bot/` folder to a GitHub repo.
2. Create a new service on Render/Railway pointing at that repo.
3. Set env vars `BOT_TOKEN` and `WEBAPP_URL`.
4. Start command: `npm start`.

### Option B — VPS / server

```bash
git clone https://github.com/yourname/two-trees-eden.git
cd two-trees-eden/telegram-bot
npm install
BOT_TOKEN=... WEBAPP_URL=... npm start
```

Wrap with `pm2` or `systemd` for autostart.

### Option C — Webhook mode (advanced)

For a serverless host (Vercel Functions, Cloudflare Workers), you must convert
the bot to webhook mode. Replace the `poll()` function with an HTTP server
(express / `node:http`) and register a webhook with:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://your-host.com/webhook"
```

See the **deployment guide** at the project root (`DEPLOYMENT.md`) for a full walkthrough.

## 7. Sync with the Next.js game engine

This bot ships with a **portable inline copy** of the game engine inside `bot.mjs`.
If you change game balance in `src/lib/game/*`, mirror those changes in `bot.mjs`
(or refactor to share a single module via a private npm package / git submodule).

## 8. Notes on persistence

The bot keeps sessions in-memory (`Map`). Restart loses progress. For production,
swap `sessions` with Redis or Postgres — see the `getSession()` function.

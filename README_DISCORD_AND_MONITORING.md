# Snakstract Community & Monitoring Setup Guide

## 1. Discord Server Setup

### Step-by-Step
1. **Create Your Server**
   - In Discord, click the **"+"** button on the left sidebar.
   - Select **"Create My Own"**.
   - Name your server (e.g., `Snakstract Community`).
   - (Optional) Upload your game logo as the server icon.

2. **Create Channels**
   - **Text Channels:**
     - `#welcome` — Welcome message, rules, and how to get started.
     - `#announcements` — Updates, launches, and important news.
     - `#general` — Main chat for everyone.
     - `#bug-reports` — For bug reports (pin your bug report template here).
     - `#support` — For help requests.
     - `#feedback` — For suggestions and feature requests.
     - `#leaderboard` — (Optional) For top players or weekly winners.
     - `#alerts` — (Private, for devs/mods, to receive error/uptime alerts via webhook).
   - **Voice Channels:**
     - `General Voice`
     - `Game Night` (optional, for events)

3. **Set Channel Permissions**
   - Click the gear icon next to a channel → **Permissions**.
   - For `#announcements`, allow only Admins/Mods to send messages.
   - For `#alerts`, restrict to Admins/Devs only.
   - For `#bug-reports`, allow everyone to post, but consider limiting chat to just bug reports.

4. **Add Roles**
   - Go to **Server Settings → Roles**.
   - Create roles like: `Admin`, `Moderator`, `Player`, `Tester`.
   - Assign colors and permissions as needed.
   - Assign roles to your team and trusted testers.

5. **Invite Your Team & Testers**
   - Click your server name → **Invite People**.
   - Set the invite link to never expire (if you want).
   - Share with your team, testers, and early players.

6. **Pin the Bug Report Template**
   - Go to `#bug-reports`, paste the template (see below), and pin it.

7. **Add a Welcome Message**
   - Paste this in `#welcome` and pin it:

```
👋 **Welcome to the Snakstract Community!**

- Play the game: [yourgameurl.com]
- Read the rules below before posting.
- Join #announcements for updates.
- Report bugs in #bug-reports (use the pinned template!).
- Need help? Ask in #support.
- Share feedback or ideas in #feedback.

**Have fun and good luck on the leaderboard!**
```

8. **Add a Bug Report Template**
   - Pin this in `#bug-reports`:

```
**🐛 Bug Report Template**

**1. What happened?**
Describe the bug clearly.

**2. Steps to reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**3. What did you expect to happen?**

**4. Screenshots or video (if possible):**

**5. Device/Browser/Wallet info:**
- Device/OS:
- Browser:
- Wallet (MetaMask, Abstract, etc.):

**6. Your wallet address (optional):**

Thank you for helping us improve Snakstract!
```

9. **Add Bots & Automations**
   - **MEE6** or **Dyno** for moderation, welcome messages, and automations.
   - **Carl-bot** for reaction roles and advanced permissions.
   - **Invite a bot:** Go to the bot’s website, invite it to your server, and follow setup instructions.
   - **Custom Webhooks:** Use Discord webhooks for automated alerts (see below).

10. **Moderation & Safety**
   - Set up moderation rules (Server Settings → Moderation).
   - Enable 2FA for admins.
   - Set up AutoMod (Server Settings → AutoMod) to filter spam or bad language.

11. **Best Practices**
   - Host events (e.g., “Game Night” in voice chat).
   - Pin important messages in each channel.
   - Regularly check #bug-reports and #support for new issues.
   - Thank your community—early adopters are your best advocates!

---

## 2. Sentry Error Monitoring & Discord Alerts

### **Frontend (React) Setup**
1. Sign up at [sentry.io](https://sentry.io/) and create a new project (choose React).
2. Install Sentry:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```
3. In your main entry file (e.g., `main.jsx`):
   ```js
   import * as Sentry from "@sentry/react";
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     tracesSampleRate: 1.0,
   });
   ```
4. Deploy your app. Errors will now appear in your Sentry dashboard.

### **Backend (Node.js) Setup**
1. In your backend project:
   ```bash
   npm install @sentry/node
   ```
2. In your main server file (e.g., `index.js`):
   ```js
   const Sentry = require("@sentry/node");
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
   });
   // Add Sentry request handler as early as possible
   app.use(Sentry.Handlers.requestHandler());
   // Add Sentry error handler after all routes
   app.use(Sentry.Handlers.errorHandler());
   ```

### **Discord Webhook Integration for Sentry**
1. In Discord, go to your `#alerts` channel → Edit Channel → Integrations → Webhooks → New Webhook.
2. Copy the webhook URL.
3. In Sentry, go to **Project Settings → Alerts → Notification Rules**.
4. Add a new rule: “Send a notification via Webhook”. Paste your Discord webhook URL.
5. Now, critical errors will be posted directly to your Discord channel.

---

## 3. UptimeRobot Monitoring & Discord Alerts

1. Go to [UptimeRobot.com](https://uptimerobot.com/) and create a free account.
2. Add a new monitor (type: HTTP(s)), enter your backend/frontend URL.
3. In UptimeRobot, go to **My Settings → Alert Contacts → Add Alert Contact → Webhook**.
4. Paste your Discord webhook URL (from above).
5. Now, if your server goes down, you’ll get an alert in your Discord `#alerts` channel.

---

## 4. Example Discord Automations

- **Welcome Bot:** Use MEE6 or Dyno to send a welcome DM to new members.
- **Reaction Roles:** Use Carl-bot to let users self-assign roles (e.g., Player, Tester).
- **Auto-Moderation:** Enable AutoMod to filter spam, links, or bad language.
- **Leaderboard Announcements:** Use a webhook or bot to post weekly leaderboard winners in `#leaderboard`.
- **Custom Scripts:** You can write a Node.js script to POST to your Discord webhook for custom alerts (e.g., big in-game events):
  ```js
  const fetch = require('node-fetch');
  fetch('YOUR_DISCORD_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '🚨 A new high score was set!' })
  });
  ```

---

## 5. Community Management & Feedback
- Host regular events (e.g., “Game Night”).
- Use `#feedback` for suggestions and feature requests.
- Pin important info and templates in each channel.
- Thank and reward active community members.
- Monitor `#bug-reports` and `#support` for urgent issues.

---

## 6. Sample Announcement Message
```

```

---

**For more advanced Discord automations, moderation, or custom bot scripts, ask your developer or reach out to the community for open-source solutions!** 
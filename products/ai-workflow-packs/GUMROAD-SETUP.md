# Gumroad Product Setup Guide

## Product: AI SMB Operations Starter Pack

---

## Step 1: Create a Gumroad Account

Go to [gumroad.com](https://gumroad.com) → **Sign Up** → use your business email.
Connect your bank account or PayPal under **Settings → Payouts**.

---

## Step 2: Create the Product

1. Dashboard → **+ New Product**
2. Type: **Digital product**
3. Name: `AI SMB Operations Starter Pack — n8n Workflow Bundle`

---

## Step 3: Upload the Files

Upload all 6 files as a single ZIP or individually:

```
ai-smb-starter-pack/
├── 01-lead-capture-ai-scoring.json
├── 01-lead-capture-README.md
├── 02-support-ticket-triage.json
├── 02-support-ticket-README.md
├── 03-weekly-report-generator.json
├── 03-weekly-report-README.md
└── BUNDLE-README.md
```

Create the ZIP:
```bash
cd products/ai-workflow-packs
zip -r ai-smb-starter-pack-v1.zip workflows/ docs/ BUNDLE-README.md
```

---

## Step 4: Set the Price

- **Price: $29**
- Enable "Pay what you want" with minimum $29 (optional — builds goodwill)
- No free tier

---

## Step 5: Product Description (Copy-Paste Ready)

```
Stop wasting hours on tasks that should run themselves.

This pack gives you 3 production-ready n8n automation workflows built for small businesses — import, configure your API keys, and they're live in under 30 minutes.

---

🔥 WHAT'S INCLUDED

Workflow 1: Lead Capture + AI Scoring
• Connects to any contact form or webhook
• Scores every lead 1–10 using GPT-4o mini
• Logs to Google Sheets + fires a Slack alert with score, tier (hot/warm/cold), and suggested follow-up
• Setup time: ~10 minutes

Workflow 2: AI Support Ticket Triage
• Monitors your Gmail inbox for new support emails
• AI classifies: billing / bug / feature request / question / complaint
• Routes to the right Slack channel with priority flag + draft reply
• Setup time: ~15 minutes

Workflow 3: Weekly Business Report Generator
• Runs every Monday at 8am automatically
• Pulls metrics from Google Sheets, calculates week-over-week changes
• AI writes a 3-paragraph report: performance, wins/concerns, priorities
• Emails you a formatted summary before your week starts
• Setup time: ~20 minutes

---

🛠️ WHAT YOU NEED

• n8n (free cloud account at n8n.io or self-hosted)
• OpenAI API key (~$0.01 per run with gpt-4o-mini)
• Google account (for Sheets + Gmail)
• Slack workspace

Each workflow comes with a plain-English README covering: what it does, exact setup steps, customization tips, and a troubleshooting table.

---

👥 WHO THIS IS FOR

Freelancers, consultants, and small business owners who:
✓ Are already using or curious about n8n
✓ Want AI in their business without hiring a developer
✓ Prefer buying a working solution over spending 8 hours building it

---

📦 WHAT YOU GET

• 3 × n8n workflow JSON files (import directly into n8n)
• 3 × setup READMEs (plain English, step-by-step)
• Free updates if workflows break due to n8n API changes

---

⚡ INSTANT DOWNLOAD

Payment → immediate ZIP download. No waiting, no account creation, no DRM.

Questions? Email [your support email].
```

---

## Step 6: Cover Image

Create a simple cover image (1280×720 recommended):
- Dark background (#0f0f23 or similar)
- Title: "AI SMB Operations Starter Pack"
- Subtitle: "3 n8n Workflows that run your business on autopilot"
- 3 icon labels: 🔥 Lead Scoring | 🎫 Ticket Triage | 📊 Weekly Reports

Free tools: Canva (free tier), Figma, or Penpot.

---

## Step 7: Checkout Settings

- **Thank you page message:**
  ```
  Thanks for your purchase! Check your email for the download link.
  Each workflow README walks you through setup step by step.
  Reply to this email if you get stuck — we'll help.
  ```
- Enable **"Email me each sale"** under Notifications

---

## Step 8: Publish

- Toggle to **Public** 
- Share the product URL with the CMO for distribution campaigns

---

## Pricing Roadmap

| Phase | Price | Condition |
|---|---|---|
| Launch (now) | $29 | First 3 workflows, intro price |
| Full pack | $49 | When 10 workflows are complete |
| Upgrade offer | $20 | Offer to existing $29 buyers |

**Rule:** Only build more workflows if 5+ purchases in first 14 days. If no signal, kill the product.

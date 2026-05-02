# AI SMB Operations Starter Pack
### 3 n8n Workflows That Run Your Business on Autopilot

---

## What's in This Pack

| File | What It Does | Setup Time |
|------|-------------|------------|
| `01-lead-capture-ai-scoring.json` | Scores every inbound lead 1–10 with AI, logs to Google Sheets, alerts Slack | ~10 min |
| `02-support-ticket-triage.json` | Classifies support emails, routes to Slack channels, drafts replies | ~15 min |
| `03-weekly-report-generator.json` | Generates a Monday morning business summary from your metrics spreadsheet | ~20 min |

Each workflow comes with a README (`docs/` folder) covering setup, customization, and troubleshooting.

---

## Requirements

- **n8n** — free account at [n8n.io](https://n8n.io) (cloud) or self-hosted
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com) — costs ~$0.01 per workflow run
- **Google account** — for Google Sheets + Gmail (used in workflows 2 & 3)
- **Slack workspace** — for notifications in workflows 1 & 2

---

## Quick Start

1. Log into n8n → **Workflows → Import from File**
2. Select a `.json` file from this pack
3. Open the README for that workflow (`docs/0X-*-README.md`)
4. Follow the setup steps — takes 10–20 minutes per workflow
5. Click **Activate** — done

---

## Estimated Running Costs

With `gpt-4o-mini` pricing (~$0.15 per 1M input tokens):

| Workflow | Cost Per Run |
|---|---|
| Lead Capture + AI Scoring | ~$0.005 per lead |
| Support Ticket Triage | ~$0.005 per email |
| Weekly Report Generator | ~$0.02 per report |

For 100 leads/week + 50 support emails/week + 1 report = **~$1.00/month** in API costs.

---

## Support

Questions or issues? Email us at [your support email].

We also fix workflows if n8n updates break them — download the latest version from your Gumroad purchase page.

---

*Pack version: 1.0 | Built for n8n v1.x*

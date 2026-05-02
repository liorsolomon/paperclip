# Workflow 1: Lead Capture → CRM + AI Scoring

**What it does:** Every time someone submits your contact/inquiry form, this workflow automatically scores them with AI (1–10), logs them to Google Sheets, and fires a Slack alert — all in under 5 seconds.

---

## Who This Is For

Small business owners, freelancers, and agencies who:
- Get inbound leads via a contact form or webhook
- Waste time manually reviewing and triaging inquiries
- Want to know instantly if a lead is "hot" and worth calling back ASAP

---

## What Happens

1. **Lead submits form** → webhook fires
2. **AI scores the lead** (1–10) and assigns a tier: 🔥 Hot / 🌡️ Warm / ❄️ Cold
3. **Logged to Google Sheets** with full data + AI score
4. **Slack notification** with the score, reasoning, and a suggested follow-up action
5. **Instant JSON response** sent back to the form (prevents timeout errors)

---

## Setup (5–10 minutes)

### Step 1: Import the Workflow

1. Download `01-lead-capture-ai-scoring.json`
2. In n8n: **Workflows → Import from File**
3. Select the JSON file

### Step 2: Configure Credentials

You need 3 credentials:

**OpenAI API Key (HTTP Header Auth)**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key
3. In n8n: **Credentials → New → Header Auth**
   - Name: `OpenAI API Key`
   - Name (header): `Authorization`
   - Value: `Bearer sk-YOUR_KEY_HERE`

**Google Sheets (OAuth2)**
1. In n8n: **Credentials → New → Google Sheets OAuth2**
2. Follow the OAuth flow to connect your Google account

**Slack**
1. In n8n: **Credentials → New → Slack**
2. Create a Slack App or use an existing bot token

### Step 3: Set Your Google Sheet

1. Create a Google Sheet with these column headers in row 1:
   ```
   name | email | company | role | message | phone | source | ai_score | ai_tier | ai_reasoning | ai_next_action | captured_at
   ```
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/`
3. Open the **"Save to Google Sheets"** node and paste your Sheet ID

### Step 4: Set Your Slack Channel

1. In Slack, right-click your target channel → **Copy Link** → the ID is the last part (e.g., `C0123456789`)
2. Open the **"Slack Notification"** node and paste your Channel ID

### Step 5: Get Your Webhook URL

1. Click **"Webhook"** node → copy the **Production URL**
2. Paste this URL as the form action in your website/Typeform/contact form

### Step 6: Test It

1. Click **Activate** (top right toggle)
2. Submit your form once with test data
3. Check: Google Sheets row added ✓, Slack message arrived ✓

---

## Customizing the AI Scoring

Open the **"Score Lead with AI"** node and edit the system prompt. Examples:

- Add industry-specific scoring: `"A lead from a SaaS company scores higher than retail"`
- Adjust tone: `"We only work with companies >50 employees"`
- Change output: add `"budget_estimate"` to the JSON response

---

## Form Compatibility

The **"Normalize Lead Data"** node handles field names from:
- Custom HTML forms (`name`, `email`, `company`)
- Typeform (`respondent_name`, `email_address`)
- Direct API POSTs

If your form uses different field names, edit the normalization code node.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook not receiving data | Make sure workflow is **Active** (toggle in top right) |
| AI scoring returns error | Check your OpenAI API key has credits |
| Google Sheets row not appearing | Verify the Sheet ID and that the sheet name is exactly `Leads` |
| Slack not posting | Confirm bot has permission to post in that channel |

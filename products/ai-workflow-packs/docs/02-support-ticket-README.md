# Workflow 2: AI Support Ticket Triage

**What it does:** When a customer sends a support email, AI instantly classifies it (billing / bug / feature request / question / complaint), routes a Slack alert to the right team channel, and drafts a reply — so your team spends zero time sorting and more time solving.

---

## Who This Is For

Small businesses and agencies that:
- Handle customer support via email
- Have a small team spread across Slack channels (sales, billing, dev, support)
- Spend 20–30 minutes per day just sorting/reading support emails before acting on them

---

## What Happens

1. **New email arrives in Gmail inbox**
2. **AI reads + classifies it**: billing / bug / feature_request / question / complaint
3. **AI assigns priority**: urgent / high / medium / low
4. **AI assesses sentiment**: positive → very_negative
5. **Routed to the right Slack channel** (you configure the channel per category)
6. **Draft reply posted in Slack thread** — edit and send, or send as-is
7. **Email labeled "Triaged"** in Gmail so you know it's been processed

---

## Setup (10–15 minutes)

### Step 1: Import the Workflow

1. Download `02-support-ticket-triage.json`
2. In n8n: **Workflows → Import from File**

### Step 2: Configure Credentials

**Gmail (OAuth2)**
1. In n8n: **Credentials → New → Gmail OAuth2**
2. Sign in with the Gmail account you use for support

**OpenAI API Key** — same as Workflow 1 (reuse existing credential)

**Slack** — same as Workflow 1 (reuse existing credential)

### Step 3: Configure Slack Channel IDs

Open the **"Parse & Route"** node and update the `channelMap` object:

```javascript
const channelMap = {
  billing: 'C0BILLING123',      // your #billing channel ID
  bug: 'C0BUGS456',             // your #bugs or #engineering channel ID
  feature_request: 'C0PRODUCT789', // your #product channel ID
  question: 'C0SUPPORT012',    // your #support channel ID
  complaint: 'C0SUPPORT012',   // usually same as support
  other: 'C0SUPPORT012'        // fallback
};
```

To find a Slack channel ID: right-click the channel → **Open in App** → the URL ends in the channel ID (e.g., `/archives/C0123456789`).

### Step 4: Create a Gmail Label

1. In Gmail: **Settings → Labels → Create New Label** → name it `Triaged`
2. In Gmail URL, the label ID appears in the URL when you click the label
   - Or use Gmail's API to find it: look for it in n8n's label picker
3. In the **"Label as Triaged"** node, update `Label_YOUR_TRIAGED_LABEL_ID`

### Step 5: Activate

1. Click **Activate** — the workflow polls Gmail every minute for new unread emails
2. Send a test email to your support inbox
3. Watch the Slack notification and draft reply appear

---

## Customizing Categories

The AI prompt in **"Classify Ticket with AI"** defines categories. You can:

**Add SLA urgency rules:**
```
urgent: requires response within 1 hour (payment failures, data loss, production down)
```

**Add custom categories:**
```
refund: explicit refund requests
onboarding: new customer setup questions
```

Then update the `channelMap` in the Code node to handle the new category.

---

## Improving Draft Reply Quality

The AI prompt includes:
> "a professional 2–3 sentence reply that acknowledges the issue and sets expectations"

You can make replies more specific by editing the system prompt to include:
- Your company name
- Your support SLA (e.g., "we respond within 24 hours")
- Common product-specific context

---

## Filtering Which Emails Get Triaged

By default, all **unread inbox** emails trigger the workflow. To limit scope:

- **Only from customers**: add an `IF` node after **"Extract Email Fields"** filtering by domain
- **Ignore mailing lists**: filter out emails where `from_email` contains `noreply`, `newsletter`, etc.
- **Only labeled emails**: change the Gmail Trigger to use a specific label like `support`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Workflow triggers on ALL emails | Add an IF filter after Extract Email Fields to whitelist domains |
| Slack routing all to one channel | Verify channel IDs in the `channelMap` code node |
| Gmail label not applying | Find the exact label ID from Gmail Settings → Labels |
| AI always classifies as "question" | Add more context about your business to the system prompt |

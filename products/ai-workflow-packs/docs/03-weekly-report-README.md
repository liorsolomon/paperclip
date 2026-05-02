# Workflow 3: Weekly Business Report Generator

**What it does:** Every Monday at 8am, this workflow pulls your key metrics from Google Sheets, feeds them to AI, and emails you a crisp 3-paragraph business summary with week-over-week comparisons — no dashboards to log into, no reports to build.

---

## Who This Is For

Small business owners who:
- Track key metrics in a spreadsheet (revenue, customers, sessions, etc.)
- Want a Monday morning briefing without logging into multiple tools
- Spend 20+ minutes every week compiling a status update they then don't act on

---

## What Happens

1. **Every Monday at 8am** — workflow wakes up automatically
2. **Reads your metrics spreadsheet** — pulls last 7 days of data
3. **Calculates WoW changes** — compares this week vs last week
4. **AI writes a 3-paragraph report** — performance overview, wins/concerns, priorities
5. **Sends you a formatted HTML email** with a metrics table + AI narrative
6. **Logs report to a "Report Log" tab** in your sheet for history

---

## Setup (15–20 minutes)

### Step 1: Import the Workflow

1. Download `03-weekly-report-generator.json`
2. In n8n: **Workflows → Import from File**

### Step 2: Set Up Your Metrics Sheet

Create a Google Sheet with **two tabs**:

**Tab 1: "Weekly Metrics"** — add these column headers in row 1, then fill in daily data:
```
date | revenue | new_customers | churn | support_tickets | website_sessions | conversions
```

Example row:
```
2024-01-15 | 1250.00 | 3 | 0 | 12 | 847 | 8
```

**Tab 2: "Report Log"** — add these headers (the workflow writes here automatically):
```
report_date | week_of | revenue | new_customers | status
```

### Step 3: Configure Google Sheets

1. Copy your Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/`
2. Open the **"Get Metrics Sheet"** node → paste your Sheet ID
3. Open the **"Log Report Sent"** node → paste the same Sheet ID

### Step 4: Configure Your Email

1. Open the **"Email Report to Owner"** node
2. Change `YOUR_EMAIL@example.com` to your email address
3. Make sure your Gmail credential is connected

### Step 5: Set Your Timezone (Optional)

By default the workflow runs in `America/New_York` time. To change:
1. Click the workflow title area → **Settings**
2. Change the timezone to yours

### Step 6: Activate

1. Click **Activate**
2. To test immediately: click **"Every Monday 8am"** node → **Execute Node**
3. Check your email for the report

---

## Customizing the Report

### Change the Day/Time

Click the **"Every Monday 8am"** Schedule Trigger node and adjust:
- `triggerAtDay`: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
- `triggerAtHour`: 0–23

### Add More Metrics

In the **"Aggregate Weekly Metrics"** Code node, add your columns:
```javascript
const metrics = {
  ...existing fields...,
  // Add yours:
  mrr: '$' + sum('mrr').toFixed(2),
  mrr_wow: wow('mrr'),
  cac: '$' + avg('cac'),
};
```

Then reference them in the **"Write Report with AI"** node's prompt.

### Change the AI Tone/Focus

Edit the system prompt in **"Write Report with AI"** to match your business:

```
You are analyzing a SaaS B2B business. Focus on MRR growth and churn rate above all else.
Flag if churn exceeds 3% for the week. Our goal is $10k MRR by end of quarter.
```

### Add Slack Delivery

Add a Slack node after **"Format Email Report"** to also post a summary in your team channel:
```
Weekly report sent to owner. Revenue: {{ $json.metrics.total_revenue }} ({{ $json.metrics.revenue_wow }} WoW)
```

---

## Metrics You Can Track

The workflow handles any numeric columns in your sheet. Common additions:
- `mrr` — monthly recurring revenue
- `cac` — customer acquisition cost (if you're running paid ads)
- `nps_score` — average NPS this week
- `social_followers` — Twitter/LinkedIn growth
- `email_subscribers` — newsletter growth
- `ad_spend` — weekly ad budget spent

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "No metrics data found" error | Make sure Tab 1 is named exactly `Weekly Metrics` and has data rows |
| Report shows zeros for WoW | You need at least 14 rows of data (2 weeks) for comparison |
| Wrong timezone on trigger | Change timezone in Workflow Settings |
| Email not arriving | Check Gmail credential, check spam folder |
| AI report is too generic | Add business context to the system prompt (industry, goals, benchmarks) |

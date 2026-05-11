import { useEffect, useState } from "react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { MetricCard } from "../components/MetricCard";
import { Users, TrendingUp, MousePointerClick, AlertCircle, RefreshCw } from "lucide-react";

// ── Supabase config ───────────────────────────────────────────────────────
// VITE_GOFFER_ANALYTICS_KEY must be a Supabase service_role key (read-only
// access is enforced by the "service read" RLS policy on goffer_signups).
// Set this in Vercel env vars — it is only accessible to board-authenticated users.

const SUPABASE_URL = import.meta.env.VITE_GOFFER_SUPABASE_URL as string | undefined;
const ANALYTICS_KEY = import.meta.env.VITE_GOFFER_ANALYTICS_KEY as string | undefined;

type SignupRow = {
  signed_up_at: string;
  referrer_source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

async function fetchSignups(): Promise<SignupRow[]> {
  if (!SUPABASE_URL || !ANALYTICS_KEY) return [];
  const url = `${SUPABASE_URL}/rest/v1/goffer_signups?select=signed_up_at,referrer_source,utm_source,utm_medium,utm_campaign&order=signed_up_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: ANALYTICS_KEY,
      Authorization: `Bearer ${ANALYTICS_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

function groupBy<T>(rows: T[], key: keyof T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const k = String(row[key] || "unknown");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ── Component ─────────────────────────────────────────────────────────────

export function GofferAnalytics() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [rows, setRows] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    setBreadcrumbs([{ label: "Goffer Analytics" }]);
  }, [setBreadcrumbs]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSignups();
      setRows(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!SUPABASE_URL || !ANALYTICS_KEY) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Analytics not configured</p>
            <p>Set <code className="bg-yellow-100 px-1 rounded">VITE_GOFFER_SUPABASE_URL</code> and <code className="bg-yellow-100 px-1 rounded">VITE_GOFFER_ANALYTICS_KEY</code> in your Vercel environment variables, then redeploy.</p>
          </div>
        </div>
      </div>
    );
  }

  const bySource = groupBy(rows, "utm_source");
  const byReferrer = groupBy(rows, "referrer_source");
  const days = last7Days();
  const byDay: Record<string, number> = {};
  for (const row of rows) {
    const day = row.signed_up_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const todayCount = byDay[new Date().toISOString().slice(0, 10)] ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Goffer.ai Signups</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card">
          <MetricCard icon={Users} value={loading ? "—" : rows.length} label="Total signups" />
        </div>
        <div className="rounded-lg border border-border bg-card">
          <MetricCard icon={TrendingUp} value={loading ? "—" : todayCount} label="Today" />
        </div>
        <div className="rounded-lg border border-border bg-card">
          <MetricCard icon={MousePointerClick} value={loading ? "—" : topSource || "—"} label="Top UTM source" />
        </div>
        <div className="rounded-lg border border-border bg-card">
          <MetricCard icon={Users} value="N/A" label="Activation rate" description="Not yet tracked — requires GA4 events" />
        </div>
      </div>

      {/* 7-day trend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Last 7 days</h2>
        {loading ? (
          <div className="h-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="flex items-end gap-2 h-24">
            {days.map((day) => {
              const count = byDay[day] ?? 0;
              const max = Math.max(...days.map((d) => byDay[d] ?? 0), 1);
              const pct = (count / max) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{count || ""}</span>
                  <div
                    className="w-full rounded-sm bg-primary/20 transition-all"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                    title={`${day}: ${count}`}
                  />
                  <span className="text-[9px] text-muted-foreground">{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BreakdownTable title="By UTM source" data={bySource} loading={loading} />
        <BreakdownTable title="By referrer source" data={byReferrer} loading={loading} />
      </div>

      {/* GA4 status note */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">GA4 events tracked</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li><code className="text-xs">goffer_run</code> — fired on each agent run</li>
          <li><code className="text-xs">goffer_signup_gate_shown</code> — fired when email gate appears</li>
          <li><code className="text-xs">goffer_signup</code> — fired on successful email capture</li>
        </ul>
        {!import.meta.env.VITE_GA_MEASUREMENT_ID && (
          <p className="mt-2 text-yellow-700">
            GA4 not active — set <code className="bg-yellow-100 px-1 rounded">VITE_GA_MEASUREMENT_ID</code> in Vercel to enable.
          </p>
        )}
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  data,
  loading,
}: {
  title: string;
  data: Record<string, number>;
  loading: boolean;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([key, count]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate">{key}</span>
                  <span className="text-xs tabular-nums text-muted-foreground ml-2">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/40"
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

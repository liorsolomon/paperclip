#!/usr/bin/env node

import fs from "node:fs/promises";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : fallback;
}

async function readFileIfPresent(path) {
  if (!path) return "";
  try {
    return await fs.readFile(path, "utf8");
  } catch {
    return "";
  }
}

async function paperclipFetch(pathname, init = {}) {
  const apiUrl = requiredEnv("PAPERCLIP_API_URL").replace(/\/+$/, "");
  const apiKey = requiredEnv("PAPERCLIP_API_KEY");
  const runId = optionalEnv("PAPERCLIP_RUN_ID");
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    ...(runId ? { "X-Paperclip-Run-Id": runId } : {}),
    ...init.headers,
  };

  const res = await fetch(`${apiUrl}${pathname}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paperclip ${pathname} failed: ${res.status} ${text}`);
  }
  return res;
}

async function lmStudioChat({ baseUrl, apiToken, model, input }) {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/chat`;
  const headers = { "Content-Type": "application/json" };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, input }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LM Studio chat failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const first = Array.isArray(json.output) ? json.output[0] : null;
  const content = typeof first?.content === "string" ? first.content.trim() : "";
  if (!content) throw new Error(`LM Studio returned no text output: ${JSON.stringify(json)}`);
  return content;
}

function formatComments(comments) {
  if (!Array.isArray(comments) || comments.length === 0) return "No recent comments.";
  return comments
    .slice()
    .reverse()
    .map((comment) => {
      const author = comment.authorAgentId || comment.authorUserId || "unknown";
      return `- ${author}: ${String(comment.body || "").trim()}`;
    })
    .join("\n");
}

async function main() {
  const taskId = optionalEnv("PAPERCLIP_TASK_ID");
  if (!taskId) {
    process.stdout.write("No PAPERCLIP_TASK_ID set; nothing to do for this heartbeat.\n");
    return;
  }

  const agentId = requiredEnv("PAPERCLIP_AGENT_ID");
  const wakeCommentId = optionalEnv("PAPERCLIP_WAKE_COMMENT_ID");
  const wakeReason = optionalEnv("PAPERCLIP_WAKE_REASON", "unspecified");
  const lmBaseUrl = requiredEnv("LMSTUDIO_BASE_URL");
  const lmModel = requiredEnv("LMSTUDIO_MODEL");
  const lmToken = optionalEnv("LMSTUDIO_API_TOKEN");
  const instructionsPath = optionalEnv("LMSTUDIO_INSTRUCTIONS_FILE");

  // Reclaim or claim the assigned issue when possible so the agent can comment.
  try {
    await paperclipFetch(`/api/issues/${taskId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        expectedStatuses: ["todo", "backlog", "blocked", "in_review", "in_progress"],
      }),
    });
  } catch (err) {
    process.stderr.write(`Checkout warning: ${err instanceof Error ? err.message : String(err)}\n`);
  }

  const [meRes, issueRes, commentsRes, instructions] = await Promise.all([
    paperclipFetch("/api/agents/me"),
    paperclipFetch(
      `/api/issues/${taskId}/heartbeat-context${wakeCommentId ? `?wakeCommentId=${encodeURIComponent(wakeCommentId)}` : ""}`,
    ),
    paperclipFetch(`/api/issues/${taskId}/comments?order=desc&limit=8`),
    readFileIfPresent(instructionsPath),
  ]);

  const me = await meRes.json();
  const issueContext = await issueRes.json();
  const comments = await commentsRes.json();

  const prompt = [
    "You are acting as a Paperclip agent through a local LM Studio bridge.",
    "Respond as concise markdown suitable for a Paperclip issue comment.",
    "If you are the CEO, focus on triage, delegation, prioritization, and unblocking rather than doing implementation yourself.",
    "Do not claim to have done work you have not done. Base your response only on the task context below.",
    "",
    "Agent:",
    JSON.stringify(
      {
        id: me.id,
        name: me.name,
        role: me.role,
        title: me.title,
        chainOfCommand: me.chainOfCommand,
      },
      null,
      2,
    ),
    "",
    "Wake:",
    JSON.stringify({ taskId, wakeReason, wakeCommentId: wakeCommentId || null }, null, 2),
    "",
    "Issue heartbeat context:",
    JSON.stringify(issueContext, null, 2),
    "",
    "Recent comments:",
    formatComments(comments),
    "",
    instructions ? `Instructions file:\n${instructions}\n` : "",
    "Write a single issue comment with:",
    "1. a short status line",
    "2. 2-5 bullet points",
    "3. a concrete next step or delegation note",
  ].join("\n");

  const reply = await lmStudioChat({
    baseUrl: lmBaseUrl,
    apiToken: lmToken,
    model: lmModel,
    input: prompt,
  });

  await paperclipFetch(`/api/issues/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: reply }),
  });

  process.stdout.write(`Posted LM Studio response to issue ${taskId}.\n`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack || err.message : String(err)}\n`);
  process.exitCode = 1;
});

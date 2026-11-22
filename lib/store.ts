"use client";
import type { RunInput, RunResult, Sender, StageEvent, StageId } from "./types";

export type Approval = "pending" | "approved" | "rejected";
export type Reply = "unknown" | "positive" | "negative" | "no_reply";

export interface RunRecord {
  id: string;
  createdAt: string;
  input: RunInput;
  result: RunResult;
  approval: Approval;
  rejectReason?: string;
  finalSubject?: string;
  finalBody?: string;
  editDistance?: number;
  regenerations: number;
  /** What the rep asked to change on each regenerate */
  feedbackLog?: string[];
  reply: Reply;
  stages: Partial<Record<StageId, StageEvent>>;
}

const RUNS = "zoc.runs.v1";
const SENDER = "zoc.sender.v1";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function listRuns(): RunRecord[] {
  return safeGet<RunRecord[]>(RUNS, []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
export function getRun(id: string) {
  return listRuns().find((r) => r.id === id);
}
export function saveRun(rec: RunRecord) {
  const all = listRuns().filter((r) => r.id !== rec.id);
  all.unshift(rec);
  safeSet(RUNS, all.slice(0, 200));
}
export function updateRun(id: string, patch: Partial<RunRecord>) {
  const rec = getRun(id);
  if (rec) saveRun({ ...rec, ...patch });
}
export function clearRuns() {
  safeSet(RUNS, []);
}

export function getSender(): Sender {
  return safeGet<Sender>(SENDER, { name: "Himanshu", role: "Account Executive, Zamp" });
}
export function setSender(s: Sender) {
  safeSet(SENDER, s);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Word-level edit distance, as a share of the original length. */
export function editShare(a: string, b: string) {
  const x = a.split(/\s+/).filter(Boolean);
  const y = b.split(/\s+/).filter(Boolean);
  const dp = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return x.length ? Math.round((dp[x.length][y.length] / x.length) * 100) : 0;
}

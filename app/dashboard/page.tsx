"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearRuns, listRuns, updateRun, type Reply, type RunRecord } from "@/lib/store";
import { PLAYBOOKS } from "@/lib/playbooks";

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "text-ledger" },
  rejected: { label: "Rejected", cls: "text-brick" },
  drafted: { label: "Drafted", cls: "text-ink" },
  needs_input: { label: "Needs you", cls: "text-rust" },
  skipped: { label: "Stopped", cls: "text-ink-3" },
  error: { label: "Failed", cls: "text-brick" },
};

function statusOf(r: RunRecord) {
  if (r.approval === "approved") return "approved";
  if (r.approval === "rejected") return "rejected";
  return r.result.status;
}

export default function Dashboard() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "sales_outreach" | "event_invite">("all");
  useEffect(() => setRuns(listRuns()), []);

  const shown = runs.filter((r) => filter === "all" || r.input.purpose === filter);
  const stats = useMemo(() => {
    const drafted = shown.filter((r) => r.result.draft?.status === "ok");
    const reviewed = shown.filter((r) => r.approval !== "pending");
    const approved = shown.filter((r) => r.approval === "approved");
    const withReply = approved.filter((r) => r.reply === "positive" || r.reply === "negative");
    const positive = approved.filter((r) => r.reply === "positive");
    const edits = approved.filter((r) => r.editDistance !== undefined);
    const credits = shown.reduce((n, r) => n + r.result.usage.credits, 0);
    const stopped = shown.filter((r) => r.result.status === "needs_input" || r.result.status === "skipped");
    return {
      runs: shown.length,
      drafted: drafted.length,
      approvalRate: reviewed.length ? Math.round((approved.length / reviewed.length) * 100) : null,
      avgEdit: edits.length ? Math.round(edits.reduce((n, r) => n + (r.editDistance || 0), 0) / edits.length) : null,
      replyRate: approved.length ? Math.round((withReply.length / approved.length) * 100) : null,
      positive: positive.length,
      credits: Math.round(credits * 100) / 100,
      stopped: stopped.length,
    };
  }, [shown]);

  const setReply = (id: string, reply: Reply) => {
    updateRun(id, { reply });
    setRuns(listRuns());
  };

  const reasons = shown.filter((r) => r.rejectReason).reduce<Record<string, number>>((m, r) => ({ ...m, [r.rejectReason!]: (m[r.rejectReason!] || 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Runs</h1>
          <p className="text-[13px] text-ink-2">Every prospect researched, what the desk decided, and what happened next. Stored in this browser.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 rounded-md border border-rule bg-sheet px-2 text-[13px]" aria-label="Filter by purpose">
            <option value="all">All purposes</option>
            {[...new Map(runs.map((r) => [r.input.purpose, r.input.purposeName || PLAYBOOKS[r.input.purpose]?.name || r.input.purpose])).entries()].map(([id, n]) => (
              <option key={id} value={id}>{n}</option>
            ))}
          </select>
          {runs.length > 0 && (
            <button onClick={() => { if (confirm("Clear all saved runs from this browser?")) { clearRuns(); setRuns([]); } }} className="text-[12px] text-ink-3 hover:text-brick">
              Clear history
            </button>
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule md:grid-cols-6">
        <Stat k="Prospects researched" v={stats.runs} />
        <Stat k="Drafts written" v={stats.drafted} />
        <Stat k="Stopped for a reason" v={stats.stopped} hint="Moved, ambiguous, customer, no fit" />
        <Stat k="Approval rate" v={stats.approvalRate === null ? "none yet" : `${stats.approvalRate}%`} />
        <Stat k="Average edit" v={stats.avgEdit === null ? "none yet" : `${stats.avgEdit}%`} hint="Share of words the rep changed" />
        <Stat k="Credits spent" v={stats.credits} />
      </dl>

      {Object.keys(reasons).length > 0 && (
        <p className="mt-3 text-[12px] text-ink-2">
          Rejection reasons, used to tune the playbooks:{" "}
          {Object.entries(reasons).map(([k, v], i) => (
            <span key={k}>{i ? ", " : ""}{k} <span className="num font-medium text-ink">{v}</span></span>
          ))}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-rule bg-sheet/60 p-10 text-center">
          <p className="text-[17px] font-semibold">No runs yet</p>
          <p className="mt-1 text-[13px] text-ink-2">Research your first prospect and it will appear here.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white">Research a prospect</Link>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-rule bg-sheet">
          <table className="w-full min-w-[920px] text-left text-[13px]">
            <thead className="border-b border-rule text-2xs text-ink-3">
              <tr>
                <th className="px-4 py-2.5 font-normal">Prospect</th>
                <th className="px-3 py-2.5 font-normal">Purpose</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
                <th className="px-3 py-2.5 font-normal">Hook or reason</th>
                <th className="px-3 py-2.5 text-right font-normal">Quality</th>
                <th className="px-3 py-2.5 text-right font-normal">Edited</th>
                <th className="px-3 py-2.5 text-right font-normal">Credits</th>
                <th className="px-3 py-2.5 font-normal">Reply</th>
                <th className="px-4 py-2.5 text-right font-normal">When</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const st = STATUS[statusOf(r)] || STATUS.error;
                const who = r.result.prospect?.name || r.input.name || r.input.linkedinUrl || r.input.findSuccessor?.companyName || "Unknown";
                return (
                  <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/runs/${r.id}`} className="font-medium hover:text-sky">{who}</Link>
                      <p className="text-2xs text-ink-3">{[r.result.prospect?.title, r.result.company?.name || r.input.company].filter(Boolean).join(", ")}</p>
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">{r.input.purposeName || PLAYBOOKS[r.input.purpose]?.name || r.input.purpose}</td>
                    <td className={`px-3 py-2.5 font-medium ${st.cls}`}>{st.label}</td>
                    <td className="max-w-[280px] px-3 py-2.5 text-ink-2">
                      <span className="line-clamp-2">{r.result.edge ? r.result.edge.title : r.result.hook ? `${r.result.hook.label}: ${r.result.hook.usable_fact}` : r.result.error}</span>
                    </td>
                    <td className="num px-3 py-2.5 text-right">{r.result.quality?.score ?? ""}</td>
                    <td className="num px-3 py-2.5 text-right text-ink-2">{r.editDistance !== undefined ? `${r.editDistance}%` : ""}</td>
                    <td className="num px-3 py-2.5 text-right text-ink-2">{r.result.usage.credits}</td>
                    <td className="px-3 py-2.5">
                      {r.approval === "approved" ? (
                        <select value={r.reply} onChange={(e) => setReply(r.id, e.target.value as Reply)} className="rounded border border-rule bg-sheet px-1.5 py-0.5 text-[12px]" aria-label="Reply outcome">
                          <option value="unknown">Waiting</option>
                          <option value="positive">Positive</option>
                          <option value="negative">Not interested</option>
                          <option value="no_reply">No reply</option>
                        </select>
                      ) : (
                        <span className="text-2xs text-ink-3">not sent</span>
                      )}
                    </td>
                    <td className="num px-4 py-2.5 text-right text-2xs text-ink-3">{new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, hint }: { k: string; v: string | number; hint?: string }) {
  return (
    <div className="bg-sheet px-4 py-3" title={hint}>
      <dt className="text-2xs text-ink-3">{k}</dt>
      <dd className="num mt-0.5 text-[20px] font-medium text-ink">{v}</dd>
    </div>
  );
}

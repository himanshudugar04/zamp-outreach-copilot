"use client";
import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Info, Pencil, RefreshCw, X } from "lucide-react";
import type { Claim, Draft, QualityReport, RunResult } from "@/lib/types";

type Seg = { text: string; n?: number };

function segment(body: string, claims: Claim[]): { segs: Seg[]; notes: { n: number; claim: Claim }[] } {
  const marks: { start: number; end: number; claim: Claim }[] = [];
  for (const c of claims) {
    if (!c.text) continue;
    const i = body.indexOf(c.text);
    if (i < 0) continue;
    if (marks.some((m) => i < m.end && i + c.text.length > m.start)) continue;
    marks.push({ start: i, end: i + c.text.length, claim: c });
  }
  marks.sort((a, b) => a.start - b.start);
  const notes: { n: number; claim: Claim }[] = [];
  const segs: Seg[] = [];
  let at = 0;
  marks.forEach((m, k) => {
    if (m.start > at) segs.push({ text: body.slice(at, m.start) });
    segs.push({ text: body.slice(m.start, m.end), n: k + 1 });
    notes.push({ n: k + 1, claim: m.claim });
    at = m.end;
  });
  if (at < body.length) segs.push({ text: body.slice(at) });
  return { segs, notes };
}

const REJECT_REASONS = ["Wrong hook", "Wrong tone", "Factually off", "Wrong person"];
const QUICK_ASKS = ["Make it shorter", "Less salesy, more peer to peer", "Lead with the news instead", "Name a different product", "Drop the customer proof point", "Warmer opening line"];

export function Letter({
  result,
  draft,
  quality,
  approval,
  finalSubject,
  finalBody,
  regenerations,
  busy,
  onApprove,
  onSaveEdit,
  onRegenerate,
  onReject,
}: {
  result: RunResult;
  draft: Draft;
  quality?: QualityReport;
  approval: "pending" | "approved" | "rejected";
  finalSubject?: string;
  finalBody?: string;
  regenerations: number;
  busy: boolean;
  onApprove: (subject: string, body: string) => void;
  onSaveEdit: (subject: string, body: string) => void;
  onRegenerate: (feedback: string) => void;
  onReject: (reason: string) => void;
}) {
  const subject = finalSubject ?? draft.subject;
  const body = finalBody ?? draft.body;
  const edited = finalBody !== undefined && finalBody !== draft.body;
  const [editing, setEditing] = useState(false);
  const [eSub, setESub] = useState(subject);
  const [eBody, setEBody] = useState(body);
  const [rejecting, setRejecting] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [fb, setFb] = useState("");
  const left = 3 - regenerations;
  const submitFb = (text: string) => {
    onRegenerate(text.trim());
    setAsking(false);
    setFb("");
  };
  const { segs, notes } = useMemo(() => segment(body, edited ? [] : draft.claims), [body, draft.claims, edited]);

  const approve = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    onApprove(subject, body);
  };

  return (
    <section aria-label="Draft" className="rounded-xl border border-rule bg-sheet">
      <header className="flex items-center justify-between border-b border-rule px-6 py-3 text-[12px] text-ink-2">
        <span>
          To <span className="text-ink">{result.prospect?.name}</span>
          {result.prospect?.email ? <span className="text-ink-3"> ({result.prospect.email})</span> : null}
        </span>
        <span className={approval === "approved" ? "font-medium text-ledger" : approval === "rejected" ? "font-medium text-brick" : "text-ink-3"}>
          {approval === "approved" ? "Approved" : approval === "rejected" ? "Rejected" : "Awaiting your review"}
        </span>
      </header>

      {editing ? (
        <div className="space-y-3 px-6 py-5">
          <label className="block text-2xs text-ink-3">
            Subject
            <input value={eSub} onChange={(e) => setESub(e.target.value)} className="mt-1 w-full rounded-md border border-rule px-3 py-2 text-[15px] text-ink" />
          </label>
          <label className="block text-2xs text-ink-3">
            Message
            <textarea value={eBody} onChange={(e) => setEBody(e.target.value)} rows={10} className="mt-1 w-full rounded-md border border-rule px-3 py-2 font-serif text-[15px] leading-relaxed text-ink" />
          </label>
          <div className="flex gap-2">
            <button onClick={() => { onSaveEdit(eSub, eBody); setEditing(false); }} className="rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-paper">
              Save edits
            </button>
            <button onClick={() => { setEditing(false); setESub(subject); setEBody(body); }} className="rounded-md px-3 py-1.5 text-[13px] text-ink-2 hover:bg-paper">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-5">
          <p className="text-[17px] font-semibold text-ink">{subject}</p>
          <div className="mt-4 whitespace-pre-wrap text-[15.5px] leading-[1.75] text-ink">
            {segs.map((s, i) =>
              s.n ? (
                <span key={i} className="cite" data-active={active === s.n} onMouseEnter={() => setActive(s.n!)} onMouseLeave={() => setActive(null)}>
                  {s.text}
                  <sup className="ml-0.5 font-sans text-[10px] font-semibold text-sky">{s.n}</sup>
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              )
            )}
          </div>
          {notes.length > 0 && (
            <ol className="mt-5 space-y-1 border-t border-rule pt-3 text-[12px] text-ink-2">
              {notes.map(({ n, claim }) => {
                const src = result.sources[claim.source_id];
                return (
                  <li key={n} className={`flex gap-2 ${active === n ? "text-ink" : ""}`} onMouseEnter={() => setActive(n)} onMouseLeave={() => setActive(null)}>
                    <span className="num w-3 shrink-0 font-semibold text-sky">{n}</span>
                    <span>
                      {src?.label || claim.source_id}
                      {src?.date ? `, ${src.date.slice(0, 10)}` : ""}
                      {src?.url && (
                        <a href={src.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-sky hover:underline" aria-label="Open source">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {edited && <p className="mt-4 text-2xs text-ink-3">Edited by you. Footnotes are hidden because the wording changed.</p>}
        </div>
      )}

      {draft.feedback_note && !editing && (
        <p className="mx-6 mb-4 flex gap-2 rounded-lg bg-rust-soft/60 px-3 py-2 text-[12px] text-ink-2">
          <Info size={14} className="mt-0.5 shrink-0 text-rust" />
          <span><span className="font-medium text-ink">Part of your request was not applied.</span> {draft.feedback_note}</span>
        </p>
      )}

      {asking && !editing && (
        <div className="border-t border-rule bg-sky-soft/50 px-6 py-4">
          <label htmlFor="fb" className="text-[13px] font-medium text-ink">What should change?</label>
          <p className="text-2xs text-ink-3">Tell it what to add, remove or change. It keeps every fact sourced, so it will say if it can't add something.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_ASKS.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setFb((v) => (v.includes(q) ? v : v ? `${v}. ${q}` : q))}
                className="rounded-full border border-sky/30 bg-sheet px-2.5 py-0.5 text-[12px] text-sky-deep hover:border-sky"
              >
                {q}
              </button>
            ))}
          </div>
          <textarea
            id="fb"
            value={fb}
            onChange={(e) => setFb(e.target.value)}
            rows={3}
            maxLength={600}
            autoFocus
            placeholder="e.g. Remove the Instacart line. Mention their Series F instead of hiring. End with a question about AP."
            className="mt-2 w-full rounded-lg border border-rule bg-sheet px-3 py-2 text-[14px] placeholder:text-ink-3"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button onClick={() => submitFb(fb)} disabled={busy || !fb.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-sky px-4 py-1.5 text-[13px] font-medium text-white hover:bg-sky-deep disabled:opacity-40">
              <RefreshCw size={14} className={busy ? "spin" : ""} /> Redraft with these changes
            </button>
            <button onClick={() => submitFb("")} disabled={busy} className="rounded-full px-3 py-1.5 text-[13px] text-ink-2 hover:bg-sheet disabled:opacity-40">
              Just try a fresh version
            </button>
            <button onClick={() => setAsking(false)} className="ml-auto text-[12px] text-ink-3 hover:text-ink">Cancel</button>
            <span className="num w-full text-2xs text-ink-3">{left} redraft{left === 1 ? "" : "s"} left for this run</span>
          </div>
        </div>
      )}

      {quality && !editing && <QualityStrip q={quality} />}

      {!editing && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-rule px-6 py-3">
          {rejecting ? (
            <>
              <span className="mr-1 text-[13px] text-ink-2">Why?</span>
              {REJECT_REASONS.map((r) => (
                <button key={r} onClick={() => { onReject(r); setRejecting(false); }} className="rounded-full border border-rule px-3 py-1 text-[12px] hover:border-brick hover:text-brick">
                  {r}
                </button>
              ))}
              <button onClick={() => setRejecting(false)} className="ml-auto text-[12px] text-ink-3 hover:text-ink">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={approve} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-ledger px-4 py-2 text-[13px] font-medium text-white hover:bg-ledger-deep disabled:opacity-50">
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Approve and copy"}
              </button>
              <button onClick={() => { setESub(subject); setEBody(body); setEditing(true); }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3.5 py-2 text-[13px] hover:bg-paper disabled:opacity-50">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => setAsking((v) => !v)} disabled={busy || regenerations >= 3} aria-expanded={asking} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] disabled:opacity-50 ${asking ? "border-sky bg-sky-soft text-sky-deep" : "border-rule hover:bg-paper"}`} title={regenerations >= 3 ? "Limit of 3 per run" : "Tell it what to change and redraft"}>
                <RefreshCw size={14} className={busy ? "spin" : ""} /> {busy ? "Redrafting" : "Regenerate"}
                <span className="num text-2xs text-ink-3">{left} left</span>
              </button>
              <button onClick={() => setRejecting(true)} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] text-ink-2 hover:bg-brick-soft hover:text-brick disabled:opacity-50">
                <X size={14} /> Reject
              </button>
            </>
          )}
        </footer>
      )}
    </section>
  );
}

function QualityStrip({ q }: { q: QualityReport }) {
  const items = [
    { k: "Words", v: `${q.words}`, ok: q.words <= q.maxWords, hint: `max ${q.maxWords}` },
    { k: "Reading grade", v: q.grade.toFixed(1), ok: q.grade <= 6.5, hint: "aim for 6 or below" },
    { k: "Questions", v: `${q.questions}`, ok: q.questions >= 1, hint: "one easy question" },
    { k: "You vs I/we", v: `${q.youCount} : ${q.iCount}`, ok: q.youCount >= q.iCount, hint: "more about them" },
    { k: "Unsourced claims", v: `${q.unsupportedClaims.length}`, ok: q.unsupportedClaims.length === 0, hint: "every fact traced" },
  ];
  return (
    <div className="border-t border-rule bg-paper/50 px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[13px]">
          Quality <span className={`num font-semibold ${q.score >= 85 ? "text-ledger" : q.score >= 70 ? "text-ink" : "text-rust"}`}>{q.score}</span>
          <span className="text-ink-3">/100</span>
        </span>
        {items.map((i) => (
          <span key={i.k} className="text-2xs text-ink-2" title={i.hint}>
            {i.k} <span className={`num font-medium ${i.ok ? "text-ink" : "text-rust"}`}>{i.v}</span>
          </span>
        ))}
      </div>
      {q.issues.length > 0 && <p className="mt-1.5 text-2xs text-rust">{q.issues.join(". ")}</p>}
    </div>
  );
}

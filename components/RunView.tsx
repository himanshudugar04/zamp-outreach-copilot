"use client";
import { useState } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { StageLog, type StageMap } from "./StageLog";
import { ProspectCard, SignalList } from "./Evidence";
import { Letter } from "./Letter";
import { EdgePanel } from "./EdgePanel";
import { PLAYBOOKS } from "@/lib/playbooks";
import { editShare, updateRun, type RunRecord } from "@/lib/store";
import type { Candidate, Hook, RunInput, ScoredSignal } from "@/lib/types";

export function RunView({
  record,
  stages,
  live,
  onRecordChange,
  onRerun,
}: {
  record?: RunRecord;
  stages: StageMap;
  live: boolean;
  onRecordChange: (r: RunRecord) => void;
  onRerun: (input: RunInput) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const result = record?.result;
  const input = record?.input;

  const patch = (p: Partial<RunRecord>) => {
    if (!record) return;
    const next = { ...record, ...p };
    updateRun(record.id, p);
    onRecordChange(next);
  };

  const redraft = async (hook: Hook, attempt: number) => {
    if (!record || !result?.prospect) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: record.input.purpose,
          sender: record.input.sender,
          prospect: result.prospect,
          company: result.company,
          hook,
          executive: !!result.executive,
          lowPersonalization: hook.source_id === "role",
          note: record.input.note,
          allowedSources: Object.keys(result.sources),
          attempt,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Draft failed");
      patch({
        result: {
          ...result,
          hook,
          draft: out.draft,
          quality: out.quality,
          usage: { ...result.usage, tokens: result.usage.tokens + (out.tokens || 0), llmCalls: result.usage.llmCalls + (out.calls || 0) },
        },
        finalBody: undefined,
        finalSubject: undefined,
        approval: "pending",
        regenerations: record.regenerations + 1,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const useSignal = (s: ScoredSignal) => {
    if (!s.judgement) return;
    redraft({ source_id: s.id, usable_fact: s.judgement.usable_fact, date: s.date || "", angle: s.judgement.angle, label: s.label }, (record?.regenerations ?? 0) + 2);
  };

  const pick = (c: Candidate) => input && onRerun({ purpose: input.purpose, sender: input.sender, note: input.note, linkedinUrl: c.profileUrl });
  const successor = (companyId: number, companyName: string, title: string) =>
    input && onRerun({ purpose: input.purpose, sender: input.sender, note: input.note, findSuccessor: { companyId, companyName, title } });
  const continueAnyway = () => input && onRerun({ ...input, ignoreFit: true });

  const playbook = input ? PLAYBOOKS[input.purpose] : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_360px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="order-2 lg:order-none lg:sticky lg:top-6 lg:self-start">
        <StageLog stages={stages} live={live} />
        {result && (
          <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-rule pt-3 text-2xs text-ink-3">
            <div><dt>Time</dt><dd className="num text-[13px] text-ink">{(result.durationMs / 1000).toFixed(1)}s</dd></div>
            <div><dt>Credits</dt><dd className="num text-[13px] text-ink">{result.usage.credits}</dd></div>
            <div><dt>AI calls</dt><dd className="num text-[13px] text-ink">{result.usage.llmCalls}</dd></div>
          </dl>
        )}
      </aside>

      <div className="order-1 min-w-0 space-y-4 lg:order-none">
        {!result && live && (
          <div className="rounded-xl border border-dashed border-rule bg-sheet/60 p-10 text-center text-ink-2">
            <p className="text-[17px] font-semibold text-ink">Researching before writing anything.</p>
            <p className="mt-1 text-[13px]">Each step on the left ticks off as it finishes. The draft appears only if there is something true and specific to say.</p>
          </div>
        )}

        {result?.status === "error" && (
          <div className="rounded-xl border border-brick/30 bg-brick-soft/60 p-5">
            <p className="font-semibold text-brick">The run stopped</p>
            <p className="mt-1 text-[13px] text-ink-2">{result.error}</p>
          </div>
        )}

        {result?.edge && <EdgePanel edge={result.edge} busy={busy || live} onPick={pick} onFindSuccessor={successor} onContinueAnyway={continueAnyway} />}

        {result?.hook && result.draft && (
          <>
            <HookCard hook={result.hook} result={result} purposeName={playbook?.name} />
            <Banners result={result} />
            {result.draft.status === "ok" ? (
              <Letter
                result={result}
                draft={result.draft}
                quality={result.quality}
                approval={record!.approval}
                finalSubject={record!.finalSubject}
                finalBody={record!.finalBody}
                regenerations={record!.regenerations}
                busy={busy}
                onApprove={(s, b) => patch({ approval: "approved", finalSubject: s, finalBody: b, editDistance: editShare(result.draft!.body, b) })}
                onSaveEdit={(s, b) => patch({ finalSubject: s, finalBody: b, editDistance: editShare(result.draft!.body, b) })}
                onRegenerate={() => redraft(result.hook!, record!.regenerations + 2)}
                onReject={(reason) => patch({ approval: "rejected", rejectReason: reason })}
              />
            ) : (
              <div className="rounded-xl border border-rust/30 bg-rust-soft/60 p-5">
                <p className="font-semibold">The writer declined to draft</p>
                <p className="mt-1 text-[13px] text-ink-2">{result.draft.insufficient_reason}</p>
                <p className="mt-1 text-2xs text-ink-3">Pick another signal on the right to try a different opening.</p>
              </div>
            )}
            {err && <p className="text-[13px] text-brick">{err}</p>}
          </>
        )}
      </div>

      <aside className="order-3 space-y-4 lg:order-none lg:col-span-2 xl:col-span-1">
        <ProspectCard p={result?.prospect} c={result?.company} />
        {result && result.signals.length > 0 && (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[13px] font-semibold">Signals, ranked</h2>
              <span className="text-2xs text-ink-3">{result.signals.filter((s) => !s.excluded).length} usable of {result.signals.length}</span>
            </div>
            <SignalList result={result} chosenId={result.hook?.source_id} onUse={result.draft ? useSignal : undefined} busy={busy} />
          </div>
        )}
        {result?.analysisNotes && result.analysisNotes.length > 0 && (
          <div className="rounded-lg border border-rule bg-sheet p-3 text-[12px] text-ink-2">
            <p className="mb-1 flex items-center gap-1 font-medium text-ink"><Info size={13} /> Notes for the reviewer</p>
            {result.analysisNotes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        )}
      </aside>
    </div>
  );
}

function HookCard({ hook, result, purposeName }: { hook: Hook; result: NonNullable<RunRecord["result"]>; purposeName?: string }) {
  const chosen = result.signals.find((s) => s.id === hook.source_id);
  const src = result.sources[hook.source_id];
  return (
    <section className="rounded-xl border-l-4 border-sky bg-sky-soft px-5 py-4">
      <p className="text-2xs font-medium text-sky-deep">Why this email, for {purposeName?.toLowerCase()}</p>
      <p className="mt-1 text-[17px] font-medium leading-snug text-ink">{hook.usable_fact}</p>
      <p className="mt-1 text-[13px] text-ink-2">{hook.angle}</p>
      <p className="mt-2 text-2xs text-ink-3">
        {src?.label}
        {chosen ? `, score ${chosen.score} (relevance ${chosen.judgement?.relevance ?? 0}/5, recency ${chosen.recency}/3)` : ""}
        {chosen?.sourceUrl && (
          <>
            {", "}
            <a href={chosen.sourceUrl} target="_blank" rel="noreferrer" className="text-sky hover:underline">open source</a>
          </>
        )}
      </p>
    </section>
  );
}

function Banners({ result }: { result: NonNullable<RunRecord["result"]> }) {
  const b: { tone: "rust" | "ink"; icon: any; title: string; text: string }[] = [];
  if (result.flags.lowPersonalization)
    b.push({ tone: "rust", icon: AlertTriangle, title: "No timely signal found", text: "This draft only uses their role and company. It is honest but generic. Consider waiting for a real trigger before sending." });
  if (result.flags.sensitiveSkipped)
    b.push({ tone: "rust", icon: ShieldAlert, title: "Skipped a sensitive signal", text: `${result.flags.sensitiveSkipped}. The draft uses the next-best signal instead.` });
  if (result.flags.personaWeak) b.push({ tone: "ink", icon: Info, title: "Weak persona fit", text: result.flags.personaWeak });
  if (result.executive) b.push({ tone: "ink", icon: Info, title: "Executive mode", text: "Senior prospect: kept under 70 words with a lighter ask." });
  if (!b.length) return null;
  return (
    <div className="space-y-2">
      {b.map((x) => (
        <div key={x.title} className={`flex gap-2.5 rounded-lg border px-4 py-2.5 text-[13px] ${x.tone === "rust" ? "border-rust/30 bg-rust-soft/60" : "border-rule bg-sheet"}`}>
          <x.icon size={15} className={`mt-0.5 shrink-0 ${x.tone === "rust" ? "text-rust" : "text-ink-2"}`} />
          <p><span className="font-medium">{x.title}.</span> <span className="text-ink-2">{x.text}</span></p>
        </div>
      ))}
    </div>
  );
}

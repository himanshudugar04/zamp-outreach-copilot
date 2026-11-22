"use client";
import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { STAGES, StageLog, type StageMap } from "./StageLog";
import { ProspectMini, SignalList } from "./Evidence";
import { Letter, segment } from "./Letter";
import { EdgePanel } from "./EdgePanel";
import { PLAYBOOKS, resolvePlaybook } from "@/lib/playbooks";
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
  const [active, setActive] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);
  const result = record?.result;
  const input = record?.input;
  const draftOk = result?.draft?.status === "ok" ? result.draft : undefined;
  const edited = !!draftOk && record?.finalBody !== undefined && record.finalBody !== draftOk.body;
  const notes = useMemo(
    () => (draftOk && !edited ? segment(record?.finalBody ?? draftOk.body, draftOk.claims).notes : []),
    [draftOk, edited, record?.finalBody]
  );

  const patch = (p: Partial<RunRecord>) => {
    if (!record) return;
    const next = { ...record, ...p };
    updateRun(record.id, p);
    onRecordChange(next);
  };

  const redraft = async (hook: Hook, attempt: number, feedback?: string) => {
    if (!record || !result?.prospect) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: record.input.purpose,
          playbookMd: record.input.playbookMd,
          companyMd: record.input.companyMd,
          sender: record.input.sender,
          prospect: result.prospect,
          company: result.company,
          hook,
          executive: !!result.executive,
          lowPersonalization: hook.source_id === "role",
          note: record.input.note,
          allowedSources: Object.keys(result.sources),
          supporting: hook.source_id === result.hook?.source_id ? result.supporting : [],
          attempt,
          feedback: feedback || undefined,
          previousDraft: feedback && result.draft ? { subject: record.finalSubject ?? result.draft.subject, body: record.finalBody ?? result.draft.body } : undefined,
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
        feedbackLog: feedback ? [...(record.feedbackLog || []), feedback] : record.feedbackLog,
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

  const carry = () => (input ? { purpose: input.purpose, purposeName: input.purposeName, playbookMd: input.playbookMd, companyMd: input.companyMd, sender: input.sender, note: input.note } : null);
  const pick = (c: Candidate) => input && onRerun({ ...carry()!, linkedinUrl: c.profileUrl });
  const successor = (companyId: number, companyName: string, title: string) => input && onRerun({ ...carry()!, findSuccessor: { companyId, companyName, title } });
  const continueAnyway = () => input && onRerun({ ...input, ignoreFit: true });

  const playbook = input ? { name: input.purposeName || PLAYBOOKS[input.purpose]?.name || input.purpose } : undefined;

  const pb = input ? resolvePlaybook(input.purpose, input.playbookMd) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_340px]">
      {/* Left: who, and where every line came from */}
      <aside className="order-2 space-y-6 lg:order-none lg:sticky lg:top-6 lg:self-start">
        {result?.prospect && <ProspectMini p={result.prospect} c={result.company} />}
        {notes.length > 0 && (
          <section aria-label="Where this came from">
            <h2 className="text-[15px] font-semibold">Where this came from</h2>
            <ol className="mt-2 space-y-1.5">
              {notes.map(({ n, claim }) => {
                const src = result!.sources[claim.source_id];
                return (
                  <li
                    key={n}
                    onMouseEnter={() => setActive(n)}
                    onMouseLeave={() => setActive(null)}
                    className={`flex gap-2 rounded-md px-1.5 py-1 text-[13px] ${active === n ? "bg-marker text-ink" : "text-ink-2"}`}
                  >
                    <span className="num w-4 shrink-0 font-semibold text-sky">{n}</span>
                    <span className="min-w-0">
                      {src?.label || claim.source_id}
                      {src?.url && (
                        <a href={src.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex align-middle text-sky" aria-label="Open source">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
        {result && (
          <div>
            <button onClick={() => setShowLog((v) => !v)} aria-expanded={showLog} className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
              How this was researched <ChevronDown size={14} className={showLog ? "rotate-180" : ""} />
            </button>
            {showLog && (
              <div className="mt-3 rounded-xl border border-rule bg-sheet p-4">
                <StageLog stages={stages} live={live} />
                {result && (
                  <p className="num mt-4 border-t border-rule pt-3 text-[12px] text-ink-3">
                    {(result.durationMs / 1000).toFixed(1)}s, {result.usage.credits} Crustdata credits, {result.usage.llmCalls} AI calls
                  </p>
                )}
                {result?.analysisNotes?.map((n, i) => <p key={i} className="mt-2 text-[12px] text-ink-2">{n}</p>)}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Centre: the email */}
      <div className="order-1 min-w-0 space-y-4 lg:order-none">
        {!result && live && <Progress stages={stages} />}

        {result?.status === "error" && (
          <div className="rounded-xl border border-brick/30 bg-brick-soft/60 p-5">
            <p className="text-[16px] font-semibold text-brick">The run stopped</p>
            <p className="mt-1 text-[14px] text-ink-2">{result.error}</p>
          </div>
        )}

        {result?.edge && <EdgePanel edge={result.edge} busy={busy || live} onPick={pick} onFindSuccessor={successor} onContinueAnyway={continueAnyway} />}

        {result?.hook && result.draft && (
          <>
            <WhyNow hook={result.hook} result={result} />
            <Notice result={result} execRange={pb?.execLength} />
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
                active={active}
                setActive={setActive}
                onApprove={(s, b) => patch({ approval: "approved", finalSubject: s, finalBody: b, editDistance: editShare(`${result.draft!.subject}\n${result.draft!.body}`, `${s}\n${b}`) })}
                onSaveEdit={(s, b) => patch({ finalSubject: s, finalBody: b, editDistance: editShare(`${result.draft!.subject}\n${result.draft!.body}`, `${s}\n${b}`) })}
                onRegenerate={(fb) => redraft(result.hook!, record!.regenerations + 2, fb)}
                onReject={(reason) => patch({ approval: "rejected", rejectReason: reason })}
              />
            ) : (
              <div className="rounded-xl border border-rust/30 bg-rust-soft/60 p-5">
                <p className="text-[16px] font-semibold">Nothing true and specific enough to write</p>
                <p className="mt-1 text-[14px] text-ink-2">{result.draft.insufficient_reason}</p>
                <p className="mt-1 text-[13px] text-ink-3">Open one of the findings on the right and choose “Write from this instead”.</p>
              </div>
            )}
            {err && <p className="text-[14px] text-brick">{err}</p>}
          </>
        )}
      </div>

      {/* Right: what we found, as headlines */}
      <aside className="order-3 lg:order-none lg:col-span-2 xl:col-span-1">
        {result && result.signals.length > 0 && (
          <>
            <h2 className="mb-2 text-[15px] font-semibold">What we found</h2>
            <SignalList result={result} chosenId={result.hook?.source_id} onUse={result.draft ? useSignal : undefined} busy={busy} />
          </>
        )}
      </aside>
    </div>
  );
}

const FRIENDLY: Record<string, string> = {
  resolve: "Finding the right person",
  person: "Reading their profile",
  company: "Checking company news, jobs, posts and press",
  hiring: "Checking company news, jobs, posts and press",
  posts: "Checking company news, jobs, posts and press",
  news: "Checking company news, jobs, posts and press",
  analyze: "Picking the strongest reason to write",
  draft: "Writing the draft",
  check: "Checking every fact against its source",
};

function Progress({ stages }: { stages: StageMap }) {
  const running = STAGES.find((s) => stages[s.id]?.status === "running");
  const label = running ? FRIENDLY[running.id] : "Starting";
  return (
    <div className="rounded-xl border border-rule bg-sheet px-6 py-6">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-ink">
        <Loader2 size={18} className="spin text-sky" /> {label}…
      </p>
      <p className="mt-1 text-[14px] text-ink-2">The draft appears only if there is something true and specific to say.</p>
      <div className="mt-5 border-t border-rule pt-5">
        <StageLog stages={stages} live simple />
      </div>
    </div>
  );
}

function WhyNow({ hook, result }: { hook: Hook; result: NonNullable<RunRecord["result"]> }) {
  const chosen = result.signals.find((s) => s.id === hook.source_id);
  return (
    <section className="rounded-xl bg-sky-soft px-5 py-3.5">
      <p className="text-[12px] font-medium text-sky-deep">Why write now</p>
      <p className="mt-0.5 text-[16px] leading-snug text-ink">
        {hook.usable_fact}
        {chosen?.sourceUrl && (
          <a href={chosen.sourceUrl} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[13px] text-sky hover:underline">
            source <ExternalLink size={11} />
          </a>
        )}
      </p>
    </section>
  );
}

function Notice({ result, execRange }: { result: NonNullable<RunRecord["result"]>; execRange?: { min: number; max: number } }) {
  const parts: string[] = [];
  if (result.flags.lowPersonalization) parts.push("No timely signal found, so this only uses their role. Consider waiting for a real trigger.");
  if (result.flags.personaWeak) parts.push(result.flags.personaWeak);
  if (result.flags.sensitiveSkipped) parts.push("Sensitive news about the company was left out on purpose.");
  if (result.executive && execRange) parts.push(`Senior reader, so kept to ${execRange.min} to ${execRange.max} words.`);
  if (!parts.length) return null;
  const warn = result.flags.lowPersonalization || result.flags.personaWeak;
  return <p className={`px-1 text-[13px] ${warn ? "text-rust" : "text-ink-3"}`}>{parts.join(" ")}</p>;
}

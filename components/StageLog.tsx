"use client";
import { AlertTriangle, Check, Circle, Loader2, Minus, X } from "lucide-react";
import type { StageEvent, StageId } from "@/lib/types";

export const STAGES: { id: StageId; label: string; group: "identity" | "research" | "judgment" }[] = [
  { id: "resolve", label: "Find the right person", group: "identity" },
  { id: "person", label: "Read their profile", group: "identity" },
  { id: "company", label: "Company profile", group: "research" },
  { id: "hiring", label: "Finance-ops hiring", group: "research" },
  { id: "posts", label: "LinkedIn posts", group: "research" },
  { id: "news", label: "News, press and interviews", group: "research" },
  { id: "analyze", label: "Judge every signal", group: "judgment" },
  { id: "draft", label: "Write the draft", group: "judgment" },
  { id: "check", label: "Quality check", group: "judgment" },
];

const GROUP_LABEL = { identity: "Identity", research: "Research, in parallel", judgment: "Judgment" };

export type StageMap = Partial<Record<StageId, StageEvent>>;

function Icon({ s }: { s?: StageEvent }) {
  const st = s?.status ?? "pending";
  if (st === "running") return <Loader2 size={15} className="spin text-sky" aria-label="Running" />;
  if (st === "done") return <Check size={15} className="text-ledger" aria-label="Done" />;
  if (st === "warn") return <AlertTriangle size={15} className="text-rust" aria-label="Needs attention" />;
  if (st === "error") return <X size={15} className="text-brick" aria-label="Failed" />;
  if (st === "skipped") return <Minus size={15} className="text-ink-3" aria-label="Skipped" />;
  return <Circle size={9} className="mx-[3px] text-rule" fill="currentColor" aria-label="Waiting" />;
}

export function StageLog({ stages, live }: { stages: StageMap; live: boolean }) {
  const groups = ["identity", "research", "judgment"] as const;
  const totalCredits = Object.values(stages).reduce((n, s) => n + (s?.credits ?? 0), 0);
  return (
    <section aria-label="Run log" aria-live="polite">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">Run log</h2>
        <span className="num text-2xs text-ink-3">{totalCredits ? `${Math.round(totalCredits * 100) / 100} credits` : live ? "starting" : ""}</span>
      </div>
      <ol className="space-y-4">
        {groups.map((g) => (
          <li key={g}>
            <p className="mb-1.5 text-2xs text-ink-3">{GROUP_LABEL[g]}</p>
            <ol className="relative ml-[7px] border-l border-rule">
              {STAGES.filter((x) => x.group === g).map((x) => {
                const s = stages[x.id];
                const muted = !s || s.status === "pending" || s.status === "skipped";
                return (
                  <li key={x.id} className="relative pb-2.5 pl-5 last:pb-0">
                    <span className="absolute -left-[8px] top-[2px] grid h-4 w-4 place-items-center bg-paper">
                      <Icon s={s} />
                    </span>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-[13px] ${muted ? "text-ink-3" : "text-ink"}`}>{x.label}</span>
                      {s?.ms !== undefined && s.status !== "skipped" && (
                        <span className="num shrink-0 text-2xs text-ink-3">{s.ms < 1000 ? `${s.ms} ms` : `${(s.ms / 1000).toFixed(1)} s`}</span>
                      )}
                    </div>
                    {s?.detail && (
                      <p className={`text-2xs ${s.status === "error" ? "text-brick" : s.status === "warn" ? "text-rust" : "text-ink-2"}`}>
                        {s.detail}
                        {s.credits ? <span className="num text-ink-3">, {s.credits} cr</span> : null}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";
import { ArrowRightLeft, Ban, UserRoundSearch, Users } from "lucide-react";
import type { Candidate, EdgeCase } from "@/lib/types";

export function EdgePanel({
  edge,
  busy,
  onPick,
  onFindSuccessor,
  onContinueAnyway,
}: {
  edge: EdgeCase;
  busy: boolean;
  onPick: (c: Candidate) => void;
  onFindSuccessor: (companyId: number, companyName: string, title: string) => void;
  onContinueAnyway: () => void;
}) {
  const stop = edge.kind === "suppressed" || edge.kind === "redacted";
  const Icon = stop ? Ban : edge.kind === "moved" ? ArrowRightLeft : edge.kind === "ambiguous" || edge.kind === "successors" ? Users : UserRoundSearch;
  return (
    <section className={`rounded-xl border p-6 ${stop ? "border-brick/30 bg-brick-soft/50" : "border-rust/30 bg-rust-soft/60"}`} aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon size={20} className={stop ? "text-brick" : "text-rust"} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold">{edge.title}</h2>
          <p className="mt-1 text-[14px] text-ink-2">{edge.message}</p>
          {!stop && <p className="mt-1 text-2xs text-ink-3">No draft was written and no OpenAI tokens were spent.</p>}

          {edge.kind === "moved" && edge.moved && (
            <div className="mt-4 flex flex-wrap gap-2">
              {edge.moved.profileUrl && (
                <button
                  disabled={busy}
                  onClick={() => onPick({ name: "", profileUrl: edge.moved!.profileUrl })}
                  className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  Write to them at {edge.moved.newCompany || "their new company"}
                </button>
              )}
              {edge.moved.oldCompanyId ? (
                <button
                  disabled={busy}
                  onClick={() => onFindSuccessor(edge.moved!.oldCompanyId, edge.moved!.oldCompany, edge.moved!.oldTitle)}
                  className="rounded-full border border-ink/20 bg-sheet px-4 py-2 text-[13px] font-medium disabled:opacity-50"
                >
                  Find who replaced them at {edge.moved.oldCompany}
                </button>
              ) : null}
            </div>
          )}

          {edge.kind === "not_fit" && (
            <div className="mt-4">
              <button disabled={busy} onClick={onContinueAnyway} className="rounded-full border border-ink/20 bg-sheet px-4 py-2 text-[13px] font-medium disabled:opacity-50">
                I know this person is relevant, write anyway
              </button>
            </div>
          )}

          {edge.candidates && edge.candidates.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {edge.candidates.map((c, i) => (
                <li key={(c.profileUrl || c.name) + i} className="rounded-lg border border-rule bg-sheet p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[12px] text-ink-2">{[c.title, c.company].filter(Boolean).join(" at ") || c.headline}</p>
                  <p className="text-2xs text-ink-3">
                    {[c.location, c.startDate ? `in role since ${c.startDate.slice(0, 7)}` : ""].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {c.profileUrl ? (
                      <a href={c.profileUrl} target="_blank" rel="noreferrer" className="text-2xs text-ink-3 hover:text-ledger">
                        View profile
                      </a>
                    ) : (
                      <span />
                    )}
                    <button disabled={busy || !c.profileUrl} onClick={() => onPick(c)} className="text-[13px] font-medium text-sky hover:underline disabled:opacity-40">
                      This is the one
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";
import { Banknote, Briefcase, ExternalLink, MapPin, MessageSquareText, Newspaper, ShieldAlert, TrendingDown, TrendingUp, UserRound } from "lucide-react";
import type { SignalType } from "@/lib/types";

const TYPE_STYLE: Record<SignalType, { cls: string; icon: any }> = {
  funding: { cls: "bg-ledger-soft text-ledger-deep", icon: Banknote },
  finops_hiring: { cls: "bg-sky-soft text-sky-deep", icon: Briefcase },
  hiring_growth: { cls: "bg-sky-soft text-sky-deep", icon: Briefcase },
  headcount_growth: { cls: "bg-teal-soft text-teal", icon: TrendingUp },
  headcount_decline: { cls: "bg-brick-soft text-brick", icon: TrendingDown },
  news: { cls: "bg-violet-soft text-violet", icon: Newspaper },
  person_post: { cls: "bg-rust-soft text-rust", icon: MessageSquareText },
  company_post: { cls: "bg-rust-soft text-rust", icon: MessageSquareText },
  new_in_role: { cls: "bg-teal-soft text-teal", icon: UserRound },
  role: { cls: "bg-paper text-ink-2", icon: UserRound },
  location: { cls: "bg-paper text-ink-2", icon: MapPin },
  person_press: { cls: "bg-brand-soft text-brand", icon: Newspaper },
};
import type { CompanyInfo, Prospect, RunResult, ScoredSignal } from "@/lib/types";
import { fmtDate, money, prettyRound } from "@/lib/signals";

function age(d: number | null) {
  if (d === null) return "undated";
  if (d === 0) return "today";
  if (d < 31) return `${d}d old`;
  if (d < 365) return `${Math.round(d / 30)}mo old`;
  return `${(d / 365).toFixed(1)}y old`;
}

function ageTone(d: number | null) {
  if (d === null) return "text-ink-3";
  if (d <= 30) return "text-ledger font-medium";
  if (d <= 90) return "text-ink-2";
  return "text-rust";
}

export function ProspectCard({ p, c }: { p?: Prospect; c?: CompanyInfo }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!p) return null;
  const tenure = p.startDate ? Math.max(0, Math.round((Date.now() - Date.parse(p.startDate)) / (30 * 864e5))) : null;
  return (
    <div className="rounded-lg border border-rule bg-sheet p-4">
      <div className="flex items-start gap-3">
        {p.photo && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt="" onError={() => setImgFailed(true)} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-[17px] font-semibold text-brand">{p.firstName?.[0]}</span>
        )}
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{p.name}</p>
          <p className="text-[13px] text-ink-2">{p.title}</p>
          {p.profileUrl && (
            <a href={p.profileUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-2xs text-sky hover:underline">
              LinkedIn profile <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Fact k="In role" v={tenure !== null ? (tenure < 1 ? "under a month" : `${tenure} months`) : "unknown"} />
        <Fact k="Location" v={p.location || "unknown"} />
        <Fact k="Company" v={c?.name || "unknown"} />
        <Fact k="People" v={c?.headcount ? `${c.headcount.toLocaleString("en-US")}${c.headcountQoq !== undefined ? ` (${c.headcountQoq > 0 ? "+" : ""}${c.headcountQoq.toFixed(1)}% qoq)` : ""}` : "unknown"} />
        <Fact k="Last round" v={c?.lastRoundDate ? `${prettyRound(c.lastRound)}${c.lastRoundUsd ? `, ${money(c.lastRoundUsd)}` : ""}, ${fmtDate(c.lastRoundDate)}` : "none found"} />
        <Fact k="Work email" v={p.email ? "found" : "not found"} />
      </dl>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs text-ink-3">{k}</dt>
      <dd className="truncate" title={v}>{v}</dd>
    </div>
  );
}

export function SignalList({
  result,
  chosenId,
  onUse,
  busy,
}: {
  result: RunResult;
  chosenId?: string;
  onUse?: (s: ScoredSignal) => void;
  busy?: boolean;
}) {
  const [all, setAll] = useState(false);
  const s = result.signals;
  if (!s.length) return <p className="text-[13px] text-ink-3">No signals found for this person yet.</p>;
  const max = Math.max(...s.map((x) => x.score), 1);
  const shown = all ? s : s.slice(0, 5);
  return (
    <>
    <ol className="space-y-2">
      {shown.map((sig) => {
        const chosen = sig.id === chosenId;
        const j = sig.judgement;
        return (
          <li key={sig.id} className={`rounded-xl border p-3 ${chosen ? "border-sky bg-sky-soft/60 ring-1 ring-sky/30" : "border-rule bg-sheet"}`}>
            <div className="flex items-center justify-between gap-2 text-2xs">
              <span className="flex items-center gap-1.5">
                {(() => { const t = TYPE_STYLE[sig.type]; const I = t.icon; return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${t.cls}`}><I size={11} />{sig.label}</span>; })()}
                <span className={ageTone(sig.ageDays)}>{age(sig.ageDays)}</span>
              </span>
              <span className="num flex items-center gap-1.5 text-ink-2" title="Score = relevance x 2 + recency + specificity">
                <span className="h-1 w-12 overflow-hidden rounded-full bg-paper">
                  <span className={`block h-full ${chosen ? "bg-sky" : "bg-ink-3"}`} style={{ width: `${Math.max(4, (sig.score / max) * 100)}%` }} />
                </span>
                {sig.score}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink">{sig.text}</p>
            {j?.angle && <p className="mt-1 text-[12px] italic text-ink-2">{j.angle}</p>}
            <div className="mt-1.5 flex items-center justify-between gap-2 text-2xs">
              {sig.sourceUrl ? (
                <a href={sig.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-3 hover:text-sky">
                  {sig.sourceName} <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-ink-3">{sig.sourceName}</span>
              )}
              {chosen ? (
                <span className="rounded-full bg-sky px-2 py-0.5 font-medium text-white">Chosen hook</span>
              ) : sig.excluded === "sensitive" ? (
                <span className="inline-flex items-center gap-1 text-rust" title={j?.sensitive_reason}>
                  <ShieldAlert size={11} /> Sensitive, never a hook
                </span>
              ) : sig.excluded === "injection" ? (
                <span className="text-brick">Suspicious text, ignored</span>
              ) : sig.excluded === "weak" ? (
                <span className="text-ink-3">Too weak</span>
              ) : onUse ? (
                <button disabled={busy} onClick={() => onUse(sig)} className="font-medium text-sky hover:underline disabled:opacity-40">
                  Use this instead
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
    {s.length > 5 && (
      <button onClick={() => setAll((v) => !v)} className="mt-2 text-[12px] text-ledger hover:underline">
        {all ? "Show top 5 only" : `Show ${s.length - 5} more signals`}
      </button>
    )}
    </>
  );
}

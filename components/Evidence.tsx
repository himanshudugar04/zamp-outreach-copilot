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
        <Fact k="Work email" v={p.email ? "found" : p.staleEmail ? `only an old one (${p.staleEmail.split("@")[1]})` : "not found"} />
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
  const [open, setOpen] = useState<string | null>(null);
  const s = result.signals;
  if (!s.length) return <p className="text-[14px] text-ink-3">Nothing recent found for this person yet.</p>;
  const usable = s.filter((x) => !x.excluded);
  const rest = s.filter((x) => x.excluded);
  const shown = all ? [...usable, ...rest] : usable.slice(0, 6);
  return (
    <>
      <ul className="divide-y divide-rule rounded-xl border border-rule bg-sheet">
        {shown.map((sig) => {
          const chosen = sig.id === chosenId;
          const isOpen = open === sig.id;
          const t = TYPE_STYLE[sig.type];
          const I = t.icon;
          return (
            <li key={sig.id} className={chosen ? "bg-sky-soft/50" : ""}>
              <button
                onClick={() => setOpen(isOpen ? null : sig.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-paper/60"
              >
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${t.cls}`} title={sig.label}>
                  <I size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] leading-snug text-ink ${isOpen ? "" : "line-clamp-2"}`}>{headline(sig)}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-3">
                    {sig.sourceName}{sig.ageDays !== null && <>, <span className={ageTone(sig.ageDays)}>{age(sig.ageDays)}</span></>}
                    {chosen && <span className="ml-1.5 font-medium text-sky">Used in the email</span>}
                    {sig.excluded === "sensitive" && <span className="ml-1.5 text-rust">Sensitive, not used</span>}
                    {sig.excluded === "stale" && <span className="ml-1.5 text-ink-3">Too old to use</span>}
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="space-y-2 px-3.5 pb-3 pl-[50px] text-[13px]">
                  {sig.text !== headline(sig) && <p className="text-ink-2">{sig.text}</p>}
                  {sig.judgement?.angle && <p className="text-ink-2">{sig.judgement.angle}</p>}
                  <div className="flex flex-wrap items-center gap-3">
                    {sig.sourceUrl && (
                      <a href={sig.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-sky hover:underline">
                        Open source <ExternalLink size={12} />
                      </a>
                    )}
                    {!chosen && !sig.excluded && onUse && (
                      <button disabled={busy} onClick={() => onUse(sig)} className="font-medium text-ink hover:underline disabled:opacity-40">
                        Write from this instead
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {s.length > shown.length || all ? (
        <button onClick={() => setAll((v) => !v)} className="mt-2 text-[13px] text-ink-2 hover:text-ink hover:underline">
          {all ? "Show fewer" : `Show ${s.length - shown.length} more`}
        </button>
      ) : null}
    </>
  );
}

/** One readable line: news keeps its headline, everything else its first sentence. */
function headline(sig: ScoredSignal) {
  const clean = sig.text.replace(/^\[Repost, not their own words\]\s*/, "").replace(/\s+/g, " ").trim();
  // First sentence with real content: skip openers like "Hey." or "Two days."
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const first = sentences.find((x) => x.split(" ").length >= 5) || clean;
  const line = first.length > 140 ? first.slice(0, 137).trimEnd() + "…" : first;
  return sig.text.startsWith("[Repost") ? `Repost: ${line}` : line;
}

export function ProspectMini({ p, c }: { p?: Prospect; c?: CompanyInfo }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!p) return null;
  return (
    <div className="flex items-center gap-3">
      {p.photo && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo} alt="" onError={() => setImgFailed(true)} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-[17px] font-semibold text-brand">{p.firstName?.[0]}</span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight">{p.name}</p>
        <p className="truncate text-[13px] text-ink-2">{p.title}{c?.name ? `, ${c.name}` : ""}</p>
        {p.profileUrl && (
          <a href={p.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-sky hover:underline">
            LinkedIn <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

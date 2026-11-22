"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Plus, Settings2 } from "lucide-react";
import { RunView } from "@/components/RunView";
import { useRunner } from "@/lib/useRunner";
import { getSender, listRuns, setSender, type RunRecord } from "@/lib/store";
import { PLAYBOOKS } from "@/lib/playbooks";
import { filesForRun, listPurposes, type PurposeEntry } from "@/lib/playbookStore";
import type { PurposeId, RunInput, Sender } from "@/lib/types";

export default function Home() {
  const { stages, record, setRecord, live, start } = useRunner();
  const [purpose, setPurpose] = useState<PurposeId>("sales_outreach");
  const [byUrl, setByUrl] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [sender, setS] = useState<Sender>({ name: "Himanshu", role: "Account Executive, Zamp" });
  const [showSender, setShowSender] = useState(false);
  const [purposes, setPurposes] = useState<PurposeEntry[]>([]);
  const [recent, setRecent] = useState<RunRecord[]>([]);
  const started = live || !!record;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    setS(getSender());
    setPurposes(listPurposes());
    setRecent(listRuns().slice(0, 5));
  }, []);

  const canRun = byUrl ? /linkedin\.com\/in\//i.test(url) : name.trim().length > 1 && company.trim().length > 1;

  const run = (override?: Partial<RunInput>) => {
    const input: RunInput = {
      purpose,
      ...filesForRun(purpose),
      sender,
      note: note.trim() || undefined,
      ...(byUrl ? { linkedinUrl: url.trim() } : { name: name.trim(), company: company.trim() }),
      ...override,
    };
    start(input);
  };

  return (
    <div className={`mx-auto px-5 md:px-8 ${started ? "max-w-[1440px] py-6" : "max-w-[960px] py-10"}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canRun && !live) run();
        }}
        className={`rounded-2xl border border-rule bg-sheet ${started ? "p-4 md:p-5" : "p-6 md:p-8"}`}
      >
        <h1 className={`${started ? "text-[20px]" : "text-[26px]"} font-semibold leading-tight tracking-tight text-ink`}>Who are you writing to?</h1>

        <div className="mt-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Purpose">
          {purposes.map(({ playbook: p, custom }) => (
            <button
              type="button"
              role="radio"
              aria-checked={purpose === p.id}
              key={p.id}
              onClick={() => setPurpose(p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[14px] ${purpose === p.id ? "border-ink bg-ink text-white" : "border-rule bg-sheet text-ink-2 hover:border-ink-3 hover:text-ink"}`}
            >
              {p.name}
              {custom && <span className={`rounded px-1 text-[10px] ${purpose === p.id ? "bg-white/20" : "bg-violet/10 text-violet"}`}>yours</span>}
            </button>
          ))}
          <Link href="/playbooks#add" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] text-ink-3 hover:text-ink">
            <Plus size={14} /> Add a purpose
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          {byUrl ? (
            <input
              aria-label="LinkedIn profile URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/..."
              className="h-12 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[16px] placeholder:text-ink-3 focus:bg-sheet"
            />
          ) : (
            <>
              <input aria-label="Prospect name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prospect name" className="h-12 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[16px] placeholder:text-ink-3 focus:bg-sheet" />
              <input aria-label="Company name or domain" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or domain" className="h-12 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[16px] placeholder:text-ink-3 focus:bg-sheet" />
            </>
          )}
          <button
            type="submit"
            disabled={!ready || !canRun || live}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {live ? <Loader2 size={16} className="spin" /> : null}
            {live ? "Researching" : "Research and draft"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <button type="button" onClick={() => setByUrl((v) => !v)} className="text-sky hover:underline">
            {byUrl ? "Use name and company instead" : "Have a LinkedIn URL? Use that"}
          </button>
          <button type="button" onClick={() => setShowNote((v) => !v)} className="text-sky hover:underline">
            {showNote ? "Hide context" : "Add context you know"}
          </button>
          <button type="button" onClick={() => setShowSender((v) => !v)} className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            <Settings2 size={13} /> Sending as {sender.name}
          </button>
        </div>

        {showNote && (
          <textarea
            aria-label="Context you know"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional. Something only you know, such as where you met. It becomes the opening line."
            className="mt-3 w-full rounded-lg border border-rule px-3.5 py-2 text-[14px] placeholder:text-ink-3"
          />
        )}
        {showSender && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg bg-paper p-3 md:flex-row md:items-end">
            <label className="flex-1 text-2xs text-ink-3">
              Your first name
              <input value={sender.name} onChange={(e) => setS({ ...sender, name: e.target.value })} className="mt-1 h-9 w-full rounded-md border border-rule bg-sheet px-3 text-[14px] text-ink" />
            </label>
            <label className="flex-1 text-2xs text-ink-3">
              Your role
              <input value={sender.role} onChange={(e) => setS({ ...sender, role: e.target.value })} className="mt-1 h-9 w-full rounded-md border border-rule bg-sheet px-3 text-[14px] text-ink" />
            </label>
            <button type="button" onClick={() => { setSender(sender); setShowSender(false); }} className="h-9 rounded-md bg-ink px-3 text-[13px] font-medium text-paper">
              Save
            </button>
          </div>
        )}
      </form>

      <div className="mt-6">
        {started ? (
          <RunView record={record} stages={stages} live={live} onRecordChange={setRecord} onRerun={(i) => start(i)} />
        ) : (
          <Recent runs={recent} />
        )}
      </div>
    </div>
  );
}

function Recent({ runs }: { runs: RunRecord[] }) {
  if (!runs.length) return <p className="px-2 text-[15px] text-ink-3">Your drafts will show up here.</p>;
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[17px] font-semibold">Recent</h2>
        <Link href="/dashboard" className="text-[13px] text-ink-2 hover:text-ink hover:underline">All runs</Link>
      </div>
      <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-sheet">
        {runs.map((r) => {
          const st = r.approval === "approved" ? ["Approved", "text-ledger"] : r.approval === "rejected" ? ["Rejected", "text-brick"] : r.result?.status === "drafted" ? ["Draft ready", "text-sky"] : r.result?.status === "needs_input" ? ["Needs you", "text-rust"] : ["Stopped", "text-ink-3"];
          const who = r.result?.prospect;
          return (
            <li key={r.id}>
              <Link href={`/runs/${r.id}`} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-paper/60">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{who?.name || r.input.name || "LinkedIn profile"}</span>
                  <span className="block truncate text-[13px] text-ink-2">
                    {[who?.title, r.result?.company?.name || r.input.company].filter(Boolean).join(", ")}
                  </span>
                </span>
                <span className="hidden text-[13px] text-ink-3 sm:block">{r.input.purposeName || PLAYBOOKS[r.input.purpose]?.name || r.input.purpose}</span>
                <span className={`w-24 text-right text-[13px] font-medium ${st[1]}`}>{st[0]}</span>
                <ArrowUpRight size={16} className="text-ink-3 group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

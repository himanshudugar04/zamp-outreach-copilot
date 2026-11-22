"use client";
import { useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { RunView } from "@/components/RunView";
import { useRunner } from "@/lib/useRunner";
import { getSender, setSender } from "@/lib/store";
import { PLAYBOOKS } from "@/lib/playbooks";
import { DEMOS } from "@/lib/demos";
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
  const started = live || !!record;

  useEffect(() => setS(getSender()), []);

  const canRun = byUrl ? /linkedin\.com\/in\//i.test(url) : name.trim().length > 1 && company.trim().length > 1;

  const run = (override?: Partial<RunInput>) => {
    const input: RunInput = {
      purpose,
      sender,
      note: note.trim() || undefined,
      ...(byUrl ? { linkedinUrl: url.trim() } : { name: name.trim(), company: company.trim() }),
      ...override,
    };
    start(input);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canRun && !live) run();
        }}
        className="rounded-xl border border-rule bg-sheet p-4 md:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink">Who are you writing to?</h1>
            <p className="text-[13px] text-ink-2">Name the prospect. The desk researches them, picks one true reason to write, and drafts. You approve.</p>
          </div>
          <div role="radiogroup" aria-label="Purpose" className="flex gap-1 rounded-xl bg-paper p-1">
            {(Object.keys(PLAYBOOKS) as PurposeId[]).map((id) => (
              <button
                type="button"
                role="radio"
                aria-checked={purpose === id}
                key={id}
                onClick={() => setPurpose(id)}
                className={`rounded-lg px-3 py-1.5 text-left ${purpose === id ? "bg-sheet text-ink shadow-[0_1px_2px_rgba(23,23,23,0.08)] ring-1 ring-rule" : "text-ink-2 hover:text-ink"}`}
              >
                <span className="block text-[13px] font-medium">{PLAYBOOKS[id].name}</span>
                <span className={`block text-2xs ${purpose === id ? "text-sky" : "text-ink-3"}`}>{PLAYBOOKS[id].persona}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          {byUrl ? (
            <input
              aria-label="LinkedIn profile URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/..."
              className="h-11 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[15px] placeholder:text-ink-3 focus:bg-sheet"
            />
          ) : (
            <>
              <input aria-label="Prospect name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prospect name" className="h-11 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[15px] placeholder:text-ink-3 focus:bg-sheet" />
              <input aria-label="Company name or domain" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or domain" className="h-11 flex-1 rounded-xl border border-rule bg-paper/60 px-4 text-[15px] placeholder:text-ink-3 focus:bg-sheet" />
            </>
          )}
          <button
            type="submit"
            disabled={!canRun || live}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {live ? <Loader2 size={16} className="spin" /> : null}
            {live ? "Researching" : "Research and draft"}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
          <button type="button" onClick={() => setByUrl((v) => !v)} className="text-sky hover:underline">
            {byUrl ? "Use name and company instead" : "Have a LinkedIn URL? Use that"}
          </button>
          <button type="button" onClick={() => setShowNote((v) => !v)} className="text-sky hover:underline">
            {showNote ? "Hide context" : "Add context you know"}
          </button>
          <button type="button" onClick={() => setShowSender((v) => !v)} className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            <Settings2 size={13} /> Sending as {sender.name}
          </button>
          {DEMOS.length > 0 && (
            <span className="ml-auto flex flex-wrap items-center gap-1.5">
              <span className="text-ink-3">Try:</span>
              {DEMOS.map((d) => (
                <button
                  type="button"
                  key={d.label}
                  title={d.what}
                  disabled={live}
                  onClick={() => {
                    setPurpose(d.purpose);
                    if (d.linkedinUrl) {
                      setByUrl(true);
                      setUrl(d.linkedinUrl);
                    } else {
                      setByUrl(false);
                      setName(d.name || "");
                      setCompany(d.company || "");
                    }
                  }}
                  className="rounded-full bg-sky-soft px-2.5 py-0.5 text-sky-deep hover:bg-sky hover:text-white disabled:opacity-40"
                >
                  {d.label}
                </button>
              ))}
            </span>
          )}
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
          <EmptyState purpose={purpose} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ purpose }: { purpose: PurposeId }) {
  const p = PLAYBOOKS[purpose];
  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-rule bg-sheet p-6">
        <h2 className="text-[16px] font-semibold">What happens when you press research</h2>
        <ol className="mt-3 space-y-2.5 text-[14px] text-ink-2">
          <li><span className="font-medium text-ink">It confirms it has the right person.</span> If they left the company or the name matches two people, it stops and asks you.</li>
          <li><span className="font-medium text-ink">It reads everything public and recent.</span> Profile, company growth and funding, finance-ops hiring, their LinkedIn posts and the news.</li>
          <li><span className="font-medium text-ink">It ranks every signal and shows its working.</span> Sensitive news like layoffs is never used as an opener.</li>
          <li><span className="font-medium text-ink">It writes a short draft with every fact footnoted.</span> Nothing is sent. You approve, edit, regenerate or reject.</li>
        </ol>
      </div>
      <div className="rounded-xl border border-rule bg-sheet p-6">
        <h2 className="text-[13px] font-semibold">{p.name} playbook</h2>
        <p className="mt-1 text-[13px] text-ink-2">{p.goal}</p>
        <p className="mt-3 text-2xs text-ink-3">Strong signals</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] text-ink-2">
          {p.strongSignals.slice(0, 4).map((s) => <li key={s}>{s}</li>)}
        </ul>
        {p.event && (
          <p className="mt-3 rounded-md bg-paper p-2.5 text-[12px] text-ink-2">
            <span className="font-medium text-ink">{p.event.name}</span>, {p.event.city}, {p.event.date}. Sample event for this demo.
          </p>
        )}
      </div>
    </div>
  );
}

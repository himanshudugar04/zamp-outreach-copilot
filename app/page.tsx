"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Settings2 } from "lucide-react";
import { RunView } from "@/components/RunView";
import { useRunner } from "@/lib/useRunner";
import { getSender, setSender } from "@/lib/store";
import { PLAYBOOKS, ZAMP, isOfferMode, type CompanyProfile } from "@/lib/playbooks";
import { filesForRun, getCompany, listPurposes, type PurposeEntry } from "@/lib/playbookStore";
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
  const [purposes, setPurposes] = useState<PurposeEntry[]>([]);
  const [seller, setSeller] = useState<CompanyProfile>(ZAMP);
  const started = live || !!record;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    setS(getSender());
    setPurposes(listPurposes());
    setSeller(getCompany());
  }, []);
  const current = purposes.find((p) => p.playbook.id === purpose)?.playbook || PLAYBOOKS[purpose] || PLAYBOOKS.sales_outreach;

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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Purpose">
          <span className="mr-1 text-[12px] text-ink-3">Purpose</span>
          {purposes.map(({ playbook: p, custom }) => (
            <button
              type="button"
              role="radio"
              aria-checked={purpose === p.id}
              key={p.id}
              onClick={() => setPurpose(p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] ${purpose === p.id ? "border-ink bg-ink text-white" : "border-rule bg-sheet text-ink-2 hover:border-ink-3 hover:text-ink"}`}
            >
              {p.name}
              {custom && <span className={`rounded px-1 text-[10px] ${purpose === p.id ? "bg-white/20" : "bg-violet/10 text-violet"}`}>yours</span>}
            </button>
          ))}
          <Link href="/playbooks#add" className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-3 px-3 py-1 text-[13px] text-ink-2 hover:border-ink hover:text-ink">
            <Plus size={13} /> Add a purpose
          </Link>
          <span className="ml-auto text-[12px] text-ink-3">
            Selling as <span className="text-ink-2">{seller.name}</span>, {seller.products.length} product suites.{" "}
            <Link href="/playbooks" className="text-sky hover:underline">Change</Link>
          </span>
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
            disabled={!ready || !canRun || live}
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
                  disabled={!ready || live}
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
          <EmptyState playbook={current} seller={seller} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ playbook: p, seller }: { playbook: (typeof PLAYBOOKS)[string]; seller: CompanyProfile }) {
  const offer = isOfferMode(p);
  const parts = [
    { t: "Who we are", d: `One line on you and ${seller.name}.` },
    { t: "Why you, why now", d: "Their freshest signal: a post, interview, news, hiring or funding." },
    offer
      ? { t: "The offer", d: "What you are inviting them to, using only the playbook's details." }
      : { t: "What fits", d: `${seller.name} has ${seller.products.length} product suites. The draft names the one or two that match the signal.` },
    { t: "The ask", d: p.ctaExamples[0] || "A short, low-pressure question." },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-rule bg-sheet p-6">
        <h2 className="text-[16px] font-semibold">What happens when you press research</h2>
        <ol className="mt-3 space-y-2.5 text-[14px] text-ink-2">
          <li><span className="font-medium text-ink">It confirms it has the right person.</span> If they left the company or the name matches two people, it stops and asks you.</li>
          <li><span className="font-medium text-ink">It checks six kinds of signal.</span> Their LinkedIn activity, company news, job postings, funding, interviews and talks, and recent press.</li>
          <li><span className="font-medium text-ink">It ranks every signal and shows its working.</span> Sensitive news like layoffs is never used.</li>
          <li><span className="font-medium text-ink">It drafts with every fact footnoted.</span> Nothing is sent. You approve, edit, ask for changes or reject.</li>
        </ol>
      </div>
      <div className="rounded-xl border border-rule bg-sheet p-6">
        <h2 className="text-[13px] font-semibold">How a {p.name.toLowerCase()} email is built</h2>
        <ol className="mt-3 space-y-3">
          {parts.map((x, i) => (
            <li key={x.t} className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-soft text-[11px] font-semibold text-sky-deep">{i + 1}</span>
              <span className="text-[13px] text-ink-2"><span className="font-medium text-ink">{x.t}.</span> {x.d}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-rule pt-3 text-[12px] text-ink-3">{p.goal}</p>
      </div>
    </div>
  );
}

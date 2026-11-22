"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Download, ExternalLink, FileText, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import {
  COMPANY_TEMPLATE_MD,
  MAX_FILE_CHARS,
  PLAYBOOK_TEMPLATE_MD,
  isOfferMode,
  parseCompany,
  parsePlaybook,
  type CompanyProfile,
  type ParseReport,
} from "@/lib/playbooks";
import {
  deleteCustomPurpose,
  downloadText,
  getCompanyFile,
  listPurposes,
  resetCompanyFile,
  saveCustomPurpose,
  setCompanyFile,
  type PurposeEntry,
} from "@/lib/playbookStore";

const PLAYBOOK_GUIDE: { section: string; need: "Required" | "Optional"; what: string }[] = [
  { section: "# Title", need: "Required", what: "The purpose's name, e.g. Sponsorship. Shown in the drafter." },
  { section: "Goal", need: "Required", what: "The reply you want, in one sentence." },
  { section: "Target roles", need: "Required", what: "Job titles that fit. Anyone else gets flagged before drafting." },
  { section: "Signals that matter", need: "Required", what: "What makes someone worth writing to now. Signals are ranked against this." },
  { section: "Call to action", need: "Required", what: "One to three example asks. The draft ends with one like it." },
  { section: "Offer", need: "Optional", what: "What you are offering (a seat, a sponsorship). Leave it out to pitch your product suites." },
  { section: "Details", need: "Optional", what: "Facts the email may quote: dates, venue, audience size, tiers." },
  { section: "Signals to ignore", need: "Optional", what: "Things that should never be the reason to write." },
  { section: "Who sends it", need: "Optional", what: "The sender's role." },
  { section: "Hiring keywords", need: "Optional", what: "Job titles to look for in their open roles." },
  { section: "Length, Tone, Words to avoid", need: "Optional", what: "Word range, voice, banned phrases." },
  { section: "Anything else", need: "Optional", what: "Any other heading is kept and passed to the writer as context." },
];

export default function Playbooks() {
  const [company, setCompany] = useState<{ md: string; fileName?: string; custom: boolean } | null>(null);
  const [purposes, setPurposes] = useState<PurposeEntry[]>([]);
  const refresh = () => {
    setCompany(getCompanyFile());
    setPurposes(listPurposes());
  };
  useEffect(refresh, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#add") document.getElementById("add")?.scrollIntoView({ block: "start" });
  }, [purposes.length]);

  const profile = company ? parseCompany(company.md).value : null;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-tight">Playbooks</h1>
      <p className="max-w-[72ch] text-[13px] text-ink-2">
        Two kinds of file drive every draft. One company profile says what you sell. One playbook per purpose says who to write to, why, and what to ask for.
        Both are plain markdown or text files, so you can write them in any editor and upload them here.
      </p>

      {/* ---------- Company profile ---------- */}
      <section className="mt-6 rounded-xl border border-rule bg-sheet">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
          <div>
            <p className="text-2xs text-ink-3">Your company</p>
            <h2 className="text-[18px] font-semibold">{profile?.name || "…"}</h2>
            <p className="text-2xs text-ink-3">{company?.custom ? `Uploaded from ${company.fileName || "your file"}` : "Built-in Zamp profile. Upload your own to sell something else."}</p>
          </div>
          {company && (
            <div className="flex flex-wrap gap-1.5">
              <FilePicker
                label="Upload new profile"
                kind="company"
                onSaved={(md, name) => {
                  setCompanyFile(md, name);
                  refresh();
                }}
              />
              <SmallButton onClick={() => downloadText(company.fileName || "company.md", company.md)} icon={Download}>Download file</SmallButton>
              <SmallButton onClick={() => downloadText("company-template.md", COMPANY_TEMPLATE_MD)} icon={FileText}>Blank template</SmallButton>
              {company.custom && (
                <SmallButton onClick={() => { resetCompanyFile(); refresh(); }} icon={RotateCcw}>Back to Zamp</SmallButton>
              )}
            </div>
          )}
        </header>
        {profile && <CompanyBody p={profile} />}
      </section>

      {/* ---------- Purposes ---------- */}
      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold">Purposes</h2>
        <span className="text-2xs text-ink-3">{purposes.length} available in the drafter</span>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {purposes.map((e) => (
          <PurposeCard
            key={e.playbook.id}
            e={e}
            onDelete={() => {
              deleteCustomPurpose(e.playbook.id);
              refresh();
            }}
          />
        ))}
        <AddPurpose onSaved={refresh} />
      </div>

      {/* ---------- Guide ---------- */}
      <section className="mt-8 rounded-xl border border-rule bg-sheet p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold">How to structure a purpose playbook</h2>
            <p className="text-[13px] text-ink-2">Use these headings with ## in front. Order does not matter, and headings are matched loosely.</p>
          </div>
          <SmallButton onClick={() => downloadText("purpose-template.md", PLAYBOOK_TEMPLATE_MD)} icon={Download}>Download template</SmallButton>
        </div>
        <table className="mt-4 w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-rule text-2xs text-ink-3">
              <th className="py-2 pr-4 font-normal">Section</th>
              <th className="py-2 pr-4 font-normal">Needed</th>
              <th className="py-2 font-normal">What to put</th>
            </tr>
          </thead>
          <tbody>
            {PLAYBOOK_GUIDE.map((g) => (
              <tr key={g.section} className="border-b border-rule/70 last:border-0">
                <td className="py-2 pr-4 font-medium text-ink">{g.section}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded px-1.5 py-0.5 text-2xs ${g.need === "Required" ? "bg-brand/10 text-brand" : "bg-paper text-ink-3"}`}>{g.need}</span>
                </td>
                <td className="py-2 text-ink-2">{g.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CompanyBody({ p }: { p: CompanyProfile }) {
  return (
    <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
      <div className="px-5 py-4">
        <p className="text-[14px] leading-relaxed text-ink-2">{p.about}</p>
        <h3 className="mt-5 text-[13px] font-semibold">
          Product suites <span className="font-normal text-ink-3">({p.products.length})</span>
        </h3>
        <p className="text-2xs text-ink-3">For sales outreach, the draft names the one or two whose “fits when” matches the prospect’s signal.</p>
        <ul className="mt-2 divide-y divide-rule rounded-lg border border-rule">
          {p.products.map((x) => (
            <li key={x.id} className="px-3.5 py-2.5">
              <p className="text-[14px] font-medium text-ink">{x.name}</p>
              <p className="text-[13px] text-ink-2">{x.does}</p>
              {x.fitsWhen && <p className="mt-0.5 text-2xs text-teal">Fits when: {x.fitsWhen}</p>}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-rule px-5 py-4 lg:border-l lg:border-t-0">
        <h3 className="text-[13px] font-semibold">Proof points</h3>
        <p className="text-2xs text-ink-3">The only results a draft may quote.</p>
        {p.proofPoints.length ? (
          <ul className="mt-2 space-y-2 text-[13px] text-ink-2">
            {p.proofPoints.map((x) => (
              <li key={x.id} className="flex gap-2">
                <span className="num mt-px text-2xs font-semibold text-sky">{x.id}</span>
                <span>
                  {x.text}
                  {x.sourceUrl && (
                    <a href={x.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-2xs text-ink-3 hover:text-sky">
                      {x.source} <ExternalLink size={10} />
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-ink-3">None yet. Drafts will skip proof.</p>
        )}
        <h3 className="mt-5 text-[13px] font-semibold">Do not contact</h3>
        <p className="text-2xs text-ink-3">Runs stop before any research for these companies.</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {p.doNotContact.length ? (
            p.doNotContact.map((d) => (
              <span key={d} className="rounded-md bg-paper px-2 py-0.5 text-[12px] capitalize text-ink-2">{d}</span>
            ))
          ) : (
            <span className="text-[13px] text-ink-3">Nobody listed.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function PurposeCard({ e, onDelete }: { e: PurposeEntry; onDelete: () => void }) {
  const p = e.playbook;
  const [raw, setRaw] = useState(false);
  const offer = isOfferMode(p);
  return (
    <article className="flex flex-col rounded-xl border border-rule bg-sheet">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <h3 className="text-[16px] font-semibold">{p.name}</h3>
          <p className="text-2xs text-ink-3">
            {e.custom ? `Yours, from ${e.fileName || "pasted text"}` : "Built in"}
            {p.persona ? `. Sent by ${p.persona}` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-2xs ${offer ? "bg-violet/10 text-violet" : "bg-teal/10 text-teal"}`}>
          {offer ? "Pitches an offer" : "Pitches product suites"}
        </span>
      </div>
      <p className="px-5 pt-2 text-[13px] text-ink-2">{p.goal}</p>

      {raw ? (
        <pre className="mx-5 mt-3 max-h-80 overflow-auto rounded-lg bg-paper p-3 text-[12px] leading-relaxed text-ink-2">{e.md}</pre>
      ) : (
        <dl className="mx-5 mt-3 grid gap-x-4 gap-y-2.5 border-t border-rule pt-3 text-[13px] sm:grid-cols-[110px_1fr]">
          <dt className="text-2xs text-ink-3">Target roles</dt>
          <dd className="text-ink-2">
            {p.targetRoles.slice(0, 5).join(", ")}
            {p.targetRoles.length > 5 ? `, and ${p.targetRoles.length - 5} more` : ""}
          </dd>
          <dt className="text-2xs text-ink-3">Signals that matter</dt>
          <dd className="text-ink-2">
            <ul className="list-disc space-y-0.5 pl-4">{p.strongSignals.slice(0, 4).map((s) => <li key={s}>{s}</li>)}</ul>
          </dd>
          {offer && (
            <>
              <dt className="text-2xs text-ink-3">Offer</dt>
              <dd className="text-ink-2">{p.offer}</dd>
            </>
          )}
          {p.details && (
            <>
              <dt className="text-2xs text-ink-3">Details</dt>
              <dd className="whitespace-pre-line text-ink-2">{p.details.replace(/^[-*]\s*/gm, "")}</dd>
            </>
          )}
          <dt className="text-2xs text-ink-3">The ask</dt>
          <dd className="text-ink-2">“{p.ctaExamples[0]}”</dd>
          <dt className="text-2xs text-ink-3">Length</dt>
          <dd className="num text-ink-2">{p.length.min} to {p.length.max} words</dd>
        </dl>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 px-5 pb-4 pt-4">
        <SmallButton onClick={() => setRaw((v) => !v)} icon={FileText}>{raw ? "Show summary" : "View file"}</SmallButton>
        <SmallButton onClick={() => downloadText(e.fileName || `${p.id}.md`, e.md)} icon={Download}>Download</SmallButton>
        {e.custom && (
          <button onClick={onDelete} className="ml-auto inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] text-ink-3 hover:bg-brick/10 hover:text-brick">
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>
    </article>
  );
}

function AddPurpose({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        id="add"
        onClick={() => setOpen(true)}
        className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rule bg-sheet/50 p-6 text-center hover:border-sky hover:bg-sky-soft/40"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sky text-white"><Plus size={18} /></span>
        <span className="text-[15px] font-semibold text-ink">Add a purpose</span>
        <span className="max-w-[36ch] text-[13px] text-ink-2">Sponsorship, partnership, webinar invite, renewal. Upload its playbook and it shows up in the drafter.</span>
      </button>
    );
  return (
    <div id="add" className="rounded-xl border border-sky/40 bg-sheet p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[16px] font-semibold">Add a purpose</h3>
          <p className="text-[13px] text-ink-2">Upload a .md or .txt playbook, or paste it below. You will see what was understood before saving.</p>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink"><X size={16} /></button>
      </div>
      <Intake
        kind="purpose"
        onSave={(md, name) => {
          saveCustomPurpose(md, name);
          setOpen(false);
          onSaved();
        }}
      />
    </div>
  );
}

/** Upload or paste → parse → show what was found and what is missing → save. */
function Intake({ kind, onSave, initialText, initialName }: { kind: "company" | "purpose"; onSave: (md: string, fileName?: string) => void; initialText?: string; initialName?: string }) {
  const [text, setText] = useState(initialText || "");
  const [fileName, setFileName] = useState<string | undefined>(initialName);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const report: ParseReport<any> | null = text.trim() ? (kind === "company" ? parseCompany(text) : parsePlaybook(text)) : null;

  const load = (f?: File) => {
    if (!f) return;
    setErr(null);
    if (!/\.(md|markdown|txt)$/i.test(f.name)) return setErr("Use a .md or .txt file.");
    if (f.size > MAX_FILE_CHARS * 2) return setErr(`That file is too long. Keep it under about ${Math.round(MAX_FILE_CHARS / 1000)}k characters.`);
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result || ""));
      setFileName(f.name);
    };
    r.readAsText(f);
  };

  return (
    <div className="mt-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          load(e.dataTransfer.files?.[0]);
        }}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink-3/50 bg-paper/60 px-3 py-2.5"
      >
        <button onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-white hover:bg-black">
          <Upload size={14} /> Choose file
        </button>
        <span className="text-[12px] text-ink-3">{fileName ? fileName : "or drop a .md / .txt file here"}</span>
        <button
          onClick={() => downloadText(kind === "company" ? "company-template.md" : "purpose-template.md", kind === "company" ? COMPANY_TEMPLATE_MD : PLAYBOOK_TEMPLATE_MD)}
          className="ml-auto text-[12px] text-sky hover:underline"
        >
          Get the template
        </button>
        <input ref={input} type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_FILE_CHARS))}
        rows={8}
        aria-label="Playbook text"
        placeholder={kind === "company" ? "# Your company\n\n## About\n...\n\n## Product suites\n- Name: what it does. Fits when: ..." : "# Sponsorship\n\n## Goal\n...\n\n## Target roles\n- ...\n\n## Signals that matter\n- ...\n\n## Call to action\n- ..."}
        className="mt-2 w-full rounded-lg border border-rule px-3 py-2 font-mono text-[12px] leading-relaxed placeholder:text-ink-3"
      />
      {err && <p className="mt-1 text-[12px] text-brick">{err}</p>}

      {report && (
        <div className="mt-2 rounded-lg border border-rule p-3 text-[12px]">
          <p className="font-medium text-ink">
            {report.missing.length ? "Not ready yet" : `Ready: “${report.value.name}”`}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {report.found.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 rounded bg-ledger/10 px-1.5 py-0.5 text-ledger"><Check size={11} /> {f}</span>
            ))}
            {report.missing.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 rounded bg-brick/10 px-1.5 py-0.5 text-brick"><X size={11} /> Missing {m}</span>
            ))}
          </div>
          {report.ignored.length > 0 && (
            <p className="mt-1.5 text-ink-3">Kept as extra context: {report.ignored.join(", ")}.</p>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          disabled={!report || report.missing.length > 0}
          onClick={() => onSave(text, fileName)}
          className="rounded-full bg-sky px-4 py-1.5 text-[13px] font-medium text-white hover:bg-sky-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {kind === "company" ? "Use this profile" : "Save purpose"}
        </button>
      </div>
    </div>
  );
}

function FilePicker({ label, kind, onSaved }: { label: string; kind: "company" | "purpose"; onSaved: (md: string, name?: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SmallButton onClick={() => setOpen((v) => !v)} icon={Upload} primary>{label}</SmallButton>
      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[640px] rounded-xl bg-sheet p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={label}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-semibold">{label}</h3>
                <p className="text-[13px] text-ink-2">About, product suites, proof points and a do-not-contact list. Needs at least About and one product.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink"><X size={16} /></button>
            </div>
            <Intake
              kind={kind}
              onSave={(md, name) => {
                onSaved(md, name);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function SmallButton({ onClick, icon: Icon, children, primary }: { onClick: () => void; icon: any; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] ${primary ? "bg-ink text-white hover:bg-black" : "border border-rule text-ink-2 hover:border-ink-3 hover:text-ink"}`}
    >
      <Icon size={13} /> {children}
    </button>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Download, ExternalLink, FileText, Plus, Trash2, Upload, X } from "lucide-react";
import {
  MAX_FILE_CHARS,
  PLAYBOOK_TEMPLATE_MD,
  isOfferMode,
  parseCompany,
  parsePlaybook,
  type CompanyProfile,
  type ParseReport,
} from "@/lib/playbooks";
import {
  addCompanyContext,
  addProofPoint,
  deleteCustomPurpose,
  downloadText,
  getCompanyFile,
  listPurposes,
  resetCompanyFile,
  saveCustomPurpose,
  setCompanyFile,
  type PurposeEntry,
} from "@/lib/playbookStore";

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
    <div className="mx-auto max-w-[1040px] px-5 py-8 md:px-8">
      <h1 className="text-[26px] font-semibold tracking-tight">Playbooks</h1>
      <p className="mt-1 max-w-[64ch] text-[15px] text-ink-2">What you sell, and how to write for each kind of outreach.</p>

      <h2 className="mt-8 text-[18px] font-semibold">Your company</h2>
      {company && profile && <CompanyCard company={company} p={profile} onChange={refresh} />}

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold">Purposes</h2>
        <span className="text-[13px] text-ink-3">Each one shows up as a tab when you write</span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
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
    </div>
  );
}

function CompanyCard({ company, p, onChange }: { company: { md: string; fileName?: string; custom: boolean }; p: CompanyProfile; onChange: () => void }) {
  const [panel, setPanel] = useState<null | "context" | "proof">(null);
  const [details, setDetails] = useState(false);
  const [ctx, setCtx] = useState("");
  const [proof, setProof] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  return (
    <section className="mt-3 rounded-2xl border border-rule bg-sheet">
      <div className="px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[20px] font-semibold">{p.name}</p>
            <p className="text-[13px] text-ink-3">
              {p.products.length} product suites, {p.proofPoints.length} proof points, {p.doNotContact.length} companies never contacted
              {company.custom && (
                <>
                  {". "}
                  <button onClick={() => { resetCompanyFile(); onChange(); }} className="text-ink-3 underline hover:text-ink">
                    reset to Zamp
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilePicker label="Upload new profile" kind="company" onSaved={(md, name) => { setCompanyFile(md, name); onChange(); }} />
            <SmallButton onClick={() => setPanel(panel === "context" ? null : "context")} icon={Plus}>Add context</SmallButton>
            <SmallButton onClick={() => setPanel(panel === "proof" ? null : "proof")} icon={Plus}>Add proof point</SmallButton>
          </div>
        </div>
        <p className="mt-3 max-w-[72ch] text-[15px] leading-relaxed text-ink-2">{p.about}</p>
      </div>

      {panel === "context" && (
        <div className="border-t border-rule bg-paper/50 px-6 py-4">
          <label htmlFor="ctx" className="text-[14px] font-medium">Add context about {p.name}</label>
          <textarea id="ctx" value={ctx} onChange={(e) => setCtx(e.target.value)} rows={3} maxLength={1500} autoFocus placeholder="e.g. We only sell in India, the US and the Middle East. Never mention competitors by name." className="mt-2 w-full rounded-lg border border-rule bg-sheet px-3 py-2 text-[15px] placeholder:text-ink-3" />
          <div className="mt-2 flex gap-2">
            <button disabled={!ctx.trim()} onClick={() => { addCompanyContext(ctx); setCtx(""); setPanel(null); onChange(); }} className="rounded-full bg-ink px-4 py-1.5 text-[14px] font-medium text-white disabled:opacity-40">Save</button>
            <button onClick={() => setPanel(null)} className="rounded-full px-3 py-1.5 text-[14px] text-ink-2 hover:bg-sheet">Cancel</button>
          </div>
        </div>
      )}

      {panel === "proof" && (
        <div className="border-t border-rule bg-paper/50 px-6 py-4">
          <p className="text-[14px] font-medium">Add a proof point</p>
          <p className="text-[13px] text-ink-3">Drafts only ever quote results listed here.</p>
          <input value={proof} onChange={(e) => setProof(e.target.value)} autoFocus maxLength={240} placeholder="Result, e.g. Zamp cut Acme's month-end close from 10 days to 4" className="mt-2 h-11 w-full rounded-lg border border-rule bg-sheet px-3 text-[15px] placeholder:text-ink-3" />
          <input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} maxLength={400} placeholder="Source link (optional)" className="mt-2 h-11 w-full rounded-lg border border-rule bg-sheet px-3 text-[15px] placeholder:text-ink-3" />
          <div className="mt-2 flex gap-2">
            <button disabled={proof.trim().length < 8 || (!!proofUrl.trim() && !/^https?:\/\//.test(proofUrl.trim()))} onClick={() => { addProofPoint(proof, proofUrl); setProof(""); setProofUrl(""); setPanel(null); onChange(); }} className="rounded-full bg-ink px-4 py-1.5 text-[14px] font-medium text-white disabled:opacity-40">Add</button>
            <button onClick={() => setPanel(null)} className="rounded-full px-3 py-1.5 text-[14px] text-ink-2 hover:bg-sheet">Cancel</button>
          </div>
        </div>
      )}

      <button onClick={() => setDetails((v) => !v)} aria-expanded={details} className="flex w-full items-center gap-1 border-t border-rule px-6 py-3 text-[14px] text-ink-2 hover:text-ink">
        {details ? "Hide details" : "View products, proof points and do-not-contact list"} <ChevronDown size={15} className={details ? "rotate-180" : ""} />
      </button>
      {details && <CompanyBody p={p} />}
    </section>
  );
}

function CompanyBody({ p }: { p: CompanyProfile }) {
  return (
    <div className="grid gap-6 border-t border-rule px-6 py-5 md:grid-cols-2">
      <div>
        <p className="text-[14px] font-semibold">Product suites</p>
        <ul className="mt-2 space-y-2.5">
          {p.products.map((x) => (
            <li key={x.id}>
              <p className="text-[14px] font-medium text-ink">{x.name}</p>
              <p className="text-[13px] text-ink-2">{x.does}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-5">
        <div>
          <p className="text-[14px] font-semibold">Proof points</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2">
            {p.proofPoints.length ? p.proofPoints.map((x) => (
              <li key={x.id}>
                {x.text}
                {x.sourceUrl && (
                  <a href={x.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex align-middle text-ink-3 hover:text-sky" aria-label="Source"><ExternalLink size={11} /></a>
                )}
              </li>
            )) : <li className="text-ink-3">None yet.</li>}
          </ul>
        </div>
        <div>
          <p className="text-[14px] font-semibold">Never contacted</p>
          <p className="mt-1 text-[13px] capitalize text-ink-2">{p.doNotContact.join(", ") || "Nobody listed"}</p>
        </div>
        {p.extra && (
          <div>
            <p className="text-[14px] font-semibold">Extra context</p>
            <p className="mt-1 whitespace-pre-line text-[13px] text-ink-2">{p.extra}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PurposeCard({ e, onDelete }: { e: PurposeEntry; onDelete: () => void }) {
  const p = e.playbook;
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(false);
  const offer = isOfferMode(p);
  return (
    <article className="flex flex-col rounded-2xl border border-rule bg-sheet">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold">{p.name}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] ${offer ? "bg-violet/10 text-violet" : "bg-teal/10 text-teal"}`}>
            {offer ? "Pitches an offer" : "Pitches products"}
          </span>
        </div>
        <p className="text-[13px] text-ink-3">{e.custom ? `Yours, from ${e.fileName || "pasted text"}` : "Built in"}</p>
        <p className="mt-2 text-[15px] text-ink-2">{p.goal}</p>
      </div>

      {open && (
        <div className="mx-5 mt-4 space-y-3 border-t border-rule pt-4 text-[14px]">
          {raw ? (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-3 text-[12px] leading-relaxed text-ink-2">{e.md}</pre>
          ) : (
            <>
              <Detail k="Who to write to">{p.targetRoles.join(", ")}</Detail>
              <Detail k="Good reasons to write">
                <ul className="list-disc space-y-0.5 pl-4">{p.strongSignals.map((x) => <li key={x}>{x}</li>)}</ul>
              </Detail>
              {offer && <Detail k="Offer">{p.offer}</Detail>}
              {p.details && <Detail k="Details"><span className="whitespace-pre-line">{p.details.replace(/^[-*]\s*/gm, "")}</span></Detail>}
              {p.guidance && <Detail k="How the message should read"><span className="whitespace-pre-line">{p.guidance}</span></Detail>}
              <Detail k="Length">{p.length.min} to {p.length.max} words, {p.execLength.min} to {p.execLength.max} for senior readers</Detail>
              <Detail k="The ask">“{p.ctaExamples[0]}”</Detail>
            </>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 px-5 pb-4 pt-4">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1 text-[14px] font-medium text-ink hover:underline">
          {open ? "Hide details" : "View details"} <ChevronDown size={15} className={open ? "rotate-180" : ""} />
        </button>
        {open && (
          <span className="ml-auto flex gap-1.5">
            <SmallButton onClick={() => setRaw((v) => !v)} icon={FileText}>{raw ? "Summary" : "View file"}</SmallButton>
            <SmallButton onClick={() => downloadText(e.fileName || `${p.id}.md`, e.md)} icon={Download}>Download</SmallButton>
            {e.custom && (
              <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-ink-3 hover:bg-brick/10 hover:text-brick">
                <Trash2 size={13} /> Remove
              </button>
            )}
          </span>
        )}
      </div>
    </article>
  );
}

function Detail({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-ink-3">{k}</p>
      <div className="mt-0.5 text-ink-2">{children}</div>
    </div>
  );
}

function AddPurpose({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        id="add"
        onClick={() => setOpen(true)}
        className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rule bg-sheet/50 p-6 text-center hover:border-sky hover:bg-sky-soft/40"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sky text-white"><Plus size={18} /></span>
        <span className="text-[15px] font-semibold text-ink">Add a purpose</span>
        <span className="max-w-[36ch] text-[14px] text-ink-2">Sponsorship, partnership, webinar invite, renewal. Upload a playbook, or start from our template.</span>
      </button>
    );
  return (
    <div id="add" className="rounded-xl border border-sky/40 bg-sheet p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[16px] font-semibold">Add a purpose</h3>
          <p className="text-[14px] text-ink-2">Start from the template, fill it in, then upload it or paste it below. You'll see what was understood before saving.</p>
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
        {kind === "purpose" && (
          <button onClick={() => downloadText("purpose-template.md", PLAYBOOK_TEMPLATE_MD)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-sky/40 bg-sheet px-3 py-1 text-[13px] font-medium text-sky-deep hover:border-sky">
            <Download size={13} /> Download template
          </button>
        )}
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

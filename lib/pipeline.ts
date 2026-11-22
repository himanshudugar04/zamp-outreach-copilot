import { PLAYBOOKS, SUPPRESSION_LIST, type Playbook } from "./playbooks";
import { checkDraft } from "./quality";
import { runAnalyst, runWriter } from "./llm";
import {
  enrichCompany,
  enrichPerson,
  financeJobs,
  findSuccessors,
  identifyCompany,
  postsBy,
  resolvePerson,
  webNews,
} from "./research";
import { buildSignals, recencyPoints, type RawResearch } from "./signals";
import type {
  CompanyInfo,
  Draft,
  Hook,
  Prospect,
  PurposeId,
  QualityReport,
  RunInput,
  RunResult,
  ScoredSignal,
  Sender,
  StageEvent,
  StageId,
} from "./types";

type Emit = (e: StageEvent) => void;
const HOOK_THRESHOLD = 6;

function isExecutive(seniority?: string, title?: string) {
  const s = `${seniority || ""} ${title || ""}`.toLowerCase();
  return /\b(cxo|chief|cfo|ceo|coo|vice president|vp|svp|evp|president|founder)\b/.test(s);
}

export async function runPipeline(input: RunInput, emit: Emit): Promise<RunResult> {
  const t0 = Date.now();
  const playbook = PLAYBOOKS[input.purpose];
  const result: RunResult = {
    status: "error",
    purpose: input.purpose,
    flags: {},
    signals: [],
    sources: {},
    usage: { credits: 0, tokens: 0, llmCalls: 0 },
    durationMs: 0,
  };
  const addCredits = (n: number) => (result.usage.credits = Math.round((result.usage.credits + n) * 100) / 100);

  const stage = async <T>(id: StageId, fn: () => Promise<{ value: T; credits: number; detail?: string }>) => {
    const s = Date.now();
    emit({ type: "stage", id, status: "running" });
    try {
      const out = await fn();
      const credits = Math.round(out.credits * 100) / 100;
      addCredits(credits);
      emit({ type: "stage", id, status: "done", ms: Date.now() - s, credits, detail: out.detail });
      return out.value;
    } catch (e: any) {
      emit({ type: "stage", id, status: "error", ms: Date.now() - s, detail: e?.message || "failed" });
      throw e;
    }
  };
  const skip = (ids: StageId[], detail = "Not needed") => ids.forEach((id) => emit({ type: "stage", id, status: "skipped", detail }));
  const finish = (r: RunResult) => ({ ...r, durationMs: Date.now() - t0 });

  try {
    // ---------- 1. Resolve identity ----------
    let profileUrl = input.linkedinUrl?.trim() || "";
    let companyRef: { id: number; name: string } | null = null;

    const resolution = await stage<any>("resolve", async (): Promise<{ value: any; credits: number; detail?: string }> => {
      let credits = 0;
      if (input.findSuccessor) {
        const s = await findSuccessors(input.findSuccessor.companyId, input.findSuccessor.title);
        return { value: { edgeSuccessors: s.value }, credits: s.credits, detail: `${s.value.length} possible successor(s)` };
      }
      if (input.company && !profileUrl) {
        const co = await identifyCompany(input.company);
        credits += co.credits;
        companyRef = co.value ? { id: co.value.id, name: co.value.name } : null;
        if (companyRef && SUPPRESSION_LIST.includes(companyRef.name.toLowerCase())) {
          return { value: { suppressed: companyRef.name }, credits, detail: "On the do-not-contact list" };
        }
      }
      if (profileUrl) return { value: { found: true }, credits, detail: "LinkedIn URL given" };
      if (!input.name) throw new Error("Enter a name or a LinkedIn URL");
      const r = await resolvePerson(input.name, companyRef);
      credits += r.credits;
      if (r.value.kind === "found") {
        profileUrl = r.value.profileUrl;
        return { value: { found: true }, credits, detail: `Matched at ${companyRef?.name ?? "one company"}` };
      }
      return { value: { res: r.value }, credits, detail: r.value.kind === "ambiguous" ? "Several people match" : r.value.kind === "moved" ? "Left the company" : "No match" };
    });

    const later: StageId[] = ["person", "company", "hiring", "posts", "news", "analyze", "draft", "check"];
    const rv: any = resolution;
    if (rv.edgeSuccessors) {
      skip(later);
      const c = rv.edgeSuccessors;
      return finish({
        ...result,
        status: "needs_input",
        edge: c.length
          ? { kind: "successors", title: `Who now holds this role at ${input.findSuccessor!.companyName}`, message: "Pick the right person to write to.", candidates: c }
          : { kind: "not_found", title: "No successor found", message: `Nobody with a similar title joined ${input.findSuccessor!.companyName} in the last 18 months.` },
      });
    }
    if (rv.suppressed) {
      skip(later, "Stopped");
      return finish({
        ...result,
        status: "skipped",
        edge: { kind: "suppressed", title: `${rv.suppressed} is already a Zamp customer`, message: "Customers are on the do-not-contact list for cold outreach. Route this to the account owner instead." },
      });
    }
    if (rv.res) {
      skip(later, "Waiting for the rep");
      const r = rv.res;
      if (r.kind === "ambiguous")
        return finish({ ...result, status: "needs_input", edge: { kind: "ambiguous", title: `${r.candidates.length} people match "${input.name}"`, message: "The system will not guess. Pick the right person.", candidates: r.candidates } });
      if (r.kind === "moved") {
        const co = companyRef as { id: number; name: string } | null;
        return finish({
          ...result,
          status: "needs_input",
          edge: {
            kind: "moved",
            title: `${r.candidate.name} has left ${co?.name}`,
            message: `${r.candidate.name.split(" ")[0]} was ${r.oldTitle || "there"}${r.endDate ? ` until ${r.endDate.slice(0, 7)}` : ""} and is now ${r.candidate.title ? `${r.candidate.title} at ` : "at "}${r.candidate.company || "another company"}.`,
            moved: {
              oldCompany: co?.name || "",
              oldCompanyId: co?.id || 0,
              oldTitle: r.oldTitle,
              endDate: r.endDate,
              newCompany: r.candidate.company,
              newTitle: r.candidate.title,
              profileUrl: r.candidate.profileUrl,
            },
          },
        });
      }
      return finish({
        ...result,
        status: "needs_input",
        edge: {
          kind: "not_found",
          title: `No "${input.name}" found${companyRef ? ` at ${(companyRef as any).name}` : ""}`,
          message: r.candidates.length ? "These people share the name elsewhere. Pick one, or check the spelling." : "Try the LinkedIn URL instead.",
          candidates: r.candidates,
        },
      });
    }

    // ---------- 2. Enrich person ----------
    const person = await stage("person", async () => {
      const p = await enrichPerson(profileUrl, (companyRef as any)?.id);
      return { value: p.value, credits: p.credits, detail: p.value.prospect ? `${p.value.prospect.title}` : p.value.status };
    });
    if (person.status !== "matched" || !person.prospect) {
      skip(later.slice(1), "Stopped");
      return finish({
        ...result,
        status: "skipped",
        edge:
          person.status === "redacted"
            ? { kind: "redacted", title: "This person has opted out", message: "They asked the data provider to remove their profile. Do not contact them from this tool." }
            : { kind: "not_found", title: "Profile not found", message: "The LinkedIn profile is not in the dataset yet. Check the URL." },
      });
    }
    const prospect: Prospect = person.prospect;
    result.prospect = prospect;
    const companyId: number | undefined = (companyRef as any)?.id || person.companyId;

    if (companyId && person.companyName && SUPPRESSION_LIST.includes(String(person.companyName).toLowerCase())) {
      skip(later.slice(1), "Stopped");
      return finish({ ...result, status: "skipped", edge: { kind: "suppressed", title: `${person.companyName} is already a Zamp customer`, message: "Customers are on the do-not-contact list for cold outreach." } });
    }

    // ---------- 3. Gather signals in parallel ----------
    const nothing = { value: [] as any[], credits: 0 };
    const [companyOut, jobs, posts, news] = await Promise.all([
      companyId
        ? stage("company", async () => {
            const c = await enrichCompany(companyId);
            return { ...c, detail: `${c.value.info.headcount?.toLocaleString("en-US") ?? "?"} people, ${c.value.news.length} news items` };
          }).catch(() => null)
        : (skip(["company"], "No company"), Promise.resolve(null)),
      companyId
        ? stage("hiring", async () => {
            const j = await financeJobs(companyId, playbook.jobKeywords);
            return { ...j, detail: `${j.value.length} relevant postings (90 days)` };
          }).catch(() => [])
        : (skip(["hiring"], "No company"), Promise.resolve([])),
      stage("posts", async () => {
        const [pp, cp] = await Promise.all([
          prospect.personId ? postsBy(prospect.personId, "person", 4) : Promise.resolve(nothing),
          companyId ? postsBy(companyId, "company", 2) : Promise.resolve(nothing),
        ]);
        return { value: { person: pp.value, company: cp.value }, credits: pp.credits + cp.credits, detail: `${pp.value.length} by them, ${cp.value.length} by company` };
      }).catch(() => ({ person: [], company: [] })),
      stage("news", async () => {
        const q = person.companyName || (companyRef as any)?.name || prospect.name;
        const w = await webNews(`"${q}"`, q);
        return { ...w, detail: `${w.value.length} recent articles` };
      }).catch(() => []),
    ]);

    const company: CompanyInfo | undefined = companyOut?.info || (person.companyName ? { id: companyId || 0, name: person.companyName } : undefined);
    result.company = company;

    const raw: RawResearch = {
      prospect,
      company,
      companyNews: companyOut?.news || [],
      jobs: (jobs as any[]) || [],
      personPosts: (posts as any)?.person || [],
      companyPosts: (posts as any)?.company || [],
      webNews: (news as any[]) || [],
    };
    const signals = buildSignals(raw, input.purpose);
    for (const s of signals) result.sources[s.id] = { label: `${s.label}, ${s.sourceName}`, url: s.sourceUrl, date: s.date };
    for (const p of playbook.proofPoints) result.sources[p.id] = { label: `Proof point, ${p.source}`, url: p.sourceUrl };
    if (playbook.event) result.sources["event"] = { label: "Event details (sample event)" };
    if (input.note) result.sources["rep_note"] = { label: "Rep's note" };

    // ---------- 4. Analyst ----------
    const analysis = await stage("analyze", async () => {
      if (!signals.length) {
        return {
          value: { signals: [], persona_fit: { verdict: "weak" as const, reason: "No signals to judge" }, executive: isExecutive(prospect.seniority, prospect.title), notes: [] },
          credits: 0,
          detail: "No signals found",
        };
      }
      const a = await runAnalyst({
        purpose: purposeForLLM(playbook),
        prospect: {
          name: prospect.name,
          title: prospect.title,
          seniority: prospect.seniority,
          started_role: prospect.startDate,
          past_roles: prospect.pastRoles,
          location: prospect.location,
        },
        company: company
          ? { name: company.name, industry: company.industry, headcount: company.headcount, headcount_growth_qoq_pct: company.headcountQoq, last_round: company.lastRound, last_round_date: company.lastRoundDate, open_roles: company.openings }
          : null,
        signals: signals.map((s) => ({ id: s.id, type: s.type, date: s.date || null, age_days: s.ageDays, source: s.sourceName, text: s.text })),
      });
      result.usage.tokens += a.tokens;
      result.usage.llmCalls += 1;
      return { value: a.data, credits: 0, detail: `${signals.length} signals judged` };
    });

    // ---------- 5. Rank (code) ----------
    const judged: ScoredSignal[] = signals.map((s) => {
      const j = analysis.signals.find((x) => x.id === s.id);
      const recency = recencyPoints(s.ageDays);
      const bonus = j ? (j.specificity === "person" ? 2 : j.specificity === "company" ? 1 : 0) : 0;
      const score = j ? j.relevance * 2 + recency + bonus : 0;
      const sensitive = !!j?.sensitive || (!!s.keywordSensitive && (j?.relevance ?? 0) > 0 && s.type === "news") || s.type === "headcount_decline";
      return {
        ...s,
        judgement: j ? { ...j, sensitive } : undefined,
        recency,
        score,
        excluded: sensitive ? "sensitive" : j?.injection_suspected ? "injection" : !j || !j.usable_fact || score < HOOK_THRESHOLD ? "weak" : undefined,
      };
    });
    judged.sort((a, b) => b.score - a.score);
    result.signals = judged;
    result.analysisNotes = analysis.notes;
    result.personaFit = analysis.persona_fit;
    const executive = analysis.executive || isExecutive(prospect.seniority, prospect.title);
    result.executive = executive;

    if (analysis.persona_fit.verdict === "no_fit" && !input.ignoreFit) {
      skip(["draft", "check"], "Waiting for the rep");
      return finish({
        ...result,
        status: "needs_input",
        edge: {
          kind: "not_fit",
          title: `${prospect.firstName} is not a typical buyer for this purpose`,
          message: analysis.persona_fit.reason,
        },
      });
    }
    if (analysis.persona_fit.verdict === "weak") result.flags.personaWeak = analysis.persona_fit.reason;

    const topOverall = judged[0];
    const best = judged.find((s) => !s.excluded);
    if (topOverall && topOverall.excluded === "sensitive" && topOverall.judgement && topOverall.judgement.relevance >= 3) {
      result.flags.sensitiveSkipped = `${topOverall.label}: ${topOverall.judgement.sensitive_reason || "sensitive topic"}`;
    }

    let hook: Hook;
    if (best && best.judgement) {
      hook = { source_id: best.id, usable_fact: best.judgement.usable_fact, date: best.date || "", angle: best.judgement.angle, label: best.label };
    } else {
      result.flags.lowPersonalization = true;
      hook = {
        source_id: "role",
        usable_fact: `${prospect.title} at ${company?.name || "their company"}`,
        date: "",
        angle: "No timely signal found; reach out based on role only.",
        label: "Role only",
      };
      result.sources["role"] = { label: "Role and company, Profile", url: prospect.profileUrl };
    }
    result.hook = hook;

    // ---------- 6 + 7. Draft and check ----------
    const written = await stage("draft", async () => {
      const w = await writeDraft({
        purpose: input.purpose,
        sender: input.sender,
        prospect,
        company,
        hook,
        executive,
        lowPersonalization: !!result.flags.lowPersonalization,
        note: input.note,
        allowedSources: Object.keys(result.sources),
      });
      result.usage.tokens += w.tokens;
      result.usage.llmCalls += w.calls;
      return { value: w, credits: 0, detail: w.draft.status === "ok" ? `${w.quality?.words ?? 0} words${w.calls > 1 ? ", rewritten once" : ""}` : "Refused: not enough to say" };
    });

    emit({ type: "stage", id: "check", status: "running" });
    result.draft = written.draft;
    result.quality = written.quality;
    emit({
      type: "stage",
      id: "check",
      status: written.quality?.passes ? "done" : "warn",
      detail: written.quality ? `Score ${written.quality.score}/100, grade ${written.quality.grade}` : "No draft to check",
      ms: 1,
    });

    return finish({ ...result, status: written.draft.status === "ok" ? "drafted" : "needs_input" });
  } catch (e: any) {
    return finish({ ...result, status: "error", error: e?.message || "Something went wrong" });
  }
}

function purposeForLLM(p: Playbook) {
  return {
    id: p.id,
    goal: p.goal,
    target_roles: p.targetRoles,
    strong_signals: p.strongSignals,
    avoid: p.avoid,
    event: p.event ? { name: p.event.name, date: p.event.date, city: p.event.city, topic: p.event.topic, audience: p.event.audience } : undefined,
  };
}

export interface WriteInput {
  purpose: PurposeId;
  sender: Sender;
  prospect: Prospect;
  company?: CompanyInfo;
  hook: Hook;
  executive: boolean;
  lowPersonalization: boolean;
  note?: string;
  allowedSources: string[];
  attempt?: number;
}

export async function writeDraft(w: WriteInput): Promise<{ draft: Draft; quality?: QualityReport; tokens: number; calls: number }> {
  const p = PLAYBOOKS[w.purpose];
  const maxWords = w.executive ? Math.min(70, p.length.max) : p.length.max;
  const base = {
    purpose: {
      id: p.id,
      offer: p.offer,
      proof_points: p.proofPoints.map((x) => ({ id: x.id, text: x.text })),
      cta_examples: p.ctaExamples,
      length: { min: Math.min(p.length.min, maxWords - 10), max: maxWords },
      never_say: p.neverSay,
      event: p.event ? { name: p.event.name, format: p.event.format, date: p.event.date, city: p.event.city, topic: p.event.topic, audience: p.event.audience, takeaway: p.event.takeaway } : undefined,
    },
    sender: w.sender,
    prospect: { first_name: w.prospect.firstName, title: w.prospect.title, company: w.company?.name || "", executive: w.executive },
    hook: { source_id: w.hook.source_id, usable_fact: w.hook.usable_fact, date: w.hook.date, angle: w.hook.angle },
    low_personalization: w.lowPersonalization,
    rep_note: w.note || "",
    attempt: w.attempt || 1,
  };
  let tokens = 0;
  let calls = 0;
  const first = await runWriter(base);
  tokens += first.tokens;
  calls += 1;
  let draft = first.data;
  if (draft.status !== "ok") return { draft, tokens, calls };
  const opts = { maxWords, allowedSources: w.allowedSources, neverSay: p.neverSay };
  let quality = checkDraft(draft, opts);
  if (!quality.passes) {
    const retry = await runWriter({ ...base, previous_problems: quality.issues });
    tokens += retry.tokens;
    calls += 1;
    if (retry.data.status === "ok") {
      const q2 = checkDraft(retry.data, opts);
      if (q2.score >= quality.score) {
        draft = retry.data;
        quality = q2;
      }
    }
  }
  return { draft, quality, tokens, calls };
}

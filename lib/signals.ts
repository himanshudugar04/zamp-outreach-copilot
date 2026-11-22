import { ageInDays } from "./crustdata";
import type { CompanyInfo, Prospect, PurposeId, Signal } from "./types";

const SENSITIVE_WORDS = [
  "layoff", "laid off", "lay off", "redundanc", "restructur", "job cuts", "cuts jobs", "lawsuit", "sued",
  "fine", "penalty", "breach", "hack", "outage", "fraud", "investigation", "resign", "fired", "ousted",
  "steps down", "stepped down", "bankrupt", "insolven", "passed away", "death", "died", "probe",
];

export function looksSensitive(text: string) {
  const t = " " + text.toLowerCase() + " ";
  return SENSITIVE_WORDS.some((w) => t.includes(w));
}

function money(n?: number) {
  if (!n) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 2).replace(/\.?0+$/, "")}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${Math.round(n / 1e3)}K`;
}

function prettyRound(t?: string) {
  if (!t) return "a round";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d?: string) {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function clip(s: string, n: number) {
  const x = (s || "").replace(/\s+/g, " ").trim();
  return x.length > n ? x.slice(0, n - 1) + "…" : x;
}

export interface RawResearch {
  prospect: Prospect;
  company?: CompanyInfo;
  companyNews: { title: string; url?: string; date?: string; publisher?: string }[];
  jobs: { title: string; url?: string; date?: string }[];
  personPosts: { text: string; url?: string; date?: string; postType?: string; reactions?: number }[];
  companyPosts: { text: string; url?: string; date?: string }[];
  webNews: { title: string; url?: string; date?: string; snippet?: string; source?: string }[];
  personPress?: { title: string; url?: string; date?: string; snippet?: string; source?: string }[];
}

export function buildSignals(r: RawResearch, purpose: PurposeId): Signal[] {
  const out: Signal[] = [];
  const push = (s: Omit<Signal, "id" | "keywordSensitive">) =>
    out.push({ ...s, id: "", keywordSensitive: looksSensitive(s.text) });
  const p = r.prospect;
  const c = r.company;
  const cname = c?.name || "their company";

  // Person: new in role
  const roleAge = ageInDays(p.startDate);
  if (p.startDate && roleAge !== null && roleAge <= 200) {
    push({
      type: "new_in_role",
      label: "New in role",
      text: `${p.name} started as ${p.title} at ${cname} on ${fmtDate(p.startDate)}.`,
      date: p.startDate,
      ageDays: roleAge,
      sourceUrl: p.profileUrl,
      sourceName: "Profile",
    });
  }

  if (c) {
    const fAge = ageInDays(c.lastRoundDate);
    if (c.lastRoundDate && fAge !== null && fAge <= 400) {
      push({
        type: "funding",
        label: "Funding",
        text: `${cname} raised ${prettyRound(c.lastRound)}${c.lastRoundUsd ? ` of ${money(c.lastRoundUsd)}` : ""} on ${fmtDate(c.lastRoundDate)}${c.totalFundingUsd ? ` (total raised ${money(c.totalFundingUsd)})` : ""}.`,
        date: c.lastRoundDate,
        ageDays: fAge,
        sourceUrl: c.linkedinUrl,
        sourceName: "Company profile",
      });
    }
    const q = c.headcountQoq ?? 0;
    const y = c.headcountYoy ?? 0;
    if ((q >= 8 || y >= 20) && c.headcount) {
      push({
        type: "headcount_growth",
        label: "Headcount growth",
        text: `${cname} headcount is up ${q >= 8 ? `${q.toFixed(0)}% over the last quarter` : `${y.toFixed(0)}% over the last year`}, to about ${c.headcount.toLocaleString("en-US")} people.`,
        ageDays: 20,
        sourceName: "Company profile",
        sourceUrl: c.linkedinUrl,
      });
    } else if ((q <= -8 || y <= -15) && c.headcount) {
      push({
        type: "headcount_decline",
        label: "Headcount decline",
        text: `${cname} headcount is down ${q <= -8 ? `${Math.abs(q).toFixed(0)}% over the last quarter` : `${Math.abs(y).toFixed(0)}% over the last year`}, to about ${c.headcount.toLocaleString("en-US")} people.`,
        ageDays: 20,
        sourceName: "Company profile",
        sourceUrl: c.linkedinUrl,
      });
    }
    if ((c.openingsQoq ?? 0) >= 0.3 && (c.openings ?? 0) >= 10) {
      push({
        type: "hiring_growth",
        label: "Hiring surge",
        text: `${cname} has ${c.openings} open roles, up ${Math.round((c.openingsQoq ?? 0) * 100)}% over the last quarter.`,
        ageDays: 15,
        sourceName: "Company profile",
        sourceUrl: c.linkedinUrl,
      });
    }
  }

  if (r.jobs.length) {
    const newest = r.jobs[0];
    const titles = Array.from(new Set(r.jobs.map((j) => j.title))).slice(0, 4);
    push({
      type: "finops_hiring",
      label: "Finance-ops hiring",
      text: `${cname} posted ${r.jobs.length} finance or operations role${r.jobs.length > 1 ? "s" : ""} in the last 90 days, including ${titles.join("; ")}.`,
      date: newest.date,
      ageDays: ageInDays(newest.date),
      sourceUrl: newest.url,
      sourceName: "Job postings",
    });
  }

  // News: company enrich news first, then web news, deduped
  const seen = new Set<string>();
  const news = [
    ...r.companyNews.map((n) => ({ ...n, src: n.publisher || "News" })),
    ...r.webNews.map((n) => ({ title: n.title, url: n.url, date: n.date, src: n.source || "Web news" })),
  ]
    .filter((n) => n.title && (ageInDays(n.date) ?? 999) <= 150)
    .filter((n) => {
      const k = n.title.toLowerCase().slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (ageInDays(a.date) ?? 999) - (ageInDays(b.date) ?? 999))
    .slice(0, 4);
  for (const n of news) {
    push({
      type: "news",
      label: "News",
      text: clip(n.title, 220),
      date: n.date,
      ageDays: ageInDays(n.date),
      sourceUrl: n.url,
      sourceName: n.src,
    });
  }

  // Press, interviews, podcasts and talks that name the person
  for (const a of (r.personPress || []).slice(0, 3)) {
    push({
      type: "person_press",
      label: a.source === "LinkedIn post" ? "Their LinkedIn post (web)" : /podcast|youtube|spotify/i.test(a.title + (a.snippet || "") + a.url) ? "Podcast" : /interview|keynote|panel|summit|conference/i.test(a.title + (a.snippet || "")) ? "Interview or talk" : "Press mention",
      text: clip(`${a.title}${a.snippet ? ". " + a.snippet : ""}`, 300),
      date: a.date,
      ageDays: ageInDays(a.date),
      sourceUrl: a.url,
      sourceName: a.source || "Web",
    });
  }

  for (const post of r.personPosts.slice(0, 4)) {
    const repost = post.postType === "repost_without_thoughts";
    push({
      type: "person_post",
      label: repost ? "Their repost" : "Their post",
      text: (repost ? "[Repost, not their own words] " : "") + clip(post.text, 500),
      date: post.date,
      ageDays: ageInDays(post.date),
      sourceUrl: post.url,
      sourceName: "LinkedIn post",
    });
  }
  for (const post of r.companyPosts.slice(0, 2)) {
    push({
      type: "company_post",
      label: "Company post",
      text: clip(post.text, 400),
      date: post.date,
      ageDays: ageInDays(post.date),
      sourceUrl: post.url,
      sourceName: "Company LinkedIn",
    });
  }

  if (purpose === "event_invite" && p.location) {
    push({
      type: "location",
      label: "Location",
      text: `${p.name} is based in ${p.location}.`,
      ageDays: 30,
      sourceUrl: p.profileUrl,
      sourceName: "Profile",
    });
  }

  // Keep at most 12, preferring fresher ones, and assign ids
  return out
    .sort((a, b) => (a.ageDays ?? 400) - (b.ageDays ?? 400))
    .slice(0, 12)
    .map((s, i) => ({ ...s, id: `s${i + 1}` }));
}

export function recencyPoints(ageDays: number | null) {
  if (ageDays === null) return 1;
  if (ageDays <= 30) return 3;
  if (ageDays <= 90) return 2;
  if (ageDays <= 180) return 1;
  return 0;
}

export { fmtDate, money, prettyRound };

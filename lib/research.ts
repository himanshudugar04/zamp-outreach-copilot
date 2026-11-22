import { and, crust, daysAgoISO, f, or } from "./crustdata";
import type { Candidate, CompanyInfo, Prospect } from "./types";

export interface Step<T> {
  value: T;
  credits: number;
}

// ---------- company ----------
export async function identifyCompany(input: string): Promise<Step<{ id: number; name: string; domain?: string } | null>> {
  const isDomain = /\.[a-z]{2,}$/i.test(input.trim()) && !/\s/.test(input.trim());
  const body = isDomain
    ? { domains: [input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")] }
    : { names: [input.trim()] };
  const { data, credits } = await crust<any[]>("/company/identify", body);
  // Many companies can share a name with equal confidence: prefer the biggest real company with a domain.
  const size = (r?: string) => {
    if (!r) return 0;
    const n = Number(String(r).replace(/[^0-9-]/g, "").split("-").pop());
    return Number.isFinite(n) ? n : 0;
  };
  const matches = (data?.[0]?.matches || []).slice().sort(
    (a: any, b: any) =>
      (b.confidence_score ?? 0) - (a.confidence_score ?? 0) ||
      size(b.company_data?.basic_info?.employee_count_range) - size(a.company_data?.basic_info?.employee_count_range) ||
      Number(!!b.company_data?.basic_info?.primary_domain) - Number(!!a.company_data?.basic_info?.primary_domain)
  );
  const top = matches[0]?.company_data;
  if (!top) return { value: null, credits };
  const bi = top.basic_info || {};
  return {
    value: { id: top.crustdata_company_id ?? bi.crustdata_company_id, name: bi.name, domain: bi.primary_domain },
    credits,
  };
}

export async function enrichCompany(id: number): Promise<Step<{ info: CompanyInfo; news: { title: string; url?: string; date?: string; publisher?: string }[] }>> {
  const { data, credits } = await crust<any[]>("/company/enrich", {
    crustdata_company_ids: [id],
    fields: ["basic_info", "funding", "headcount", "hiring", "news", "taxonomy", "locations"],
  });
  const c = data?.[0]?.matches?.[0]?.company_data || {};
  const bi = c.basic_info || {};
  const hc = c.headcount || {};
  const fu = c.funding || {};
  const hi = c.hiring || {};
  const loc = c.locations || {};
  const newsRaw = Array.isArray(c.news) ? c.news : c.news ? [c.news] : [];
  const info: CompanyInfo = {
    id,
    name: bi.name,
    domain: bi.primary_domain,
    logo: bi.logo_permalink,
    description: bi.description,
    industry: c.taxonomy?.professional_network_industry,
    headcount: hc.total,
    headcountQoq: hc.growth_percent?.qoq,
    headcountYoy: hc.growth_percent?.yoy,
    hq: [loc.headquarters, loc.country].filter(Boolean)[0],
    lastRound: fu.last_round_type,
    lastRoundDate: fu.last_fundraise_date,
    lastRoundUsd: fu.last_round_amount_usd,
    totalFundingUsd: fu.total_investment_usd,
    openings: hi.openings_count,
    openingsQoq: hi.openings_growth_percent?.qoq,
    linkedinUrl: bi.professional_network_url,
  };
  const news = newsRaw
    .map((n: any) => ({ title: n.article_title, url: n.article_url, date: n.article_publish_date, publisher: n.article_publisher_name }))
    .filter((n: any) => n.title);
  return { value: { info, news }, credits };
}

// ---------- people ----------
const SEARCH_FIELDS = [
  "crustdata_person_id",
  "basic_profile.name",
  "basic_profile.headline",
  "basic_profile.location",
  "social_handles.professional_network_identifier.profile_url",
  "experience.employment_details.current",
  "experience.employment_details.past",
];

function toCandidate(p: any, companyId?: number): Candidate {
  const cur: any[] = p.experience?.employment_details?.current || [];
  const role = cur.find((r) => companyId && r.crustdata_company_id === companyId) || cur[0] || {};
  const loc = p.basic_profile?.location;
  return {
    name: p.basic_profile?.name,
    headline: p.basic_profile?.headline,
    title: role.title,
    company: role.name,
    location: typeof loc === "string" ? loc : loc?.full_location || loc?.raw || [loc?.city, loc?.country].filter(Boolean).join(", "),
    startDate: role.start_date,
    profileUrl: p.social_handles?.professional_network_identifier?.profile_url,
  };
}

function nameMatches(input: string, found?: string) {
  if (!found) return false;
  const f2 = found.toLowerCase();
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => f2.includes(t));
}

async function personSearch(filters: unknown, limit = 5) {
  return crust<{ profiles: any[]; total_count: number }>("/person/search", { filters, fields: SEARCH_FIELDS, limit });
}

export type Resolution =
  | { kind: "found"; profileUrl: string; companyId?: number }
  | { kind: "ambiguous"; candidates: Candidate[] }
  | { kind: "moved"; candidate: Candidate; oldTitle: string; endDate?: string }
  | { kind: "not_found"; candidates: Candidate[] };

export async function resolvePerson(name: string, company: { id: number; name: string } | null): Promise<Step<Resolution>> {
  let credits = 0;
  const nameF = f("basic_profile.name", "(.)", name);

  if (company) {
    const atCo = await personSearch(and(nameF, f("experience.employment_details.current.company_id", "=", company.id)));
    credits += atCo.credits;
    const hits = (atCo.data.profiles || []).filter((p) => nameMatches(name, p.basic_profile?.name));
    const uniq = dedupe(hits.map((p) => toCandidate(p, company.id)));
    if (uniq.length === 1 && uniq[0].profileUrl) return { value: { kind: "found", profileUrl: uniq[0].profileUrl, companyId: company.id }, credits };
    if (uniq.length > 1) return { value: { kind: "ambiguous", candidates: uniq }, credits };

    // Not there now: did they work there before?
    const past = await personSearch(and(nameF, f("experience.employment_details.past.company_id", "=", company.id)), 3);
    credits += past.credits;
    const pastHit = (past.data.profiles || []).find((p) => nameMatches(name, p.basic_profile?.name));
    if (pastHit) {
      const oldRole = (pastHit.experience?.employment_details?.past || []).find((r: any) => r.crustdata_company_id === company.id) || {};
      return {
        value: { kind: "moved", candidate: toCandidate(pastHit), oldTitle: oldRole.title || "", endDate: oldRole.end_date },
        credits,
      };
    }
  }

  const any = await personSearch(nameF, 5);
  credits += any.credits;
  const all = dedupe((any.data.profiles || []).filter((p) => nameMatches(name, p.basic_profile?.name)).map((p) => toCandidate(p)));
  if (!company && all.length === 1 && all[0].profileUrl) return { value: { kind: "found", profileUrl: all[0].profileUrl }, credits };
  if (!company && all.length > 1) return { value: { kind: "ambiguous", candidates: all }, credits };
  return { value: { kind: "not_found", candidates: all }, credits };
}

export async function findSuccessors(companyId: number, title: string): Promise<Step<Candidate[]>> {
  const res = await personSearch(
    and(
      f("experience.employment_details.current.company_id", "=", companyId),
      f("experience.employment_details.current.title", "(.)", title),
      f("experience.employment_details.current.start_date", "=>", daysAgoISO(540))
    ),
    5
  );
  return { value: dedupe((res.data.profiles || []).map((p) => toCandidate(p, companyId))), credits: res.credits };
}

function dedupe(c: Candidate[]) {
  const seen = new Set<string>();
  return c.filter((x) => {
    const k = x.profileUrl || x.name + x.company;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function enrichPerson(
  profileUrl: string,
  preferCompanyId?: number
): Promise<Step<{ status: "matched" | "not_found" | "redacted"; prospect?: Prospect; companyId?: number; companyName?: string }>> {
  const { data, credits } = await crust<any[]>("/person/enrich", {
    professional_network_profile_urls: [profileUrl],
    fields: ["crustdata_person_id", "basic_profile", "experience", "social_handles", "contact.business_emails"],
  });
  const row = data?.[0];
  const status = row?.match_status || (row?.matches?.length ? "matched" : "not_found");
  const pd = row?.matches?.[0]?.person_data;
  if (status !== "matched" || !pd) return { value: { status: status === "redacted" ? "redacted" : "not_found" }, credits };
  const bp = pd.basic_profile || {};
  const cur: any[] = pd.experience?.employment_details?.current || [];
  const role =
    cur.find((r) => preferCompanyId && r.crustdata_company_id === preferCompanyId) ||
    cur.find((r) => r.is_default) ||
    cur[0] ||
    {};
  const past: any[] = pd.experience?.employment_details?.past || [];
  const loc = bp.location;
  const name: string = bp.name || "";
  const prospect: Prospect = {
    name,
    firstName: bp.first_name || name.split(" ")[0] || name,
    title: role.title || bp.current_title || bp.headline || "",
    headline: bp.headline,
    seniority: role.seniority_level,
    location: typeof loc === "string" ? loc : loc?.full_location || loc?.raw || [loc?.city, loc?.country].filter(Boolean).join(", "),
    startDate: role.start_date,
    profileUrl: pd.social_handles?.professional_network_identifier?.profile_url || profileUrl,
    photo: bp.profile_picture_permalink,
    email: pd.contact?.business_emails?.[0]?.email,
    pastRoles: past.slice(0, 4).map((r) => ({ title: r.title, company: r.name, start: r.start_date, end: r.end_date })),
    personId: pd.crustdata_person_id,
  };
  return { value: { status: "matched", prospect, companyId: role.crustdata_company_id, companyName: role.name }, credits };
}

// ---------- signals sources ----------
export async function financeJobs(companyId: number, keywords: string[]): Promise<Step<{ title: string; url?: string; date?: string }[]>> {
  const { data, credits } = await crust<any>("/job/search", {
    filters: and(
      f("company.basic_info.company_id", "=", companyId),
      f("metadata.date_added", "=>", daysAgoISO(90)),
      or(...keywords.map((k) => f("job_details.title", "[.]", k)))
    ),
    sorts: [{ field: "metadata.date_added", order: "desc" }],
    fields: ["job_details.title", "job_details.url", "metadata.date_added"],
    limit: 20,
  });
  // Keyword matches also catch product, sales and engineering roles (e.g. "Product Design Lead - Payroll").
  const notOps = /engineer|developer|design|account executive|sales|product|marketing|recruit|solution|partner|customer success|implementation|consultant|scientist|analyst, data/i;
  return {
    value: (data.job_listings || [])
      .map((j: any) => ({ title: j.job_details?.title, url: j.job_details?.url, date: j.metadata?.date_added }))
      .filter((j: any) => j.title && !notOps.test(j.title)),
    credits,
  };
}

export async function postsBy(entityId: number, kind: "person" | "company", limit: number) {
  const { data, credits } = await crust<any>("/social_post/search", {
    filters: and(f("actor.crustdata_entity_id", "=", entityId), f("actor.actor_type", "=", kind)),
    sorts: [{ field: "date_posted", order: "desc" }],
    fields: ["text", "date_posted", "share_url", "post_type", "engagement.total_reactions"],
    limit,
  });
  return {
    value: (data.posts || []).map((p: any) => ({
      text: p.text || "",
      url: p.share_url,
      date: p.date_posted,
      postType: p.post_type,
      reactions: p.engagement?.total_reactions,
    })),
    credits,
  };
}

function parseNewsDate(meta?: string): string | undefined {
  if (!meta) return undefined;
  const rel = meta.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const days = unit === "minute" || unit === "hour" ? 0 : unit === "day" ? n : unit === "week" ? n * 7 : n * 30;
    return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  }
  const t = Date.parse(meta);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
}

export async function webNews(query: string, mustContain?: string) {
  const { data, credits } = await crust<any>("/web/search/live", {
    query,
    sources: ["news"],
    start_date: Math.floor((Date.now() - 150 * 864e5) / 1000),
  });
  return {
    value: (data.results || [])
      .filter((r: any) => !mustContain || String(r.title || "").includes(mustContain))
      .slice(0, 8)
      .map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      date: parseNewsDate(r.date || r.metadata),
      source: "Web news",
    })),
    credits,
  };
}

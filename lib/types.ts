export type PurposeId = "sales_outreach" | "event_invite";

export type StageId =
  | "resolve"
  | "person"
  | "company"
  | "hiring"
  | "posts"
  | "news"
  | "analyze"
  | "draft"
  | "check";

export type StageStatus = "pending" | "running" | "done" | "skipped" | "warn" | "error";

export interface StageEvent {
  type: "stage";
  id: StageId;
  status: StageStatus;
  detail?: string;
  ms?: number;
  credits?: number;
}

export interface Sender {
  name: string;
  role: string;
}

export interface RunInput {
  name?: string;
  company?: string;
  linkedinUrl?: string;
  purpose: PurposeId;
  note?: string;
  sender: Sender;
  /** Re-target flow: find who replaced someone at a company */
  findSuccessor?: { companyId: number; companyName: string; title: string };
  /** Skip the persona-fit gate after the rep confirms */
  ignoreFit?: boolean;
}

export interface Candidate {
  name: string;
  headline?: string;
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  profileUrl?: string;
}

export type EdgeKind =
  | "moved"
  | "ambiguous"
  | "not_found"
  | "suppressed"
  | "redacted"
  | "not_fit"
  | "successors";

export interface EdgeCase {
  kind: EdgeKind;
  title: string;
  message: string;
  candidates?: Candidate[];
  moved?: {
    oldCompany: string;
    oldCompanyId: number;
    oldTitle: string;
    endDate?: string;
    newCompany?: string;
    newTitle?: string;
    profileUrl?: string;
  };
}

export interface Prospect {
  name: string;
  firstName: string;
  title: string;
  headline?: string;
  seniority?: string;
  location?: string;
  startDate?: string;
  profileUrl?: string;
  photo?: string;
  email?: string;
  pastRoles: { title: string; company: string; start?: string; end?: string }[];
  personId?: number;
}

export interface CompanyInfo {
  id: number;
  name: string;
  domain?: string;
  logo?: string;
  description?: string;
  industry?: string;
  headcount?: number;
  headcountQoq?: number;
  headcountYoy?: number;
  hq?: string;
  lastRound?: string;
  lastRoundDate?: string;
  lastRoundUsd?: number;
  totalFundingUsd?: number;
  openings?: number;
  openingsQoq?: number;
  linkedinUrl?: string;
}

export type SignalType =
  | "new_in_role"
  | "funding"
  | "headcount_growth"
  | "headcount_decline"
  | "hiring_growth"
  | "finops_hiring"
  | "news"
  | "person_post"
  | "company_post"
  | "location"
  | "role";

export interface Signal {
  id: string;
  type: SignalType;
  label: string;
  text: string;
  date?: string;
  ageDays: number | null;
  sourceUrl?: string;
  sourceName: string;
  keywordSensitive?: boolean;
}

export interface SignalJudgement {
  id: string;
  relevance: number;
  specificity: "person" | "company" | "topic";
  sensitive: boolean;
  sensitive_reason: string;
  injection_suspected: boolean;
  angle: string;
  usable_fact: string;
}

export interface ScoredSignal extends Signal {
  judgement?: SignalJudgement;
  score: number;
  recency: number;
  excluded?: "sensitive" | "injection" | "weak";
}

export interface Analysis {
  signals: SignalJudgement[];
  persona_fit: { verdict: "fit" | "weak" | "no_fit"; reason: string };
  executive: boolean;
  notes: string[];
}

export interface Hook {
  source_id: string;
  usable_fact: string;
  date: string;
  angle: string;
  label: string;
}

export interface Claim {
  text: string;
  source_id: string;
}

export interface Draft {
  status: "ok" | "insufficient";
  subject: string;
  body: string;
  claims: Claim[];
  insufficient_reason: string;
}

export interface QualityReport {
  words: number;
  sentences: number;
  grade: number;
  questions: number;
  youCount: number;
  iCount: number;
  bannedFound: string[];
  unsupportedClaims: string[];
  maxWords: number;
  score: number;
  passes: boolean;
  issues: string[];
}

export interface Usage {
  credits: number;
  tokens: number;
  llmCalls: number;
}

export type RunStatus = "drafted" | "needs_input" | "skipped" | "error";

export interface RunResult {
  status: RunStatus;
  purpose: PurposeId;
  edge?: EdgeCase;
  flags: { lowPersonalization?: boolean; sensitiveSkipped?: string; personaWeak?: string };
  prospect?: Prospect;
  company?: CompanyInfo;
  signals: ScoredSignal[];
  hook?: Hook;
  analysisNotes?: string[];
  personaFit?: Analysis["persona_fit"];
  executive?: boolean;
  draft?: Draft;
  quality?: QualityReport;
  sources: Record<string, { label: string; url?: string; date?: string }>;
  usage: Usage;
  durationMs: number;
  error?: string;
}

export interface ResultEvent {
  type: "result";
  result: RunResult;
}

export type StreamEvent = StageEvent | ResultEvent;

/**
 * Playbooks are plain markdown files a rep can read, edit and upload.
 *
 * - One COMPANY PROFILE: who the seller is, its product suites, proof points,
 *   who never to contact. Shared by every purpose.
 * - One PURPOSE PLAYBOOK per kind of outreach (sales, event invite, sponsorship…):
 *   goal, who to target, which signals matter, what we're offering, the ask.
 *
 * The built-in Zamp files below use exactly the same format a rep uploads, so the
 * parser is the single path for both. Parsing is deterministic code, no LLM call.
 */

export type PurposeId = string;

export interface ProofPoint {
  id: string;
  text: string;
  source: string;
  sourceUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  does: string;
  fitsWhen: string;
}

export interface CompanyProfile {
  name: string;
  about: string;
  products: Product[];
  proofPoints: ProofPoint[];
  doNotContact: string[];
  neverSay: string[];
  extra: string;
}

export interface Playbook {
  id: PurposeId;
  name: string;
  persona: string;
  goal: string;
  /** Present → the email pitches this offer (event, sponsorship…). Absent → it pitches the product suites. */
  offer: string;
  /** Free-text facts the writer may use (event date, venue, package tiers…). */
  details: string;
  targetRoles: string[];
  strongSignals: string[];
  avoid: string[];
  jobKeywords: string[];
  ctaExamples: string[];
  length: { min: number; max: number };
  /** Length when the prospect is VP or C-level */
  execLength: { min: number; max: number };
  /** Detailed guidance on how the message should read: the writer's main brief */
  guidance: string;
  /** The outline the email follows, in order. Empty means the writer picks a shape that fits the goal. */
  structure: string;
  neverSay: string[];
  tone: string;
  extra: string;
  builtIn: boolean;
}

export interface ParseReport<T> {
  value: T;
  missing: string[];
  found: string[];
  ignored: string[];
}

export const MAX_FILE_CHARS = 15000;

// ---------------------------------------------------------------- built-in files

export const ZAMP_COMPANY_MD = `# Zamp

## About
Zamp builds AI employees that take over finance and operations work end to end and stay accountable for the result. Customers are mid-size and large companies and banks. Buyers are finance and operations leaders.

## Product suites
- Accounts payable: reads invoices, matches them to POs, routes approvals and schedules vendor payments. Fits when: AP hiring, invoice volume growth, slow approvals, a new finance leader.
- Procure to pay: turns purchase requests into approved POs and onboards vendors. Fits when: procurement hiring, many entities or vendors, expansion into new markets.
- Accounting close: prepares reconciliations and journal entries so month-end closes faster. Fits when: controller or accounting hiring, IPO prep, a new ERP, a recent funding round.
- Disputes and chargebacks: works card disputes from intake to resolution. Fits when: a bank, card issuer or fintech, disputes or chargeback hiring.
- KYC and KYB onboarding: runs customer and business onboarding checks and payment screening. Fits when: a bank or fintech, compliance ops hiring, new market launches.

## Proof points
- Zamp cut Instacart's AP approval time from 2 weeks to 2 days (source: https://zamp.ai)
- Zamp automated 80% of Instacart's manual AP work (source: https://zamp.ai)
- Mindbody says Zamp now handles most of its invoice processing end to end (source: https://zamp.ai)
- Zamp took a bank's card chargeback backlog from two months to one day (source: https://aws.amazon.com/startups/learn/zamp-realizing-an-autonomous-future-for-enterprise-with-aws)
- Zamp brought a bank's KYC and KYB onboarding down to about five minutes (source: https://aws.amazon.com/startups/learn/zamp-realizing-an-autonomous-future-for-enterprise-with-aws)

## Do not contact
- Instacart
- Mindbody
- Block
- Amgen
- Uber Freight
- Wio
- Wio Bank
- Commercial Bank of Dubai
- Zamp

## Words to avoid
- AI-powered
- digital transformation
- streamline your operations
- I'd love to
`;

export const SALES_MD = `# Sales outreach

## Goal
Get a first reply from a finance or operations leader who has never heard from Zamp.

## Who sends it
SDR or Account Executive

## Target roles
- CFO
- VP Finance
- Finance Director
- Controller
- Head of Accounts Payable
- Head of Finance Operations
- Head of Shared Services
- COO
- Head of Operations
- Head of Payments, Cards or Disputes
- Head of KYC or Compliance Operations

## Signals that matter
- Hiring for AP, accounting, payments ops, disputes, KYC or compliance ops
- A new finance or operations leader
- A funding round or expansion that multiplies transaction volume
- ERP or finance-system change in job posts
- The prospect posting or speaking about manual finance work, close speed or ops headcount

## Signals to ignore
- Awards, marketing campaigns, product launches unrelated to finance ops
- Anything sensitive

## Hiring keywords
- Accounts Payable
- Accounting
- Controller
- Finance Operations
- Procurement
- Payroll
- Billing
- Chargeback
- Dispute
- KYC
- Compliance
- Treasury
- Revenue Accounting

## Call to action
- Open to a short chat?
- Worth a 15 minute call?
- Would a quick chat be useful?

## Length
175 to 200 words

## Executive length
125 to 150 words

## Structure
1. Introduce yourself and Zamp in one or two plain sentences, framed around the kind of work this reader owns.
2. Why them, why now: the most specific recent fact about them or their company (news, a post, an interview, hiring, funding) and the pressure it usually creates for someone in their role.
3. Say Zamp has several product suites, then name the one or two that fit this company and what each would take off this reader's team. Add a proof point only if it matches.
4. Ask whether they are open to a short chat.

## Message guidance
Write like a sharp account executive who did ten minutes of homework, not like a marketing email. The reader is a finance or operations leader who gets dozens of vendor emails a week and deletes anything generic in two seconds, so the first two lines after the greeting must prove this email is about them.

Open part 2 with the most specific, recent fact about their company or about them: a hiring wave in AP or accounting, a new finance leader, a funding round, a public post or interview. Then explain, in one or two plain sentences, the operational pressure that fact usually creates. Talk about the work (invoice backlogs, approval delays, close taking too long, disputes piling up, onboarding queues), never about technology.

When you name Zamp's product suites, tie each one directly to that pressure and say what it would take off their team's plate. Pick at most two suites. Use one proof point only if it matches the same workflow.

Adjust to the reader. A CFO cares about headcount, close speed, control and audit risk. A Controller cares about reconciliations, accuracy and the close calendar. A Head of AP or Finance Ops cares about invoice volume, exceptions and approval chasing. A COO or Head of Operations cares about throughput and cost per transaction.

Keep the tone warm, direct and peer to peer. No flattery, no hype, no "I hope you're well". End with a single easy question.
`;

export const EVENT_MD = `# Event invite

## Goal
Get an RSVP to one specific Zamp event from a senior finance leader who fits its topic and audience.

## Who sends it
Field or event marketer

## Target roles
- CFO
- VP Finance
- Finance Director
- Controller
- Head of Finance Operations
- Head of Shared Services
- COO

## Signals that matter
- Posts, talks or comments on the event's topic
- Role matches the event audience
- Based in or near the event city
- Recently started a role where peer advice helps

## Signals to ignore
- Sales-pain signals unrelated to the event topic
- Anything sensitive

## Offer
A seat at an invite-only dinner for finance leaders. No product pitch.

## Details
- Name: Zamp CFO Roundtable: Running the Autonomous Back Office
- Format: invite-only dinner for about 20 finance leaders
- Date: Thursday, 21 January 2027, 7 pm
- City: Bengaluru
- Topic: how finance teams are handing AP, close and reconciliations to AI without losing control
- Audience: CFOs, VPs of Finance, Controllers and Heads of Finance Operations
- Takeaway: peers sharing what they automated first, what broke, and how they kept audit trails clean

## Hiring keywords
- Accounts Payable
- Finance Operations
- Controller
- Shared Services

## Call to action
- Want me to save you a seat?
- Should I hold a place for you?

## Length
175 to 200 words

## Executive length
125 to 150 words

## Structure
1. Open with the invitation itself and why this person in particular should be in the room.
2. One line, in the first person, saying you and Zamp are hosting it and that it is not a sales pitch.
3. The evening: name, date, time, city, who else is coming, what they will take away.
4. A simple yes or no question.

## Message guidance
This is an invitation from a person, not an event announcement. The reader is a senior finance leader who is protective of their evenings, so the email has to make the dinner feel worth it for them specifically and make saying yes effortless.

In part 2, connect them to the topic: something they posted or said, a change at their company that makes the topic live (AP hiring, a new ERP, a close that is under pressure), or their role in the city where the dinner happens. Say in plain words why peers in a similar seat find this conversation useful right now.

In part 3, describe the evening concretely using only the playbook details: the name, date, time, city, how small the room is, who else is coming and what they will get out of it. Make clear there is no sales pitch.

Keep it warm and personal, as if a well-connected colleague is saving them a seat. No pressure, no urgency tricks, no "limited spots". End with a simple yes or no question.

## Words to avoid
- demo
- pricing
`;

export const COMPANY_TEMPLATE_MD = `# Your company name

## About
(Required) Two or three plain sentences: what you do, for whom.

## Product suites
(Required) One line per product or service:
- Product name: what it does for the customer. Fits when: the signals or company types that make it relevant.
- Another product: what it does. Fits when: ...

## Proof points
(Optional, strongly recommended) Results you can prove, with a source link:
- Customer X cut Y from 2 weeks to 2 days (source: https://...)

## Do not contact
(Optional) Existing customers or companies you never cold-email, one per line.

## Words to avoid
(Optional) Phrases your brand never uses, one per line.

## Anything else
(Optional) Any other context the writer should know: positioning, competitors to never name, regions you serve.
`;

export const PLAYBOOK_TEMPLATE_MD = `# Purpose name (e.g. Sponsorship)

## Goal
(Required) One sentence: what reply do you want from this person?

## Who sends it
(Optional) The role of the person sending, e.g. Partnerships manager.

## Target roles
(Required) Job titles that are a good fit, one per line.
- Head of Marketing
- Brand Director

## Signals that matter
(Required) What makes someone worth contacting now, one per line.
- Recently launched a product or entered a new market
- Spoke at or sponsored a similar event

## Signals to ignore
(Optional) What should never be the reason to write.
- Anything sensitive

## Offer
(Optional) What you are offering. Leave this out and the email pitches your product suites instead.
Sponsorship of our annual summit with stage time and a booth.

## Details
(Optional) Facts the email may quote: dates, venue, audience size, package tiers, prices.
- Date: 12 March 2027, Mumbai
- Audience: 600 finance leaders

## Hiring keywords
(Optional) Job titles to look for in their open roles, one per line.

## Call to action
(Required) One to three example asks, one per line.
- Open to a short call about it?

## Structure
(Recommended) The outline your email should follow, one step per line, in order. Leave it out and the writer picks a shape that fits your goal.
1. ...
2. ...

## Message guidance
(Recommended) A detailed brief, around 200 words: what a great message for this purpose sounds like, what to emphasise for each kind of reader, what to avoid. The more context here, the better the drafts.

## Length
(Optional) e.g. 175 to 200 words

## Executive length
(Optional) Length for VPs and C-level, e.g. 125 to 150 words

## Tone
(Optional) e.g. warm and peer-to-peer, no hard sell

## Words to avoid
(Optional) one per line

## Anything else
(Optional) Any other context you want the writer to use.
`;

// ---------------------------------------------------------------- parser

function splitSections(md: string) {
  const text = md.replace(/\r\n?/g, "\n").slice(0, MAX_FILE_CHARS);
  const titleMatch = text.match(/^\s*#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const sections: { heading: string; body: string }[] = [];
  let cur: { heading: string; lines: string[] } | null = null;
  for (const line of text.split("\n")) {
    const h = line.match(/^\s*#{2,3}\s+(.+?)\s*:?\s*$/);
    if (h) {
      if (cur) sections.push({ heading: cur.heading, body: cur.lines.join("\n").trim() });
      cur = { heading: h[1].trim(), lines: [] };
    } else if (cur) cur.lines.push(line);
  }
  if (cur) sections.push({ heading: cur.heading, body: cur.lines.join("\n").trim() });
  // Drop template hints like "(Required) ..." lines so an unedited template reads as empty.
  for (const s of sections) s.body = s.body.split("\n").filter((l) => !/^\s*\((required|optional|recommended)[^)]*\)/i.test(l)).join("\n").trim();
  return { title, sections };
}

function items(body: string): string[] {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const bulleted = lines.filter((l) => /^([-*•]|\d+[.)])\s+/.test(l));
  const src = bulleted.length ? bulleted : lines;
  return src.map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, "").trim()).filter(Boolean);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "purpose";
}

export function parseCompany(md: string): ParseReport<CompanyProfile> {
  const { title, sections } = splitSections(md);
  const v: CompanyProfile = { name: title, about: "", products: [], proofPoints: [], doNotContact: [], neverSay: [], extra: "" };
  const found: string[] = [];
  const ignored: string[] = [];
  const extra: string[] = [];
  for (const s of sections) {
    const h = s.heading.toLowerCase();
    if (!s.body) continue;
    if (/about|overview|who we are|company/.test(h) && !v.about) {
      v.about = s.body.replace(/\n+/g, " ");
      found.push("About");
    } else if (/product|suite|service|offering|solution/.test(h)) {
      v.products = items(s.body).map((line, i) => {
        const [head, ...rest] = line.split(":");
        const tail = rest.join(":").trim();
        const [does, fits] = tail ? tail.split(/fits when:?|best for:?|good fit when:?/i) : [line, ""];
        const d = (does || "").trim().replace(/[.\s]+$/, "");
        return { id: `prod${i + 1}`, name: tail ? head.trim() : line.slice(0, 40), does: d.charAt(0).toUpperCase() + d.slice(1), fitsWhen: (fits || "").trim().replace(/[.\s]+$/, "") };
      });
      found.push(`Product suites (${v.products.length})`);
    } else if (/proof|case stud|result|stat|evidence|testimonial/.test(h)) {
      v.proofPoints = items(s.body).map((line, i) => {
        const url = line.match(/https?:\/\/[^\s)]+/)?.[0];
        const text = line.replace(/\(?\s*source:?\s*https?:\/\/[^\s)]+\s*\)?/i, "").replace(/https?:\/\/[^\s)]+/, "").replace(/[|\s]+$/, "").trim();
        return { id: `p${i + 1}`, text, source: url ? new URL(url).hostname.replace(/^www\./, "") : "company file", sourceUrl: url };
      });
      found.push(`Proof points (${v.proofPoints.length})`);
    } else if (/do not contact|don't contact|suppress|exclude|existing customer|never contact/.test(h)) {
      v.doNotContact = items(s.body).map((x) => x.toLowerCase());
      found.push(`Do not contact (${v.doNotContact.length})`);
    } else if (/avoid|never say|banned|don't say/.test(h)) {
      v.neverSay = items(s.body);
      found.push("Words to avoid");
    } else {
      extra.push(`${s.heading}: ${s.body.replace(/\n+/g, " ")}`);
      ignored.push(s.heading);
    }
  }
  v.extra = extra.join("\n").slice(0, 2000);
  const missing: string[] = [];
  if (!v.name) missing.push("A title line, e.g. '# Acme'");
  if (!v.about) missing.push("## About");
  if (!v.products.length) missing.push("## Product suites (at least one)");
  return { value: v, missing, found, ignored };
}

export function parsePlaybook(md: string, builtIn = false): ParseReport<Playbook> {
  const { title, sections } = splitSections(md);
  const v: Playbook = {
    id: slug(title),
    name: title,
    persona: "",
    goal: "",
    offer: "",
    details: "",
    targetRoles: [],
    strongSignals: [],
    avoid: [],
    jobKeywords: [],
    ctaExamples: [],
    length: { min: 175, max: 200 },
    execLength: { min: 125, max: 150 },
    guidance: "",
    structure: "",
    neverSay: [],
    tone: "",
    extra: "",
    builtIn,
  };
  const found: string[] = [];
  const ignored: string[] = [];
  const extra: string[] = [];
  for (const s of sections) {
    const h = s.heading.toLowerCase();
    if (!s.body) continue;
    const text = s.body.replace(/\n+/g, " ");
    if (/guidance|how to write|writing brief|message brief|instructions/.test(h)) (v.guidance = s.body.slice(0, 3000)), found.push("Message guidance");
    else if (/structure|outline|format|flow|shape/.test(h)) (v.structure = s.body.slice(0, 1500)), found.push("Structure");
    else if (/exec|senior/.test(h) && /length|word/.test(h)) {
      const nums = (s.body.match(/\d+/g) || []).map(Number).filter((n) => n >= 20 && n <= 400);
      if (nums.length >= 2) v.execLength = { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
      found.push(`Executive length (${v.execLength.min} to ${v.execLength.max})`);
    } else if (/goal|objective|aim/.test(h)) (v.goal = text), found.push("Goal");
    else if (/who sends|sender|persona|sent by/.test(h)) (v.persona = text), found.push("Sender");
    else if (/target|roles|titles|who to contact|ideal/.test(h)) (v.targetRoles = items(s.body)), found.push(`Target roles (${v.targetRoles.length})`);
    else if (/ignore|avoid signal|weak|not a reason|don't use/.test(h)) (v.avoid = items(s.body)), found.push("Signals to ignore");
    else if (/signal|trigger|look for|reason to reach/.test(h)) (v.strongSignals = items(s.body)), found.push(`Signals that matter (${v.strongSignals.length})`);
    else if (/hiring|job keyword|job title/.test(h)) (v.jobKeywords = items(s.body).slice(0, 20)), found.push("Hiring keywords");
    else if (/call to action|cta|the ask|ask$/.test(h)) (v.ctaExamples = items(s.body).slice(0, 5)), found.push("Call to action");
    else if (/length|word/.test(h) && !/avoid/.test(h)) {
      const nums = (s.body.match(/\d+/g) || []).map(Number).filter((n) => n >= 20 && n <= 400);
      if (nums.length >= 2) v.length = { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
      else if (nums.length === 1) v.length = { min: Math.max(30, nums[0] - 40), max: nums[0] };
      found.push(`Length (${v.length.min} to ${v.length.max})`);
    } else if (/avoid|never say|banned/.test(h)) (v.neverSay = items(s.body)), found.push("Words to avoid");
    else if (/tone|voice|style/.test(h)) (v.tone = text), found.push("Tone");
    else if (/offer|proposal|invitation|what we/.test(h)) (v.offer = text), found.push("Offer");
    else if (/detail|event|fact|package|logistics/.test(h)) (v.details = s.body), found.push("Details");
    else {
      extra.push(`${s.heading}: ${text}`);
      ignored.push(s.heading);
    }
  }
  v.extra = extra.join("\n").slice(0, 2000);
  if (builtIn) v.id = title === "Sales outreach" ? "sales_outreach" : title === "Event invite" ? "event_invite" : v.id;
  const missing: string[] = [];
  if (!v.name) missing.push("A title line, e.g. '# Sponsorship'");
  if (!v.goal) missing.push("## Goal");
  if (!v.targetRoles.length) missing.push("## Target roles");
  if (!v.strongSignals.length) missing.push("## Signals that matter");
  if (!v.ctaExamples.length) missing.push("## Call to action");
  return { value: v, missing, found, ignored };
}

// ---------------------------------------------------------------- built-ins and resolution

export const BUILTIN_PLAYBOOK_MD: Record<string, string> = {
  sales_outreach: SALES_MD,
  event_invite: EVENT_MD,
};

export const ZAMP = parseCompany(ZAMP_COMPANY_MD).value;
export const PLAYBOOKS: Record<string, Playbook> = {
  sales_outreach: parsePlaybook(SALES_MD, true).value,
  event_invite: parsePlaybook(EVENT_MD, true).value,
};

/** Server side: use the uploaded file when the rep sent one and it parses, else the built-in. */
export function resolveCompany(md?: string): CompanyProfile {
  if (md) {
    const r = parseCompany(md);
    if (!r.missing.length) return r.value;
  }
  return ZAMP;
}

export function resolvePlaybook(purpose: string, md?: string): Playbook {
  if (md) {
    const r = parsePlaybook(md);
    if (!r.missing.length) return { ...r.value, id: purpose || r.value.id };
  }
  return PLAYBOOKS[purpose] || PLAYBOOKS.sales_outreach;
}

export const isOfferMode = (p: Playbook) => !!p.offer.trim();

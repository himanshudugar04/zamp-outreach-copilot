import type { PurposeId } from "./types";

export interface ProofPoint {
  id: string;
  text: string;
  tags: string[];
  source: string;
  sourceUrl: string;
}

export interface Playbook {
  id: PurposeId;
  name: string;
  persona: string;
  goal: string;
  offer: string;
  targetRoles: string[];
  strongSignals: string[];
  avoid: string[];
  jobKeywords: string[];
  proofPoints: ProofPoint[];
  ctaExamples: string[];
  length: { min: number; max: number };
  neverSay: string[];
  event?: {
    demo: boolean;
    name: string;
    format: string;
    date: string;
    city: string;
    topic: string;
    audience: string;
    takeaway: string;
  };
}

/** Companies Zamp names publicly as customers: never cold-pitch them. */
export const SUPPRESSION_LIST = [
  "instacart",
  "mindbody",
  "block",
  "amgen",
  "uber freight",
  "wio",
  "wio bank",
  "commercial bank of dubai",
  "zamp",
];

const ZAMP_PROOF: ProofPoint[] = [
  {
    id: "p1",
    text: "Zamp cut Instacart's AP approval time from 2 weeks to 2 days",
    tags: ["ap", "invoices", "approvals"],
    source: "zamp.ai",
    sourceUrl: "https://zamp.ai",
  },
  {
    id: "p2",
    text: "Zamp automated 80% of Instacart's manual AP work",
    tags: ["ap", "headcount", "scale"],
    source: "zamp.ai",
    sourceUrl: "https://zamp.ai",
  },
  {
    id: "p3",
    text: "Mindbody says Zamp now handles most of its invoice processing end to end",
    tags: ["ap", "invoices"],
    source: "zamp.ai",
    sourceUrl: "https://zamp.ai",
  },
  {
    id: "p4",
    text: "Zamp took a bank's card chargeback backlog from two months to one day",
    tags: ["chargebacks", "disputes", "cards", "bank"],
    source: "AWS case study",
    sourceUrl: "https://aws.amazon.com/startups/learn/zamp-realizing-an-autonomous-future-for-enterprise-with-aws",
  },
  {
    id: "p5",
    text: "Zamp brought a bank's KYC and KYB onboarding down to about five minutes",
    tags: ["kyc", "kyb", "onboarding", "compliance", "bank"],
    source: "AWS case study",
    sourceUrl: "https://aws.amazon.com/startups/learn/zamp-realizing-an-autonomous-future-for-enterprise-with-aws",
  },
];

export const PLAYBOOKS: Record<PurposeId, Playbook> = {
  sales_outreach: {
    id: "sales_outreach",
    name: "Sales outreach",
    persona: "SDR / Account Executive",
    goal: "Get a first reply from a finance or operations leader who has never heard from Zamp.",
    offer:
      "Zamp's AI employees take over finance and operations work end to end: AP and invoice processing, close, chargebacks and KYC onboarding.",
    targetRoles: [
      "CFO",
      "VP Finance",
      "Finance Director",
      "Controller",
      "Head of Accounts Payable",
      "Head of Finance Operations",
      "Head of Shared Services",
      "COO",
      "Head of Operations",
      "Head of Payments / Cards / Disputes",
      "Head of KYC / Compliance Operations",
    ],
    strongSignals: [
      "Hiring for AP, accounting, payments ops, disputes, KYC or compliance ops",
      "A new finance or operations leader",
      "A funding round or expansion that multiplies transaction volume",
      "ERP or finance-system change in job posts",
      "The prospect posting about manual finance work, close speed or ops headcount",
    ],
    avoid: ["Awards, marketing campaigns, product launches unrelated to finance ops", "Anything sensitive"],
    jobKeywords: [
      "Accounts Payable",
      "Accounting",
      "Controller",
      "Finance Operations",
      "Procurement",
      "Payroll",
      "Billing",
      "Chargeback",
      "Dispute",
      "KYC",
      "Compliance",
      "Treasury",
      "Revenue Accounting",
    ],
    proofPoints: ZAMP_PROOF,
    ctaExamples: ["Worth a look?", "Is this on your radar?", "Open to seeing how?"],
    length: { min: 50, max: 90 },
    neverSay: ["AI-powered", "digital transformation", "streamline your operations", "I'd love to"],
  },
  event_invite: {
    id: "event_invite",
    name: "Event invite",
    persona: "Field / event marketer",
    goal: "Get an RSVP to one specific Zamp event from a senior finance leader who fits its topic and audience.",
    offer: "An invite-only evening with finance leaders. No product pitch.",
    targetRoles: [
      "CFO",
      "VP Finance",
      "Finance Director",
      "Controller",
      "Head of Finance Operations",
      "Head of Shared Services",
      "COO",
    ],
    strongSignals: [
      "Posts, talks or comments on the event's topic",
      "Role matches the event audience",
      "Based in or near the event city",
      "Recently started a role where peer advice helps",
    ],
    avoid: ["Selling Zamp", "Sales-pain signals unrelated to the event topic", "Anything sensitive"],
    jobKeywords: ["Accounts Payable", "Finance Operations", "Controller", "Shared Services"],
    proofPoints: [],
    ctaExamples: ["Want me to save you a seat?", "Should I hold a place for you?"],
    length: { min: 45, max: 85 },
    neverSay: ["AI-powered", "demo", "pricing", "I'd love to"],
    event: {
      demo: true,
      name: "Zamp CFO Roundtable: Running the Autonomous Back Office",
      format: "Invite-only dinner for about 20 finance leaders",
      date: "Thursday, 21 January 2027, 7 pm",
      city: "Bengaluru",
      topic: "How finance teams are handing AP, close and reconciliations to AI without losing control",
      audience: "CFOs, VPs of Finance, Controllers and Heads of Finance Operations",
      takeaway: "Peers sharing what they automated first, what broke, and how they kept audit trails clean",
    },
  },
};

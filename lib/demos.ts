import type { PurposeId } from "./types";

export interface Demo {
  label: string;
  what: string;
  name?: string;
  company?: string;
  linkedinUrl?: string;
  purpose: PurposeId;
}

// Real people and companies, each chosen to show one path. Verified with live Crustdata lookups on 22 Nov 2026.
export const DEMOS: Demo[] = [
  { label: "New VP Finance", what: "Happy path: new finance leader at a company hiring heavily in finance ops", name: "Adi Asali", company: "Rippling", purpose: "sales_outreach" },
  { label: "Sensitive signal", what: "Strongest company signal is a headcount drop, which must never be the opener", name: "Sean Delehanty", company: "Databricks", purpose: "sales_outreach" },
  { label: "Left the company", what: "Person no longer works at the company you named", name: "Marijan Luksa", company: "Databricks", purpose: "sales_outreach" },
  { label: "Two matches", what: "Common name: the desk refuses to guess", name: "Rahul Sharma", company: "Infosys", purpose: "sales_outreach" },
  { label: "Existing customer", what: "Company is already a Zamp customer: stop before research", name: "Emily Reuter", company: "Instacart", purpose: "sales_outreach" },
  { label: "Event invite", what: "Bengaluru CFO invited to the sample Zamp roundtable", name: "Rahul Bothra", company: "Swiggy", purpose: "event_invite" },
];

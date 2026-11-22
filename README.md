# Outreach Desk for Zamp GTM

A rep names a prospect. The desk researches them with Crustdata, ranks every signal, picks one true reason to write, and drafts a short email with every fact footnoted. Nothing sends without the rep's approval.

Built for the Zamp AI Solutions Analyst case study (PS-3, personalised outreach).

## Who uses it

| Persona | Purpose | Goal |
|---|---|---|
| SDR / BDR | Sales outreach | First reply from a new finance or ops leader |
| Account Executive | Sales outreach (executive mode for VP and CXO prospects) | First reply from a senior buyer |
| Field / event marketer | Event invite | RSVP to a specific Zamp event |

## How a run works

1. **Find the right person.** Company identify, then person search at that company. Stops if the person left (offers to re-target or find their successor), if two people match, or if the company is an existing Zamp customer.
2. **Read their profile.** Person enrich: role, start date, career, work email.
3. **Research in parallel.** Company enrich (funding, headcount, hiring, news), finance-ops job postings, their LinkedIn posts and the company's, and live news search.
4. **Judge every signal.** One OpenAI call (`gpt-5.4-mini`) scores relevance, specificity and sensitivity. Code ranks them: `relevance x 2 + recency + specificity`. Sensitive signals (layoffs, lawsuits, headcount drops) are never used as hooks.
5. **Write the draft.** One OpenAI call (`gpt-5.5`) writes from the chosen hook only, with every factual phrase tied to a source id.
6. **Quality check, in code.** Word count, reading grade, questions, you/I ratio, banned phrases, unsourced claims. One automatic rewrite if a hard rule fails.

## Edge cases built in

| Case | What the desk does |
|---|---|
| Prospect left the company | Stops, shows where they went, offers "write to them there" or "find who replaced them" |
| Two people match the name | Shows candidates side by side and waits for the rep to pick |
| No usable signal | Writes an honest role-only draft, clearly flagged as low personalization |
| Best signal is sensitive | Skips it, uses the next-best signal, and tells the rep why |
| Existing Zamp customer | Stops before research |
| Person opted out of data | Hard stop |
| Prompt injection in scraped text | Signal marked suspicious and ignored |
| Wrong persona for the purpose | Stops and explains, with "write anyway" if the rep knows better |
| Work email from a past employer | Never used as the To address |

### Try these on the live site

Type the name and company on New prospect, with the purpose shown.

| Prospect | Company | Purpose | Shows |
|---|---|---|---|
| Adi Asali | Rippling | Sales outreach | Happy path: new VP Finance, company hiring heavily in finance ops |
| Sean Delehanty | Databricks | Sales outreach | Sensitive company news held back |
| Marijan Luksa | Databricks | Sales outreach | Person left the company |
| Rahul Sharma | Infosys | Sales outreach | Several people match, the desk refuses to guess |
| Emily Reuter | Instacart | Sales outreach | Existing customer, stops before research |
| Rahul Bothra | Swiggy | Event invite | Bengaluru CFO invited to the sample roundtable |

## Playbooks

Everything the writer knows about the seller and the purpose comes from two plain markdown files, editable on the Playbooks page:

- **Company profile**: about, product suites (with when each fits), proof points, do-not-contact list. Reps can upload a new one, add context, or add proof points.
- **Purpose playbooks**: one per kind of outreach. Sales outreach and Event invite are built in; reps can add their own (Sponsorship, Webinar invite…) from the downloadable template. Each has a detailed message brief and two lengths: 175 to 200 words, or 125 to 150 for VP and C-level readers.

## Run locally

```bash
npm install
cp .env.example .env   # add CRUSTDATA_API_KEY and OPENAI_API_KEY
npm run dev
```

`npx tsx scripts/test-pipeline.ts` runs the pipeline offline against recorded Crustdata response shapes and a stubbed OpenAI, covering every edge case.

## Deploy

Import the repo in Vercel and set `CRUSTDATA_API_KEY` and `OPENAI_API_KEY` as environment variables. Optional: `OPENAI_ANALYST_MODEL`, `OPENAI_WRITER_MODEL`.

## Cost per run

About 9 to 12 Crustdata credits and two OpenAI calls (three if a rewrite is needed). Responses are cached per server instance, so repeated demo runs cost nothing.

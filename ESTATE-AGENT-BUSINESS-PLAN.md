# Autoeight Business Plan: AI & Automation for Small UK Estate Agents

*Drafted 2026-07-16. Working document, update as the offer proves itself.*

---

## 1. The business in one line

Autoeight sells AI and automation to small independent UK estate agents (1 to 3 branches), starting with a paid £250 audit that converts into fixed-price automation projects and ongoing retainers.

## 2. Why estate agents, why now

- They are drowning in exactly the work Autoeight already automates: out-of-hours enquiries, viewing-booking back-and-forth, chasing solicitors, re-keying data between portal/CRM/spreadsheets, writing listing descriptions, maintenance triage.
- Small independents (1 to 3 branches) have no in-house tech capability and get ignored by big consultancies. They can make a buying decision in one meeting with the owner.
- The CRM landscape is knowable and small: most run Alto, Apex27, Street or Rezi. Street, Rezi and Apex27 have open APIs (Rezi also has Zapier). Alto has no public API (Houseful partner-gated), so Alto shops need workarounds such as lead-email parsing. Knowing this cold is the credibility wedge no generalist agency has.
- Every service on the Autoeight site maps directly onto an agent's pain (see section 4). No new capability needs building, only packaging.

## 3. The offer ladder

The funnel, as already scoped (flowchart lives in the Flow Builder "Estate Agents — AI audit offer" project):

1. **Local outreach** (free): calls, emails, walk-ins, LinkedIn to owners/directors.
2. **£250 AI & Automation Audit** (1-hour call): walk their lead-to-completion journey, map their CRM and systems, count wasted hours.
3. **Written report** (the product): their systems mapped, top 3 AI wins, estimated ROI, priced next step. Professional enough to be worth £250 on its own even if they never buy again.
4. **First fixed-price project**: one automation from the report, delivered in 1 to 3 weeks.
5. **Retainer + referrals**: monthly support/improvement retainer, and ask for introductions to other agents (owners know each other locally).

Why paid audit rather than free: it filters tyre-kickers, positions Autoeight as a consultant not a vendor, and the report does the selling so the pitch call is low-pressure.

## 4. Productised projects (mapped to existing services)

Each is a fixed-scope, fixed-price package the audit report can recommend. Prices below are proposed starting points for Alfie to confirm, not published yet.

| Package | The pain it kills | Autoeight service it draws on | Proposed price |
|---|---|---|---|
| Out-of-hours enquiry responder | Portal leads and emails going cold overnight/weekends | AI Email & Support Automation | £1,500 to £2,500 |
| Viewing booking automation | Phone/email ping-pong to arrange viewings | Sales Automation | £1,200 to £2,000 |
| Sales progression chaser | Manually chasing solicitors and buyers for updates | Internal Systems & Ops Automation | £1,500 to £2,500 |
| CRM connect & de-rekey | Typing the same data into portal, CRM and spreadsheets | CRM & Integration (Street/Rezi/Apex27 APIs; Alto via email parsing) | £1,500 to £3,000 |
| Listing description assistant | Hours writing property descriptions | AI & Automation | £750 to £1,500 |
| Owner's dashboard | No clear view of pipeline, valuations booked, fall-through rate | Data & Reporting | £1,000 to £2,000 |
| Lead-gen website rebuild | Dated site that doesn't capture or qualify leads | Web Design | £2,500+ |

Retainer after any project: monitoring, tweaks, new automations, proposed £200 to £500/month depending on scope.

Alto-shop note: lead with email-parsing based automations (enquiry responder, progression chaser) since the CRM can't be integrated directly. Street/Rezi/Apex27 shops can be pitched deeper CRM integration work.

## 5. Target customer profile

- Independent sales and/or lettings agent, 1 to 3 branches, UK (start West Yorkshire and surrounding, widen once remote delivery is proven).
- Owner-operated, 3 to 15 staff.
- Decision maker: the owner/director, reachable directly.
- Disqualify: corporate chains (procurement hell), single self-employed agents with no volume, franchises whose tech is dictated by head office.

## 6. Sales and marketing engine

Weekly operating rhythm (solo founder, so keep it small and repeatable):

- **Prospecting (2 hrs/wk)**: build a list of local independents from Rightmove/Zoopla agent directories. Log every one in the CRM (crm-cloud) with branch count and, where discoverable, which CRM they run.
- **Outreach (4 hrs/wk)**: mix of cold email (use the cold-email skill and existing scripts), phone, and in-person drop-ins for the closest towns. Message leads with a specific observable pain ("I enquired on one of your listings Saturday evening and heard back Monday") rather than generic AI talk.
- **Content (2 hrs/wk)**: one short piece per week aimed at agents, published on the Autoeight site and LinkedIn. Topics: what Alto/Street/Rezi can and can't automate, what an out-of-hours responder actually does, anonymised audit findings.
- **Audit delivery**: the audit itself is a sales activity; every audit ends with a report and a priced recommendation.
- **Referral ask**: baked into every project handover.

Assets needed (build order in section 9): estate-agent landing page on the Autoeight site, audit booking + payment link, audit question checklist, report template, one anonymised sample report to show prospects.

## 7. Delivery process

1. Audit call (recorded with consent), structured around the lead-to-completion journey.
2. Report delivered within 3 working days. Fixed template: systems map, wasted-hours estimate (from their own numbers given on the call, never invented), top 3 wins, one recommended first project with fixed price.
3. Project built in 1 to 3 weeks using existing Autoeight tooling and the CRM APIs where available.
4. Handover call + short Loom-style walkthrough, then retainer offer.
5. Case study written after each successful project (case-study-writer skill), with client permission, to feed the site and outreach.

Rule carried over from standing feedback: no unverified claims anywhere in copy or reports. ROI figures in reports come from the client's own numbers captured on the audit call.

## 8. Financial model (targets, not forecasts)

Illustrative monthly steady-state target after ramp-up, for sense-checking only:

- 8 to 12 audits booked per month at £250 = £2,000 to £3,000
- 25 to 40% of audits convert to a project at roughly £2,000 average = £4,000 to £8,000
- Retainer base growing by 1 to 2 clients/month at £200 to £500 = compounding recurring revenue

Costs stay near zero beyond time: hosting/tooling is already in place (Cloudflare stack), so gross margin is effectively labour.

Break-even question to answer in the first 90 days: what does it actually cost in outreach hours to book one audit, and what share of audits buy a project. Track both from day one in the CRM.

## 9. 90-day plan

**Days 1 to 14: package it**
- Estate-agent landing page on autoeight.co.uk (offer, price, booking). Draft for approval first, per the no-unsolicited-changes rule.
- Audit checklist + report template finalised.
- Prospect list: first 100 local independents, CRM logged.

**Days 15 to 45: sell it**
- Outreach running weekly. Target: first 5 paid audits.
- Refine the pitch from real objections. First anonymised sample report produced.

**Days 46 to 90: prove it**
- Deliver first 2 to 3 projects. Get 1 case study and 2 referrals.
- Decide pricing based on what actually closed. Kill or reprice packages nobody picks.
- If audit conversion is weak, test a cheaper foot-in-door (e.g. free 15-minute teardown video) before dropping the paid audit.

## 10. Risks and mitigations

- **Alto dominance blocks deep integrations**: lead with email-parsing automations for Alto shops; track whether Houseful partnership is worth pursuing later.
- **Agents are sceptical of "AI"**: sell outcomes (answered enquiries, chased solicitors, saved hours), demo real systems on the audit call, never lead with the technology.
- **Solo capacity ceiling**: fixed-scope packages and templates keep delivery under 3 weeks; retainers smooth income between projects.
- **£250 audit stalls the funnel**: it's a hypothesis. Give it 45 days of real outreach before changing it, then test alternatives.
- **Compliance sensitivities** (GDPR on client data, property misdescription rules on AI-written listings): human-approval step on anything client-facing, data processing kept inside the client's own accounts where possible.

## 11. What makes this defensible

Speed and specificity. Autoeight already has the delivery stack (Workers, D1, CRM tooling, email automation, dashboards), a working CRM of its own to run the pipeline in, and now vertical knowledge of the four estate-agent CRMs. Each audit deepens the playbook; after 10 audits the report practically writes itself and no generalist can match the specificity of the pitch.

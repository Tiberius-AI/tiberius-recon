# TIBERIUS RECON™ — BEYOND THE JOB SITE
## How Our Overnight Autonomous Recon & Conversation Engine Captures High-Intent B2B Deals (and Protects Existing Clients) While Your Competitors Sleep

**Prepared by:** Tiberius AI (*"The Bad Boys of AI"*)  
**System Reference:** `server.js` · `workers/orchestrator.js` · `workers/live-zero-api-agent.js` · `inbox.html`

---

## PART 1: THE PROCESS ITSELF — HOW TIBERIUS RECON™ WORKS

### ✈️ The 10,000-Foot Overview (The Big Picture)

Every high-value B2B sale—whether you are a CPA firm, a corporate attorney, a commercial insurance broker, or a growth agency—comes down to a single unfair advantage: **showing up within 24 hours of a "Money-in-Motion" event with the exact facts already in your hand.**

Right now, B2B firms are stuck choosing between two broken options:
1. **Buying Recycled "Cold Lists" or $5,000/mo Agency Retainers:** You pay thousands of dollars to blast generic spam (*"Hey {{First_Name}}, do you need bookkeeping/legal/insurance/SEO?"*) to 10,000 business owners who don't need you today. It burns your domain reputation and makes your firm look cheap.
2. **Buying DIY Software Seats Nobody Uses:** You pay for databases, CRMs, or scrapers that require a partner or account executive to sit at a computer at 9:00 PM clicking through government portals, matching LLC owners to real people, and figuring out what to write. Within two weeks, the login collects dust.

**Tiberius Recon™ replaces both with an overnight digital scout and a 90-second morning coffee ritual.**

Picture **6:45 AM tomorrow morning** in your kitchen:
* While your competitors were asleep, your **Tiberius Scout** swept public registries, county records, licensing boards, and live company websites across your territory between **2:00 AM and 6:00 AM**.
* Instead of dumping a messy spreadsheet on your desk, it cross-examined every trigger against secondary ownership records, found the real decision-maker's direct email and phone number, and drafted a **4-sentence, fact-verified note** in your firm's exact voice.
* At **6:45 AM**, your phone buzzes with a single text message. You tap the magic link, review your **3 to 10 "Silver Platter" Recon Cards**, tap **"Approve & Send"** three times before your coffee cools, and walk into the office with warm conversations already in motion.

Even better: **the exact same overnight engine watches your existing client roster 24/7.** When a current client registers a new LLC, leases a second warehouse, gets hit with a lien, or drops in customer ratings, you know about it at 6:45 AM—allowing you to call them with the solution before they even realize they have a problem.

> **The "Home Depot vs. Finished Slab" Principle:** Buying normal B2B lead software is like buying 80-pound bags of concrete at Home Depot—you still have to haul it, mix it, and pour it yourself. **Tiberius Recon™** pours and finishes the slab while you sleep. You just walk out at 6:45 AM and approve the work.

---

### ⚙️ Under the Hood: The 4-Stage Overnight Technical Architecture

Our production engine (orchestrated via `runNightlyReconPipeline` in `workers/orchestrator.js` and `injectLiveZeroApiCardsIntoBriefing` in `workers/live-zero-api-agent.js`) is intentionally built as a **modular, vertical-agnostic pipeline**. To adapt Tiberius Recon™ from commercial construction to CPAs, attorneys, insurance brokers, or agencies, **90% of the core infrastructure stays identical**—we simply swap the **Stage 1 Signal Collectors** and **Stage 2 Entity X-Ray Connectors**.

1. **Stage 1 (02:00 AM) — Multi-Source Trigger Ingestion:**  
   Headless browser workers and Socrata/REST connectors (`workers/scrapers/`) sweep municipal, county, state, and federal records alongside live company web signals to isolate events where money, risk, or legal liability just moved in the last 24–72 hours.
2. **Stage 2 (04:30 AM) — Cross-Registry X-Ray & Zero-API Contact Resolution:**  
   Raw government records almost always hide behind shell LLCs or incomplete forms. Our X-Ray engine (`runCadTaxRollXRay` and `crawlLiveCompanyWebsiteAndEmail`) pierces the shell record by cross-referencing County Appraisal District (CAD) deed/tax rolls, Secretary of State officer filings, and live organic search (`DuckDuckGo HTML` + `/contact` and `/about` page DOM crawls) to extract the human Managing Partner, CFO, or Owner, along with their verified domain email and direct phone number.
3. **Stage 3 (05:30 AM) — Fact-Locked 4-Sentence Drafting:**  
   Our drafting layer (`generateShopVoiceDraft`) combines the client's **Knowledge Base / Dossier** (`/api/recon/knowledge`) with the verified public record. Every draft must pass a deterministic fact-check verifying that the exact filing number, street address, or trigger metric is cited accurately with **0% hallucination**.
4. **Stage 4 (06:45 AM) — Human-in-the-Loop Dispatch & 3-Pane Conversation Room:**  
   At 6:45 AM, `/api/recon/cron-morning` texts the professional a magic link to `briefing.html`. Approved cards route into the 3-Pane Conversation Room (`inbox.html`), where outbound emails fire via Resend with thread-locked reply routing (`/api/webhooks/resend`), calls launch with a 1-tap script, and personal follow-up texts trigger via the **Native SIM (`sms:`) Protocol**—bypassing cold A2P 10DLC carrier filtering and landing as a real blue/green bubble from the partner's cell phone.

---

## PART 2: HOW TIBERIUS RECON™ WORKS ACROSS HIGH-VALUE B2B VERTICALS

Below is our blueprint for deploying the Tiberius Recon™ engine across seven high-margin B2B verticals—both to **capture high-ticket new accounts** and to **deliver proactive, retention-locking service to existing customers**.

---

### 1. Bookkeepers, CPAs & Fractional CFO Firms

#### ✈️ The 10,000-Foot Overview (The Big Picture)
Most accounting and bookkeeping firms only hear from prospects when their books are already on fire—usually in March, when a business owner dumps a shoebox of commingled receipts on their desk and begs for a miracle. Worse, CPAs lose their best existing clients when those clients quietly outgrow basic tax prep and get poached by an "advisory" firm that noticed they were expanding.

**Imagine 6:45 AM tomorrow with Tiberius Recon™:**  
While you pour your coffee, you open three Recon Cards for businesses within 15 miles of your office that **just crossed a major financial complexity threshold yesterday**:
1. A local medical group that just pulled a **$320,000 tenant build-out permit** for a second clinic (they immediately need multi-location chart-of-accounts restructuring and Section 179/cost-segregation planning).
2. A distribution company that just filed a **UCC-1 equipment financing statement** for $180,000 in new machinery and posted three new warehouse job openings (they need payroll scaling and cash-flow forecasting).
3. An existing client on your roster whose entity just registered a **new Texas Sales & Use Tax permit** for an additional business line—before they even thought to tell you.

You tap **"Approve & Send"** three times. Instead of pitching "monthly bookkeeping," you are the sharp financial strategist who noticed their exact expansion move and offered a 10-minute tax-shield checkup.

#### 🎯 How It's Used: New Lead Retrieval vs. Serving Existing Clients

| Workflow Mode | What Your Tiberius Scout Catches Overnight | The 7:00 AM Action You Approve |
| :--- | :--- | :--- |
| **Mode A: High-Ticket Lead Retrieval** | • Commercial tenant build-out permits ($100K+)<br>• New Sales Tax Permit & Mixed Beverage filings<br>• Multi-member LLC formations & S-Corp election windows (45–60 days post-formation)<br>• Companies actively hiring an in-house "Bookkeeper" or "Office Manager" (prime Fractional CFO conversion) | A 4-sentence congratulatory note referencing their new location or entity filing and pointing out a specific tax/depreciation election window closing soon. |
| **Mode B: Proactive Client Advisory & Retention** | • **Existing Client Expansion Radar:** New DBA/entity registrations, new commercial property purchases on County Appraisal District (CAD) rolls, or new UCC equipment loans<br>• **Compliance Early-Warning:** State Franchise Tax delinquency notices or IRS/State tax lien filings | An instant "White-Glove Check-In" email/text to your current client: *"Saw the county deed record for the new warehouse on Industrial Blvd—let's structure the cost-segregation schedule before Q3 estimates are due."* |

#### 🔧 The Technical Implementation
* **Stage 1 Collectors:** State Comptroller Open Data APIs (Socrata endpoints for new Sales Tax & Franchise Tax permits), Secretary of State (SOS) new entity feeds filtered for multi-manager LLCs, Municipal Commercial Tenant Improvement (TI) permit scrapers, and Indeed/LinkedIn job-posting monitors (targeting companies trying to hire a $55K/yr bookkeeper who can instead buy a $2,500/mo AI-powered bookkeeping + CFO retainer).
* **Stage 2 X-Ray:** Cross-matches the registered entity address against County Appraisal District (`CAD`) commercial personal property renditions and officer records to identify the Managing Member, plus crawls the business's live website for direct executive emails.
* **Stage 3 Fact-Locked Draft Example:**
  > *"Hi Marcus — saw the City permit filing (#BP-2026-08412) for Apex Physical Therapy's $265,000 build-out over on Oaklawn Ave. When clinics open a second location, roughly 60% of the interior leasehold improvements qualify for accelerated Year-1 bonus depreciation if the invoices are separated correctly during construction. We handle multi-clinic accounting for three practices two miles down the road—want me to send over our 1-page TI invoice checklist so your GC bills it cleanly for your tax return?"*

---

### 2. Business Attorneys, Corporate Counsel & Fractional GCs

#### ✈️ The 10,000-Foot Overview (The Big Picture)
Business attorneys can't run cheesy billboards, and waiting by the phone for a CPA referral means your monthly revenue is a rollercoaster. Even worse, business owners rarely call a lawyer *before* they sign a bad commercial lease, botch a partner buyout, or receive a trademark refusal—they call after the damage costs $50,000 to unwind.

**Imagine 6:45 AM tomorrow with Tiberius Recon™:**  
Your phone buzzes with four verified legal triggers pulled overnight from public dockets and registries in your metro area:
1. A fast-growing local brand that just received a **USPTO "Non-Final Office Action" refusal** on a trademark they tried to file themselves without an attorney (`pro se`).
2. Two partners who just formed a **multi-member LLC on the Secretary of State portal** using a generic statutory form—right as they leased a 6,000 sq. ft. commercial facility (zero customized Operating Agreement or Buy-Sell protection in place).
3. A local manufacturer that just had a **Mechanic's Lien or County Civil Petition** filed against them yesterday afternoon—before process servers have even knocked on their door.
4. **One of your own retainer clients** whose vendor just filed for Chapter 11 bankruptcy or whose corporate registration slipped into "Tax Forfeiture Pending" status overnight.

Instead of "selling legal services," you send a calm, authoritative 4-sentence executive briefing that proves you are already watching their blind spots.

#### 🎯 How It's Used: New Lead Retrieval vs. Serving Existing Clients

| Workflow Mode | What Your Tiberius Scout Catches Overnight | The 7:00 AM Action You Approve |
| :--- | :--- | :--- |
| **Mode A: Ethical, Event-Driven Client Acquisition** | • **Pro Se USPTO Trademark Office Actions:** Local companies whose DIY trademark application just hit a legal roadblock<br>• **High-Asset Self-Filed Entities:** New multi-member LLCs matched to commercial leases or $200K+ permits<br>• **Commercial Deed & Lease Transfers:** Businesses acquiring commercial real estate or SBA 504 loans<br>• **Regulatory / OSHA / Licensing Citations:** Businesses needing immediate administrative defense | A peer-level, Bar-compliant informational note referencing the public filing number and offering a specific statutory deadline checklist or 15-minute review. |
| **Mode B: Automated Corporate Shield for Retainer Clients** | • **24/7 Litigation & Lien Docket Watch:** Instant alert if a current client (or one of their key suppliers/customers) is named in a county civil suit, mechanic's lien, or federal PACER filing<br>• **Entity & Trademark Hygiene:** Automated monitoring for copycat LLC names registered in the state, upcoming SOS annual report deadlines, or UCC-1 filings placed against your client's assets | An immediate 7:00 AM general-counsel alert inside the 3-Pane Conversation Room: *"Heads up, David—a supplier filed a $42K lien notice on Parcel #10948 yesterday. I already pulled the instrument and drafted our demand response."* |

#### 🔧 The Technical Implementation
* **Stage 1 Collectors:** USPTO Trademark Status & Document Retrieval (`TSDR`) API/XML feeds filtered by owner ZIP code + `Attorney of Record = None` + `Status = Non-Final Action Mailed`; County Clerk Real Property & Official Public Records (`OPR`) scrapers for Warranty Deeds, Deeds of Trust, and Mechanic's Liens; Secretary of State daily formation feeds; County/District Court Civil Docket feeds.
* **Stage 2 X-Ray:** Matches the named respondent, applicant, or grantee LLC to its Governing Persons on the state SOS registry, resolves the operating company's domain via `crawlLiveCompanyWebsiteAndEmail`, and verifies bar-advertising compliance rules (e.g., automatic insertion of jurisdictional disclaimers where required).
* **Stage 3 Fact-Locked Draft Example:**
  > *"Hi Elena — our morning trademark docket watch flagged USPTO Serial #98412099 for 'Hill Country Cold Brew,' where the examining attorney issued a Section 2(d) likelihood-of-confusion refusal yesterday. Most founders don't realize you have a strict 90-day window to file a consent or narrowed class amendment before the mark is permanently abandoned. Our firm handles food-and-beverage IP right here in Austin—happy to send you two examples of how we cleared identical refusals last quarter if helpful."*

---

### 3. Commercial Insurance Brokers & Risk Advisors (P&C, Fleet, Workers' Comp, Cyber)

#### ✈️ The 10,000-Foot Overview (The Big Picture)
Commercial insurance producers waste 80% of their week dialing business owners who say, *"Our policy doesn't renew until November—call me in eight months."* By the time November arrives, the incumbent broker has already locked up the renewal.

Meanwhile, there is a moment when **every** business owner is forced to buy new coverage immediately—regardless of their renewal date: **the day they buy a building, pull a construction permit, add a commercial truck to their DOT fleet, or win a contract that demands higher limits.**

**Imagine 6:45 AM tomorrow with Tiberius Recon™:**  
Your 7:00 AM Queue shows three commercial accounts in your territory with immediate, mandatory insurance triggers:
1. A regional HVAC company that just registered **4 new commercial vehicles on the FMCSA/USDOT census** yesterday.
2. A property investor LLC that just pulled a **$480,000 structural renovation permit** (requiring an immediate **Builder's Risk / Installation Floater** policy before the bank releases the first draw).
3. A local manufacturer whose **Workers' Compensation policy expiration date** is exactly **65 days from today** on the State Coverage Verification portal—putting you in the door two weeks before their current broker even starts the renewal packet.
4. **Plus a Client Retention Alert:** One of your current insureds just pulled a $210,000 warehouse expansion permit and filed a UCC-1 for a new CNC laser cutter—giving you the exact trigger to endorse their policy today so they aren't catastrophically underinsured.

#### 🎯 How It's Used: New Lead Retrieval vs. Serving Existing Clients

| Workflow Mode | What Your Tiberius Scout Catches Overnight | The 7:00 AM Action You Approve |
| :--- | :--- | :--- |
| **Mode A: Mid-Term & Pre-Renewal Policy Capture** | • **State Workers' Comp X-Dates:** Exact policy effective/expiration dates and current carrier names from public state verification portals<br>• **Builder's Risk Triggers:** Commercial remodeling, new ground-up, and roof permits over $150K<br>• **FMCSA / USDOT Fleet Triggers:** Local fleets adding power units, drivers, or failing roadside safety inspections<br>• **New Liquor (TABC) / MedSpa / HazMat Licenses:** Mandatory General Liability, Liquor Liability, or MedMal bonds | A razor-specific 4-sentence email or Native SIM text offering an instant Builder's Risk bind quote or a 60-day pre-renewal Comp mod audit. |
| **Mode B: Zero-Gap Account Protection & Cross-Sell** | • **Unreported Asset Expansion:** Detects when a current insured buys a new parcel, pulls a building permit, opens a new location, or finances heavy equipment (UCC-1) without notifying you<br>• **Contractual Risk Shifts:** Spots when a client wins a municipal/school district bid requiring Umbrella, Cyber, or Surety Bonding | A proactive risk-advisor outreach: *"Saw the city permit for the 4,000 sq. ft. bay addition at your Main St. shop—let's add a Builder's Risk endorsement today and bump your building limit so coinsurance penalties don't bite you."* |

#### 🔧 The Technical Implementation
* **Stage 1 Collectors:** State Workers' Compensation Coverage Verification portals (e.g., TX DWC / NCCI public coverage lookup by employer name/ZIP returning exact carrier + policy anniversary date), FMCSA Motor Carrier Census & SMS inspection feeds, Municipal Accela/EnerGov commercial permit scrapers (`workers/scrapers/accela-scraper.js`), and State Alcohol/Licensing boards.
* **Stage 2 X-Ray:** Pairs the permit parcel or DOT number with County Appraisal District property values (calculating replacement-cost-per-square-foot estimates) and extracts the CFO/Risk Manager contact details.
* **Stage 3 Fact-Locked Draft Example:**
  > *"Hi Garrett — saw Permit #2026-11904 come through yesterday for the $410,000 structural remodel on your Blanco Rd property. Most lenders and GCs require a standalone Builder's Risk policy bound before slab and framing draws clear, and bundling it onto an existing property policy often leaves soft-cost delays uncovered. We insure 14 commercial properties along the I-35 corridor and can turn around a bindable Builder's Risk indication by 2:00 PM today if you want a second number to compare."*

---

### 4. Marketing, Web, SEO & Creative Agencies

#### ✈️ The 10,000-Foot Overview (The Big Picture)
Every local business owner deletes 30 cold agency emails a week that start with *"I was looking at your website and noticed your SEO could be improved."* Those emails fail because there is zero urgency, zero proof, and zero context.

Now flip the script. What happens when an agency reaches out **the exact morning a business commits real capital to growth, or the exact morning a revenue leak appears on their live digital storefront?**

**Imagine 6:45 AM tomorrow with Tiberius Recon™:**  
Your agency's 7:00 AM Briefing Queue surfaces four hyper-qualified local businesses:
1. A high-end dental practice or medspa that just received a **Certificate of Occupancy (CO) or Sign Permit** for a brand-new location opening in 30 days—yet their website and Google Business Profile still only list their old address.
2. A roofing contractor who is actively spending $5,000/mo on **Google Local Services Ads / Meta Ads**, but our 2:00 AM crawler detected that their landing page takes **6.8 seconds to load on mobile** and has zero instant SMS/chat capture.
3. A successful home-services company that just received **two 1-star Google reviews in the last 48 hours**, dragging their public star badge from `4.8 ★` down to `4.4 ★`.
4. **An existing agency client** whose receptionist missed three after-hours leads or whose competitor just launched 12 new Facebook video ads in their ZIP code overnight.

#### 🎯 How It's Used: New Lead Retrieval vs. Serving Existing Clients

| Workflow Mode | What Your Tiberius Scout Catches Overnight | The 7:00 AM Action You Approve |
| :--- | :--- | :--- |
| **Mode A: Trigger-Based Agency Prospecting** | • **New Location Openings:** Municipal Certificate of Occupancy (CO), Health Permit, and Commercial Sign Permit filings<br>• **Ad-Spend Waste Detection:** Businesses running active paid ads whose landing pages return HTTP errors, broken forms, slow mobile LCP, or missing tracking pixels<br>• **Hiring Signal:** Companies posting a job for an in-house "Digital Marketing Specialist" on Indeed | A 4-sentence note citing their exact new location address (or broken ad URL) paired with a custom 60-second audit or pre-built Smart Site preview link. |
| **Mode B: Automated Account Retention & Upsell** | • **24/7 Client Reputation & Funnel Watchdog:** Overnight checks on every client's SSL certificate, form/checkout uptime, Google review velocity, and local map-pack rank<br>• **Competitor Ad & Offer Radar:** Alerts when a client's top local competitor launches a new seasonal offer or outranks them in a target ZIP code | A proactive 7:05 AM client text from the account director: *"Hey Sam—our overnight scout caught that Summit HVAC just launched a $79 tune-up ad campaign in 78130. I already drafted a counter-offer campaign for your approval—tap here to launch it."* |

#### 🔧 The Technical Implementation
* **Stage 1 Collectors:** Municipal Certificate of Occupancy (`CO`) and Commercial Sign Permit scrapers; Zero-API Headless DOM Inspector (checking page load latency, mobile viewport rules, schema.org markup, chat widgets, and Meta/Google tracking tags); Google Places / Review velocity monitors.
* **Stage 2 X-Ray:** Resolves the business owner's direct identity via state corporate filings + `crawlLiveCompanyWebsiteAndEmail` so your outreach bypasses generic `info@` inboxes whenever a direct founder address is discoverable.

---

### 5. Three More High-Margin B2B Verticals Ready for Tiberius Recon™

#### A. Commercial Lenders, SBA Brokers & Equipment Finance
* **✈️ The 10,000-Foot Overview:** Stop buying UCC lists that 400 other loan brokers are dialing to death. Catch business owners the exact morning they pull a **$300,000+ expansion permit**, win a municipal procurement contract, or file a predatory Merchant Cash Advance (`MCA`) UCC-1 lien that you can refinance into a low-rate SBA 7(a) or 504 loan, saving them $8,000 a month.
* **🎯 Lead Retrieval & Client Service:**
  * *Outbound Retrieval:* Pulls commercial building permits, government contract award notices, and aged MCA UCC-1 filings (6–9 months post-filing when the borrower has proven payment history and qualifies for conventional/SBA debt consolidation).
  * *Serving Existing Borrowers:* Monitors your existing loan portfolio for secondary UCC filings ("stacking"), tax liens, or new property acquisitions so you capture their next equipment lease before a competitor does.
* **🔧 Technical Connectors:** Secretary of State UCC-1 XML/bulk feeds (filtering Secured Party names against known MCA lenders vs. equipment OEMs) + CAD Commercial Property Deeds + Municipal Building Permits.

#### B. Specialized B2B Staffing, Recruiting & Executive Search
* **✈️ The 10,000-Foot Overview:** Recruiters waste half their week calling HR directors who either have no budget or already hired someone. What if your recruiters woke up at 6:45 AM with a list of local companies that **just won a $2M contract, just leased 15,000 sq. ft. of new warehouse/office space, or have had a mission-critical role sitting unfilled for 45+ days** while their current project backlog explodes?
* **🎯 Lead Retrieval & Client Service:**
  * *Outbound Retrieval:* Correlates facility expansion permits and government/commercial contract awards with open high-skill job postings (`>30 days old`) and resolves the VP of Operations or Hiring Manager directly (bypassing the HR gatekeeper).
  * *Serving Existing Clients:* Tracks your clients' competitor layoffs, plant closures, or local licensing registrations so you can text your client at 7:00 AM: *"Three licensed master electricians within 12 miles just came on the market overnight—want their redacted profiles?"*
* **🔧 Technical Connectors:** State Licensing Board rosters (TDLR, Engineering, Nursing, CPA boards) + Job Board age-tracking crawlers + Commercial Certificate of Occupancy & Permit feeds.

#### C. Managed IT Service Providers (MSPs) & Cybersecurity Firms
* **✈️ The 10,000-Foot Overview:** No CEO wakes up wanting to switch IT providers—until **the week they sign a lease to move offices, open a second clinic, suffer a vendor breach, or fail a cyber-insurance security check.**
* **🎯 Lead Retrieval & Client Service:**
  * *Outbound Retrieval:* Catches medical practices, law firms, and manufacturers pulling commercial interior build-out or electrical/low-voltage permits (they need network cabling, VoIP, firewall cutover, and managed IT *right now*), enriched with an overnight non-intrusive DNS/Email Security check (`SPF`, `DMARC`, `MX`, SSL expiration).
  * *Serving Existing Clients:* Runs an automated 2:00 AM external perimeter and dark-web domain check across every existing MSP client and delivers a human-readable weekly executive proof briefing so the client visually sees the value of their monthly retainer.
* **🔧 Technical Connectors:** Municipal Commercial Remodel / Low-Voltage Permits + Automated DNS `TXT`/`MX`/`DMARC` & TLS Certificate Telemetry + HHS/State Breach Portal feeds.

---

## PART 3: WHY THE TIBERIUS RECON™ ARCHITECTURE CONVERTS SKEPTICAL B2B BUYERS

### ✈️ The 10,000-Foot Overview (The Big Picture)

Why do partners at CPA firms, law practices, insurance agencies, and B2B consultancies immediately fall in love with **Tiberius Recon™** when they hate traditional CRMs and lead-gen agencies?

Because **professionals who bill $250 to $800 an hour do not want another piece of software to manage—and they refuse to let a reckless AI bot spam their local market with hallucinated nonsense under their firm's name.**

Tiberius Recon™ solves both fears through three architectural pillars built right into our codebase:

1. **Zero Dashboards Required at 6:45 AM:** You don't log into a bloated desktop portal. You tap one SMS link on your phone while your coffee brews, read three cards, and tap **"Approve & Send."**
2. **100% Human-in-the-Loop + Zero Hallucinations:** Nothing ever leaves your firm without your thumb approving it. And every single draft is mathematically locked to a real, verifiable public record number.
3. **One Unified Conversation Room When They Reply:** The moment a prospect replies by email, texts back, or calls, every message lands inside a single, clean 3-Pane Conversation Room (`inbox.html`)—with full context of the permit, tax roll, or filing right on the right-hand screen.

---

### 🔒 Under the Hood: The 3 Technical Moats That Make This Possible

1. **Deterministic Fact-Verification Guardrails (`workers/drafting/gemini-drafter.js`):**  
   Before any AI-generated outreach draft is allowed into a client's 7:00 AM Queue, our verification layer runs a deterministic check against the raw JSON payload from Stage 1 and Stage 2:
   * Does the draft cite the exact `externalPermitId` / `filingNumber`?
   * Does the street address or entity name match the verified government record?
   * Is the draft strictly capped at **4 crisp sentences** using the client's onboarding `Knowledge Base` (`onboarding.html`)?  
   If any check fails, the card is rejected or rebuilt automatically at 5:30 AM (`zeroHallucinationPassRate: 100%`).

2. **Compliant Multi-Channel Dispatch + The "Native SIM" Protocol (`api/recon/send.js` & `inbox.js`):**  
   Cold-texting public records over VoIP/Twilio violates carrier A2P 10DLC rules and gets numbers blocked. Tiberius Recon™ solves this with a split-channel architecture:
   * **6:45 AM Scout-to-Client Alerts:** Sent from Tiberius AI's pre-verified Master A2P 10DLC campaign directly to our paying client (100% opted-in, zero client A2P registration wait time on Day 1).
   * **1-Tap Email Outreach (`Resend API`):** Fires clean, plain-text-styled executive emails with dedicated thread-matching `Reply-To` headers (`/api/webhooks/resend`).
   * **1-Tap Personal Cell Handoff (`Native SIM sms: Protocol`):** When a partner, broker, or contractor wants to text a local decision-maker directly, tapping **"Text from My Phone"** inside the Conversation Room invokes `sms:+18305550199?body=...`, pre-filling the 4-sentence message right inside their native iPhone/Android Messages app. One thumb-tap sends a real blue/green bubble from their personal SIM card—$0 carrier fees, zero A2P filtering, and a 3x–5x higher local response rate.

3. **The 3-Pane Conversation & Dossier Cockpit (`inbox.html` & `command.html`):**  
   Every outbound touch and inbound reply is unified alongside a live **Address / Entity X-Ray Tool** (`/api/recon/cad-lookup`). During a live phone call with a prospect or existing client, the professional can type any street address or company name into the Command Portal and pull the legal parcel owner, assessed valuation, permit history, and public filing trail in under 15 seconds.

---

## PART 4: SUMMARY MATRIX — PLUGGING ANY B2B VERTICAL INTO TIBERIUS RECON™

| B2B Vertical | Primary 2:00 AM Public Signal (Stage 1) | Secondary 4:30 AM X-Ray (Stage 2) | New Business Hook (Outbound) | Existing Client Hook (Retention/Upsell) |
| :--- | :--- | :--- | :--- | :--- |
| **CPAs, Bookkeepers & Fractional CFOs** | Commercial TI Permits, New Sales Tax Permits, Multi-Member LLCs, UCC-1 Loans | County CAD Tax Rolls + SOS Governing Persons + Website Crawl | Year-1 Bonus Depreciation / Cost-Segregation / S-Corp Election Window | Proactive Tax Planning When a Client Buys Property, Equipment, or Registers a New DBA |
| **Business Attorneys & Corporate Counsel** | Pro Se USPTO Trademark Refusals, Self-Filed Multi-Member LLCs, Deeds, Liens & Civil Dockets | SOS Officer Lookup + County Clerk OPR + Domain Contact Discovery | 90-Day Trademark Rescue / Operating Agreement & Lease Protection | 24/7 Litigation, Lien, Franchise Tax & Copycat Entity Shield for Retainer Clients |
| **Commercial Insurance Brokers** | State Workers' Comp X-Dates, $150K+ Remodel Permits, FMCSA Fleet Additions, TABC Licenses | CAD Replacement-Cost Valuation + Officer & Risk Manager Resolution | Same-Day Builder's Risk Bind / 60-Day Pre-Renewal Comp Mod Audit | Zero-Gap Coverage Alerts When an Insured Adds Square Footage, Vehicles, or Equipment |
| **Marketing, Web & SEO Agencies** | Certificates of Occupancy (New Locations), Sign Permits, Slow/Broken Ad Pages, Review Drops | Headless DOM Tech Audit + Owner Email/Phone Discovery | Launch-Ready Local Funnel & Smart Site for Their Brand-New Location | Automated Overnight Watchdog for Client Rankings, Reviews, Site Uptime & Competitor Ads |
| **Commercial Lenders & SBA Brokers** | High-Rate MCA UCC-1 Filings (6–9 Mos Old), Expansion Permits, Gov Contract Awards | Property Equity & Tax Roll Match + Executive Contact Resolution | Refinance Predatory Daily-Debit MCA Debt into a Low-Rate SBA 7(a) / 504 Loan | Portfolio Monitoring for Secondary Lien Stacking or New Equipment Financing Needs |
| **B2B Staffing & Executive Search** | Facility Expansion Permits + Aged Job Postings (`>30 Days`) + State License Rosters | Hiring Manager / VP Ops Direct Contact Resolution | Fill the Bottleneck Role Delaying Their New Facility or Contract Rollout | Instant Alerts When Licensed Local Talent Enters the Market or Competitors Downsize |
| **Managed IT (MSPs) & Cybersecurity** | Commercial Office Move / Low-Voltage Permits + Non-Intrusive DNS/DMARC/SSL Faults | Company Headcount & Executive Contact Resolution | Turnkey Network Cutover & Compliance Setup for Their New Office Lease | Automated Overnight Domain, Dark-Web & Perimeter Proof Reports for Current Clients |

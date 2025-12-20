# Real Estate CRM Development Checklist - Malaysian Edition

Based on how Malaysian property agencies use CRMs, adapted for Malaysian market, regulations, platforms, and business practices.

---

## 🎯 STARTUP MVP - WHAT "BASICS" MEANS

Since you're a startup, focus on the **5 features that solve the biggest pain points**:

### Must-Have (Launch Blockers):
1. **WhatsApp Business API** - 70% of Malaysians prefer messaging
2. **PropertyGuru lead capture** - Biggest portal, automatic lead import
3. **Contact database** with property matching
4. **Mobile app** - RENs work on phones, not desktops
5. **Deal pipeline** - Track leads → viewing → booking → sale

### Nice-to-Have (Post-Launch):
- iProperty/EdgeProp integration (add after PropertyGuru works)
- Email automation (WhatsApp is more important)
- Advanced reporting (basic dashboard is enough initially)
- Multi-language UI (start English-only, add BM later)
- BOVAEA compliance tools (add as agencies request)

### Skip for Now:
- ❌ API for custom integrations
- ❌ White-label options
- ❌ Multi-branch management
- ❌ Advanced analytics/forecasting
- ❌ Offline mode
- ❌ CPD tracking
- ❌ Third portal integrations (Mudah, EdgeProp)

**Your MVP Success Metric:** Can a REN get a PropertyGuru lead, WhatsApp the buyer, schedule a viewing, and track the deal to closing - all from their phone in under 5 clicks?

---

## 🔴 CRITICAL - Core Features (Build First)

### Contact & Lead Management
- [ ] **Contact database** with custom fields for buyer/seller profiles
  - Malaysian IC/Passport number field
  - Preferred language (BM/English/Mandarin/Tamil)
  - Citizenship status (Malaysian/PR/Foreigner)
- [ ] **Lead source tracking** (PropertyGuru, iProperty, EdgeProp, Mudah.my, Facebook, referral)
- [ ] **Activity timeline** showing all interactions (WhatsApp, calls, viewings)
- [ ] **Quick-add contacts** from mobile (RENs/REAs are always in the field)
- [ ] **Duplicate detection** and merge functionality
- [ ] **Tags/labels** for segmentation (first-time buyer, investor, upgrader, downgrader, Bumi priority)
- [ ] **Contact import** from CSV/Excel
- [ ] **WhatsApp integration** for direct messaging from CRM

### Property Management (The #1 Gap in Generic CRMs)
- [ ] **Property object** separate from deals/contacts
  - Address with state, city, taman/area
  - Property type (Terrace, Semi-D, Bungalow, Cluster, Condo, Apartment, Service Residence, SoHo, SoVo, Shop House, Land)
  - Bedrooms, bathrooms, square footage (sq ft), land size (if landed)
  - Price (RM), listing status
  - Tenure (Freehold/Leasehold - years remaining)
  - Bumi lot status (Yes/No)
  - Strata/Individual title
  - Maintenance fee (for strata properties)
  - Photos/virtual tour links
  - Property listing ID from portals
- [ ] **Property-contact relationships** (many-to-many)
- [ ] **Property search/filter** by location, price range, property type, tenure, Bumi status
- [ ] **Property status workflow** (Available → Reserved → Booking → S&P Signed → Loan Approved → Completed)
- [ ] **Prevent double-booking** - visual indicator when property is reserved/sold

### Deal Pipeline
- [ ] **Visual pipeline** with drag-and-drop stages
- [ ] **Separate pipelines** for buyers vs. sellers (or rent vs. sale)
- [ ] **Standard stages for SALE**: New Lead → First Contact → Viewing Scheduled → Viewing Done → Offer Made → Booking Fee → S&P Signed → Loan Application → Loan Approved → Property Handover → Completed
- [ ] **Standard stages for RENT**: New Lead → First Contact → Viewing Scheduled → Viewing Done → Offer Made → Tenancy Agreement → Move In → Completed
- [ ] **Deal-property linking** (associate property with deal)
- [ ] **Expected completion date** with visual timeline
- [ ] **Deal value** and commission tracking (default 3% for sale, 1 month rent for tenancy)
- [ ] **Lost reason tracking** with common Malaysian reasons (Cannot get loan, Price too high, Location not suitable, etc.)

### Communication Tools (WhatsApp is CRITICAL)
- [ ] **WhatsApp Business API integration** (70% of Malaysians prefer messaging)
  - Send/receive WhatsApp messages within CRM
  - WhatsApp message templates
  - WhatsApp broadcast lists
  - Read receipts and typing indicators
  - Media sharing (photos, PDFs, location)
- [ ] **Email integration** (Gmail/Outlook sync)
- [ ] **Email templates** in BM and English (viewing invite, thank you, follow-up)
- [ ] **SMS capability** (backup to WhatsApp)
- [ ] **Call logging** with notes
- [ ] **Internal notes** vs. client-facing notes
- [ ] **Multi-language support** (BM/English/Mandarin interface)

---

## 🟠 HIGH PRIORITY - Automation & Efficiency

### Task Automation
- [ ] **Auto-create follow-up tasks** when lead enters system
  - "Call within 5 minutes" for hot leads
  - "WhatsApp property details within 1 hour"
  - "Schedule viewing within 24 hours"
- [ ] **Task templates** for common workflows (e.g., "New Buyer" creates follow-up sequence)
- [ ] **Overdue task notifications** via WhatsApp and push notification
- [ ] **Mobile task management**
- [ ] **Task assignment** to team members (RENs under specific REA)

### Lead Distribution
- [ ] **Round-robin assignment** between RENs (with performance weighting)
- [ ] **Geographic routing** by state/area (Klang Valley, Penang, JB, etc.)
- [ ] **Lead pool/queue system** where RENs can claim leads
- [ ] **Assignment rules** based on property type, price range, or portal source
- [ ] **Real-time notifications** via WhatsApp/push notification when assigned lead
- [ ] **REA/REN hierarchy** - REAs can reassign leads from their RENs

### Workflow Automation
- [ ] **Trigger-based WhatsApp messages**: "When viewing scheduled → Send location + directions"
- [ ] **Automated WhatsApp sequences** (drip campaigns)
  - Welcome sequence for new portal leads (BM/English)
  - Property match alerts when listings meet saved criteria
  - Post-viewing follow-up within 2 hours
  - Monthly market update newsletters
  - Quarterly buyer/seller check-ins
- [ ] **Status change notifications** to relevant parties
- [ ] **Automated task creation** based on triggers

---

## 🟡 MEDIUM PRIORITY - Integrations

### Property Portal Integration (THE Critical Integration)
- [ ] **PropertyGuru integration** (automatic or scheduled)
  - Pull property listings into CRM
  - Auto-create contacts from PropertyGuru inquiries
  - Sync price changes, status updates
  - Match REN ID for ownership assignment
- [ ] **iProperty integration** 
  - Same functionality as PropertyGuru
- [ ] **EdgeProp.my integration**
  - Auction property alerts
  - Transaction price data sync
- [ ] **Mudah.my integration**
  - Lead capture from Mudah property ads
- [ ] **Saved search alerts** - auto-WhatsApp clients when properties match criteria

### Lead Source Integrations
- [ ] **Facebook Lead Ads** integration (huge in Malaysia)
- [ ] **Instagram Lead capture**
- [ ] **Google Ads** integration
- [ ] **Website form** → CRM direct creation + instant WhatsApp notification

### Productivity Integrations
- [ ] **Google Calendar/Outlook sync**
  - Viewing appointments appear in CRM
  - Sync CRM events to personal calendar
- [ ] **WhatsApp Web/Desktop** integration for team inbox
- [ ] **Document storage** (Google Drive or built-in)
  - Store IC copies, booking receipts, S&P agreements
- [ ] **PDF generator** for offers, quotations in BM/English

---

## 🟢 BOVAEA/LPPEH COMPLIANCE & REGULATION

### Licensing & Registration Features
- [ ] **REA profile** with license details
  - REA number (E-XXXX)
  - License expiry date with renewal reminders
  - CPD hours tracking (annual requirement)
  - Blue tag number
- [ ] **REN profile** with registration details
  - REN number (REN-XXXXX)
  - Registration expiry date
  - Red tag number
  - Attached REA/Agency
- [ ] **Agency registration details**
  - E-Registration number
  - BOVAEA firm registration status
  - Maximum REN count enforcement (20 RENs per REA, extendable to 30)
- [ ] **Advertisement compliance checker**
  - Ensure ads include: Agency name, E-number, REN name & number
  - Flag non-compliant listing drafts
  - Auto-insert required details in property ads
- [ ] **Client Account tracking** (required by BOVAEA)
  - Separate booking deposits from commissions
  - Audit trail for all client money movements

### Regulatory Compliance
- [ ] **Bumi lot handling**
  - Flag Bumi lots prominently
  - Warn when matching non-Bumi buyers to Bumi properties
  - State government approval workflow tracking
- [ ] **Foreign buyer restrictions**
  - Minimum purchase price alerts by state
  - Foreign buyer approval checklist
  - BNMR (Bank Negara Malaysia Reserve) tracking for foreigners
- [ ] **Consent form templates** (BOVAEA-compliant)
  - Seller appointment form
  - Buyer representation agreement
  - Viewing acknowledgment forms
  
---

## 🟢 REPORTING & ANALYTICS

### Agent Performance
- [ ] **Activity dashboards** (WhatsApp sent, calls made, viewings scheduled)
- [ ] **Lead response time** tracking (critical - must respond <5 mins)
- [ ] **Conversion rates** by stage (lead → viewing → offer → sale)
- [ ] **Deals closed** and revenue by REN/REA
- [ ] **Lead source ROI** - which portals convert best
- [ ] **Commission tracking** by deal
  - Standard 3% for sales
  - 1-month rent for tenancy
  - Commission splits between co-broke agents

### Pipeline Visibility
- [ ] **Pipeline value reports** (total potential revenue by stage)
- [ ] **Deal velocity** - average time in each stage
- [ ] **Forecast reports** - expected completions this month/quarter
- [ ] **Lost deal analysis** - common reasons for lost deals
- [ ] **State/area performance** comparison

### Property Reports
- [ ] **Active listings** count and value by area
- [ ] **Days on market** average by property type
- [ ] **Property inventory** by type/location/price band
- [ ] **Freehold vs Leasehold** distribution
- [ ] **Bumi vs Non-Bumi** property split

---

## 🔵 MALAYSIAN-SPECIFIC FEATURES

### Transaction Management (Malaysian Process)
- [ ] **Booking fee tracking** (typically RM2,000-5,000)
  - Receipt generation with agency details
  - Refund status if deal falls through
- [ ] **S&P milestone tracking**
  - Booking fee paid ✓
  - S&P signed ✓
  - 10% down payment ✓
  - Loan application submitted ✓
  - Loan approved ✓
  - Balance payment on completion ✓
- [ ] **Legal firm coordination**
  - Store lawyer contact details
  - S&P appointment scheduling
  - Legal fee calculator
- [ ] **Loan application tracking**
  - Bank name
  - Loan officer contact
  - Application status
  - Approval date
  - Disbursement status
- [ ] **Defect period tracking** (24 months for new properties)

### Client Journey Features
- [ ] **Buyer preference profile** 
  - Price range (RM)
  - Preferred areas/states
  - Property type preference
  - Must-haves (Gated & Guarded, Near LRT, Good Feng Shui, Corner lot, etc.)
  - Bumi eligibility
  - Financing pre-approval amount
- [ ] **Viewing scheduling** 
  - Calendar integration
  - WhatsApp viewing confirmation with Google Maps link
  - Property showing history
  - Post-viewing feedback capture (via WhatsApp)
- [ ] **Open house management**
  - Digital sign-in via QR code
  - Auto-create contacts from attendees
  - WhatsApp follow-up sequence trigger

### Malaysian Market Tools
- [ ] **Loan calculator**
  - Home loan eligibility based on income
  - Monthly repayment calculator
  - Stamp duty calculator (varying by state)
- [ ] **Affordability calculator** based on DSR (Debt Service Ratio)
- [ ] **Comparative analysis** builder
  - Similar properties in same taman/area
  - Psf comparison
  - Nearby amenities mapping
- [ ] **Market reports** 
  - State-level price trends
  - Area/township analysis
  - Property type demand indicators
- [ ] **Property alerts** matching buyer criteria via WhatsApp
- [ ] **Price history** for properties with EdgeProp data
- [ ] **Multi-language property descriptions**
  - Auto-translate BM ↔ English ↔ Mandarin
- [ ] **Feng Shui notes field** for properties (important for Chinese buyers)
- [ ] **Prayer room/Surau indicator** for Muslim buyers

---

## 🟣 USER EXPERIENCE PRIORITIES

### Mobile-First Design (Critical for Malaysian Market)
- [ ] **Functional mobile app** (Android + iOS)
  - Add contacts from business cards (OCR scan)
  - Log viewings on-the-go
  - Voice-to-text notes (BM/English/Mandarin)
  - Quick property lookup
  - WhatsApp-like chat interface
- [ ] **Offline mode** for property viewings in areas with poor 4G
- [ ] **Fast loading** even on slower Malaysian 4G networks
- [ ] **Low data mode** option

### Simplicity Over Features
- [ ] **Clean, uncluttered interface** (RENs are not tech-savvy)
- [ ] **Quick actions** prominently displayed
  - "Add new lead" button
  - "Schedule viewing" button
  - "Send WhatsApp" button
- [ ] **Smart defaults** so minimal clicking required
- [ ] **Guided workflows** for new RENs
- [ ] **Global search** - find anything instantly

### Onboarding & Training
- [ ] **5-minute setup** for individual RENs
- [ ] **Pre-built templates** for Malaysian scenarios
  - BM & English email/WhatsApp templates
  - Standard viewing scripts
  - Objection handling scripts
- [ ] **In-app tooltips** in BM/English
- [ ] **Video tutorials** in BM/English (Malaysian accent)
- [ ] **Agency onboarding** - REA can invite RENs easily

---

## 💰 PRICING MODEL (MALAYSIAN RINGGIT)

### Dead Simple Pricing (No Confusion, No Options)

**7-Day Free Trial**
- Full access to everything
- No credit card required
- Email reminders on Day 5 and Day 7
- Trial data persists when you subscribe

**↓ Then ↓**

**RM59/month**
- That's it. One price. Everything included.
- Unlimited contacts and properties
- Unlimited WhatsApp messages
- All portal integrations (PropertyGuru, iProperty, EdgeProp, Mudah)
- Full automation and workflows
- Advanced reporting and analytics
- BOVAEA compliance tools
- REA admin panel
- Mobile app (Android + iOS)
- Email + WhatsApp support
- Multi-language (BM/English/Mandarin)
- Cancel anytime

**No annual plans. No hidden fees. No feature tiers. No bullshit.**

---

### Why RM59/month Works

**Psychology:**
- "Under RM60" feels significantly cheaper than RM60
- = RM1.97/day = Price of one teh tarik
- = 0.7% - 2% of typical REN monthly income (RM3-8K/month)

**ROI Math:**
- Commission on ONE RM300K property = RM9,000 (3%)
- Your annual CRM cost = RM708
- **ROI = 12.7x** if CRM helps close just 1 extra deal/year

**Competitive Positioning:**
- HubSpot Professional: ~RM500/month (8.5x more expensive)
- Salesforce Starter: ~RM250/month (4.2x more expensive)
- PropSpace Malaysia: ~RM150/month (2.5x more expensive)
- **Your CRM: RM59/month (impulse-buy territory for working RENs)**

---

### Launch Offer (First 100 Users Only)

**Lock in RM49/month FOREVER**
- First 100 users get RM49/month for life
- After 100 users, price goes to standard RM59/month
- Creates urgency + rewards early adopters
- Locks in RM4,900 MRR quickly (100 × RM49)

**Why this works:**
- FOMO effect (only 100 spots)
- Early adopters feel special
- Word-of-mouth: "I got grandfathered pricing!"
- After you hit 100, you increase to RM59 and never look back

---

### Payment Processing

**Payment Methods (Malaysian Preferences):**
- Online Banking/FPX (60% of Malaysians prefer this)
- Credit/Debit Card (Visa, Mastercard)
- E-wallets (Touch 'n Go eWallet, Boost, GrabPay)

**Payment Gateway:**
- Billplz (Malaysian-focused, supports FPX + e-wallets)
- Stripe (international cards backup)

**Billing:**
- Auto-renewal monthly
- Email reminder 3 days before charge
- Failed payment? 3 auto-retry attempts over 7 days
- Friendly dunning emails (no aggressive collection)
- 7-day grace period before account suspension
- Self-service cancellation (no need to email/call)

---

### Revenue Projections

**Conservative Growth (RM59/month):**
- **Month 6:** 50 paying RENs = **RM2,950 MRR** (RM35.4K ARR)
- **Month 12:** 200 paying RENs = **RM11,800 MRR** (RM141.6K ARR)
- **Month 18:** 500 paying RENs = **RM29,500 MRR** (RM354K ARR)
- **Month 24:** 1,000 paying RENs = **RM59,000 MRR** (RM708K ARR)

**With Launch Offer (RM49 for first 100):**
- 100 users @ RM49 = RM4,900
- 900 users @ RM59 = RM53,100
- **Total at 1,000 users = RM58,000 MRR**

**Target: RM30K MRR by Month 18 = You can hire developers and scale**

---

### Volume Discounts (Negotiate Privately)

Don't advertise these publicly. Offer when agencies with 10+ RENs contact you:
- 10-19 RENs: RM55/user/month
- 20-49 RENs: RM49/user/month
- 50+ RENs: RM45/user/month + dedicated onboarding

**Why negotiate privately?**
- Keeps public messaging simple ("RM59/month, period")
- Allows flexibility for enterprise deals
- Prevents small users from demanding discounts

---

### Pricing Page Messaging

**Headline:** 
"RM59/month. Everything Included."

**Subheadline:** 
"The only real estate CRM built for Malaysian RENs. WhatsApp-first. Portal-integrated. BOVAEA-compliant."

**Pricing Box:**
```
7-Day Free Trial → RM59/month
✓ Unlimited contacts
✓ Unlimited WhatsApp messages  
✓ All portal integrations
✓ Mobile app (Android + iOS)
✓ Cancel anytime

[Start Free Trial]
```

**No Fine Print. No Asterisks. No "Starting At" Crap.**

---

### Churn Prevention

**Activation Checklist (First 7 Days):**
Users who complete these 5 actions convert at 80%:
1. Connected PropertyGuru account ✓
2. Imported first lead ✓
3. Sent WhatsApp from CRM ✓
4. Created deal in pipeline ✓
5. Scheduled viewing ✓

**Usage Monitoring:**
- Flag inactive users (no login for 14 days)
- Automated "We miss you" WhatsApp
- Offer help: "Stuck on something? Let me show you"

**Win-Back Offer:**
- If user cancels, offer 1 month free if they reactivate within 30 days
- Exit survey: "What made you cancel?" (improve product)

**ROI Dashboard:**
- Show RENs their stats: "You saved X hours, closed Y deals worth RM Z"
- Remind them of value monthly

---

## 🎯 ANTI-FEATURES (Don't Build These - STARTUP EDITION)

**Things that sound good but waste your time:**

### Features That Kill Startups:
- ❌ **Complex workflow builders** - RENs want templates, not drag-and-drop automation
- ❌ **Social media monitoring** - They just want PropertyGuru leads
- ❌ **Built-in advertising** - They advertise on portals, not in CRM
- ❌ **Blogging/CMS features** - They don't blog
- ❌ **Advanced marketing automation** - Too complex, they won't use it
- ❌ **AI lead scoring** - RENs respond to ALL leads within 5 minutes
- ❌ **Video calling features** - They use WhatsApp video
- ❌ **Multi-branch management** - You're targeting individual RENs first
- ❌ **White-label options** - No one cares at RM59/month
- ❌ **API marketplace** - Build integrations yourself, don't open API
- ❌ **Advanced permissions** - Keep it simple: REA vs REN only
- ❌ **Offline mode** - 4G works fine in cities
- ❌ **Dark mode** - Seriously, don't waste time on this

### What RENs Actually Want (Keep It Simple):
1. "Can I get PropertyGuru leads into my phone automatically?" ✅
2. "Can I WhatsApp them without switching apps?" ✅
3. "Can I remember which property I showed them?" ✅
4. "Can I see which deals are closing this month?" ✅
5. "Does it work on my cheap Android phone?" ✅

**If a feature doesn't directly answer one of these 5 questions, DON'T BUILD IT.**

---

## 📊 MVP PRIORITY RANKING (STARTUP FOCUS)

**Phase 1 - Launch MVP** (3-4 months - GET TO MARKET):
1. WhatsApp Business API integration (CRITICAL)
2. Contact management with basic fields (name, phone, email, status)
3. Property object with essential Malaysian fields (address, price, property type, Bumi status)
4. Simple deal pipeline (5 stages: Lead → Contact → Viewing → Offer → Closed)
5. PropertyGuru lead auto-import (just PropertyGuru, not all portals)
6. Mobile app (Android priority - 80% of RENs use Android)
7. Basic viewing scheduler with WhatsApp confirmation
8. Simple dashboard (active leads, viewings this week, deals closing)

**Phase 2 - Product-Market Fit** (After first 50 paying users):
1. Multi-language UI (Bahasa Malaysia + English)
2. iProperty integration
3. WhatsApp automation (welcome message, post-viewing follow-up)
4. Lead distribution (round-robin between RENs)
5. Task management with reminders
6. Email templates (backup to WhatsApp)
7. Better reporting (conversion rates, lead source performance)
8. iOS mobile app

**Phase 3 - Scale Features** (After first 200 paying users):
1. EdgeProp + Mudah.my integration
2. REA/REN hierarchy with permissions
3. BOVAEA compliance tools (license tracking, ad checker)
4. Commission tracking
5. Advanced automation workflows
6. Team collaboration features
7. API access for large agencies

**Don't Build Until Customers Ask:**
- Offline mode
- White-label
- Advanced analytics
- CPD tracking
- Transaction checklists
- Loan calculators

---

## ⚡ STARTUP REALITY CHECK - Feature Cuts

**You can't build everything in the checklist as a startup. Here's what to ACTUALLY build:**

### ✅ BUILD THIS (Solve core pain):
- WhatsApp integration (RENs live on WhatsApp)
- PropertyGuru auto-import (manual entry kills adoption)
- Mobile app (RENs don't use laptops)
- Basic pipeline tracking (where is each deal?)
- Contact database (who are my buyers/sellers?)

### ⏸️ BUILD LATER (After revenue):
- Multi-portal sync (start with PropertyGuru only)
- Advanced automation (start with basic WhatsApp templates)
- Reporting (basic is fine, fancy charts come later)
- BOVAEA compliance (nice-to-have, not must-have)
- Multi-language UI (launch in English, add BM in Phase 2)
- iOS app (start with Android only)

### ❌ DON'T BUILD (Waste of time):
- Custom API for agencies (no one will use it at RM59/month)
- Offline mode (4G coverage is good enough in Malaysia)
- White-label (you're too small for agencies to care)
- Advanced analytics (users just want to see their deals)
- Transaction checklists (they use lawyers for this)

**The 80/20 Rule:** 
- 80% of value = WhatsApp + PropertyGuru + Mobile + Pipeline
- 20% of value = Everything else in this checklist

**Launch with 5 features that work flawlessly, not 50 features that are buggy.**

---

## 🚨 CRITICAL SUCCESS FACTORS (MALAYSIAN MARKET)

From HubSpot/Salesforce failures adapted for Malaysia:

1. **WhatsApp integration is non-negotiable** - 70% of Malaysians prefer messaging over calls/email
2. **Portal integration is non-negotiable** - RENs won't double-enter data from PropertyGuru/iProperty
3. **Mobile must actually work** - RENs are rarely at desks, always on the road
4. **Setup takes <30 minutes** or RENs abandon it
5. **Daily workflow requires <5 clicks** for common actions (most are not tech-savvy)
6. **Support in BM & English** responds within 24 hours
7. **Works on mid-range Android phones** (not everyone has flagship)
8. **Handles Malaysian addressing** (Taman, Jalan, Lorong, proper postcode format)

---

## 💡 COMPETITIVE ADVANTAGES TO BUILD

Opportunities specific to Malaysian market:

- [ ] **Native portal sync** (not third-party Zapier - direct API to PropertyGuru/iProperty)
- [ ] **Property-first data model** with Malaysian fields (Bumi, tenure, strata)
- [ ] **Malaysian pricing in MYR** (not generic USD SaaS tiers)
- [ ] **REN-friendly UI** (not enterprise IT friendly)
- [ ] **S&P process templates** following Malaysian conveyancing practice
- [ ] **Commission calculator** for 3% standard + co-broke splits
- [ ] **BOVAEA compliance built-in** (ad checker, license tracking, client account)
- [ ] **Multi-language throughout** (BM/English/Mandarin - not just UI but templates too)
- [ ] **WhatsApp-first design** (not email-first like Western CRMs)
- [ ] **Malaysian cultural intelligence**
  - Feng Shui notes
  - Prayer room indicators
  - Multi-racial buyer preferences
  - Bumi lot awareness
- [ ] **Affordable for individual RENs** (RM59/month vs RM500+ international CRMs)
- [ ] **Works offline** for areas with poor connectivity
- [ ] **Malaysian payment methods** (FPX, e-wallets)

---

## 🏠 MALAYSIAN PROPERTY-SPECIFIC DATA FIELDS

Ensure these are built into Property object:

**Location Details:**
- State (dropdown: Selangor, KL, Penang, Johor, etc.)
- City/District
- Taman/Area name
- Jalan/Lorong
- Postcode
- Nearby landmarks (LRT station, shopping mall, school)

**Property Classification:**
- Property type (Terrace, Semi-D, Bungalow, Cluster, Condo, Apartment, Service Residence, SoHo, SoVo, Flat, Shop House, Land)
- Property sub-type (Corner lot, Intermediate, End lot)
- Tenure (Freehold / Leasehold with years remaining)
- Title type (Strata / Individual / Master)
- Bumi lot (Yes/No)
- Gated & Guarded (Yes/No)

**Property Specifications:**
- Land size (sq ft) - for landed
- Built-up size (sq ft)
- Bedrooms + 1 (3+1 notation)
- Bathrooms
- Car parks
- Floors/Levels (for landed)
- Floor level (for high-rise)
- Facing (North, South, East, West, Northeast, etc.)
- Renovated (Yes/No/Partially)
- Furnished (Fully/Partially/Unfurnished)

**Financial:**
- Asking price (RM)
- PSF calculation (auto-calculate)
- Maintenance fee (RM/month)
- Sinking fund
- Assessment tax (RM/year)
- Quit rent (RM/year)

**Facilities (for high-rise):**
- Swimming pool
- Gymnasium
- Playground
- Multi-purpose hall
- 24-hour security
- Covered parking
- Surau/Prayer room
- BBQ area
- Sauna
- Squash court
- Tennis court
- Mini market

**Additional Info:**
- Year built
- Developer name
- Number of units in development
- Occupancy rate
- Feng Shui notes (text field)
- Nearby amenities (schools, hospitals, malls, transportation)

---

## 📱 WHATSAPP BUSINESS FEATURES TO BUILD

Critical for Malaysian market (70% prefer messaging):

**Core WhatsApp Features:**
- [ ] Send/receive WhatsApp messages in CRM inbox
- [ ] WhatsApp message templates (pre-approved by Meta)
- [ ] Media sharing (images, PDFs, location, contact cards)
- [ ] Voice messages
- [ ] Read receipts and typing indicators
- [ ] Archive/unarchive conversations
- [ ] Star important messages

**Automation:**
- [ ] Auto-reply when offline (business hours)
- [ ] Welcome message for new contacts
- [ ] Away message (lunch break, viewings, etc.)
- [ ] Quick replies for common questions
- [ ] Chatbot for basic inquiries (property search, viewing booking)

**Broadcasting:**
- [ ] Broadcast lists (up to 256 contacts)
- [ ] Segmented broadcasts (by buyer preference, location, etc.)
- [ ] Schedule broadcasts for optimal times
- [ ] Track broadcast open rates and responses

**Templates (in BM & English):**
- [ ] Viewing confirmation: "Hi {name}, confirmed viewing for {property} on {date} at {time}. Location: {link}. See you!"
- [ ] Post-viewing follow-up: "Hi {name}, thank you for viewing {property}. What did you think? Any questions?"
- [ ] Property match alert: "Hi {name}, new property matching your criteria: {property details}. Interested to view?"
- [ ] Booking confirmation: "Hi {name}, booking fee RM{amount} received for {property}. S&P appointment on {date}."
- [ ] Loan approval: "Hi {name}, congratulations! Loan approved for {property}. Next step: {action}."

**Analytics:**
- [ ] Response time tracking
- [ ] Message volume by REN
- [ ] Most used templates
- [ ] Conversion rate from WhatsApp leads

---

## 🌐 LANGUAGE & LOCALIZATION

**UI Translation Required:**
- [ ] Bahasa Malaysia (primary)
- [ ] English (primary)
- [ ] Simplified Chinese (secondary - for Mandarin speakers)

**Content Templates (BM + English minimum):**
- [ ] All email templates
- [ ] All WhatsApp templates
- [ ] All SMS templates
- [ ] Property descriptions (auto-translate option)
- [ ] Reports and documents

**Malaysian Terminology:**
- Use "REN" not "agent" or "negotiator"
- Use "REA" for licensed agents
- Use "Taman" not "neighborhood"
- Use "Jalan" not "street"
- Use "RM" not "MYR" or "Ringgit"
- Use "psf" not "per square foot"
- Use "terrace" not "townhouse"
- Use "condo" and "apartment" (different meanings in Malaysia)
- Use "service residence" not "serviced apartment"
- Use "viewing" not "showing"
- Use "S&P" not "purchase agreement"

---

## 🚀 GO-TO-MARKET STRATEGY (YOUR FIRST 100 CUSTOMERS)

### Customer Acquisition Channels (Ranked by ROI)

**1. Direct WhatsApp Outreach (Highest ROI - Start Here)**

**Source REN contacts:**
- Scrape PropertyGuru/iProperty agent listings (name, phone, agency publicly displayed)
- Build database of 1,000 REN contacts in Klang Valley
- Prioritize active RENs (recent listings, many reviews)

**Cold WhatsApp script:**
```
Hi [Name], saw your [Property] listing on PropertyGuru. 

Quick question - tired of manually copying PropertyGuru leads into your phone?

I built a CRM that auto-imports leads directly to WhatsApp. 

Want 7-day free trial?
```

**Expected Results:**
- 1,000 messages → 300 opens → 100 replies → 20 trials → **10 paying customers**

**2. Facebook Groups (Free, High Intent)**

Join these groups:
- "Real Estate Negotiators Malaysia" 
- "REN Malaysia Support Group"
- "Property Agent Network MY"

**Soft promotion approach:**
- Provide value first (answer questions for 2 weeks)
- Then: "Built a simple CRM for RENs. Auto-imports PropertyGuru → WhatsApp. 7-day trial?"

**Expected Results:**
- 40 helpful posts → 160 DMs → 32 trials → **16 paying customers**

**3. REA Partnership (1 REA = 20 RENs)**

**Pitch to agencies:**
"Give your RENs competitive advantage. RM49/user for 10+ RENs."

**Expected Results:**
- Contact 50 REAs → 5 interested → 2 sign → **30 paying RENs**

---

### Launch Offer (First 100 Users)

**"Lock in RM49/month FOREVER"**
- Creates urgency (only 100 spots)
- Rewards early adopters
- Generates word-of-mouth
- Locks in RM4,900 MRR quickly (100 × RM49)

Normal price after first 100: RM59/month

---

### Key Metrics to Track

**Trial → Paid Conversion:**
- Target: 50%
- If < 30%: Product broken, fix before scaling
- If > 60%: You're undercharging

**Magic Number = 5 Actions in First 7 Days:**
1. Connected PropertyGuru ✓
2. Imported first lead ✓
3. Sent WhatsApp from CRM ✓
4. Created deal in pipeline ✓
5. Scheduled viewing ✓

Users completing all 5 = 80% convert to paid

**Customer Acquisition Cost:**
- Organic (WhatsApp/FB): RM0-50
- Paid ads (later): RM100-150
- LTV: RM59 × 18 months = RM1,062
- Target LTV:CAC > 7x

---

### Customer Acquisition Goal (Month 4-6)

**Month 4 (Beta):** 10 free beta testers
**Month 5 (Launch):** 30 trials → 15 paying = **RM885 MRR**
**Month 6:** 50 trials → 25 paying = **40 total = RM2,360 MRR**

**Hit RM3,000 MRR by Month 6 = Product-Market Fit confirmed**

---

## 💪 STARTUP EXECUTION STRATEGY

### Your Unfair Advantage (Why You'll Win):
1. **Speed** - HubSpot/Salesforce take 6-12 months to localize. You build in 3-4 months.
2. **Price** - RM59/month vs RM500+/month = 8.5x cheaper
3. **Focus** - They solve 1000 industries poorly. You solve Malaysian real estate perfectly.
4. **WhatsApp-native** - Western CRMs bolt on WhatsApp. You build around it.
5. **PropertyGuru integration** - Direct API, not Zapier middleware.

### Your Launch Checklist (Get to RM10K MRR):
**Month 1-3: Build MVP**
- [ ] WhatsApp Business API working
- [ ] PropertyGuru lead auto-import working
- [ ] Mobile app (Android only) working
- [ ] Basic pipeline (5 stages) working
- [ ] Contact database working
- [ ] Payment (FPX) working
- [ ] 7-day trial working

**Month 4: Beta Launch (Target: 10 beta users)**
- [ ] Find 10 RENs willing to test free for 1 month
- [ ] Get feedback on critical bugs
- [ ] Fix show-stoppers only
- [ ] Ignore feature requests for now

**Month 5-6: Paid Launch (Target: 50 paying users = RM3K MRR)**
- [ ] Launch at RM59/month (or RM49 for first 100 users)
- [ ] Cold WhatsApp to 1000 RENs (scrape from PropertyGuru)
- [ ] Offer: "First 100 users lock in RM49/month lifetime price"
- [ ] Simple landing page: "PropertyGuru leads → WhatsApp → Close deals. 7-day free trial."
- [ ] Post in 5 Facebook REN groups
- [ ] Contact 50 REAs for agency deals

**Month 7-12: Scale to RM10K MRR (167 users)**
- [ ] Add iProperty integration (customers keep asking)
- [ ] Add iOS app (if 30%+ request it)
- [ ] Add WhatsApp automation (if adoption > 70%)
- [ ] Fix bugs reported by paying customers
- [ ] Referral program: "Get 1 month free for each REN you refer"

### What Success Looks Like:
- **Month 6:** 50 paying RENs × RM59 = **RM2,950 MRR**
- **Month 12:** 200 paying RENs × RM59 = **RM11,800 MRR**
- **Month 18:** 500 paying RENs × RM59 = **RM29,500 MRR**

At RM30K MRR (RM360K ARR), you can:
- Hire 2 developers full-time
- Build iProperty + EdgeProp integrations
- Add nice-to-have features
- Raise seed funding if you want to scale faster

**Remember:** You don't need 1000 features. You need 5 features that work so well that RENs can't live without them.

---

## 🎯 FINAL WORD - KEEP IT SIMPLE

This checklist has 100+ features. **You're only building 10 for MVP.**

Your winning formula:
1. WhatsApp Business API (seamless messaging)
2. PropertyGuru auto-import (no manual entry)
3. Mobile app (Android first)
4. Contact database (remember buyers/sellers)
5. Deal pipeline (track progress)
6. Property matching (show right property to right buyer)
7. Viewing scheduler (WhatsApp confirmation)
8. Basic dashboard (see your business at a glance)
9. Payment integration (FPX)
10. 7-day trial (get them hooked)

**That's it. Ship these 10. Ignore everything else until you hit RM10K MRR.**

Good luck! 🚀

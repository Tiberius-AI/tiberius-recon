-- ============================================================================
-- TIBERIUS RECON™ — PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Supports:
--   1. Contractors & Shop Voice Calibration + Smart Site $200/mo Equity Ledger
--   2. Territory Locks (Tier 2 Max 2/Zip vs. Tier 3 100% Zip Exclusivity)
--   3. 2:00 AM Raw Permit, Commercial Deed & Competitor Review Triggers
--   4. 4:30 AM County Appraisal District (CAD) Tax Roll X-Ray Records
--   5. Enriched Decision-Maker Contacts (GC PM, Regional PM, Deeded Homeowner)
--   6. 7:00 AM Morning Briefings & 1-Tap Human-in-the-Loop Recon Cards
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONTRACTORS
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(160) NOT NULL DEFAULT 'Apex Commercial Trades',
  owner_name VARCHAR(120) NOT NULL DEFAULT 'Shop Owner',
  primary_trade VARCHAR(120) NOT NULL,
  tier_level VARCHAR(64) NOT NULL DEFAULT 'Tier 2: Commercial Permits',
  include_smart_site_bundle BOOLEAN NOT NULL DEFAULT FALSE,
  smart_site_equity_cents INTEGER NOT NULL DEFAULT 20000, -- $200.00 initial month credit when bundled
  smart_site_target_cents INTEGER NOT NULL DEFAULT 240000, -- $2,400.00 full buyout target
  base_zip VARCHAR(32) NOT NULL,
  service_radius_miles INTEGER NOT NULL DEFAULT 25,
  min_permit_valuation INTEGER NOT NULL DEFAULT 100000,
  min_cad_assessed_value INTEGER NOT NULL DEFAULT 600000,
  mobile_phone VARCHAR(40) NOT NULL,
  work_email VARCHAR(160) NOT NULL,
  voice_profile_json JSONB NOT NULL DEFAULT '{
    "tone": "direct-local-pro",
    "landmark_reference": "two miles east on Commerce Dr",
    "recent_win": "a 22,000 sq ft commercial project that passed city inspection ahead of schedule",
    "differentiator": "zero day-labor subs and a 100% clean-site guarantee",
    "cta_style": "quick 10-minute site walk or bid calendar drop-off"
  }'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'TRIAL_ACTIVE', -- TRIAL_ACTIVE | PAID_ACTIVE | PAUSED
  trial_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_base_zip ON contractors(base_zip);
CREATE INDEX IF NOT EXISTS idx_contractors_email ON contractors(work_email);

-- 2. TERRITORY LOCKS (ZIP EXCLUSIVITY & CAPACITY ENGINE)
CREATE TABLE IF NOT EXISTS territory_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zip_code VARCHAR(16) NOT NULL,
  trade_category VARCHAR(120) NOT NULL,
  lock_type VARCHAR(32) NOT NULL, -- TIER_1_OPEN | TIER_2_MAX_2 | TIER_3_EXCLUSIVE
  max_slots INTEGER NOT NULL DEFAULT 2,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(zip_code, trade_category, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_territory_locks_lookup
  ON territory_locks(zip_code, trade_category, is_active);

-- 3. 2:00 AM RAW TRIGGERS (PERMITS, COMMERCIAL DEEDS, COMPETITOR REVIEWS)
CREATE TABLE IF NOT EXISTS raw_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_portal VARCHAR(64) NOT NULL, -- ACCELA | ENERGOV | SOCRATA | COUNTY_DEED | GOOGLE_PLACES
  trigger_type VARCHAR(64) NOT NULL,  -- COMMERCIAL_PERMIT | B2B_PM | RESIDENTIAL_CAD | COMPETITOR_REVIEW
  external_permit_id VARCHAR(120) NOT NULL,
  property_address VARCHAR(240) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(16) NOT NULL DEFAULT 'TX',
  zip_code VARCHAR(16) NOT NULL,
  estimated_valuation NUMERIC(14, 2) NOT NULL DEFAULT 0,
  square_footage INTEGER,
  raw_scope_description TEXT NOT NULL,
  applicant_or_gc_name VARCHAR(200),
  distance_miles NUMERIC(5, 1) NOT NULL DEFAULT 3.8,
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dedupe_hash VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_triggers_zip_filed ON raw_triggers(zip_code, filed_at DESC);

-- 4. 4:30 AM COUNTY APPRAISAL DISTRICT (CAD) TAX ROLL X-RAY RECORDS
CREATE TABLE IF NOT EXISTS cad_xray_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id UUID NOT NULL UNIQUE REFERENCES raw_triggers(id) ON DELETE CASCADE,
  parcel_id VARCHAR(80) NOT NULL,
  county_name VARCHAR(120) NOT NULL,
  deeded_owner_name VARCHAR(200) NOT NULL,
  owner_entity_type VARCHAR(32) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL | LLC_CORP | TRUST
  assessed_value NUMERIC(14, 2) NOT NULL,
  land_value NUMERIC(14, 2),
  improvement_value NUMERIC(14, 2),
  building_sq_ft INTEGER NOT NULL,
  lot_acres NUMERIC(7, 2) NOT NULL DEFAULT 0.45,
  year_built INTEGER,
  homestead_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  raw_cad_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENRICHED DECISION-MAKER CONTACTS
CREATE TABLE IF NOT EXISTS enriched_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id UUID NOT NULL REFERENCES raw_triggers(id) ON DELETE CASCADE,
  contact_header VARCHAR(120) NOT NULL, -- e.g. VERIFIED GC PROJECT MANAGER:
  full_name VARCHAR(160) NOT NULL,
  role_title VARCHAR(160) NOT NULL,
  company_name VARCHAR(160) NOT NULL,
  verified_email VARCHAR(160) NOT NULL,
  verified_phone VARCHAR(40) NOT NULL,
  phone_line_type VARCHAR(32) NOT NULL DEFAULT 'MOBILE', -- MOBILE | DIRECT_OFFICE
  contact_meta VARCHAR(240) NOT NULL,
  confidence_score NUMERIC(4, 2) NOT NULL DEFAULT 0.96,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 7:00 AM MORNING BRIEFINGS
CREATE TABLE IF NOT EXISTS morning_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  magic_token VARCHAR(64) NOT NULL UNIQUE,
  territory_zip VARCHAR(32) NOT NULL,
  trade_name VARCHAR(120) NOT NULL,
  tier_level VARCHAR(64) NOT NULL,
  unlocked_limit INTEGER NOT NULL DEFAULT 3,
  total_spotted_count INTEGER NOT NULL DEFAULT 12,
  sms_dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_morning_briefings_token ON morning_briefings(magic_token);

-- 7. RECON CARDS (INDIVIDUAL DEAL CARDS IN THE 7:00 AM BRIEFING)
CREATE TABLE IF NOT EXISTS recon_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  briefing_id UUID NOT NULL REFERENCES morning_briefings(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES raw_triggers(id) ON DELETE SET NULL,
  card_rank INTEGER NOT NULL,
  card_number_label VARCHAR(80) NOT NULL,
  unlocked_badge VARCHAR(40) NOT NULL,
  is_locked_overflow BOOLEAN NOT NULL DEFAULT FALSE,
  pill_icon VARCHAR(16) NOT NULL DEFAULT '⚡',
  pill_text VARCHAR(140) NOT NULL,
  pill_class VARCHAR(160) NOT NULL,
  headline VARCHAR(240) NOT NULL,
  sub_meta TEXT,
  cad_callout TEXT,
  contact_header VARCHAR(120) NOT NULL,
  contact_name VARCHAR(200) NOT NULL,
  contact_short VARCHAR(140) NOT NULL,
  contact_meta VARCHAR(240) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(40) NOT NULL,
  draft_label VARCHAR(120) NOT NULL DEFAULT '4-SENTENCE BID INTRO (YOUR VOICE):',
  draft_subject VARCHAR(240) NOT NULL,
  draft_body TEXT NOT NULL,
  original_ai_draft_body TEXT NOT NULL,
  approval_status VARCHAR(32) NOT NULL DEFAULT 'READY', -- READY | SENT | SKIPPED
  dispatch_channel VARCHAR(32), -- CLOUD_EMAIL | CLOUD_SMS | NATIVE_SMS | NATIVE_EMAIL
  approved_at TIMESTAMPTZ,
  approved_time_label VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_recon_cards_briefing_rank ON recon_cards(briefing_id, card_rank ASC);

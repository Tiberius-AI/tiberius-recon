-- ============================================================================
-- TIBERIUS RECON™ — DEMO SEED DATA (7:00 AM BRIEFING + TERRITORY LOCKS)
-- ============================================================================

INSERT INTO contractors (
  id,
  company_name,
  owner_name,
  primary_trade,
  tier_level,
  include_smart_site_bundle,
  smart_site_equity_cents,
  base_zip,
  service_radius_miles,
  min_permit_valuation,
  mobile_phone,
  work_email,
  status
) VALUES (
  '11111111-2222-3333-4444-555555555555',
  'Lone Star Commercial Concrete & Paving',
  'Travis Miller',
  'Commercial Concrete',
  'Tier 2: Commercial Permits',
  TRUE,
  80000,
  '78130',
  25,
  100000,
  '(830) 555-0194',
  'travis@lonestarconcrete.com',
  'TRIAL_ACTIVE'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO territory_locks (
  zip_code,
  trade_category,
  lock_type,
  max_slots,
  contractor_id,
  is_active
) VALUES (
  '78130',
  'Commercial Concrete',
  'TIER_2_MAX_2',
  2,
  '11111111-2222-3333-4444-555555555555',
  TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO morning_briefings (
  id,
  contractor_id,
  briefing_date,
  magic_token,
  territory_zip,
  trade_name,
  tier_level,
  unlocked_limit,
  total_spotted_count,
  sms_dispatched_at
) VALUES (
  '99999999-8888-7777-6666-555555555555',
  '11111111-2222-3333-4444-555555555555',
  CURRENT_DATE,
  'demo-7am-briefing',
  '78130',
  'Commercial Concrete',
  'Tier 2: Commercial Permits',
  3,
  12,
  NOW()
) ON CONFLICT (magic_token) DO NOTHING;

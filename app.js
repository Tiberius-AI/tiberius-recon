/**
 * TIBERIUS RECON™ — SALES PAGE INTERACTIVE CONTROLLER (app.js / recon-app.js)
 *
 * Powers:
 *   1. Contextual Personalized Recon Brief Campaign Banner & Section (?brief=1, ?from=brief, ?token=preview-...)
 *   2. Featured Recon Card Centerpiece Trade Switcher (Permit #BP-2026-08941 at 1420 Industrial Pkwy, Suite B)
 *   3. 6-Step Interactive Opportunity-to-Conversation Demonstration:
 *      - Trade Calibration across 5 Trades
 *      - Inline Outreach Draft Editing
 *      - 1-Tap Approve & Move to Conversation Room Preview
 *      - Interactive Conversation Room Reply & Site-Walk Confirmation
 *   4. Live Territory Zip Code Availability Checker (/api/recon/availability)
 *   5. 21st.dev ("G3") WebGL1 'Silk' Shader & Pixel-Grid Footer Wordmark
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') {
    if (typeof module !== 'undefined') {
      module.exports = require('./server');
    }
    return;
  }
  if (window.__TIBERIUS_RECON_SALES_APP_INITIALIZED__) return;
  window.__TIBERIUS_RECON_SALES_APP_INITIALIZED__ = true;

  /* ==========================================================================
     1. PERSONALIZED RECON BRIEF CAMPAIGN DETECTION & TOGGLE
     ========================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const briefParam =
    urlParams.get('brief') ||
    urlParams.get('from') ||
    urlParams.get('campaign') ||
    urlParams.get('utm_campaign') ||
    '';
  const previewToken = urlParams.get('token') || urlParams.get('t') || '';
  const isFromPersonalizedBrief =
    briefParam === '1' ||
    briefParam === 'true' ||
    /brief|recon_brief|trojan|meta/i.test(briefParam) ||
    previewToken.startsWith('preview-');

  const topBriefBanner = document.getElementById('personalized-brief-top-banner');
  const briefBannerReopenLink = document.getElementById('brief-banner-reopen-link');
  const briefCollapsedPrompt = document.getElementById('personalized-brief-CollapsedPrompt');
  const briefExpandedCard = document.getElementById('personalized-brief-ExpandedCard');
  const briefSectionReopenBtn = document.getElementById('brief-section-reopen-btn');
  const btnRevealBriefMessage = document.getElementById('btn-reveal-personalized-brief-message');

  function activatePersonalizedBriefExperience() {
    if (topBriefBanner) topBriefBanner.classList.remove('hidden');
    if (briefCollapsedPrompt) briefCollapsedPrompt.classList.add('hidden');
    if (briefExpandedCard) briefExpandedCard.classList.remove('hidden');

    if (previewToken) {
      const targetHref = `/recon/briefing?token=${encodeURIComponent(previewToken)}`;
      if (briefBannerReopenLink) {
        briefBannerReopenLink.href = targetHref;
        briefBannerReopenLink.classList.remove('hidden');
      }
      if (briefSectionReopenBtn) {
        briefSectionReopenBtn.href = targetHref;
        briefSectionReopenBtn.textContent = 'Re-Open My Personalized Recon Brief →';
      }
    }
  }

  if (isFromPersonalizedBrief) {
    activatePersonalizedBriefExperience();
  }

  if (btnRevealBriefMessage) {
    btnRevealBriefMessage.addEventListener('click', () => {
      activatePersonalizedBriefExperience();
    });
  }

  /* ==========================================================================
     2. UNIFIED TRADE DATA FOR FEATURED CARD & 6-STEP INTERACTIVE DEMO
        (Consistent Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130)
     ========================================================================== */
  const TRADE_DEMO_DATA = {
    concrete: {
      tradeLabel: 'COMMERCIAL CONCRETE & PAVING',
      featuredTypeBadge:
        'COMMERCIAL TENANT IMPROVEMENT & STRUCTURAL FLATWORK • TRADE RELEVANCE: COMMERCIAL CONCRETE',
      featuredWhy:
        'Commercial TI permits are typically filed 30–60 days before specialty sub-bids close—creating an early window to introduce your concrete crew before site mobilization.',
      featuredDraft:
        '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our ACI-certified concrete crew just wrapped a 22,000 sq ft commercial tilt-wall & dock apron project two miles east off FM 306 and passed city inspection ahead of schedule. We have a crew opening in our bid calendar next month and would love to drop off numbers on the foundation, dock apron, and flatwork scope. Mind if I send over our commercial spec sheet and COI this afternoon? — Travis Miller • Lone Star Commercial Concrete"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 TI BUILDOUT',
          headline: '18,500 Sq Ft Commercial Buildout & Dock Apron',
          submeta:
            'Location: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130 • City of New Braunfels EnerGov #BP-2026-08941',
          why: 'Why it matters: $1,850,000 assessed industrial parcel (2.4 acres). Subcontractor numbers are typically collected 30–60 days after TI permit filing.',
          contact: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
          draft:
            '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our crew just wrapped a 22,000 sq ft commercial tilt-wall & dock apron project two miles east off FM 306 and passed city inspection ahead of schedule. We have a crew opening next month and would love to drop off numbers on the foundation, dock apron & flatwork scope. Mind if I send over our commercial spec sheet and bid calendar this afternoon?"',
          replySender: 'MARCUS VANCE (APEX COMMERCIAL BUILDERS) — SIMULATED REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          replyBody:
            '"Hey Travis — timing is spot on. Our previous sub backed out on the concrete & dock apron schedule at 1420 Industrial Pkwy, Suite B. Do you guys carry $2M commercial GL + bonding, and can you walk the site with my superintendent this Thursday at 9:00 AM to review the plan set?"',
          suggestedFollowUp:
            'Hey Marcus — yes, we carry $2M/$5M commercial GL and bonding, and our ACI-certified crew is ready for the schedule at 1420 Industrial Pkwy, Suite B. Locking us in for Thursday at 9:00 AM on-site with our COI, W-9, and unit-price sheet. — Travis Miller • Lone Star Commercial Concrete'
        },
        2: {
          pill: 'COMMERCIAL DEED TRANSFER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
          submeta:
            'Location: 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130 • Parcel #CAD-78130-218635',
          why: 'Why it matters: $14,200,000 commercial acquisition (142,000 sq ft). New regional property management teams frequently review exterior trade vendors within 30 days of closing.',
          contact: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
          draft:
            '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex and adjacent retail pads at 2410 Gruene Rd & Loop 337 in New Braunfels. Usually during the first 30 days of a transition, inherited exterior trade vendors get re-evaluated to bring the property up to your standards. We carry full commercial coverage ($2M GL) and specialize in weekend phased work on ADA concrete flatwork, bollard installations, and dumpster pad replacements so zero tenants lose parking access. Can I swing by Thursday to leave you a clean CapEx bid breakdown?"',
          replySender: 'DANA STERLING (CRESTVIEW COMMERCIAL MGMT) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-218635 • 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130',
          replyBody:
            '"Hi Travis, thanks for reaching out. We are onboarding two new preferred concrete & flatwork vendors for Oakridge Commons this quarter. Can you reply with your COI, W-9, and warranty summary so I can add your shop to Thursday\'s 9:00 AM property walk?"',
          suggestedFollowUp:
            'Hi Dana — happy to send our vendor packet right over. We carry $2M/$5M commercial GL and specialize in zero-disruption ADA flatwork and dumpster pad replacements. Locking in Thursday at 9:00 AM at 2410 Gruene Rd with our COI and W-9 in hand. — Travis Miller • Lone Star Commercial Concrete'
        },
        3: {
          pill: 'CUSTOM ADDITION PERMIT + COUNTY PARCEL MATCH',
          headline: '1140 Whispering Pines Ln — Custom Estate Addition & Motor Court',
          submeta:
            'Location: 1140 Whispering Pines Ln (Havenwood), New Braunfels, TX 78130 • Comal CAD #CAD-78130-90418A',
          why: 'Why it matters: $940,000 assessed estate property (4,120 sq ft on 1.4 acres). Included in Full Territory Dominion for high-ticket residential trades.',
          contact: 'Dr. Robert & Elena Harrison • Sample Property Owners',
          draft:
            '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft property at 1140 Whispering Pines Ln in Havenwood. Our custom residential team specializes in engineered post-tension foundation additions and architectural stamped motor courts across New Braunfels with a 100% clean-site guarantee. Because we coordinate directly with your framing schedule, we keep your project on timeline without headaches. Would you be open to a quick 10-minute site walk or estimate drop-off this week?"',
          replySender: 'DR. ROBERT HARRISON (PROPERTY OWNER) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Travis — we have been looking for a concrete contractor who can handle both the engineered foundation addition and the stamped motor court. Are you available Thursday morning around 9:00 AM to look at the structural drawings on site?"',
          suggestedFollowUp:
            'Hi Robert — Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. I will bring portfolio photos of our recent Havenwood motor courts and review your structural foundation plans on site. — Travis Miller • Lone Star Commercial Concrete'
        }
      }
    },
    roofing: {
      tradeLabel: 'COMMERCIAL & METAL ROOFING',
      featuredTypeBadge:
        'COMMERCIAL TENANT IMPROVEMENT & ROOF ENVELOPE • TRADE RELEVANCE: COMMERCIAL ROOFING',
      featuredWhy:
        'Commercial TI and shell permits often require TPO membrane, curb flashing, or standing-seam metal work—giving commercial roofers an early bid window.',
      featuredDraft:
        '"Hey Marcus — saw the $240,000 commercial buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our RCAT-licensed commercial roofing crew just wrapped a 24,000 sq ft TPO & sheet-metal coping package two miles east off FM 306 and passed inspection ahead of schedule. We have capacity opening next month and would love to drop off numbers on the 60-mil TPO membrane, tapered insulation, and RTU curb flashing scope. Mind if I send over our commercial spec sheet and 20-year NDL warranty details this afternoon? — Jack Williams • A-lert Roof Systems"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 COMMERCIAL ROOF & TI',
          headline: '18,500 Sq Ft Commercial Buildout & TPO Roof System',
          submeta:
            'Location: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130 • City of New Braunfels EnerGov #BP-2026-08941',
          why: 'Why it matters: $1,850,000 assessed commercial parcel. Mechanical curb flashing and roof membrane packages are locked in 30–60 days after filing.',
          contact: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
          draft:
            '"Hey Marcus — saw the $240,000 commercial buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our RCAT-licensed commercial roofing crew just wrapped a 24,000 sq ft TPO & sheet-metal coping package two miles east off FM 306 and passed inspection ahead of schedule. We have a crew opening next month and would love to drop off numbers on the 60-mil TPO membrane, tapered insulation & curb flashing scope. Mind if I send over our spec sheet and COI this afternoon?"',
          replySender: 'MARCUS VANCE (APEX COMMERCIAL BUILDERS) — SIMULATED REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          replyBody:
            '"Hey Jack — good timing. We need a licensed commercial roofer for the TPO membrane and new RTU curb flashings at 1420 Industrial Pkwy, Suite B. Can you walk the roof with our superintendent Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus — Thursday at 9:00 AM at 1420 Industrial Pkwy, Suite B works great. Our estimator will bring our RCAT license, $5M commercial GL COI, and 20-year NDL warranty specs. — Jack Williams • A-lert Roof Systems'
        },
        2: {
          pill: 'COMMERCIAL DEED TRANSFER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & 3 Adjacent Retail Pads — CapEx Roof Scope',
          submeta:
            'Location: 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130 • Parcel #CAD-78130-218635',
          why: 'Why it matters: $14,200,000 property acquisition. New asset managers frequently schedule roof inspections, elastomeric coatings, and CapEx reroofs right after closing.',
          contact: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
          draft:
            '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex at 2410 Gruene Rd & Loop 337 in New Braunfels. During the first 30 days of a transition, new ownership usually audits roof warranties and CapEx restoration budgets. We are RCAT-licensed and specialize in commercial roof restoration, elastomeric coatings, and 20-year NDL leak warranty transfers with zero tenant disruption. Can I swing by Thursday to provide a complimentary drone core & CapEx condition report?"',
          replySender: 'DANA STERLING (CRESTVIEW COMMERCIAL MGMT) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-218635 • 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130',
          replyBody:
            '"Hi Jack — we actually need a baseline roof condition report on Buildings B and C at Oakridge Commons for our Q4 CapEx budget. Can you meet our facilities lead on site Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana — locked in for Thursday at 9:00 AM at 2410 Gruene Rd. We will inspect Buildings B and C and deliver a photo-documented CapEx roof report and COI. — Jack Williams • A-lert Roof Systems'
        },
        3: {
          pill: 'CUSTOM ADDITION PERMIT + COUNTY PARCEL MATCH',
          headline: '1140 Whispering Pines Ln — Custom Estate Addition & Standing-Seam Metal Roof',
          submeta:
            'Location: 1140 Whispering Pines Ln (Havenwood), New Braunfels, TX 78130 • Comal CAD #CAD-78130-90418A',
          why: 'Why it matters: $940,000 estate addition permit requiring architectural 24-gauge standing-seam metal roofing to match the main residence.',
          contact: 'Dr. Robert & Elena Harrison • Sample Property Owners',
          draft:
            '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at 1140 Whispering Pines Ln in Havenwood. Our architectural metal team specializes in 24-gauge standing-seam metal roofing and custom copper flashing across New Braunfels with a weathertightness guarantee. Would you be open to a quick 10-minute site walk or color-sample drop-off this week?"',
          replySender: 'DR. ROBERT HARRISON (PROPERTY OWNER) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Jack — yes, we want to make sure the new standing-seam metal roof on the addition matches our main roof profile. Can you bring Kynar color samples by 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert — see you Thursday at 9:00 AM at 1140 Whispering Pines Ln with our 24-gauge standing-seam panel profiles and Kynar color chart. — Jack Williams • A-lert Roof Systems'
        }
      }
    },
    hvac: {
      tradeLabel: 'ELECTRICAL / HVAC (MEP)',
      featuredTypeBadge:
        'COMMERCIAL TENANT IMPROVEMENT & 800A MEP UPGRADE • TRADE RELEVANCE: ELECTRICAL & HVAC',
      featuredWhy:
        'Commercial TI permits with mechanical and electrical upgrades give TDLR/TACLA licensed MEP contractors an early window to bid RTUs, switchgear, and high-bay lighting.',
      featuredDraft:
        '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our TDLR/TACLA-licensed MEP crew just wrapped a 22,000 sq ft commercial tenant finish-out two miles east off FM 306 and passed city inspection ahead of schedule. We have a crew opening next month and would love to drop off numbers on the 800A 3-phase switchgear, high-bay LED package, and 25-ton RTU mechanical scope. Mind if I send over our MEP spec sheet and COI this afternoon? — Carlos Mendez • Alamo Mechanical & Electrical"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 MEP & TI BUILDOUT',
          headline: '18,500 Sq Ft Commercial TI Buildout & 800A MEP Upgrade',
          submeta:
            'Location: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130 • City of New Braunfels EnerGov #BP-2026-08941',
          why: 'Why it matters: $1,850,000 assessed industrial facility requiring 3-phase power distribution, LED lighting, and packaged rooftop HVAC units.',
          contact: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
          draft:
            '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our licensed MEP crew just wrapped a 22,000 sq ft commercial tenant finish-out two miles east off FM 306 and passed city inspection ahead of schedule. We would love to drop off numbers on the 800A 3-phase switchgear, LED high-bay package & 25-ton RTU mechanical scope. Mind if I send over our commercial spec sheet and bid calendar this afternoon?"',
          replySender: 'MARCUS VANCE (APEX COMMERCIAL BUILDERS) — SIMULATED REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          replyBody:
            '"Hey Carlos — we are still collecting MEP numbers for the 25-ton RTU curbed units and 800A panel upgrade at 1420 Industrial Pkwy, Suite B. Can your lead estimator walk the building Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus — locking us in for Thursday at 9:00 AM at 1420 Industrial Pkwy, Suite B. I will bring our TDLR/TACLA licenses, $2M GL COI, and RTU lead-time sheet. — Carlos Mendez • Alamo Mechanical & Electrical'
        },
        2: {
          pill: 'COMMERCIAL DEED TRANSFER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & 3 Adjacent Retail Pads — HVAC PM & LED Retrofit',
          submeta:
            'Location: 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130 • Parcel #CAD-78130-218635',
          why: 'Why it matters: $14,200,000 multi-pad commercial acquisition seeking quarterly HVAC preventative maintenance and parking lot LED retrofits.',
          contact: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
          draft:
            '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex at 2410 Gruene Rd & Loop 337 in New Braunfels. Usually during the first 30 days of a transition, inherited mechanical and electrical vendors get re-evaluated. We carry full commercial coverage and specialize in common-area LED parking lot retrofits, breaker panel upgrades, and quarterly HVAC PM with a 4-hour emergency SLA. Can I swing by Thursday to leave you a clean CapEx & PM proposal?"',
          replySender: 'DANA STERLING (CRESTVIEW COMMERCIAL MGMT) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-218635 • 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130',
          replyBody:
            '"Hi Carlos — we are looking for a responsive local MEP vendor for quarterly RTU maintenance and exterior parking lot lighting at Oakridge Commons. Can you walk the property Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana — Thursday at 9:00 AM at 2410 Gruene Rd works great. I will bring our quarterly commercial HVAC PM checklist, COI, and W-9. — Carlos Mendez • Alamo Mechanical & Electrical'
        },
        3: {
          pill: 'CUSTOM ADDITION PERMIT + COUNTY PARCEL MATCH',
          headline: '1140 Whispering Pines Ln — Estate Addition, 48kW Generator & VRF HVAC',
          submeta:
            'Location: 1140 Whispering Pines Ln (Havenwood), New Braunfels, TX 78130 • Comal CAD #CAD-78130-90418A',
          why: 'Why it matters: $940,000 estate addition permit ideal for service panel expansion, multi-zone VRF HVAC, and whole-home standby generator installation.',
          contact: 'Dr. Robert & Elena Harrison • Sample Property Owners',
          draft:
            '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at 1140 Whispering Pines Ln in Havenwood. Our residential MEP team specializes in service panel expansions, 48kW standby generator transfer switches, and multi-zone VRF HVAC across New Braunfels. Would you be open to a quick 10-minute site walk or load-calculation review this week?"',
          replySender: 'DR. ROBERT HARRISON (PROPERTY OWNER) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Carlos — we definitely want to add a whole-home standby generator and dedicated zoned HVAC while the addition electrical is open. Can you meet us at 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert — locked in for Thursday at 9:00 AM at 1140 Whispering Pines Ln to review the panel load calculation and generator pad placement. — Carlos Mendez • Alamo Mechanical & Electrical'
        }
      }
    },
    pools: {
      tradeLabel: 'CUSTOM OUTDOOR, POOLS & FENCING',
      featuredTypeBadge:
        'COMMERCIAL SITE ENCLOSURE & PERIMETER SECURITY • TRADE RELEVANCE: FENCING, GATES & HARDSCAPE',
      featuredWhy:
        'Commercial buildouts and industrial yard permits frequently require perimeter security fencing, cantilever slide gates, bollards, and outdoor amenity hardscaping.',
      featuredDraft:
        '"Hey Marcus — saw the $240,000 commercial buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our AWS-certified site & perimeter crew just wrapped a multi-pad commercial security fencing and automated cantilever gate package two miles east off FM 306 ahead of schedule. We have a crew opening next month and would love to drop off numbers on the perimeter fencing, automated security gates, and masonry dumpster enclosure scope. Mind if I send over our commercial spec sheet and COI this afternoon? — Luke Mercer • Hill Country Outdoor & Perimeter"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 PERIMETER & SITE SCOPE',
          headline: '18,500 Sq Ft Commercial Buildout — Security Fencing & Gate Package',
          submeta:
            'Location: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130 • City of New Braunfels EnerGov #BP-2026-08941',
          why: 'Why it matters: $1,850,000 industrial parcel (2.4 acres) requiring laydown yard security fencing, UL-325 gate operators, and steel bollards.',
          contact: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
          draft:
            '"Hey Marcus — saw the $240,000 commercial buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our crew just wrapped a multi-pad commercial hardscape and controlled-access perimeter package two miles east off FM 306 ahead of schedule. We would love to drop off numbers on the commercial architectural perimeter fencing, automated security gates & hardscape plaza. Mind if I send over our spec sheet and bid calendar this afternoon?"',
          replySender: 'MARCUS VANCE (APEX COMMERCIAL BUILDERS) — SIMULATED REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          replyBody:
            '"Hey Luke — yes, we need pricing on 640 linear feet of 8-ft security fencing and two motorized cantilever gates at 1420 Industrial Pkwy, Suite B. Can you walk the perimeter Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus — Thursday at 9:00 AM at 1420 Industrial Pkwy, Suite B works great. I will bring our UL-325 gate operator specs, COI, and linear-foot pricing sheet. — Luke Mercer • Hill Country Outdoor & Perimeter'
        },
        2: {
          pill: 'COMMERCIAL DEED TRANSFER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & 3 Adjacent Retail Pads — Amenity & Perimeter Upgrade',
          submeta:
            'Location: 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130 • Parcel #CAD-78130-218635',
          why: 'Why it matters: $14,200,000 multi-family & retail acquisition upgrading pool amenity decks, shade structures, and wrought-iron access gates.',
          contact: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
          draft:
            '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex at 2410 Gruene Rd & Loop 337 in New Braunfels. Usually during the first 30 days of a transition, exterior amenity and perimeter security vendors get re-evaluated. We carry full commercial coverage and specialize in commercial amenity modernization and wrought-iron perimeter security enclosures. Can I swing by Thursday to leave you a clean CapEx bid breakdown?"',
          replySender: 'DANA STERLING (CRESTVIEW COMMERCIAL MGMT) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-218635 • 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130',
          replyBody:
            '"Hi Luke — we are planning to replace the perimeter access gates and resurface the pool courtyard deck at Oakridge Commons this quarter. Can you meet on site Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana — locked in for Thursday at 9:00 AM at 2410 Gruene Rd to measure the perimeter gate openings and courtyard deck. Bringing our COI and W-9. — Luke Mercer • Hill Country Outdoor & Perimeter'
        },
        3: {
          pill: 'CUSTOM ADDITION PERMIT + COUNTY PARCEL MATCH',
          headline: '1140 Whispering Pines Ln — Estate Addition, Negative-Edge Pool & Cabana',
          submeta:
            'Location: 1140 Whispering Pines Ln (Havenwood), New Braunfels, TX 78130 • Comal CAD #CAD-78130-90418A',
          why: 'Why it matters: $940,000 estate addition on 1.4 acres in Havenwood—prime fit for custom gunite pool, outdoor kitchen pavilion, and privacy masonry.',
          contact: 'Dr. Robert & Elena Harrison • Sample Property Owners',
          draft:
            '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at 1140 Whispering Pines Ln in Havenwood. Our custom outdoor team specializes in negative-edge gunite pools, outdoor kitchen pavilions, and estate privacy masonry across New Braunfels. Because we coordinate directly with your addition grading and framing schedule, we keep your backyard build seamless. Would you be open to a quick 10-minute site walk this week?"',
          replySender: 'DR. ROBERT HARRISON (PROPERTY OWNER) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Luke — we are hoping to start our outdoor kitchen cabana and pool excavation right after the addition slab is poured. Can you walk the backyard at 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert — Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. I will bring 3D design examples from our recent Havenwood estate builds. — Luke Mercer • Hill Country Outdoor & Perimeter'
        }
      }
    },
    b2b: {
      tradeLabel: 'B2B FACILITY & PROPERTY SERVICES',
      featuredTypeBadge:
        'COMMERCIAL BUILDOUT & POST-CONSTRUCTION TURNOVER • TRADE RELEVANCE: B2B COMMERCIAL SERVICES',
      featuredWhy:
        'Commercial buildouts and property management transitions create immediate demand for post-construction final clean, exterior restoration, lot striping, and recurring facility contracts.',
      featuredDraft:
        '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our OSHA-certified commercial turnover crew just wrapped a 22,000 sq ft commercial post-construction detailing & lot striping package two miles east off FM 306 ahead of CO inspection. We have capacity next month and would love to drop off numbers on the post-construction final clean, glass detailing, and exterior pressure restoration scope. Mind if I send over our commercial rate sheet and COI this afternoon? — Granteson Cole • Lone Star Facility Services"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 TURNOVER & FACILITY SCOPE',
          headline: '18,500 Sq Ft Commercial Buildout & Post-Construction Turnkey',
          submeta:
            'Location: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130 • City of New Braunfels EnerGov #BP-2026-08941',
          why: 'Why it matters: Every commercial TI buildout requires a bonded post-construction final clean, floor prep, and exterior detailing before Certificate of Occupancy.',
          contact: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
          draft:
            '"Hey Marcus — saw the $240,000 commercial TI buildout permit (#BP-2026-08941) filed for 1420 Industrial Pkwy, Suite B in New Braunfels. Our crew just wrapped a 22,000 sq ft commercial turnover package two miles east off FM 306 ahead of schedule. We would love to drop off numbers on the post-construction final spec detailing, exterior pressure restoration & ongoing facility contract. Mind if I send over our commercial spec sheet and COI this afternoon?"',
          replySender: 'MARCUS VANCE (APEX COMMERCIAL BUILDERS) — SIMULATED REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          replyBody:
            '"Hey Granteson — we always need reliable post-construction final clean and parking lot striping subs before CO walk-throughs. Can you walk 1420 Industrial Pkwy, Suite B this Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus — locking us in for Thursday at 9:00 AM at 1420 Industrial Pkwy, Suite B with our per-square-foot turnover rate sheet, COI, and W-9. — Granteson Cole • Lone Star Facility Services'
        },
        2: {
          pill: 'COMMERCIAL DEED TRANSFER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & 3 Adjacent Retail Pads — Annual Facility Contract',
          submeta:
            'Location: 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130 • Parcel #CAD-78130-218635',
          why: 'Why it matters: $14,200,000 property transition. Ideal fit for B2B Deal Scout ($297/mo) targeting recurring exterior maintenance and porter contracts.',
          contact: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
          draft:
            '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex at 2410 Gruene Rd & Loop 337 in New Braunfels. Usually during the first 30 days of a transition, inherited facility maintenance vendors get re-evaluated. We carry full commercial coverage and specialize in annual exterior facility maintenance, common-area porter services, and day-1 vendor transitions. Can I swing by Thursday to leave you a clean service proposal?"',
          replySender: 'DANA STERLING (CRESTVIEW COMMERCIAL MGMT) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-218635 • 2410 Gruene Rd & Loop 337, New Braunfels, TX 78130',
          replyBody:
            '"Hi Granteson — we are actively rebidding the exterior pressure washing, lot sweeping, and weekly common-area porter contract for Oakridge Commons. Can you walk the property with me Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana — Thursday at 9:00 AM at 2410 Gruene Rd works great. I will bring our commercial SLA checklist, COI, W-9, and monthly contract pricing. — Granteson Cole • Lone Star Facility Services'
        },
        3: {
          pill: 'CUSTOM ADDITION PERMIT + COUNTY PARCEL MATCH',
          headline: '1140 Whispering Pines Ln — Custom Estate Turn-Key Detailing & Maintenance',
          submeta:
            'Location: 1140 Whispering Pines Ln (Havenwood), New Braunfels, TX 78130 • Comal CAD #CAD-78130-90418A',
          why: 'Why it matters: $940,000 estate addition requiring post-construction fine detailing, window restoration, and exterior stone sealing.',
          contact: 'Dr. Robert & Elena Harrison • Sample Property Owners',
          draft:
            '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at 1140 Whispering Pines Ln in Havenwood. Our team specializes in custom estate post-construction commissioning, exterior limestone sealing, and preventative maintenance schedules across New Braunfels. Would you be open to a quick 10-minute site walk or estimate drop-off this week?"',
          replySender: 'DR. ROBERT HARRISON (PROPERTY OWNER) — SIMULATED REPLY',
          replyMeta: 'Parcel #CAD-78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Granteson — we will definitely need a thorough post-construction clean and exterior stone wash once the addition wraps up. Can you stop by 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert — Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. I will bring our estate detailing checklist and references. — Granteson Cole • Lone Star Facility Services'
        }
      }
    }
  };

  let currentTradeKey = 'concrete';
  let activeConversationCardIndex = 1;
  const approvedCardsState = { 1: false, 2: false, 3: false };

  function setWorkflowActiveStep(stepNum) {
    for (let i = 1; i <= 6; i++) {
      const pill = document.getElementById(`workflow-step-pill-${i}`);
      if (!pill) continue;
      if (i <= stepNum) {
        pill.className = 'p-3 rounded-xl bg-blue-600/20 border border-blue-500 text-white transition-all';
      } else {
        pill.className = 'p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 transition-all';
      }
    }
  }

  function updateFeaturedCardUI(tradeKey) {
    const data = TRADE_DEMO_DATA[tradeKey] || TRADE_DEMO_DATA.concrete;
    const c1 = data.cards[1];

    const typeBadgeEl = document.getElementById('featured-card-type-badge');
    const titleEl = document.getElementById('featured-card-title');
    const pillEl = document.getElementById('featured-card-permit-pill');
    const whyEl = document.getElementById('featured-card-why');
    const draftEl = document.getElementById('featured-card-draft');

    if (typeBadgeEl) typeBadgeEl.textContent = data.featuredTypeBadge;
    if (titleEl) titleEl.textContent = c1.headline;
    if (pillEl) pillEl.textContent = c1.pill;
    if (whyEl) whyEl.textContent = data.featuredWhy;
    if (draftEl) draftEl.textContent = data.featuredDraft;

    document.querySelectorAll('.featured-trade-btn').forEach((btn) => {
      const isSelected = btn.getAttribute('data-featured-trade') === tradeKey;
      btn.className = isSelected
        ? 'featured-trade-btn active px-3.5 py-2 rounded-xl border border-blue-500 bg-blue-600/20 text-white font-display font-bold text-xs cursor-pointer transition-all'
        : 'featured-trade-btn px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white font-display font-bold text-xs cursor-pointer transition-all';
    });
  }

  function updateDemoConversationPreview(cardIdx) {
    activeConversationCardIndex = cardIdx;
    const data = TRADE_DEMO_DATA[currentTradeKey] || TRADE_DEMO_DATA.concrete;
    const cardData = data.cards[cardIdx] || data.cards[1];

    const customDraftEl = document.getElementById(`card-${cardIdx}-draft`);
    const outboundText = customDraftEl
      ? customDraftEl.textContent.trim().replace(/^"|"$/g, '')
      : cardData.draft.replace(/^"|"$/g, '');

    const titleEl = document.getElementById('demo-conv-thread-title');
    const metaEl = document.getElementById('demo-conv-thread-meta');
    const outboundEl = document.getElementById('demo-conv-outbound-body');
    const inboundSenderEl = document.getElementById('demo-conv-inbound-sender');
    const inboundBodyEl = document.getElementById('demo-conv-inbound-body');
    const replyInputEl = document.getElementById('demo-conv-reply-input');
    const followUpBubbleEl = document.getElementById('demo-conv-followup-bubble');
    const sendFeedbackEl = document.getElementById('demo-conv-send-feedback');

    if (titleEl) titleEl.textContent = cardData.contact;
    if (metaEl) metaEl.textContent = cardData.replyMeta;
    if (outboundEl) outboundEl.textContent = outboundText;
    if (inboundSenderEl) inboundSenderEl.textContent = cardData.replySender;
    if (inboundBodyEl) inboundBodyEl.textContent = cardData.replyBody;
    if (replyInputEl) replyInputEl.value = cardData.suggestedFollowUp;
    if (followUpBubbleEl) followUpBubbleEl.classList.add('hidden');
    if (sendFeedbackEl) sendFeedbackEl.classList.add('hidden');
  }

  function applyTradeToDemoCards(tradeKey) {
    currentTradeKey = TRADE_DEMO_DATA[tradeKey] ? tradeKey : 'concrete';
    const data = TRADE_DEMO_DATA[currentTradeKey];

    updateFeaturedCardUI(currentTradeKey);

    document.querySelectorAll('.trade-pill-btn').forEach((btn) => {
      const isSelected = btn.getAttribute('data-trade') === currentTradeKey;
      btn.classList.toggle('active', isSelected);
    });

    [1, 2, 3].forEach((idx) => {
      const c = data.cards[idx];
      if (!c) return;
      const pillEl = document.getElementById(`card-${idx}-pill`);
      const headlineEl = document.getElementById(`card-${idx}-headline`);
      const submetaEl = document.getElementById(`card-${idx}-submeta`);
      const whyEl = document.getElementById(`card-${idx}-why`);
      const contactEl = document.getElementById(`card-${idx}-contact`);
      const draftEl = document.getElementById(`card-${idx}-draft`);
      const editorEl = document.getElementById(`card-${idx}-editor`);

      if (pillEl) pillEl.textContent = c.pill;
      if (headlineEl) headlineEl.textContent = c.headline;
      if (submetaEl) submetaEl.textContent = c.submeta;
      if (whyEl) whyEl.innerHTML = `<strong class="text-white">Why it matters:</strong> ${c.why.replace(/^Why it matters:\s*/i, '')}`;
      if (contactEl) contactEl.textContent = c.contact;
      if (draftEl) {
        draftEl.textContent = c.draft;
        draftEl.classList.remove('hidden');
      }
      if (editorEl) {
        editorEl.value = c.draft;
        editorEl.classList.add('hidden');
      }
    });

    updateDemoConversationPreview(activeConversationCardIndex);
  }

  // Bind Featured Card trade switcher buttons
  document.querySelectorAll('.featured-trade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tradeKey = btn.getAttribute('data-featured-trade') || 'concrete';
      applyTradeToDemoCards(tradeKey);
    });
  });

  // Bind Interactive Demo trade calibration buttons
  document.querySelectorAll('.trade-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tradeKey = btn.getAttribute('data-trade') || 'concrete';
      applyTradeToDemoCards(tradeKey);
      setWorkflowActiveStep(2);
    });
  });

  // Bind Inline Draft Editor buttons on Sample Cards 1, 2, 3
  document.querySelectorAll('.demo-edit-draft-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-edit-card');
      const draftEl = document.getElementById(`card-${idx}-draft`);
      const editorEl = document.getElementById(`card-${idx}-editor`);
      if (!draftEl || !editorEl) return;

      const isEditing = !editorEl.classList.contains('hidden');
      if (isEditing) {
        draftEl.textContent = editorEl.value.trim() || draftEl.textContent;
        editorEl.classList.add('hidden');
        draftEl.classList.remove('hidden');
        btn.textContent = '✎ Edit Draft';
        setWorkflowActiveStep(5);
      } else {
        editorEl.value = draftEl.textContent.trim();
        draftEl.classList.add('hidden');
        editorEl.classList.remove('hidden');
        editorEl.focus();
        btn.textContent = '✓ Save Draft';
        setWorkflowActiveStep(4);
      }
    });
  });

  function updateApprovedCounterUI() {
    const count = Object.values(approvedCardsState).filter(Boolean).length;
    const counterEl = document.getElementById('demo-approved-counter');
    if (counterEl) {
      counterEl.textContent = `Sample Cards Approved: ${count}/3`;
    }
  }

  // Bind 1-Tap Approve & Move to Conversation Room buttons
  document.querySelectorAll('[data-approve-card]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-approve-card') || 1);
      const editorEl = document.getElementById(`card-${idx}-editor`);
      const draftEl = document.getElementById(`card-${idx}-draft`);
      if (editorEl && !editorEl.classList.contains('hidden') && draftEl) {
        draftEl.textContent = editorEl.value.trim() || draftEl.textContent;
        editorEl.classList.add('hidden');
        draftEl.classList.remove('hidden');
      }

      approvedCardsState[idx] = true;
      updateApprovedCounterUI();

      const actionsEl = document.getElementById(`card-${idx}-actions`);
      const dispatchedEl = document.getElementById(`card-${idx}-dispatched`);
      if (actionsEl) actionsEl.classList.add('hidden');
      if (dispatchedEl) dispatchedEl.classList.remove('hidden');

      setWorkflowActiveStep(6);
      updateDemoConversationPreview(idx);

      const convStageEl = document.getElementById('demo-conversation-room-stage');
      if (convStageEl) {
        convStageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Bind Featured Centerpiece Card CTA to trigger Step 6 Conversation Flow preview
  const featuredCardDemoCta = document.getElementById('featured-card-demo-cta');
  if (featuredCardDemoCta) {
    featuredCardDemoCta.addEventListener('click', () => {
      setWorkflowActiveStep(5);
      updateDemoConversationPreview(1);
    });
  }

  // Bind Reset Demo Button
  const resetDemoBtn = document.getElementById('reset-demo-btn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      [1, 2, 3].forEach((idx) => {
        approvedCardsState[idx] = false;
        const actionsEl = document.getElementById(`card-${idx}-actions`);
        const dispatchedEl = document.getElementById(`card-${idx}-dispatched`);
        if (actionsEl) actionsEl.classList.remove('hidden');
        if (dispatchedEl) dispatchedEl.classList.add('hidden');
      });
      updateApprovedCounterUI();
      applyTradeToDemoCards(currentTradeKey);
      setWorkflowActiveStep(1);
    });
  }

  // Bind Step 6 Conversation Room Reply Composer buttons
  const demoConvDraftWalkBtn = document.getElementById('demo-conv-draft-walk-btn');
  const demoConvReplyInput = document.getElementById('demo-conv-reply-input');
  const demoConvSendReplyBtn = document.getElementById('demo-conv-send-reply-btn');
  const demoConvFollowupBubble = document.getElementById('demo-conv-followup-bubble');
  const demoConvFollowupSentText = document.getElementById('demo-conv-followup-sent-text');
  const demoConvSendFeedback = document.getElementById('demo-conv-send-feedback');
  const demoConvStatusPill = document.getElementById('demo-conv-status-pill');

  if (demoConvDraftWalkBtn && demoConvReplyInput) {
    demoConvDraftWalkBtn.addEventListener('click', () => {
      const data = TRADE_DEMO_DATA[currentTradeKey] || TRADE_DEMO_DATA.concrete;
      const cardData = data.cards[activeConversationCardIndex] || data.cards[1];
      demoConvReplyInput.value = cardData.suggestedFollowUp;
      demoConvReplyInput.focus();
    });
  }

  if (demoConvSendReplyBtn && demoConvReplyInput) {
    demoConvSendReplyBtn.addEventListener('click', () => {
      const text = demoConvReplyInput.value.trim();
      if (!text) return;
      if (demoConvFollowupSentText) {
        demoConvFollowupSentText.textContent = text;
      }
      if (demoConvFollowupBubble) {
        demoConvFollowupBubble.classList.remove('hidden');
      }
      if (demoConvSendFeedback) {
        demoConvSendFeedback.classList.remove('hidden');
      }
      if (demoConvStatusPill) {
        demoConvStatusPill.textContent = '📅 SITE WALK BOOKED — THU 9:00 AM (DEMO)';
        demoConvStatusPill.className =
          'px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-[11px] text-emerald-300 font-bold';
      }
    });
  }

  /* ==========================================================================
     3. LIVE TERRITORY ZIP CODE AVAILABILITY CHECKER (/api/recon/availability)
     ========================================================================== */
  const zipCheckerForm = document.getElementById('zip-checker-form');
  const zipCheckerTrade = document.getElementById('zip-checker-trade');
  const zipCheckerInput = document.getElementById('zip-checker-input');
  const zipCheckerResult = document.getElementById('zip-checker-result');
  const zipCheckerStatusText = document.getElementById('zip-checker-status-text');

  if (zipCheckerForm) {
    zipCheckerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawZip = zipCheckerInput ? zipCheckerInput.value.trim() : '78130';
      const trade = zipCheckerTrade ? zipCheckerTrade.value : 'Commercial Concrete';
      const cleanZip = (rawZip.match(/\b\d{5}\b/) || ['78130'])[0];

      if (zipCheckerStatusText) {
        zipCheckerStatusText.textContent = `Checking live territory capacity for ${trade} in ${cleanZip}...`;
      }

      try {
        const resp = await fetch(
          `/api/recon/availability?zip=${encodeURIComponent(cleanZip)}&trade=${encodeURIComponent(
            trade
          )}&tier=${encodeURIComponent('Tier 2: Commercial Permits')}`
        );
        const data = await resp.json();
        if (data && data.ok && zipCheckerStatusText && zipCheckerResult) {
          if (data.isAvailable) {
            zipCheckerResult.className =
              'mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs';
            zipCheckerStatusText.className = 'font-mono-telemetry text-emerald-300 font-bold';
            zipCheckerStatusText.textContent = `✓ ZIP ${data.zipCode} (${data.city}) OPEN FOR ${trade.toUpperCase()} — ${data.statusBadge}`;
          } else {
            zipCheckerResult.className =
              'mt-3 p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-2 text-xs';
            zipCheckerStatusText.className = 'font-mono-telemetry text-amber-300 font-bold';
            zipCheckerStatusText.textContent = `🔒 ${data.statusBadge} — ${data.statusReason}`;
          }
          return;
        }
      } catch (_err) {
        // Fallback if offline
      }

      if (zipCheckerStatusText && zipCheckerResult) {
        if (cleanZip === '79999') {
          zipCheckerResult.className =
            'mt-3 p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-2 text-xs';
          zipCheckerStatusText.className = 'font-mono-telemetry text-amber-300 font-bold';
          zipCheckerStatusText.textContent = `🔒 LOCKED • TIER 3 EXCLUSIVE CLAIMED IN 79999 — Adjacent open territories: 78130, 78132, 78258.`;
        } else {
          zipCheckerResult.className =
            'mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs';
          zipCheckerStatusText.className = 'font-mono-telemetry text-emerald-300 font-bold';
          zipCheckerStatusText.textContent = `✓ ZIP ${cleanZip} OPEN FOR ${trade.toUpperCase()} — Commercial & Sub Permit Radar & Full Territory Dominion Available`;
        }
      }
    });
  }

  /* ==========================================================================
     4. 16:9 EXECUTIVE VIDEO OVERVIEW PLAYER & 21ST.DEV ("G3") VISUAL ENGINE
     ========================================================================== */
  const videoPlayerCard = document.getElementById('hero-video-player-card');
  const videoPosterView = document.getElementById('hero-video-poster-view');
  const heroOverviewVideo = document.getElementById('hero-overview-video');

  function openVideoWalkthrough() {
    if (!videoPlayerCard || !videoPosterView) return;
    if (heroOverviewVideo) {
      videoPosterView.classList.add('hidden');
      heroOverviewVideo.controls = true;
      const playPromise = heroOverviewVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }
  }

  if (heroOverviewVideo) {
    heroOverviewVideo.addEventListener('play', () => {
      if (videoPosterView) videoPosterView.classList.add('hidden');
      heroOverviewVideo.controls = true;
    });
  }

  if (videoPlayerCard) {
    videoPlayerCard.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (videoPosterView && videoPosterView.classList.contains('hidden')) return;
      openVideoWalkthrough();
    });
  }

  function initG3VisualEngine() {
    document.documentElement.classList.add('dark');
    if (document.body) {
      document.body.classList.add('g-root', 'g3-root');
    }

    // 4A. Scroll-Into-View Entrance Animation & 3D Scroll-Tilted Stage (--tilt-progress)
    const videoScrollStage = document.getElementById('hero-video-scroll-stage');
    const videoShowcaseShell = videoScrollStage ? videoScrollStage.querySelector('.video-showcase-shell') : null;

    if (videoScrollStage) {
      if ('IntersectionObserver' in window) {
        const videoRevealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                videoScrollStage.classList.add('is-in-view');
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        videoRevealObserver.observe(videoScrollStage);
      } else {
        videoScrollStage.classList.add('is-in-view');
      }
    }

    function syncHeroTilt() {
      const targetEl = videoShowcaseShell || videoPlayerCard;
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.14) / (vh * 0.72)));
      const eased = 0.25 + raw * 0.75;
      targetEl.style.setProperty('--tilt-progress', eased.toFixed(3));
      if (videoScrollStage && rect.top < vh * 0.88 && rect.bottom > 0) {
        videoScrollStage.classList.add('is-in-view');
      }
    }
    window.addEventListener('scroll', syncHeroTilt, { passive: true });
    syncHeroTilt();

    // 4B. Authentic 21st.dev WebGL1 'silk' Fragment Shader (OKLab + Film Grain)
    const VERT_SRC = [
      'attribute vec2 a_pos;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_pos * 0.5 + 0.5;',
      '  gl_Position = vec4(a_pos, 0.0, 1.0);',
      '}'
    ].join('\n');

    const FRAG_SRC = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform float u_time;',
      'uniform vec2 u_res;',
      'uniform vec3 u_c0;',
      'uniform vec3 u_c1;',
      'uniform vec3 u_c2;',
      'uniform vec3 u_c3;',
      '',
      'vec3 rgb2oklab(vec3 c) {',
      '  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;',
      '  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;',
      '  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;',
      '  float l_ = pow(max(l, 0.0), 1.0 / 3.0);',
      '  float m_ = pow(max(m, 0.0), 1.0 / 3.0);',
      '  float s_ = pow(max(s, 0.0), 1.0 / 3.0);',
      '  return vec3(',
      '    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,',
      '    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,',
      '    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_',
      '  );',
      '}',
      '',
      'vec3 oklab2rgb(vec3 c) {',
      '  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;',
      '  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;',
      '  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;',
      '  float l = l_ * l_ * l_;',
      '  float m = m_ * m_ * m_;',
      '  float s = s_ * s_ * s_;',
      '  return vec3(',
      '    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,',
      '    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,',
      '    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s',
      '  );',
      '}',
      '',
      'vec3 mixOklab(vec3 a, vec3 b, float t) {',
      '  return oklab2rgb(mix(rgb2oklab(a), rgb2oklab(b), clamp(t, 0.0, 1.0)));',
      '}',
      '',
      'vec3 paletteOklab(float t) {',
      '  t = clamp(t, 0.0, 1.0);',
      '  if (t < 0.333) return mixOklab(u_c0, u_c1, t * 3.0);',
      '  if (t < 0.666) return mixOklab(u_c1, u_c2, (t - 0.333) * 3.0);',
      '  return mixOklab(u_c2, u_c3, (t - 0.666) * 3.0);',
      '}',
      '',
      'float grainHash(vec2 p) {',
      '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
      '  p3 += dot(p3, p3.yzx + 33.33);',
      '  return fract((p3.x + p3.y) * p3.z);',
      '}',
      '',
      'void main() {',
      '  vec2 uv = v_uv;',
      '  float aspect = u_res.x / max(u_res.y, 1.0);',
      '  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);',
      '  float t = u_time * 0.35;',
      '  vec2 u = p * 1.15;',
      '  float s = sin(u.x * 3.0 + u.y * 2.0 + t * 1.1 + sin(u.y * 5.0 - t) * 0.6);',
      '  float s2 = cos(u.x * 2.0 - u.y * 4.0 + t * 0.7 + s * 0.8);',
      '  float v = s * 0.5 + s2 * 0.5;',
      '  float h = smoothstep(-0.85, 0.85, v);',
      '  float sheen = pow(max(0.0, 1.0 - abs(v)), 4.0);',
      '  vec3 col = paletteOklab(h * 0.82) + u_c3 * sheen * 0.32;',
      '  float g = (grainHash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5) * 0.025;',
      '  gl_FragColor = vec4(clamp(col + g, 0.0, 1.0), 1.0);',
      '}'
    ].join('\n');

    function mountSilkShader(canvas) {
      const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
      if (!gl) return;

      function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
        return sh;
      }

      const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
      if (!vs || !fs) return;

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uRes = gl.getUniformLocation(prog, 'u_res');
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c0'), 0.02, 0.02, 0.03);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c1'), 0.0, 0.063, 0.247);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c2'), 0.0, 0.204, 1.0);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c3'), 0.31, 0.435, 1.0);

      let isVisible = true;
      const start = performance.now();

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr * 0.65));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr * 0.65));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }

      resize();
      window.addEventListener('resize', resize, { passive: true });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        });
        io.observe(canvas);
      }

      function render(now) {
        if (isVisible) {
          resize();
          gl.uniform1f(uTime, (now - start) * 0.001);
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    document.querySelectorAll('canvas[data-g3-shader="silk"]').forEach(mountSilkShader);

    // 4C. 21st.dev Canvas 2D Pixel-Grid Wordmark Footer
    function renderPixelFooter(canvas) {
      const word = canvas.getAttribute('data-pixel-word') || 'TIBERIUS RECON';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, canvas.clientWidth || 1100);
      const h = Math.max(80, canvas.clientHeight || 100);
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const off = document.createElement('canvas');
      const cell = w < 640 ? 4 : 5;
      const cols = Math.floor(w / cell);
      const rows = Math.floor(h / cell);
      off.width = cols;
      off.height = rows;
      const octx = off.getContext('2d');
      if (!octx) return;

      octx.fillStyle = '#000';
      octx.fillRect(0, 0, cols, rows);
      octx.fillStyle = '#fff';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      const fontSize = Math.min(rows * 0.78, (cols / (word.length * 0.62)));
      octx.font = `800 ${fontSize}px "General Sans", "Inter", sans-serif`;
      octx.fillText(word, cols / 2, rows / 2);

      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let y = 0; y < rows; y++) {
        const vFade = 1 - (y / rows) * 0.75;
        for (let x = 0; x < cols; x++) {
          const alpha = data[(y * cols + x) * 4];
          if (alpha > 90) {
            const isCobalt = (x + y) % 5 === 0;
            ctx.fillStyle = isCobalt
              ? `rgba(79, 111, 255, ${(0.58 * vFade).toFixed(2)})`
              : `rgba(244, 244, 245, ${(0.28 * vFade).toFixed(2)})`;
            ctx.fillRect(x * cell, y * cell, cell - 1.2, cell - 1.2);
          }
        }
      }
    }

    const pixelCanvases = Array.from(document.querySelectorAll('canvas.g3-footer-pixel-canvas'));
    pixelCanvases.forEach(renderPixelFooter);
    window.addEventListener('resize', () => pixelCanvases.forEach(renderPixelFooter), { passive: true });
  }

  initG3VisualEngine();
})();

/**
 * GET /api/recon/availability
 * Real-time Zip Code Exclusivity & Trade Slot Availability Checker
 * Supports Tier 1 (Open B2B), Tier 2 (Max 2 Contractors/Trade/Zip), Tier 3 (100% Zip Exclusive)
 */

const { checkTerritoryAvailability } = require('../../db/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const query = req.query || {};
  const zipCode = query.zip || query.zipCode || '75024';
  const tradeCategory = query.trade || query.primaryTrade || 'Commercial Concrete';
  const tierLevel = query.tier || query.tierLevel || 'Tier 2: Commercial Permits';

  const result = checkTerritoryAvailability({
    zipCode,
    tradeCategory,
    tierLevel
  });

  return res.status(200).json(result);
};

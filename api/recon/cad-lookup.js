/**
 * GET / POST /api/recon/cad-lookup
 * Live Zero-API Address & TCAD Parcel X-Ray Endpoint for the Command Portal (`MODULE 03`).
 */

const { runLiveZeroApiAddressXRay } = require('../../workers/live-zero-api-agent');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = req.method === 'POST' ? req.body || {} : req.query || {};
  const query = params.address || params.query || params.q || '16013 N IH 35';

  try {
    const result = await runLiveZeroApiAddressXRay(query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Live CAD lookup failed'
    });
  }
};

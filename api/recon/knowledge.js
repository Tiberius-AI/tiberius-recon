/**
 * TIBERIUS RECON™ — CLIENT KNOWLEDGE BASE ("SHOP DOSSIER") & AUTO-SCANNER API
 * (api/recon/knowledge.js)
 *
 * GET  /api/recon/knowledge?token=... -> Returns the contractor's active Knowledge Base
 * POST /api/recon/knowledge           ->
 *   - action === 'scan_website': Crawls the client's website with Zero API keys & updates Knowledge Base
 *   - action === 'save_knowledge': Saves updated Knowledge Base fields & recalibrates 7:00 AM Briefing drafts
 */

const {
  getBriefingByToken,
  updateContractorKnowledgeBase,
  buildDefaultKnowledgeBaseForContractor
} = require('../../db/store');
const { scanClientWebsiteForKnowledgeBase } = require('../../workers/live-zero-api-agent');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    if (req.method === 'GET') {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const token = urlObj.searchParams.get('token') || 'demo-7am-briefing';
      const data = getBriefingByToken(token);
      if (!data || !data.contractor) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: false, error: 'Contractor not found' }));
      }

      const knowledgeBase =
        data.contractor.knowledgeBase ||
        buildDefaultKnowledgeBaseForContractor(data.contractor);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          ok: true,
          token: data.briefing.magicToken,
          contractor: data.contractor,
          knowledgeBase
        })
      );
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const action = body.action || 'save_knowledge';
      const token = body.token || 'demo-7am-briefing';

      if (action === 'scan_website') {
        const result = await scanClientWebsiteForKnowledgeBase({
          token,
          websiteUrl: body.websiteUrl,
          companyName: body.companyName,
          primaryTrade: body.primaryTrade
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(result));
      }

      const updated = updateContractorKnowledgeBase({
        token,
        knowledgeBase: body.knowledgeBase || body
      });

      res.statusCode = updated.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(updated));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};

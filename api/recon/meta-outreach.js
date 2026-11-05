/**
 * GET / POST /api/recon/meta-outreach
 * Unified API Controller for Tiberius Meta-Recon™ (Autonomous Lead-Gen & Outbound System for Tiberius itself):
 *   - GET: Retrieves current Meta-Recon campaign state, gathered prospects, 3-Leak X-Rays, and 4-Touch sequences
 *   - POST action="sweep": Runs the autonomous prospect + permit bait + 3-leak X-Ray + preview briefing sweep
 *   - POST action="send_touch": Dispatches a specific touch (Touch 1–4) via Resend Email or Native SIM (`sms:`)
 *   - POST action="run_drip_batch": Runs an autonomous drip batch across all Copy-Gate-verified prospects
 *   - POST action="simulate_reply" / "inbound_reply": Classifies a prospect reply, halts cold follow-ups,
 *     and autonomously delivers their live Preview Briefing link (`/recon/briefing?token=preview-...`)
 *   - POST action="xray_url": Runs an on-demand 3-Leak Website & CRO Teardown X-Ray on any business/URL
 */

const {
  runMetaReconAgentSweep,
  getMetaReconState,
  dispatchMetaOutreachTouch,
  runAutonomousMetaDripBatch,
  handleMetaInboundProspectReply
} = require('../../workers/meta-recon-orchestrator');
const { runSiteLeakXRay } = require('../../workers/enrichment/site-leak-xray');

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
      const q = req.query || {};
      if (q.sweep === 'true' || q.zip || q.trade || q.playbook) {
        const swept = await runMetaReconAgentSweep({
          zipCode: q.zip || q.zipCode || 'ALL',
          primaryTrade: q.trade || q.primaryTrade || 'ALL',
          playbook: q.playbook || 'FULL_BUNDLE_OFFENSE_DEFENSE',
          limit: q.limit ? Number(q.limit) : 6,
          fetchLiveWeb: q.live === 'true'
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(swept));
      }

      const metaRecon = await getMetaReconState();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, metaRecon }));
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const action = String(body.action || 'sweep').toLowerCase();

    if (action === 'sweep') {
      const swept = await runMetaReconAgentSweep({
        zipCode: body.zipCode || body.zip || 'ALL',
        primaryTrade: body.primaryTrade || body.trade || 'ALL',
        playbook: body.playbook || 'FULL_BUNDLE_OFFENSE_DEFENSE',
        limit: body.limit ? Number(body.limit) : 6,
        fetchLiveWeb: Boolean(body.fetchLiveWeb),
        baseUrl: body.baseUrl,
        autopilotDripEnabled:
          body.autopilotDripEnabled !== undefined ? Boolean(body.autopilotDripEnabled) : true,
        autopilotReplyEnabled:
          body.autopilotReplyEnabled !== undefined ? Boolean(body.autopilotReplyEnabled) : true
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(swept));
    }

    if (action === 'send_touch') {
      const result = await dispatchMetaOutreachTouch({
        prospectId: body.prospectId,
        touchNumber: body.touchNumber || 1,
        channel: body.channel || 'RESEND_EMAIL',
        customSubject: body.customSubject,
        customBody: body.customBody,
        providerConfig: body.providerConfig
      });
      res.statusCode = result.statusCode || (result.ok ? 200 : 400);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (action === 'run_drip_batch') {
      const result = await runAutonomousMetaDripBatch({
        touchNumber: body.touchNumber || 1,
        maxBatchSize: body.maxBatchSize || 6,
        onlyHotLeads: Boolean(body.onlyHotLeads),
        providerConfig: body.providerConfig
      });
      res.statusCode = result.statusCode || (result.ok ? 200 : 400);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (action === 'simulate_reply' || action === 'inbound_reply') {
      const result = await handleMetaInboundProspectReply({
        prospectId: body.prospectId,
        fromEmail: body.fromEmail,
        fromPhone: body.fromPhone,
        rawReplyBody: body.rawReplyBody || body.replyText,
        autoSendDemoLink:
          body.autoSendDemoLink !== undefined ? Boolean(body.autoSendDemoLink) : true,
        providerConfig: body.providerConfig
      });
      res.statusCode = result.statusCode || (result.ok ? 200 : 400);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    if (action === 'xray_url') {
      const xray = await runSiteLeakXRay(body.prospect || body, {
        fetchLiveDom: Boolean(body.fetchLiveDom)
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(xray));
    }

    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: `Unknown action: ${action}` }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};

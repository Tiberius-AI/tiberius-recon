/**
 * GET / POST /api/recon/pretrip
 * 5:30 AM Native Fleet Pre-Trip Inspector & 6:45 AM Circuit Breaker Endpoint
 *
 * - GET /api/recon/pretrip:
 *     Executes the 5-point Pre-Trip Inspection (or returns cached state when `?statusOnly=true`)
 *     and returns `{ timestamp, overallStatus, holdDispatch, checks, heals, failures, agRepairPrompt }`.
 * - POST /api/recon/pretrip:
 *     - Default / `action: 'run_pretrip'`: Runs the 5-point Pre-Trip Inspection, auto-heals Tier 1 issues,
 *       updates `pretrip_hold_dispatch`, and sends Resend Email + Master Twilio SMS alerts.
 *     - `action: 'clear_hold'` | `'unlock'`: Clears the 6:45 AM circuit breaker hold lock (`pretrip_hold_dispatch = false`).
 *     - `action: 'lock_hold'`: Manually engages the 6:45 AM circuit breaker hold lock (`pretrip_hold_dispatch = true`).
 */

const {
  getPreTripState,
  setPreTripHoldDispatch,
  getLatestPreTripReport,
  savePreTripReport
} = require('../../db/store');
const { runPreTripInspection } = require('../../workers/pretrip-inspector');

function resolveRequestBaseUrl(req) {
  const rawHost =
    (req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '';
  const host = String(rawHost).split(',')[0].trim();
  if (host) {
    const isLocal = /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host);
    const rawProto =
      (req && req.headers && req.headers['x-forwarded-proto']) || (isLocal ? 'http' : 'https');
    const proto = String(rawProto).split(',')[0].trim() || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return 'https://www.tiberius.ai';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const requestBaseUrl = resolveRequestBaseUrl(req);

    if (req.method === 'GET') {
      const statusOnly =
        req.query && (req.query.statusOnly === 'true' || req.query.statusOnly === '1');
      const existingReport = getLatestPreTripReport();

      if (statusOnly && existingReport) {
        const preTripState = getPreTripState();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ok: true,
            ...existingReport,
            holdDispatch: preTripState.holdDispatch,
            preTripState
          })
        );
      }

      const report = await runPreTripInspection({
        token: (req.query && (req.query.token || req.query.t)) || 'demo-7am-briefing',
        baseUrl: (req.query && req.query.baseUrl) || requestBaseUrl,
        manualTrigger: Boolean(req.query && req.query.manual === 'true'),
        sendNotifications: !statusOnly && !(req.query && req.query.silent === 'true')
      });
      const preTripState = getPreTripState();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          ok: true,
          ...report,
          preTripState
        })
      );
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const action = String(body.action || 'run_pretrip').trim();

      if (action === 'clear_hold' || action === 'unlock') {
        setPreTripHoldDispatch(
          false,
          body.reason || 'Admin manually cleared 6:45 AM Pre-Trip Circuit Breaker Hold Lock'
        );
        const latest = getLatestPreTripReport();
        if (latest) {
          const updated = {
            ...latest,
            holdDispatch: false,
            overallStatus: latest.overallStatus === 'RED_TAGGED' ? 'AUTO_HEALED' : latest.overallStatus,
            clearedAt: new Date().toISOString()
          };
          savePreTripReport(updated);
        }
        const preTripState = getPreTripState();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ok: true,
            action: 'clear_hold',
            holdDispatch: false,
            overallStatus: preTripState.overallStatus,
            preTripState
          })
        );
      }

      if (action === 'lock_hold') {
        setPreTripHoldDispatch(
          true,
          body.reason || 'Admin manually engaged 6:45 AM Pre-Trip Circuit Breaker Hold Lock'
        );
        const preTripState = getPreTripState();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ok: true,
            action: 'lock_hold',
            holdDispatch: true,
            overallStatus: 'RED_TAGGED',
            preTripState
          })
        );
      }

      const report = await runPreTripInspection({
        baseUrl: body.baseUrl || requestBaseUrl,
        ...body,
        manualTrigger: body.manualTrigger !== undefined ? Boolean(body.manualTrigger) : true
      });
      const preTripState = getPreTripState();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          ok: true,
          ...report,
          preTripState
        })
      );
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        ok: false,
        error: 'Pre-Trip Inspector failed',
        details: err.message
      })
    );
  }
};

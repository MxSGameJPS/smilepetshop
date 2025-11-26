// Serverless function to forward events to Facebook Conversions API
// Expects environment variables: META_PIXEL_ID and META_CAPI_TOKEN

import crypto from "crypto";

function readEnv() {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.process !== "undefined" &&
    globalThis.process.env
  )
    return globalThis.process.env;
  return {};
}

function sha256Hex(value) {
  return crypto
    .createHash("sha256")
    .update(String(value).trim().toLowerCase())
    .digest("hex");
}

function looksHashedHex(v) {
  return typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
}

export default async function handler(req, res) {
  const env = readEnv();
  const PIXEL_ID = env.META_PIXEL_ID || env.NEXT_PUBLIC_META_PIXEL_ID;
  const ACCESS_TOKEN = env.META_CAPI_TOKEN || env.META_CAPI_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    res
      .status(500)
      .json({ success: false, error: "Missing PIXEL_ID or ACCESS_TOKEN" });
    return;
  }

  try {
    const body = req.method === "POST" ? req.body || {} : {};
    const { eventName, params } = body || {};

    if (!eventName) {
      res.status(400).json({ success: false, error: "eventName is required" });
      return;
    }

    // extract event id (may be in body.event_id or params)
    const eventId =
      body.event_id || (params && (params.event_id || params.eventID)) || null;

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: req.headers.referer || req.headers.origin || null,
      action_source: "website",
      custom_data: params || {},
    };

    if (eventId) event.event_id = String(eventId);

    // Handle user_data: prefer raw keys 'email'/'phone' from client and hash them here.
    if (body.user_data && typeof body.user_data === "object") {
      const raw = body.user_data || {};
      const ud = {};
      // email
      if (raw.em && looksHashedHex(raw.em)) {
        ud.em = raw.em;
      } else if (raw.email) {
        ud.em = sha256Hex(raw.email);
      }
      // phone
      if (raw.ph && looksHashedHex(raw.ph)) {
        ud.ph = raw.ph;
      } else if (raw.phone) {
        ud.ph = sha256Hex(raw.phone);
      }

      // add client metadata for better matching
      const xff = req.headers["x-forwarded-for"];
      const clientIp = xff
        ? String(xff).split(",")[0].trim()
        : req.socket?.remoteAddress || null;
      if (clientIp) ud.client_ip_address = clientIp;
      if (req.headers["user-agent"])
        ud.client_user_agent = req.headers["user-agent"];

      // only set if we have at least one field
      if (Object.keys(ud).length) event.user_data = ud;
    }

    const payload = { data: [event] };

    const url = `https://graph.facebook.com/v17.0/${encodeURIComponent(
      PIXEL_ID
    )}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    if (!resp.ok) {
      res
        .status(502)
        .json({ success: false, status: resp.status, data: parsed });
      return;
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

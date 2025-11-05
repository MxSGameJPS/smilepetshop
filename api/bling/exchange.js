// Serverless endpoint to exchange Bling authorization code for access token.
// Expects POST with JSON body: { code: '...', grant_type?: 'authorization_code'|'refresh_token', refresh_token?: '...' }
// Requires environment variables set in Vercel:
// - BLING_CLIENT_ID
// - BLING_CLIENT_SECRET

import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const procEnv =
    typeof globalThis !== "undefined" &&
    globalThis["process"] &&
    globalThis["process"].env
      ? globalThis["process"].env
      : {};
  const clientId = procEnv.BLING_CLIENT_ID;
  const clientSecret = procEnv.BLING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .json({
        error:
          "Server misconfigured: BLING_CLIENT_ID or BLING_CLIENT_SECRET missing in env",
      });
  }

  let body = {};
  try {
    body =
      req.body && Object.keys(req.body).length ? req.body : req.query || {};
  } catch {
    body = req.query || {};
  }

  const grantType =
    body.grant_type ||
    (body.refresh_token ? "refresh_token" : "authorization_code");
  const code = body.code;
  const refreshToken = body.refresh_token;

  if (grantType === "authorization_code" && !code) {
    return res
      .status(400)
      .json({ error: "authorization_code grant requires code" });
  }
  if (grantType === "refresh_token" && !refreshToken) {
    return res
      .status(400)
      .json({ error: "refresh_token grant requires refresh_token" });
  }

  const tokenUrl = "https://api.bling.com.br/Api/v3/oauth/token";

  const NodeBuffer = globalThis["Buffer"];
  const auth = NodeBuffer
    ? NodeBuffer.from(`${clientId}:${clientSecret}`).toString("base64")
    : btoa(`${clientId}:${clientSecret}`);

  const params = new URLSearchParams();
  params.append("grant_type", grantType);
  if (grantType === "authorization_code") params.append("code", code);
  if (grantType === "refresh_token")
    params.append("refresh_token", refreshToken);

  try {
    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "1.0",
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    });

    const text = await resp.text();
    // Try parse JSON, fallback to text
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      return res
        .status(502)
        .json({ error: "Failed to exchange token", status: resp.status, data });
    }

    // Return the token response to the client (do NOT expose client_secret here)
    return res.status(200).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Exchange failed", detail: String(err) });
  }
}

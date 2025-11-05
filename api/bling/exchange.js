// Serverless endpoint to exchange Bling authorization code for access token.
// Expects POST with JSON body: { code: '...', grant_type?: 'authorization_code'|'refresh_token', refresh_token?: '...' }
// Requires environment variables set in Vercel:
// - BLING_CLIENT_ID
// - BLING_CLIENT_SECRET

function readEnv() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.process &&
    globalThis.process.env
  ) {
    return globalThis.process.env;
  }
  return {};
}

function inferOrigin(req, env) {
  const headers = req?.headers || {};
  const envUrl =
    env.BLING_PUBLIC_URL ||
    env.BLING_APP_BASE_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    env.SITE_URL ||
    env.VERCEL_URL ||
    "";

  if (envUrl) {
    if (/^https?:\/\//i.test(envUrl)) {
      return envUrl.replace(/\/$/, "");
    }
    return `https://${envUrl.replace(/\/$/, "")}`;
  }

  const hostHeader =
    headers["x-forwarded-host"]?.split(",")[0]?.trim() ||
    headers.host ||
    "localhost:3000";
  const protoHeader =
    headers["x-forwarded-proto"]?.split(",")[0]?.trim() ||
    (hostHeader.startsWith("localhost") ? "http" : "https");

  return `${protoHeader}://${hostHeader.replace(/\/$/, "")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const procEnv = readEnv();
  const clientId = procEnv.BLING_CLIENT_ID;
  const clientSecret = procEnv.BLING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error:
        "Server misconfigured: BLING_CLIENT_ID or BLING_CLIENT_SECRET missing in env",
    });
  }

  const origin = inferOrigin(req, procEnv);
  let redirectUri =
    procEnv.BLING_REDIRECT_URI || `${origin}/api/bling/callback`;

  let body = {};
  try {
    body =
      req.body && Object.keys(req.body).length ? req.body : req.query || {};
  } catch {
    body = req.query || {};
  }

  if (body.redirect_uri || body.redirectUri) {
    const provided = String(body.redirect_uri || body.redirectUri).trim();
    if (provided) {
      redirectUri = provided.replace(/\s+/g, "");
    }
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

  const tokenUrl =
    procEnv.BLING_TOKEN_URL || "https://api.bling.com.br/Api/v3/oauth/token";

  const NodeBuffer = globalThis["Buffer"];
  const auth = NodeBuffer
    ? NodeBuffer.from(`${clientId}:${clientSecret}`).toString("base64")
    : btoa(`${clientId}:${clientSecret}`);

  const params = new URLSearchParams();
  params.append("grant_type", grantType);
  params.append("client_id", clientId);
  if (grantType === "authorization_code") {
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
  }
  if (grantType === "refresh_token") {
    params.append("refresh_token", refreshToken);
  }

  try {
    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok || data?.error) {
      return res.status(resp.status || 502).json({
        error: data?.error || "Failed to exchange token",
        status: resp.status,
        data,
        redirect_uri: redirectUri,
      });
    }

    return res.status(200).json({
      ...data,
      redirect_uri: redirectUri,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Exchange failed", detail: String(err) });
  }
}

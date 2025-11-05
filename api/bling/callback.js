// Vercel serverless function: handle Bling redirect and (optionally) exchange code for tokens
// If BLING_CLIENT_ID and BLING_CLIENT_SECRET are set in env, this function will
// perform the token exchange server-side and embed the token response in the page
// so the opener (or SPA route) receives tokens instead of the one-minute code.

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

function buildRedirectTargets(req, env) {
  const origin = inferOrigin(req, env);
  const apiBase = env.BLING_API_BASE_URL
    ? env.BLING_API_BASE_URL.replace(/\/$/, "")
    : origin;
  const appBase = env.BLING_APP_BASE_URL
    ? env.BLING_APP_BASE_URL.replace(/\/$/, "")
    : origin;

  const redirectUri = env.BLING_REDIRECT_URI
    ? env.BLING_REDIRECT_URI.replace(/\/$/, "")
    : `${apiBase}/api/bling/callback`;

  const spaCallback = env.BLING_APP_CALLBACK_URL
    ? env.BLING_APP_CALLBACK_URL.replace(/\/$/, "")
    : `${appBase}/bling/callback`;

  return { origin, apiBase, appBase, redirectUri, spaCallback };
}

export default async function handler(req, res) {
  try {
    const params = req.method === "GET" ? req.query : req.body || {};
    const env = readEnv();
    const { redirectUri, spaCallback } = buildRedirectTargets(req, env);

    let tokenData = null;
    let tokenError = null;

    if (params?.code && env.BLING_CLIENT_ID && env.BLING_CLIENT_SECRET) {
      try {
        const NodeBuffer = globalThis["Buffer"];
        const auth = NodeBuffer
          ? NodeBuffer.from(
              env.BLING_CLIENT_ID + ":" + env.BLING_CLIENT_SECRET
            ).toString("base64")
          : btoa(env.BLING_CLIENT_ID + ":" + env.BLING_CLIENT_SECRET);

        const tokenResp = await fetch(
          env.BLING_TOKEN_URL || "https://api.bling.com.br/Api/v3/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
              Authorization: "Basic " + auth,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: params.code,
              redirect_uri: redirectUri,
              client_id: env.BLING_CLIENT_ID,
            }).toString(),
          }
        );

        const txt = await tokenResp.text();
        let parsed;
        try {
          parsed = JSON.parse(txt);
        } catch {
          parsed = { raw: txt };
        }

        if (!tokenResp.ok || parsed?.error) {
          tokenError = {
            status: tokenResp.status,
            data: parsed,
            redirect_uri: redirectUri,
          };
        } else {
          tokenData = parsed;
        }
      } catch (err) {
        tokenError = { error: String(err), redirect_uri: redirectUri };
      }
    }

    const payload = tokenError
      ? { ...(params || {}), token_error: tokenError }
      : tokenData
      ? { ...(params || {}), ...tokenData, redirect_uri: redirectUri }
      : { ...(params || {}), redirect_uri: redirectUri };

    const safeData = JSON.stringify(payload);
    const safeSpaCallback = JSON.stringify(spaCallback);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res
      .status(200)
      .send(
        "<!doctype html>" +
          '<html lang="pt-BR">' +
          "<head>" +
          '<meta charset="utf-8" />' +
          '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
          "<title>Bling callback</title>" +
          "<style>body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial;margin:32px;color:#073b4c}pre{background:#f5f7f7;padding:12px;border-radius:8px;overflow:auto}</style>" +
          "</head>" +
          "<body>" +
          "<h2>Callback do Bling recebido</h2>" +
          "<p>Feche esta janela se ela foi aberta por um popup — os dados serão enviados para a aplicação que abriu a autenticação.</p>" +
          '<div id="payload"></div>' +
          "<script>" +
          "(function(){" +
          "const data = " +
          safeData +
          ";" +
          "const spaCallback = " +
          safeSpaCallback +
          ";" +
          'const payload = document.getElementById("payload");' +
          "try {" +
          "if (window.opener && window.opener.postMessage) {" +
          'try { window.opener.postMessage({ source: "bling-callback", data }, "*"); } catch(e) { /* ignore */ }' +
          'try { localStorage.setItem("bling_callback", JSON.stringify(data)); } catch(e) { /* ignore */ }' +
          'payload.innerHTML = "<p>Dados enviados para a aplicação. Você pode fechar esta janela.</p>";' +
          "setTimeout(function(){ try{ window.close(); } catch(e){} }, 900);" +
          "return;" +
          "}" +
          "} catch (e) { /* ignore */ }" +
          'try { localStorage.setItem("bling_callback", JSON.stringify(data)); } catch (e) { /* ignore */ }' +
          "try {" +
          "var qs = Object.keys(data).map(function(k){" +
          "  var value = data[k];" +
          "  if (value === null || value === undefined) {" +
          '    return encodeURIComponent(k) + "=";' +
          "  }" +
          '  if (typeof value === "object") {' +
          "    try { value = JSON.stringify(value); } catch(e) { value = String(value); }" +
          "  }" +
          '  return encodeURIComponent(k) + "=" + encodeURIComponent(String(value));' +
          '}).join("&");' +
          'var target = spaCallback + (qs ? ("?" + qs) : "");' +
          "window.location.replace(target);" +
          "return;" +
          "} catch (e) {" +
          'payload.innerHTML = "<h3>Parâmetros recebidos</h3><pre>" + JSON.stringify(data, null, 2) + "</pre>";' +
          "}" +
          "})();" +
          "</script>" +
          "</body>" +
          "</html>"
      );
  } catch (err) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("Erro no callback: " + String(err));
  }
}

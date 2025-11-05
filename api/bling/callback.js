// Vercel serverless function: handle Bling redirect and (optionally) exchange code for tokens
// If BLING_CLIENT_ID and BLING_CLIENT_SECRET are set in env, this function will
// perform the token exchange server-side and embed the token response in the page
// so the opener (or SPA route) receives tokens instead of the one-minute code.

import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const params = req.method === "GET" ? req.query : req.body || {};

    // Read env safely (avoid lint warnings about 'process')
    const procEnv =
      typeof globalThis !== "undefined" &&
      globalThis["process"] &&
      globalThis["process"].env
        ? globalThis["process"].env
        : {};
    let tokenData = null;

    if (
      params &&
      params.code &&
      procEnv.BLING_CLIENT_ID &&
      procEnv.BLING_CLIENT_SECRET
    ) {
      try {
        const NodeBuffer = globalThis["Buffer"];
        const auth = NodeBuffer
          ? NodeBuffer.from(
              procEnv.BLING_CLIENT_ID + ":" + procEnv.BLING_CLIENT_SECRET
            ).toString("base64")
          : btoa(procEnv.BLING_CLIENT_ID + ":" + procEnv.BLING_CLIENT_SECRET);

        const tokenResp = await fetch(
          "https://api.bling.com.br/Api/v3/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "1.0",
              Authorization: "Basic " + auth,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: params.code,
            }).toString(),
          }
        );

        const txt = await tokenResp.text();
        try {
          tokenData = JSON.parse(txt);
        } catch {
          tokenData = { raw: txt };
        }
      } catch {
        tokenData = null;
      }
    }

    const safe = JSON.stringify(tokenData || params || {});

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
          safe +
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
          'var qs = Object.keys(data).map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(data[k] == null ? "" : String(data[k])); }).join("&");' +
          'var target = "https://smilepetshop.vercel.app/bling/callback" + (qs ? ("?" + qs) : "");' +
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

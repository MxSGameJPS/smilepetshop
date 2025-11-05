// Simple Vercel serverless function to handle Bling OAuth/redirect callback.
// It accepts GET requests with query parameters (e.g. ?code=...&state=...)
// and returns a small HTML page which:
// - if opened from a popup, posts the params to window.opener via postMessage and closes the popup;
// - otherwise displays the params so you can copy them manually.

export default function handler(req, res) {
  try {
    const params = req.method === "GET" ? req.query : req.body || {};
    const safe = JSON.stringify(params || {});

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(
      `<!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Bling callback</title>
        <style>body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial;margin:32px;color:#073b4c}pre{background:#f5f7f7;padding:12px;border-radius:8px;overflow:auto}</style>
      </head>
      <body>
        <h2>Callback do Bling recebido</h2>
        <p>Feche esta janela se ela foi aberta por um popup — os dados serão enviados para a aplicação que abriu a autenticação.</p>
        <div id="payload"></div>
        <script>
          (function(){
            const data = ${safe};
            const payload = document.getElementById('payload');
            // If the auth flow opened a popup, notify the opener and close
            try {
              if (window.opener && window.opener.postMessage) {
                try { window.opener.postMessage({ source: 'bling-callback', data }, '*'); } catch(e) { /* ignore */ }
                // also save a copy to localStorage as a fallback if opener misses the message
                try { localStorage.setItem('bling_callback', JSON.stringify(data)); } catch(e) { /* ignore */ }
                payload.innerHTML = '<p>Dados enviados para a aplicação. Você pode fechar esta janela.</p>';
                // try to close after a short delay so user sees message
                setTimeout(() => window.close(), 900);
                return;
              }
            } catch (e) {
              // ignore
            }

            // If there is no opener (redirected in the same tab), store params and redirect
            try {
              localStorage.setItem('bling_callback', JSON.stringify(data));
            } catch (e) {
              // ignore
            }
            // build query string and redirect to SPA route so the frontend can finish auth
            try {
              const qs = Object.keys(data).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k] == null ? '' : String(data[k]))).join('&');
              const target = 'https://smilepetshop.vercel.app/bling/callback' + (qs ? ('?' + qs) : '');
              // replace location so back button doesn't keep callback URL
              window.location.replace(target);
              return;
            } catch (e) {
              // if redirect fails, render the returned params so user can copy them
              payload.innerHTML = '<h3>Parâmetros recebidos</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
          })();
        </script>
      </body>
      </html>`
    );
  } catch (err) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("Erro no callback: " + String(err));
  }
}

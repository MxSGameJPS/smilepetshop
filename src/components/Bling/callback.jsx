import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BlingCallback() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(qs.entries());

    // save to localStorage as a canonical source
    try {
      localStorage.setItem("bling_callback", JSON.stringify(params));
    } catch {
      /* ignore */
    }

    async function finalize() {
      setInfo(params);

      // If we received an authorization code but not tokens, try server-side exchange
      if (params && params.code && !params.access_token) {
        setStatus("Trocando code por token...");
        try {
          const resp = await fetch("/api/bling/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: params.code }),
          });
          const data = await resp.json();
          if (resp.ok) {
            // store tokens and notify opener if present
            try {
              localStorage.setItem("bling_callback", JSON.stringify(data));
            } catch {
              /* ignore */
            }
            try {
              if (window.opener && window.opener.postMessage)
                window.opener.postMessage(
                  { source: "bling-callback", data },
                  "*"
                );
            } catch {
              /* ignore */
            }
            setStatus("Autenticação concluída com sucesso. Redirecionando...");
            setTimeout(() => navigate("/perfil"), 900);
            return;
          } else {
            setStatus(
              "Falha na troca de token: " +
                (data && data.error ? data.error : resp.status)
            );
          }
        } catch (err) {
          setStatus("Erro ao trocar token: " + String(err));
        }
      }

      // notify opener if present even when tokens are already in params
      try {
        if (window.opener && window.opener.postMessage) {
          try {
            window.opener.postMessage(
              { source: "bling-callback", data: params },
              "*"
            );
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }

      // navigate to profile after a short delay
      const t = setTimeout(() => navigate("/perfil"), 900);
      return () => clearTimeout(t);
    }

    const cancel = finalize();
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Finalizando autenticação do Bling</h2>
      {status && (
        <p>
          <strong>{status}</strong>
        </p>
      )}
      {info && Object.keys(info).length ? (
        <div>
          <p>Parâmetros recebidos:</p>
          <pre style={{ background: "#f5f7f7", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(info, null, 2)}
          </pre>
          <p>Redirecionando para perfil...</p>
        </div>
      ) : (
        <p>
          Nenhum parâmetro recebido. Se você veio de um popup, verifique se a
          janela foi fechada automaticamente.
        </p>
      )}
    </div>
  );
}

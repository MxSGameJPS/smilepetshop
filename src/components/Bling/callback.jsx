import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BlingCallback() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(qs.entries());

    // save to localStorage as a canonical source
    try {
      localStorage.setItem("bling_callback", JSON.stringify(params));
    } catch {
      /* ignore */
    }

    // If this tab was opened by a popup we may want to notify the opener
    try {
      if (window.opener && window.opener.postMessage) {
        window.opener.postMessage(
          { source: "bling-callback", data: params },
          "*"
        );
      }
    } catch {
      // ignore
    }

    setInfo(params);

    // After saving params, redirect user to profile or admin area to finish auth
    const t = setTimeout(() => {
      // you can change this destination if you have a dedicated admin page
      navigate("/perfil");
    }, 900);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Finalizando autenticação do Bling</h2>
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

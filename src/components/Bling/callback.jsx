import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function parseMaybeJSON(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^-?\d+$/.test(trimmed) && trimmed.length < 16) {
    return Number(trimmed);
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function normalizeParams(raw) {
  if (!raw) return {};
  const normalized = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[key] = parseMaybeJSON(value);
  });
  return normalized;
}

function persistPayload(payload) {
  try {
    localStorage.setItem("bling_callback", JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function notifyOpener(payload) {
  try {
    if (window.opener && window.opener.postMessage) {
      window.opener.postMessage(
        { source: "bling-callback", data: payload },
        "*"
      );
    }
  } catch {
    /* ignore */
  }
}

export default function BlingCallback() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const rawParams = Object.fromEntries(qs.entries());
    let params = normalizeParams(rawParams);

    if (!params || !Object.keys(params).length) {
      try {
        const cached = localStorage.getItem("bling_callback");
        if (cached) params = normalizeParams(JSON.parse(cached));
      } catch {
        /* ignore */
      }
    }

    setInfo(params);
    if (params && Object.keys(params).length) {
      persistPayload(params);
    }

    let timerId = null;

    async function finalize(currentParams) {
      if (!currentParams || !Object.keys(currentParams).length) {
        setStatus(
          "Nenhum parâmetro recebido. Se você veio de um popup, confirme se a janela foi fechada automaticamente."
        );
        return;
      }

      if (currentParams.error) {
        setStatus(
          `Fluxo interrompido pelo Bling: ${
            currentParams.error_description || currentParams.error
          }`
        );
        return;
      }

      if (currentParams.token_error) {
        const message =
          currentParams.token_error?.data?.error_description ||
          currentParams.token_error?.data?.error ||
          currentParams.token_error?.error ||
          "Falha na troca de token";
        setStatus(`Erro ao autenticar no Bling: ${message}`);
        persistPayload(currentParams);
        notifyOpener(currentParams);
        return;
      }

      if (currentParams.access_token) {
        persistPayload(currentParams);
        notifyOpener(currentParams);
        setStatus("Autenticação concluída com sucesso. Redirecionando...");
        timerId = window.setTimeout(() => navigate("/perfil"), 1200);
        return;
      }

      if (currentParams.code) {
        setStatus("Trocando code por token...");
        try {
          const resp = await fetch("/api/bling/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: currentParams.code,
              redirect_uri: currentParams.redirect_uri,
            }),
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            const errMsg =
              data?.error_description || data?.error || resp.statusText;
            const payload = { ...currentParams, token_error: data };
            setInfo(payload);
            setStatus(`Falha na troca de token: ${errMsg}`);
            persistPayload(payload);
            notifyOpener(payload);
            return;
          }

          const merged = { ...currentParams, ...data };
          setInfo(merged);
          persistPayload(merged);
          notifyOpener(merged);
          if (merged.access_token) {
            setStatus("Autenticação concluída com sucesso. Redirecionando...");
            timerId = window.setTimeout(() => navigate("/perfil"), 1200);
            return;
          }
          setStatus(
            "Token trocado, mas resposta inesperada recebida. Verifique a aba de detalhes abaixo."
          );
          return;
        } catch (err) {
          setStatus("Erro ao trocar token: " + String(err));
          return;
        }
      }

      setStatus(
        "Parâmetros recebidos, mas nenhum token disponível. Caso necessário, tente autenticar novamente."
      );
    }

    finalize(params);

    return () => {
      if (timerId) window.clearTimeout(timerId);
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

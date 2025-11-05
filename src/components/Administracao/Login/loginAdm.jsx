import React, { useState } from "react";
import styles from "./loginAdm.module.css";
import { useNavigate } from "react-router-dom";

export default function LoginAdm() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(
        "https://apismilepet.vercel.app/api/usuarios/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, senha }),
        }
      );
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setError(
          (data && (data.error || data.message)) || `Erro: ${resp.status}`
        );
        setLoading(false);
        return;
      }

      // store admin info
      try {
        localStorage.setItem("smilepet_admin", JSON.stringify(data));
        // notify the app that admin changed so parent components update
        try {
          window.dispatchEvent(new Event("smilepet_admin_changed"));
        } catch {
          /* ignore */
        }
      } catch {
        // ignore
      }

      // navigate to admin home which will show header
      navigate("/adm/home", { replace: true });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <h2>Área administrativa</h2>
      <p>Faça o Login para acessar a área administrativa.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Usuário
          <input value={login} onChange={(e) => setLogin(e.target.value)} />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

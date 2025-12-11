import React, { useState } from "react";
import styles from "./recuperarSenha.module.css";
import { Link } from "react-router-dom";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!email) {
      setError("Por favor, informe seu email.");
      return;
    }

    setLoading(true);
    try {
      // Simulação da chamada para API
      const res = await fetch(
        "https://apismilepet.vercel.app/api/client/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setMsg(
          "Se existir uma conta com este email, você receberá um link para redefinir sua senha."
        );
        setEmail("");
      } else {
        // Por segurança, muitas vezes não se informa se o email não existe.
        // Mas podemos mostrar erro se for algo genérico.
        setError(
          data?.message || "Ocorreu um erro ao processar sua solicitação."
        );
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h1>Recuperar Senha</h1>
      <p>Informe seu email para receber o link de redefinição.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="seu@email.com"
          required
        />

        {msg && <div className={styles.success}>{msg}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? "Enviando..." : "Enviar Email"}
        </button>

        <div className={styles.backLink}>
          <Link to="/login">Voltar para Login</Link>
        </div>
      </form>
    </section>
  );
}

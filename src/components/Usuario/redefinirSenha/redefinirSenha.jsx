import React, { useState, useEffect } from "react";
import styles from "./redefinirSenha.module.css";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Link inválido ou expirado.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token não encontrado.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://apismilepet.vercel.app/api/client/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(
          data?.message ||
            "Erro ao redefinir a senha. O link pode ter expirado."
        );
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className={styles.section}>
        <div className={styles.errorBox}>
          <h2>Link Inválido</h2>
          <p>O link de redefinição de senha é inválido ou está ausente.</p>
          <Link to="/recuperar-senha" className={styles.link}>
            Solicitar novo link
          </Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className={styles.section}>
        <div className={styles.successBox}>
          <h2>Senha Redefinida!</h2>
          <p>Sua senha foi alterada com sucesso.</p>
          <p>Redirecionando para o login...</p>
          <Link to="/login" className={styles.btnLink}>
            Ir para Login agora
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h1>Redefinir Senha</h1>
      <p>Crie uma nova senha para sua conta.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="password">
          Nova Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="Mínimo 6 caracteres"
          required
        />

        <label className={styles.label} htmlFor="confirmPassword">
          Confirmar Senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
          placeholder="Repita a senha"
          required
        />

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </form>
    </section>
  );
}

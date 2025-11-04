import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./loginUsuario.module.css";

export default function LoginUsuario() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState("");

  const isEmailValid = (value) => {
    // simples validação de email
    return /^\S+@\S+\.\S+$/.test(String(value).toLowerCase());
  };

  const emailValid = isEmailValid(email);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError("");
    if (!emailValid) {
      setSubmitError("Por favor informe um e-mail válido.");
      return;
    }
    if (!password || password.length < 4) {
      setSubmitError("Por favor informe a senha (mínimo 4 caracteres).");
      return;
    }

    // Aqui você chamaria a API de autenticação.
    // Para demo, apenas navega para a área do usuário.
    navigate("/usuario");
  }

  return (
    <section className={styles.loginSection}>
      <h1>Login</h1>
      <p>Faça login para acessar sua conta.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={touched.email && !emailValid}
          aria-describedby={
            touched.email && !emailValid ? "email-error" : undefined
          }
          placeholder="seu@email.com"
        />
        {touched.email && !emailValid && (
          <div id="email-error" className={styles.error} role="alert">
            Informe um e-mail válido.
          </div>
        )}

        <label className={styles.label} htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="Digite sua senha"
        />

        {submitError && (
          <div className={styles.error} role="alert">
            {submitError}
          </div>
        )}

        <div className={styles.linkRow}>
          <span>Ainda não tem cadastro? </span>
          <Link to="/cadastro" className={styles.cadastroInline}>
            Cadastre-se
          </Link>
        </div>

        <button className={styles.submitBtn} type="submit">
          ENTRAR
        </button>
      </form>
    </section>
  );
}

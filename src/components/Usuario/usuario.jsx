import React from "react";
import styles from "./usuario.module.css";
import { Link } from "react-router-dom";

export default function Usuario() {
  return (
    <section className={styles.usuarioSection}>
      <h1>Área do Usuário</h1>
      <p>Entre ou cadastre-se para acessar sua conta e pedidos.</p>
      {/* Ações de login / cadastro */}
      <div className={styles.actions}>
        <Link to="/login" className={styles.loginBtn} aria-label="Entrar">
          Entrar
        </Link>
        <Link
          to="/cadastro"
          className={styles.cadastroBtn}
          aria-label="Cadastre-se"
        >
          Cadastre-se
        </Link>
      </div>
    </section>
  );
}

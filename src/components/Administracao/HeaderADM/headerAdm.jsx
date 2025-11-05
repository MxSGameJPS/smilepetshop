import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./headerAdm.module.css";

export default function HeaderAdm({ admin }) {
  const navigate = useNavigate();

  function handleLogout(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    try {
      localStorage.removeItem("smilepet_admin");
    } catch (err) {
      // log but don't block logout
      console.warn("failed to clear admin storage", err);
    }
    // notify app that admin changed
    try {
      window.dispatchEvent(new Event("smilepet_admin_changed"));
    } catch {
      // ignore
    }

    // Force a full reload to the admin root to ensure any in-memory
    // state is cleared and we present the login screen. Using a hard
    // navigation avoids subtle client-side re-writes of localStorage
    // that could happen during a SPA-only navigate.
    try {
      window.location.replace("/adm");
      return;
    } catch {
      // fallback to client-side navigation if replace fails
      navigate("/adm", { replace: true });
    }
  }

  function extractAdminName(a) {
    if (!a) return null;
    const candidates = [a.nome, a.name, a.usuario, a.login];
    for (const c of candidates) {
      if (!c && c !== 0) continue;
      if (typeof c === "string") return c;
      if (typeof c === "number") return String(c);
      if (typeof c === "object") {
        // try common nested fields
        if (typeof c.login === "string") return c.login;
        if (typeof c.name === "string") return c.name;
        if (typeof c.usuario === "string") return c.usuario;
        // if object has a 'login' key that is an object with text
        if (c && typeof c === "object") {
          // try first string property
          for (const k of Object.keys(c)) {
            if (typeof c[k] === "string") return c[k];
          }
        }
      }
    }
    return null;
  }

  const nome = extractAdminName(admin) || "Administrador";

  return (
    <header className={styles.headerWrap}>
      <div className={styles.banner}>
        <div className={styles.welcome}>
          Bem vindo {nome} a área de administração da Smile Pet!
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          Sair
        </button>
      </div>
      <nav className={styles.nav}>
        <Link to="/adm/clientes">Página de Clientes</Link>
        <Link to="/adm/produtos">Página de Produtos</Link>
        <Link to="/adm/vendas">Página de Vendas</Link>
      </nav>
    </header>
  );
}

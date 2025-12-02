import React, { useState } from "react";
import styles from "./perfil.module.css";
import DadosUsuario from "./DadosUsuario";
import MeusPedidos from "../pedidos/pedidos";
import { FaUser, FaBoxOpen } from "react-icons/fa";

export default function Perfil() {
  const [activeTab, setActiveTab] = useState("pedidos");

  return (
    <section className={styles.perfilSection}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Minha Conta</h3>
          </div>
          <nav className={styles.nav}>
            <button
              className={`${styles.navButton} ${
                activeTab === "pedidos" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("pedidos")}
            >
              <FaBoxOpen /> Meus Pedidos
            </button>
            <button
              className={`${styles.navButton} ${
                activeTab === "dados" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("dados")}
            >
              <FaUser /> Meus Dados
            </button>
          </nav>
        </aside>

        <main className={styles.content}>
          {activeTab === "pedidos" && <MeusPedidos />}
          {activeTab === "dados" && <DadosUsuario />}
        </main>
      </div>
    </section>
  );
}

import React from "react";
import styles from "./atacado.module.css";

export default function Atacado() {
  return (
    <div className={styles.atacadoBg}>
      <div className={styles.cardAtacado}>
        <h1 className={styles.titulo}>Compre no Atacado</h1>
        <div className={styles.info}>
          <p style={{ fontSize: 18, marginTop: 12, color: "#222" }}>
            Essa novidade está chegando em breve! 🎉
          </p>
          <p style={{ marginTop: 8, color: "#555" }}>
            Estamos preparando uma experiência especial para compras no atacado.
            Fique ligado — em breve liberaremos preços e condições exclusivas
            para empresas.
          </p>
          <div style={{ marginTop: 18 }}>
            <button
              className={styles.btnLaranja}
              onClick={() => (window.location.href = "/")}
              style={{ marginRight: 10 }}
            >
              Voltar para a loja
            </button>
            <button
              className={styles.btnAzul}
              onClick={() => (window.location.href = "/contato")}
            >
              Quero ser avisado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

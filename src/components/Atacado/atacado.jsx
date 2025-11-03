import React from "react";
import styles from "./atacado.module.css";

export default function Atacado() {
  return (
    <div className={styles.atacadoBg}>
      <div className={styles.cardAtacado}>
        <h1 className={styles.titulo}>COMPRE NO ATACADO SMILEPET</h1>
        <h2 className={styles.subtitulo}>
          Tenha acesso a preços especiais e condições exclusivas para empresas!
        </h2>
        <p className={styles.info}>
          Somente pessoas jurídicas com CNPJ podem comprar por atacado.
          <br />
          Cadastre sua empresa e aproveite os benefícios de ser um parceiro
          SmilePet.
        </p>
        <div className={styles.botoes}>
          <button
            className={styles.btnLaranja}
            onClick={() => (window.location.href = "/loginatacado")}
          >
            Tenho cadastro
          </button>
          <button
            className={styles.btnAzul}
            onClick={() => (window.location.href = "/cadastroatacado")}
          >
            Quero me Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

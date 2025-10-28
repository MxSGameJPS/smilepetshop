import React from "react";
import styles from "./contato.module.css";

export default function Contato() {
  return (
    <section className={styles.contatoSection}>
      <div className={styles.headerArea}>
        <h1 className={styles.title}>
          Contate-nos <span className={styles.titleHighlight}>!</span>
        </h1>
        <p className={styles.subtitle}>
          Adoraríamos ouvir de você – por favor, use o formulário para nos enviar sua
          mensagem ou ideias. 
        </p>
        <div className={styles.infoRow}>
          <div className={styles.infoCol}>
            <span>
              SmilePetShop           
            </span>
          </div>
          <div className={styles.infoCol}>
            <span>
              Ligue para nós: (21) 97666-3909
              <br />
              Email:
              <br />
              contato@smilepet.com.br
            </span>
          </div>
        </div>
        
      </div>
      <div className={styles.formArea}>
        <div className={styles.formText}>
          <h2>
            Tem alguma dúvida ou comentário?
            <br />
            Use o formulário abaixo para nos enviar uma mensagem.
          </h2>
          <div className={styles.arrow}></div>
        </div>
        <form className={styles.form}>
          <input type="text" placeholder="Seu nome" className={styles.input} />
          <input
            type="email"
            placeholder="Seu email"
            className={styles.input}
          />
          <input type="tel" placeholder="Seu telefone" className={styles.input} />
          <textarea
            placeholder="Seu comentário"
            className={styles.textarea}
          ></textarea>
          <button type="submit" className={styles.submitBtn}>
            Enviar Mensagem
          </button>
        </form>
      </div>
    </section>
  );
}

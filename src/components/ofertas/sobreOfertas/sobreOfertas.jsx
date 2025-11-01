import React from "react";
import styles from "./sobreOfertas.module.css";

export default function SobreOfertas() {
  return (
    <section className={styles.container}>
      <div className={styles.inner}>
        <h2 className={styles.pageTitle}>
          Black Friday Smile Pet! 2025: 
          <br />
          Seu Pet vai amar
        </h2>
        <p className={styles.pageSubtitle}>
          As melhores ofertas do ano estão chegando com tudo
        </p>

        <div className={styles.cards}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>O que é a Black Friday?</h3>
            <p className={styles.cardText}>
              A Black Friday é um evento que acontece todos os anos, na última
              sexta-feira de novembro, com ofertas especiais. E na Smile Pet!,
              você garante os melhores itens com preços incríveis.
            </p>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>As maiores ofertas do ano</h3>
            <p className={styles.cardText}>
              São descontos especiais em Rações, Petiscos, Tapetes higiênicos e muito mais.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

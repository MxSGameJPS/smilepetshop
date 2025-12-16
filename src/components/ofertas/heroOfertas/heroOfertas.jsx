import React from "react";
import styles from "./heroOfertas.module.css";

export default function HeroOfertas() {
  const scrollToProdutos = () => {
    const el = document.getElementById("produtos-ofertas");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section
      className={styles.hero}
      onClick={scrollToProdutos}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") scrollToProdutos();
      }}
      tabIndex={0}
      style={{ cursor: "pointer" }}
    >
      <video
        className={styles.bgVideo}
        src="/Video/natal.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={styles.inner}></div>
    </section>
  );
}

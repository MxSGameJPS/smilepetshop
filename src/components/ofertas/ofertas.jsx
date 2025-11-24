import React from "react";
import styles from "./oferta.module.css";
import HeaderOfertas from "./headerOfertas/headerOfertas";
import HeroOfertas from "./heroOfertas/heroOfertas";
import SobreOfertas from "./sobreOfertas/sobreOfertas";
import ProdutosOfertas from "./produtos/produtosOfertas";

export default function Ofertas() {
  return (
    <div className={styles.page}>
      <HeaderOfertas />
      <main className={styles.content}>
        <HeroOfertas />
        {/* <SobreOfertas /> */}
        <div id="produtos-ofertas" className={styles.produtosContainer}>
          <ProdutosOfertas />
        </div>

        {/* restante da página de ofertas pode ser implementado aqui */}
      </main>
    </div>
  );
}

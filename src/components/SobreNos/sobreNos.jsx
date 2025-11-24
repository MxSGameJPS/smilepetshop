import React from "react";
import styles from "./sobreNos.module.css";

export default function SobreNos() {
  return (
    <div className={styles.sobreNosContainer}>
      <h1>QUEM SOMOS?</h1>
      <p>
        A Smile Pet é uma loja virtual especializada na venda de rações e
        produtos para animais de estimação, oferecendo apenas marcas confiáveis,
        originais e reconhecidas no mercado nacional. Nosso diferencial está em
        unir preço competitivo, qualidade garantida e atendimento responsável,
        com uma base de produtos com valores acessíveis sem abrir mão da
        segurança e da procedência.
      </p>
      <p>
        Com forte atuação nos principais marketplaces, como Mercado Livre,
        Amazon e Shopee, construímos uma trajetória sólida, com alto volume de
        vendas, reputação elevada e reconhecimento por parte dos consumidores.
        Essa experiência nos permitiu aprimorar nossa logística, atendimento e
        cuidado em cada etapa da compra, trazendo toda essa eficiência agora
        também para o nosso site oficial.
      </p>
      <p>
        Mais do que um pet shop online, a Smile Pet representa o vínculo entre
        tutor e animal. Nosso trabalho é proporcionar praticidade e confiança
        para quem compra e bem-estar para quem recebe, garantindo nutrição,
        saúde e satisfação para os pets de todo o Brasil. Trabalhamos para que
        cada cliente tenha uma experiência segura, clara e positiva, sempre com
        foco em entregar o melhor custo-benefício do mercado.
      </p>
    </div>
  );
}

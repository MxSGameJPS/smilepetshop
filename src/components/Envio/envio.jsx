import React from "react";
import styles from "./envio.module.css";

export default function Envio() {
  return (
    <section className={styles.envioSection}>
      <h1 className={styles.title}>
        Envio <span className={styles.titleHighlight}>!</span>
      </h1>
      <div className={styles.block}>
        <h2 className={styles.heading}>Entrega padrão</h2>
        <p className={styles.text}>
          Aguarde aproximadamente 7 a 10 dias úteis para a entrega do seu
          pedido, exceto feriados. Pedidos personalizados ou sob medida exigem
          um prazo adicional. Assim que seu pedido for processado, você receberá
          seu número de rastreamento.
          <br />
        </p>
      </div>
      <hr className={styles.divider} />
      <div className={styles.block}>
        <h2 className={styles.heading}>Custo</h2>
        <p className={styles.text}>
          O valor exato do frete será calculado na finalização da compra com
          base no valor total e no peso do seu pedido, sem impostos. Taxas
          adicionais podem ser aplicadas para itens de grandes dimensões e áreas
          remotas.
          <br />
          Opções de entrega expressa e expressa estão disponíveis.
        </p>
      </div>
    </section>
  );
}

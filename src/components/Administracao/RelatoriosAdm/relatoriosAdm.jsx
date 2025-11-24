import React from "react";
import styles from "./relatoriosAdm.module.css";
import { useNavigate } from "react-router-dom";

export default function RelatoriosAdm() {
  const navigate = useNavigate();

  return (
    <section className={styles.wrap}>
      <h2>Relatórios</h2>
      <p className={styles.intro}>
        Relatórios administrativos — exporte e analise vendas, clientes e
        produtos.
      </p>

      <div className={styles.grid}>
        <div
          className={styles.card}
          onClick={() => navigate("/adm/relatorios/vendas")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.label}>Relatório de Vendas</div>
          <div className={styles.desc}>
            Exportar vendas por período, status e método de entrega.
          </div>
        </div>

        

        <div
          className={styles.card}
          onClick={() => navigate("/adm/relatorios/produtos")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.label}>Relatório de Produtos</div>
          <div className={styles.desc}>
            Produtos mais vendidos, estoque e promoções.
          </div>
        </div>
      </div>
    </section>
  );
}

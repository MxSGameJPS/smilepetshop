import React from "react";
import styles from "./relatoriosAdm.module.css";
import { useNavigate } from "react-router-dom";
import { FaChartLine, FaBoxOpen } from "react-icons/fa";

export default function RelatoriosAdm() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Relatórios</h2>
      </div>

      <p className={styles.intro}>
        Bem-vindo à área de relatórios. Aqui você pode extrair análises
        detalhadas sobre o desempenho da sua loja.
      </p>

      <div className={styles.grid}>
        <div
          className={styles.menuCard}
          onClick={() => navigate("/adm/relatorios/vendas")}
          role="button"
          tabIndex={0}
        >
          <div style={{ marginBottom: 16, color: "#a855f7" }}>
            <FaChartLine size={32} />
          </div>
          <div className={styles.menuLabel}>Relatório de Vendas</div>
          <div className={styles.menuDesc}>
            Acompanhe o volume de vendas, faturamento total e detalhes por
            pedido. Exportável em CSV.
          </div>
        </div>

        <div
          className={styles.menuCard}
          onClick={() => navigate("/adm/relatorios/produtos")}
          role="button"
          tabIndex={0}
        >
          <div style={{ marginBottom: 16, color: "#3b82f6" }}>
            <FaBoxOpen size={32} />
          </div>
          <div className={styles.menuLabel}>Relatório de Produtos</div>
          <div className={styles.menuDesc}>
            Analise os produtos mais vendidos, quantidades saídas e popularidade
            por SKU. Exportável em CSV.
          </div>
        </div>
      </div>
    </div>
  );
}

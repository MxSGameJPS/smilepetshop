import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./admHome.module.css";

function tryParseArray(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  if (Array.isArray(respData.produtos)) return respData.produtos;
  return [];
}

async function fetchWithFallback(urls) {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json().catch(() => null);
      if (d) return d;
    } catch {
      // try next
    }
  }
  return null;
}

export default function AdmHome() {
  const [counts, setCounts] = useState({
    clients: 0,
    orders: 0,
    products: 0,
    promos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function makeClickable(handler) {
    return {
      role: "button",
      tabIndex: 0,
      onClick: handler,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") handler();
      },
      style: { cursor: "pointer" },
    };
  }

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoading(true);
      setError("");
      try {
        // clients
        const clientsData = await fetchWithFallback([
          "https://apismilepet.vercel.app/api/client",
          "https://apismilepet.vercel.app/api/clients",
        ]);
        const clientsArr = tryParseArray(clientsData);

        // products
        const productsData = await fetchWithFallback([
          "https://apismilepet.vercel.app/api/produtos",
          "https://apismilepet.vercel.app/api/products",
        ]);
        const productsArr = tryParseArray(productsData);

        // orders/pedidos
        const ordersData = await fetchWithFallback([
          "https://apismilepet.vercel.app/api/pedidos",
          "https://apismilepet.vercel.app/api/orders",
        ]);
        const ordersArr = tryParseArray(ordersData);

        const promos = productsArr.filter(
          (p) =>
            p &&
            (p.promocao ||
              p.promocao === true ||
              p.promocao === "true" ||
              p.promocao === "1" ||
              p.promocao === 1)
        ).length;

        if (mounted) {
          setCounts({
            clients: clientsArr.length,
            orders: ordersArr.length,
            products: productsArr.length,
            promos,
          });
        }
      } catch {
        if (mounted) setError("Falha ao carregar estatísticas do servidor");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={styles.wrap}>
      <h2>Painel Administrativo</h2>
      {loading ? (
        <p>Carregando métricas...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div className={styles.grid}>
          <div
            className={styles.card}
            {...makeClickable(() => navigate("/adm/clientes"))}
            aria-label={`Clientes cadastrados: ${counts.clients}`}
          >
            <div className={styles.value}>{counts.clients}</div>
            <div className={styles.label}>Clientes cadastrados</div>
          </div>

          <div
            className={styles.card}
            {...makeClickable(() => navigate("/adm/vendas"))}
            aria-label={`Vendas realizadas: ${counts.orders}`}
          >
            <div className={styles.value}>{counts.orders}</div>
            <div className={styles.label}>Vendas realizadas</div>
          </div>

          <div
            className={styles.card}
            {...makeClickable(() => navigate("/adm/produtos"))}
            aria-label={`Produtos cadastrados: ${counts.products}`}
          >
            <div className={styles.value}>{counts.products}</div>
            <div className={styles.label}>Produtos cadastrados</div>
          </div>

          <div
            className={styles.card}
            {...makeClickable(() => navigate("/adm/produtos"))}
            aria-label={`Produtos em promoção: ${counts.promos}`}
          >
            <div className={styles.value}>{counts.promos}</div>
            <div className={styles.label}>Produtos em promoção</div>
          </div>

          <div
            className={styles.card}
            {...makeClickable(() => navigate("/adm/relatorios"))}
            aria-label={`Relatórios`}
          >
            <div className={styles.value}>—</div>
            <div className={styles.label}>Relatórios</div>
          </div>
        </div>
      )}
    </section>
  );
}

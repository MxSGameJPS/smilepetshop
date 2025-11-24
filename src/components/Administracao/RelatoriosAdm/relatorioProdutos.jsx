import React, { useEffect, useState } from "react";
import styles from "./relatoriosAdm.module.css";

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

function tryParseOrders(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  return [];
}

export default function RelatorioProdutos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchWithFallback([
          "https://apismilepet.vercel.app/api/pedidos",
          "https://apismilepet.vercel.app/api/orders",
        ]);
        const orders = tryParseOrders(data) || [];

        const map = new Map();

        orders.forEach((o) => {
          const items =
            o.items_data || o.Items_data || o.itens || o.items || [];
          if (!Array.isArray(items)) return;
          items.forEach((it) => {
            const sku =
              it.sku ||
              it.SKU ||
              it.codigo ||
              it.codigo_produto ||
              it.codigo_sku ||
              it.id ||
              "-";
            const name =
              it.nome || it.produto_nome || it.name || it.title || "Produto";
            const qty =
              Number(it.quantidade || it.qty || it.quantity || it.quant || 0) ||
              0;
            const key = sku || name;
            if (!map.has(key)) map.set(key, { sku, name, qty: 0 });
            const cur = map.get(key);
            cur.qty += qty;
          });
        });

        const aggregated = Array.from(map.values()).sort(
          (a, b) => b.qty - a.qty
        );
        if (mounted) setRows(aggregated);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Falha ao carregar dados de pedidos");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  function exportCSV() {
    const headers = ["SKU", "Quantidade", "Nome do produto"];
    const csv = [headers, ...rows.map((r) => [r.sku, r.qty, r.name])]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_produtos_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading)
    return (
      <div className={styles.loading}>
        Carregando relatório de produtos vendidos...
      </div>
    );
  if (error) return <div className={styles.error}>{error}</div>;

  const totalUnits = rows.reduce((acc, r) => acc + (r.qty || 0), 0);

  return (
    <section className={styles.wrap}>
      <h2>Relatório de Produtos Vendidos</h2>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <strong>Produtos distintos:</strong> {rows.length}
          <br />
          <strong>Unidades vendidas:</strong> {totalUnits}
        </div>
        <div>
          <button className={styles.btn} onClick={exportCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Quantidade</th>
            <th>Nome do produto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.sku}</td>
              <td>{r.qty}</td>
              <td>{r.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

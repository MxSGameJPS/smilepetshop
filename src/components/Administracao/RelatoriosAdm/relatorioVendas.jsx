import React, { useEffect, useState } from "react";
import styles from "./relatoriosAdm.module.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileCsv } from "react-icons/fa";

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

export default function RelatorioVendas() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchWithFallback([
          "https://apismilepet.vercel.app/api/orders",
          "https://apismilepet.vercel.app/api/pedidos",
        ]);
        const arr = tryParseArray(data) || [];
        if (mounted) setOrders(arr);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Falha ao carregar pedidos");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  function getInvoiceNumber(o) {
    return (
      o.nf ||
      o.nf_number ||
      o.invoice_number ||
      o.notaFiscal ||
      o.numero_nota ||
      o.nfe_id ||
      "-"
    );
  }

  function calculateTotal(order) {
    let total = 0;
    const items = order.items_data || order.Items_data;

    if (items && Array.isArray(items)) {
      total += items.reduce((acc, item) => {
        const price = Number(item.precoUnit) || 0;
        const qty = Number(item.quantidade) || 1;
        return acc + price * qty;
      }, 0);
    } else if (order.itens) {
      total += order.itens.reduce(
        (acc, item) => acc + item.quantidade * item.preco_unitario,
        0
      );
    }

    if (order.shipping_data) {
      if (order.shipping_data.cost)
        total += Number(order.shipping_data.cost) || 0;
      else if (order.shipping_data.cust)
        total += Number(order.shipping_data.cust) || 0;
      else if (order.shipping_data.price)
        total += Number(order.shipping_data.price) || 0;
    }

    if (total === 0 && order.total) return Number(order.total);
    return total;
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  }

  function exportCSV() {
    const headers = [
      "ID",
      "Data",
      "Cliente",
      "Valor",
      "Nº Nota Fiscal",
      "Status",
    ];
    const rows = orders.map((o) => {
      const id = o.id || o.order_id || "-";
      const date = o.created_at || o.date || o.data || "-";
      const name =
        (o.customer_data &&
          (o.customer_data.firstName || o.customer_data.name)) ||
        o.usuario_nome ||
        "-";
      const value = calculateTotal(o) || o.total || 0;
      const nf = getInvoiceNumber(o);
      const status = o.status || "-";
      return [id, date, name, value, nf, status];
    });

    const csvContent = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => {
            if (typeof c === "string") return `"${c.replace(/"/g, '""')}"`;
            return `"${String(c)}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_vendas_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const totalValue = orders.reduce(
    (acc, o) => acc + (calculateTotal(o) || Number(o.total) || 0),
    0
  );

  if (loading)
    return (
      <div className={styles.loading}>Carregando relatório de vendas...</div>
    );
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/adm/relatorios")}
      >
        <FaArrowLeft /> Voltar para Relatórios
      </button>

      <div className={styles.header}>
        <h2 className={styles.title}>Relatório de Vendas</h2>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.statsRow}>
            <span>
              <strong>Total:</strong> {orders.length} vendas
            </span>
            <span>
              <strong>Faturamento:</strong> {formatCurrency(totalValue)}
            </span>
          </div>
          <button className={styles.btn} onClick={exportCSV}>
            <FaFileCsv size={16} /> Exportar CSV
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Nº Nota Fiscal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={idx}>
                  <td>{o.id || o.order_id || "-"}</td>
                  <td>
                    {o.created_at
                      ? new Date(o.created_at).toLocaleDateString()
                      : o.date || "-"}
                  </td>
                  <td>
                    {(o.customer_data &&
                      (o.customer_data.firstName || o.customer_data.name)) ||
                      o.usuario_nome ||
                      "-"}
                  </td>
                  <td>{formatCurrency(calculateTotal(o) || o.total || 0)}</td>
                  <td>{getInvoiceNumber(o)}</td>
                  <td>{o.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./paginaVendas.module.css";

export default function PaginaVendas() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://apismilepet.vercel.app/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar vendas");
        return res.json();
      })
      .then((raw) => {
        // API may return either an array or a wrapper { data: [...] }
        const payload =
          raw && raw.data && Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw)
            ? raw
            : [];
        // Sort by date descending
        const sorted = payload.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar as vendas.");
        setLoading(false);
      });
  }, []);

  const groupOrdersByDate = (orders) => {
    const groups = {};
    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString("pt-BR");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });
    return groups;
  };

  const calculateTotal = (order) => {
    let total = 0;

    // Check for items_data (lowercase based on JSON) or Items_data
    const items = order.items_data || order.Items_data;

    if (items && Array.isArray(items)) {
      total += items.reduce((acc, item) => {
        const price = Number(item.precoUnit) || 0;
        const qty = Number(item.quantidade) || 1;
        return acc + price * qty;
      }, 0);
    } else if (order.itens && Array.isArray(order.itens)) {
      // Fallback to existing structure
      total += order.itens.reduce(
        (acc, item) => acc + item.quantidade * item.preco_unitario,
        0
      );
    }

    // Add shipping
    if (order.shipping_data) {
      if (order.shipping_data.cost)
        total += Number(order.shipping_data.cost) || 0;
      else if (order.shipping_data.cust)
        total += Number(order.shipping_data.cust) || 0;
      else if (order.shipping_data.price)
        total += Number(order.shipping_data.price) || 0;
    }

    // Fallback to order.total if calculation yields 0 (and total exists)
    if (total === 0 && order.total) return Number(order.total);

    return total;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getCustomerName = (order) => {
    if (order.customer_data) {
      const { nome, sobrenome } = order.customer_data;
      if (nome || sobrenome) {
        return `${nome || ""} ${sobrenome || ""}`.trim();
      }
    }
    return order.nome || "Cliente não identificado";
  };

  if (loading)
    return <div className={styles.loading}>Carregando vendas...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const groupedOrders = groupOrdersByDate(orders);

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Vendas Realizadas</h3>

      {Object.keys(groupedOrders).length === 0 ? (
        <p>Nenhuma venda encontrada.</p>
      ) : (
        Object.entries(groupedOrders).map(([date, ordersInDate]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateHeader}>{date}</div>
            <div className={styles.cardsGrid}>
              {ordersInDate.map((order) => (
                <div
                  key={order.id}
                  className={styles.card}
                  onClick={() => navigate(`${order.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.orderId}>#{order.id}</span>
                    <span className={styles.status}>
                      {order.status || "Pendente"}
                    </span>
                  </div>
                  <div className={styles.buyerName}>
                    {getCustomerName(order)}
                  </div>
                  <div className={styles.totalValue}>
                    {formatCurrency(calculateTotal(order))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

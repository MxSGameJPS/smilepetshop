import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./vendaDetalhes.module.css";
import { TiArrowBack } from "react-icons/ti";

export default function VendaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`https://apismilepet.vercel.app/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar detalhes da venda");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar os detalhes da venda.");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className={styles.loading}>Carregando detalhes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return <div className={styles.error}>Venda não encontrada.</div>;

  const calculateTotal = (order) => {
    let total = 0;
    const items = order.items_data || order.Items_data;
    
    if (items && Array.isArray(items)) {
      total += items.reduce((acc, item) => {
        const price = Number(item.precoUnit) || 0;
        const qty = Number(item.quantidade) || 1;
        return acc + (price * qty);
      }, 0);
    } else if (order.itens) {
       total += order.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
    }
    
    if (order.shipping_data) {
        if (order.shipping_data.cost) total += Number(order.shipping_data.cost) || 0;
        else if (order.shipping_data.cust) total += Number(order.shipping_data.cust) || 0;
        else if (order.shipping_data.price) total += Number(order.shipping_data.price) || 0;
    }

    if (total === 0 && order.total) return Number(order.total);
    return total;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getCustomerName = (order) => {
    if (order.customer_data) {
        const { firstName, lastName } = order.customer_data;
        if (firstName || lastName) {
            return `${firstName || ""} ${lastName || ""}`.trim();
        }
    }
    return order.usuario_nome || "Cliente não identificado";
  };
  
  const getCustomerEmail = (order) => {
      if (order.customer_data && order.customer_data.email) return order.customer_data.email;
      return order.usuario_email || "-";
  };

  // Determine items list to display
  const itemsToDisplay = order.items_data || order.Items_data || order.itens || [];

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate("/adm/vendas")}>
        <TiArrowBack /> Voltar
      </button>

      <div className={styles.header}>
        <h2 className={styles.title}>Venda #{order.id}</h2>
        <span className={styles.date}>{formatDate(order.created_at)}</span>
      </div>

      <div className={styles.section}>
        <h3>Dados do Cliente</h3>
        <p><strong>Nome:</strong> {getCustomerName(order)}</p>
        <p><strong>Email:</strong> {getCustomerEmail(order)}</p>
      </div>

      <div className={styles.section}>
        <h3>Itens do Pedido</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {itemsToDisplay.map((item, idx) => (
              <tr key={idx}>
                <td>{item.nome || item.produto_nome || "Produto"}</td>
                <td>{item.quantidade || 1}</td>
                <td>{formatCurrency(item.precoUnit || item.preco_unitario || 0)}</td>
                <td>{formatCurrency((item.precoUnit || item.preco_unitario || 0) * (item.quantidade || 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.totalSection}>
        <h3>Total: {formatCurrency(calculateTotal(order))}</h3>
        <p>{order.status}</p>
      </div>
    </div>
  );
}

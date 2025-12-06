import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./vendaDetalhes.module.css";
import {
  FaArrowLeft,
  FaBan,
  FaCheck,
  FaClock,
  FaBox,
  FaCreditCard,
  FaUser,
} from "react-icons/fa";

export default function VendaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetch(`https://apismilepet.vercel.app/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar detalhes da venda");
        return res.json();
      })
      .then((raw) => {
        const payload = raw && raw.data ? raw.data : raw;
        setOrder(payload);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar os detalhes da venda.");
        setLoading(false);
      });
  }, [id]);

  const handleCancelOrder = async () => {
    if (!justification.trim()) {
      alert("Por favor, informe uma justificativa.");
      return;
    }

    setCanceling(true);
    try {
      const res = await fetch(
        "https://apismilepet.vercel.app/api/orders/cancel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            justificativa: justification,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao cancelar venda");
      }

      setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
      setShowCancelModal(false);
      setJustification("");
      alert("Venda cancelada com sucesso!");
    } catch (err) {
      alert("Erro ao cancelar venda: " + err.message);
    } finally {
      setCanceling(false);
    }
  };

  const calculateTotal = (order) => {
    let total = 0;
    const items = order.items_data || order.Items_data || order.itens;

    if (items && Array.isArray(items)) {
      total += items.reduce((acc, item) => {
        const price = Number(item.precoUnit || item.preco_unitario) || 0;
        const qty = Number(item.quantidade) || 1;
        return acc + price * qty;
      }, 0);
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
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleString("pt-BR") : "-";

  const getCustomerName = (order) => {
    if (order.customer_data) {
      const { nome, sobrenome } = order.customer_data;
      if (nome || sobrenome) return `${nome || ""} ${sobrenome || ""}`.trim();
    }
    return order.nome || "Cliente não identificado";
  };

  const getCustomerEmail = (order) => {
    if (order.customer_data && order.customer_data.email)
      return order.customer_data.email;
    return order.usuario_email || "-";
  };

  const getShippingInfo = (order) => {
    const ship = order.shipping_data || order.shipping || order.freight || null;
    if (!ship) return { serviceName: "-", cost: 0 };
    const serviceName =
      ship.serviceName ||
      ship.service_name ||
      ship.nome ||
      ship.serviceId ||
      "-";
    const cost = Number(ship.cost || ship.cust || ship.price || 0) || 0;
    return { serviceName, cost };
  };

  const getPaymentMethod = (order) => {
    const candidates = [
      order.payment_method_id,
      order.payment_type_id,
      order.payment_method,
      order.payment?.method,
      order.pay_method,
      order.pagamento?.method,
      order.payments?.[0]?.method || order.payments?.[0]?.payment_method_id,
    ];
    const val = candidates.find(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (!val) return "-";

    // Simple Mapping
    const s = String(val).toLowerCase();
    if (s.includes("pix")) return "PIX";
    if (s.includes("credit") || s.includes("card")) return "Cartão de Crédito";
    if (s.includes("boleto")) return "Boleto";
    return s;
  };

  const getStatusBadge = (status) => {
    if (!status)
      return (
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          <FaClock /> Pendente
        </span>
      );
    const s = status.toLowerCase();
    if (s.includes("pago") || s.includes("approved") || s.includes("aprovado"))
      return (
        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
          <FaCheck /> Aprovado
        </span>
      );
    if (s.includes("cancel") || s.includes("refund"))
      return (
        <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>
          <FaBan /> Cancelado
        </span>
      );
    return (
      <span className={`${styles.statusBadge} ${styles.statusPending}`}>
        <FaClock /> {status}
      </span>
    );
  };

  if (loading)
    return (
      <div className={styles.container}>
        <p style={{ textAlign: "center", marginTop: 50 }}>
          Carregando detalhes...
        </p>
      </div>
    );
  if (error)
    return (
      <div className={styles.container}>
        <p style={{ textAlign: "center", marginTop: 50, color: "red" }}>
          {error}
        </p>
      </div>
    );
  if (!order)
    return (
      <div className={styles.container}>
        <p style={{ textAlign: "center", marginTop: 50 }}>
          Venda não encontrada.
        </p>
      </div>
    );

  const itemsToDisplay =
    order.items_data || order.Items_data || order.itens || [];
  const shipInfo = getShippingInfo(order);

  return (
    <div className={styles.container}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/adm/vendas")}
      >
        <FaArrowLeft /> Voltar para Vendas
      </button>

      {/* Main Order Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Venda #{order.id}</h2>
            <span className={styles.date}>
              Realizada em {formatDate(order.created_at)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {getStatusBadge(order.status)}
            {order.status !== "CANCELLED" && (
              <button
                className={styles.cancelButton}
                onClick={() => setShowCancelModal(true)}
              >
                Cancelar Venda
              </button>
            )}
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoColumn}>
            <h4>
              <FaUser style={{ marginRight: 6, verticalAlign: "middle" }} />{" "}
              Cliente
            </h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nome</span>
              <span className={styles.infoValue}>{getCustomerName(order)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>
                {getCustomerEmail(order)}
              </span>
            </div>
          </div>

          <div className={styles.infoColumn}>
            <h4>
              <FaCreditCard
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />{" "}
              Pagamento
            </h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Método</span>
              <span className={styles.infoValue}>
                {getPaymentMethod(order)}
              </span>
            </div>
            {/* Could add Payment ID or other details here */}
          </div>

          <div className={styles.infoColumn}>
            <h4>
              <FaBox style={{ marginRight: 6, verticalAlign: "middle" }} />{" "}
              Entrega
            </h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Serviço</span>
              <span className={styles.infoValue}>{shipInfo.serviceName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Custo</span>
              <span className={styles.infoValue}>
                {formatCurrency(shipInfo.cost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ marginBottom: "16px" }}>
          Itens do Pedido
        </h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th style={{ textAlign: "right" }}>Preço Unit.</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {itemsToDisplay.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.nome || item.produto_nome || "Produto"}</td>
                  <td>{item.quantidade || 1}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(item.precoUnit || item.preco_unitario || 0)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(
                      (item.precoUnit || item.preco_unitario || 0) *
                        (item.quantidade || 1)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.totalSection}>
          <span className={styles.totalLabel}>TOTAL DO PEDIDO</span>
          <span className={styles.totalValue}>
            {formatCurrency(calculateTotal(order))}
          </span>
        </div>
      </div>

      {/* Modal */}
      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Cancelar Venda #{order.id}</h3>
            <p style={{ color: "#666", marginBottom: 10 }}>
              Por favor, informe o motivo do cancelamento:
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Ex: Cliente solicitou cancelamento..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.btnModalClose}
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
              >
                Fechar
              </button>
              <button
                className={styles.btnModalConfirm}
                onClick={handleCancelOrder}
                disabled={canceling}
              >
                {canceling ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

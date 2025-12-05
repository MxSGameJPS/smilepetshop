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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [canceling, setCanceling] = useState(false);

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
          headers: {
            "Content-Type": "application/json",
          },
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
      console.error(err);
      alert("Erro ao cancelar venda: " + err.message);
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    fetch(`https://apismilepet.vercel.app/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar detalhes da venda");
        return res.json();
      })
      .then((raw) => {
        // API can return the order directly or wrapped as { data: { ... } }
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

  if (loading)
    return <div className={styles.loading}>Carregando detalhes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return <div className={styles.error}>Venda não encontrada.</div>;

  const calculateTotal = (order) => {
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
      const { nome, sobrenome } = order.customer_data;
      if (nome || sobrenome) {
        return `${nome || ""} ${sobrenome || ""}`.trim();
      }
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
      order.payment && order.payment.method,
      order.pay_method,
      order.pagamento && order.pagamento.method,
      order.payments &&
        order.payments[0] &&
        (order.payments[0].method || order.payments[0].payment_method_id),
    ];
    const val = candidates.find(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (!val) return "-";
    const key = String(val).toLowerCase();
    const map = {
      account_money: "Conta (account_money)",
      pix: "PIX",
      bank_transfer: "Transferência bancária",
      credit_card: "Cartão de crédito",
      boleto: "Boleto",
    };
    return (
      map[key] ||
      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const getPaymentStatus = (order) => {
    const candidates = [
      order.payment_status,
      order.payment && order.payment.status,
      order.payment_status_detail,
      order.status_pagamento || order.status,
      order.pagamento && order.pagamento.status,
      order.payments && order.payments[0] && order.payments[0].status,
    ];
    const val = candidates.find(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (!val) return "-";
    const s = String(val).toLowerCase();
    if (s.includes("paid") || s.includes("pago") || s.includes("conclu"))
      return "Pago";
    if (s.includes("pend") || s.includes("pending") || s.includes("aguard"))
      return "Pendente";
    if (
      s.includes("cancel") ||
      s.includes("canceled") ||
      s.includes("cancelado")
    )
      return "Cancelado";
    if (s.includes("refun") || s.includes("devol")) return "Reembolsado";
    return String(val);
  };

  // Determine items list to display
  const itemsToDisplay =
    order.items_data || order.Items_data || order.itens || [];

  return (
    <div className={styles.container}>
      <h3>Detalhes da venda {getCustomerName(order)}</h3>
      <button
        className={styles.backButton}
        onClick={() => navigate("/adm/vendas")}
      >
        <TiArrowBack /> Voltar
      </button>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Venda #{order.id}</h2>
          <span className={styles.date}>{formatDate(order.created_at)}</span>
        </div>

        <div className={styles.headerActions}>
          {order.status !== "CANCELLED" && (
            <button
              className={styles.cancelButton}
              onClick={() => setShowCancelModal(true)}
            >
              Cancelar Venda
            </button>
          )}

          {/* aplicar classe de cor conforme status */}
          {(() => {
            const s = (order.status || "").toString().toLowerCase();
            let statusClass = styles.status;
            if (
              s.includes("cancel") ||
              s.includes("cancelado") ||
              s.includes("canceled")
            ) {
              statusClass = `${styles.status} ${styles.statusCancelado}`;
            } else if (
              s.includes("pend") ||
              s.includes("pendente") ||
              s.includes("pending")
            ) {
              statusClass = `${styles.status} ${styles.statusPendente}`;
            } else if (
              s.includes("paid") ||
              s.includes("pago") ||
              s.includes("conclu")
            ) {
              statusClass = `${styles.status} ${styles.statusPago}`;
            }
            return <p className={statusClass}>{order.status}</p>;
          })()}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Dados do Cliente</h3>
        <div className={styles.separador}></div>
        <p>
          <strong>Nome:</strong> {getCustomerName(order)}
        </p>
        <p>
          <strong>Email:</strong> {getCustomerEmail(order)}
        </p>
      </div>

      <div className={styles.section}>
        <h3>Entrega</h3>
        <div className={styles.separador}></div>
        {(() => {
          const ship = getShippingInfo(order);
          return (
            <>
              <p>
                <strong>Tipo de entrega:</strong> {ship.serviceName || "-"}
              </p>
              <p>
                <strong>Custo de entrega:</strong>{" "}
                {formatCurrency(ship.cost || 0)}
              </p>
            </>
          );
        })()}
      </div>

      <div className={styles.section}>
        <h3>Pagamento</h3>
        <div className={styles.separador}></div>
        <p>
          <strong>Método:</strong> {getPaymentMethod(order)}
        </p>
        <p>
          <strong>Status do pagamento:</strong> {getPaymentStatus(order)}
        </p>
      </div>

      <div className={styles.section}>
        <h3>Itens do Pedido</h3>
        <div className={styles.separador}></div>
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
                <td>
                  {formatCurrency(item.precoUnit || item.preco_unitario || 0)}
                </td>
                <td>
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
        <h3>Total: {formatCurrency(calculateTotal(order))}</h3>
      </div>

      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Cancelar Venda</h3>
            <p>Por favor, informe o motivo do cancelamento:</p>
            <textarea
              className={styles.textarea}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Cliente desistiu da compra..."
              rows={4}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.closeButton}
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
              >
                Fechar
              </button>
              <button
                className={styles.confirmButton}
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

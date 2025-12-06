import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./paginaVendas.module.css";
import { FaSearch, FaEye } from "react-icons/fa";

export default function PaginaVendas() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://apismilepet.vercel.app/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar vendas");
        return res.json();
      })
      .then((raw) => {
        const payload =
          raw && raw.data && Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw)
            ? raw
            : [];
        // Sort by newest
        const sorted = payload.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sorted);
        setFilteredOrders(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = orders.filter((o) => {
      const id = String(o.id || o._id);
      const name = getCustomerName(o).toLowerCase();
      return id.includes(lower) || name.includes(lower);
    });
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, orders]);

  const getCustomerName = (order) => {
    if (order.customer_data) {
      const { nome, sobrenome } = order.customer_data;
      if (nome || sobrenome) {
        return `${nome || ""} ${sobrenome || ""}`.trim();
      }
    }
    return order.nome || "Cliente desconhecido";
  };

  const calculateTotal = (order) => {
    let total = 0;
    const items = order.items_data || order.Items_data;

    if (items && Array.isArray(items)) {
      total += items.reduce((acc, item) => {
        const price = Number(item.precoUnit) || 0;
        const qty = Number(item.quantidade) || 1;
        return acc + price * qty;
      }, 0);
    } else if (order.itens && Array.isArray(order.itens)) {
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

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const getStatusBadge = (status) => {
    if (!status)
      return (
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          Pendente
        </span>
      );
    const s = status.toLowerCase();
    if (s.includes("pago") || s.includes("approved") || s.includes("aprovado"))
      return (
        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
          Aprovado
        </span>
      );
    if (s.includes("cancel") || s.includes("refund"))
      return (
        <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>
          Cancelado
        </span>
      );
    return (
      <span className={`${styles.statusBadge} ${styles.statusPending}`}>
        {status}
      </span>
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vendas Realizadas</h2>
        <div className={styles.searchBar}>
          <FaSearch color="#9ca3af" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por ID ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Lista de Vendas</div>
          <div className={styles.paginationInfo}>
            {filteredOrders.length > 0
              ? `${indexOfFirstItem + 1} - ${Math.min(
                  indexOfLastItem,
                  filteredOrders.length
                )} de ${filteredOrders.length}`
              : "0 de 0"}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.loading}>
                    Carregando vendas...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.loading}>
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                currentItems.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <strong>{getCustomerName(order)}</strong>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{formatCurrency(calculateTotal(order))}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          title="Ver Detalhes"
                          onClick={() => navigate(`${order.id}`)}
                        >
                          <FaEye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                border: "1px solid #eee",
                background: "white",
                borderRadius: "4px",
              }}
            >
              &lt;
            </button>
            <span style={{ alignSelf: "center", fontSize: "14px" }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                border: "1px solid #eee",
                background: "white",
                borderRadius: "4px",
              }}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

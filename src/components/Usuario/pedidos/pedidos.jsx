import React, { useEffect, useState } from "react";
import styles from "./pedidos.module.css";
import { getUser } from "../../../lib/auth";
import { Link } from "react-router-dom";

function normalizeStatus(s) {
  if (!s) return "Pendente";
  const v = String(s).toLowerCase();
  if (v.includes("cancel") || v.includes("canceled") || v.includes("cancelado"))
    return "Cancelado";
  if (v.includes("deliv") || v.includes("entreg") || v.includes("delivered"))
    return "Entregue";
  if (v.includes("pend") || v.includes("pending")) return "Pendente";
  return s;
}

export default function MeusPedidos() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const saved = getUser();
      const email = saved?.email ?? saved?.data?.email ?? null;

      // Fetch all orders and filter by the logged user's email.
      // The endpoint `/api/orders` returns the list of orders; we must
      // compare the `email` property of each order with the logged user's email.
      let found = null;
      if (!email) {
        // If we don't have an email for the logged user, don't fetch public orders.
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("https://apismilepet.vercel.app/api/orders");
        if (!res.ok) {
          setOrders([]);
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => null);
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.orders)
          ? data.orders
          : null;
        if (!arr) {
          setOrders([]);
          setLoading(false);
          return;
        }
        found = { url: "https://apismilepet.vercel.app/api/orders", arr };
      } catch (err) {
        console.debug("Erro ao buscar pedidos em /api/orders:", err);
        setOrders([]);
        setLoading(false);
        return;
      }

      // if we have a logged user id or email, prefer to filter server results
      // note: we fetch /api/orders and filter by the `email` property
      // of each order, so the previous generic matchOrder helper is
      // no longer necessary.

      // apply client-side filtering by email (the orders endpoint returns all orders)
      let filtered = [];
      if (email) {
        const target = String(email).toLowerCase();
        filtered = found.arr.filter(
          (o) => String(o.email || "").toLowerCase() === target
        );
      }

      // normalize order items
      const list = filtered.map((o) => ({
        id: o.id ?? o._id ?? o.orderId ?? o.numero ?? o.numero_pedido ?? null,
        date: o.created_at ?? o.createdAt ?? o.date ?? o.data_criacao ?? null,
        status: normalizeStatus(o.status ?? o.estado ?? o.situacao),
        total: o.total ?? o.valor ?? o.amount ?? null,
        raw: o,
      }));

      setOrders(list);
      setLoading(false);
    }

    load();
  }, []);

  if (loading)
    return <div className={styles.center}>Carregando pedidos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!orders || orders.length === 0)
    return (
      <div className={styles.emptyBox}>
        <h2>Ainda não foi efetuado nenhum pedido no site.</h2>
        <p>
          Quando você fizer um pedido, ele aparecerá aqui com o status de
          entrega.
        </p>
        <Link to="/" className={styles.buyNow}>
          Compre agora
        </Link>
      </div>
    );

  return (
    <div className={styles.pedidosWrap}>
      <h1>Meus Pedidos</h1>
      <ul className={styles.list}>
        {orders.map((o) => (
          <li key={o.id || Math.random()} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <strong>Pedido:</strong> {o.id || "—"}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className={styles.status}>{o.status}</div>
                {/* Mostrar botão de cancelar quando não estiver cancelado ou entregue */}
                {o.status !== "Cancelado" && o.status !== "Entregue" && (
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={async () => {
                      // Confirmar ação irreversível
                      const ok = window.confirm(
                        "Atenção: Esta ação é irreversível. Se cancelar este pedido você terá que fazer um novo pedido caso precise do produto. Deseja continuar?"
                      );
                      if (!ok) return;

                      // pedir justificativa
                      const justificativa = window.prompt(
                        "Por favor, informe a justificativa para o cancelamento deste pedido:"
                      );
                      if (justificativa === null) return; // usuário cancelou o prompt
                      if (!justificativa.trim()) {
                        alert(
                          "Justificativa obrigatória para cancelar o pedido."
                        );
                        return;
                      }

                      try {
                        setCancelling(o.id);
                        const res = await fetch(
                          "https://apismilepet.vercel.app/api/orders/cancel",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              orderId: o.id,
                              justificativa: justificativa.trim(),
                            }),
                          }
                        );
                        if (!res.ok) {
                          const t = await res.text().catch(() => null);
                          throw new Error(
                            `Falha ao cancelar pedido: ${res.status} ${t || ""}`
                          );
                        }
                        // marcar localmente como cancelado para feedback imediato
                        setOrders((prev) =>
                          (prev || []).map((it) =>
                            it.id || it.id === o.id
                              ? { ...it, status: "Cancelado" }
                              : it
                          )
                        );
                        alert("Pedido cancelado com sucesso.");
                      } catch (err) {
                        console.error("Erro ao cancelar pedido:", err);
                        alert(
                          "Não foi possível cancelar o pedido. Tente novamente mais tarde."
                        );
                      } finally {
                        setCancelling(null);
                      }
                    }}
                    disabled={cancelling === o.id}
                  >
                    {cancelling === o.id ? "Cancelando..." : "Cancelar pedido"}
                  </button>
                )}
              </div>
            </div>
            <div className={styles.orderBody}>
              <div>
                <small>Data:</small>
                <div>{o.date ? new Date(o.date).toLocaleString() : "—"}</div>
              </div>
              <div>
                <small>Total:</small>
                <div>{o.total ?? "—"}</div>
              </div>
            </div>
            <details className={styles.details}>
              <summary>Ver detalhes</summary>
              <pre className={styles.pre}>{JSON.stringify(o.raw, null, 2)}</pre>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

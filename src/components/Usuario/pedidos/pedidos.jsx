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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const saved = getUser();
      const id =
        saved?.id ??
        saved?._id ??
        saved?.data?.id ??
        saved?.clienteId ??
        saved?.clientId ??
        null;
      const email = saved?.email ?? saved?.data?.email ?? null;

      // candidate endpoints - try in order until one returns a usable result
      const candidates = [];
      if (id) {
        candidates.push(
          `https://apismilepet.vercel.app/api/client/${id}/orders`,
          `https://apismilepet.vercel.app/api/client/${id}/pedidos`,
          `https://apismilepet.vercel.app/api/orders?clientId=${id}`,
          `https://apismilepet.vercel.app/api/pedidos?clientId=${id}`,
          `https://apismilepet.vercel.app/api/pedidos?clienteId=${id}`
        );
      }
      if (email) {
        candidates.push(
          `https://apismilepet.vercel.app/api/pedidos?email=${encodeURIComponent(
            email
          )}`,
          `https://apismilepet.vercel.app/api/orders?email=${encodeURIComponent(
            email
          )}`
        );
      }
      // generic fallbacks
      candidates.push(
        `https://apismilepet.vercel.app/api/pedidos`,
        `https://apismilepet.vercel.app/api/orders`
      );

      let found = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json().catch(() => null);
          // try common shapes: array at root, data array, pedidos, orders
          const arr = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.pedidos)
            ? data.pedidos
            : Array.isArray(data?.orders)
            ? data.orders
            : null;
          if (arr) {
            found = { url, arr };
            break;
          }
        } catch {
          // ignore and try next
        }
      }

      if (!found) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // if we have a logged user id or email, prefer to filter server results
      const matchOrder = (o, userId, userEmail) => {
        if (!o) return false;
        // helper to flatten candidate id/email values
        const candidates = [];
        const push = (v) => {
          if (v === null || v === undefined) return;
          if (typeof v === "string" && v.trim() !== "") candidates.push(v);
          else if (typeof v === "number") candidates.push(String(v));
        };

        // common id fields
        [
          o.id,
          o._id,
          o.clientId,
          o.clienteId,
          o.cliente?.id,
          o.cliente?._id,
          o.customerId,
          o.customer?._id,
          o.customer?.id,
          o.user?._id,
          o.user?.id,
          o.buyerId,
        ].forEach(push);

        // common email fields
        [
          o.email,
          o.buyer_email,
          o.customer?.email,
          o.cliente?.email,
          o.email_cliente,
          o.contact_email,
          o.buyer?.email,
        ].forEach(push);

        const norm = candidates.map((c) => String(c).toLowerCase());
        if (userId) {
          const uid = String(userId).toLowerCase();
          if (norm.includes(uid)) return true;
        }
        if (userEmail) {
          const uemail = String(userEmail).toLowerCase();
          if (norm.includes(uemail)) return true;
        }
        return false;
      };

      // apply client-side filtering when possible
      let filtered = found.arr;
      if (id || email) {
        const f = found.arr.filter((o) => matchOrder(o, id, email));
        // if we found matches, use them; otherwise keep empty (user likely has no orders)
        filtered = f;
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
              <div className={styles.status}>{o.status}</div>
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

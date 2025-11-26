import React, { useEffect } from "react";
import styles from "./paginaDeObrigado.module.css";
import { getUser } from "../../lib/auth";
import { trackEvent } from "../../lib/meta";
import { clearCart } from "../../lib/cart";

export default function PaginaDeObrigado() {
  const user = typeof window !== "undefined" ? getUser() : null;
  const email = user?.email || user?.login || "";

  useEffect(() => {
    // Check for pending purchase event saved from checkout
    try {
      const raw = localStorage.getItem("smilepet_last_order");
      if (raw) {
        const data = JSON.parse(raw);
        // Fire Purchase event
        trackEvent("Purchase", {
          content_ids: data.content_ids || [],
          content_type: "product",
          value: Number(data.value) || 0,
          currency: "BRL",
          num_items: Number(data.num_items) || 1,
        });
        // Clear the pending event so we don't fire it again on refresh
        localStorage.removeItem("smilepet_last_order");
        // Also clear the cart as the purchase is complete
        clearCart();
      }
    } catch (err) {
      console.error("Error tracking purchase:", err);
    }
  }, []);

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Obrigado pela sua compra!</h1>
        <p className={styles.text}>
          Recebemos seu pedido e o pagamento está sendo processado.
        </p>
        <p className={styles.text}>
          Enviaremos a confirmação para
          <span className={styles.email}>
            {" "}
            {email || "o e-mail cadastrado"}
          </span>
          . Aguarde o e-mail de confirmação.
        </p>
        <p className={styles.small}>
          Caso não receba em alguns minutos, verifique a caixa de spam.
        </p>
      </div>
    </section>
  );
}

import React, { useState } from "react";
import styles from "./pedido.module.css";
import { getCart } from "../../lib/cart";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../../lib/cart";

const moeda = (v) => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v) || 0);
  } catch {
    return String(v);
  }
};

export default function Pedido() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("");
  const cart = getCart();
  const subtotal = cart.reduce(
    (s, it) => s + Number(it.precoUnit || 0) * Number(it.quantidade || 0),
    0
  );
  const shipping = Number(localStorage.getItem("smilepet_shipping") || 0);
  const total = subtotal + (Number(shipping) || 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h1 className={styles.title}>Seu pedido</h1>

          <div className={styles.itemsList}>
            {cart.length === 0 && (
              <div className={styles.empty}>Nenhum item no pedido.</div>
            )}
            {cart.map((it, idx) => (
              <div
                key={`${it.id}-${it.variante}-${idx}`}
                className={styles.itemRow}
              >
                <div className={styles.itemMain}>
                  <img
                    src={it.imagem_url || "/imgCards/RacaoSeca.png"}
                    alt={it.nome}
                    className={styles.thumb}
                  />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {it.nome}
                      {it.variante ? ` - ${it.variante}` : ""}
                    </div>
                    <div className={styles.itemQty}>
                      {it.quantidade} x {moeda(it.precoUnit)}
                    </div>
                  </div>
                </div>
                <div className={styles.itemTotal}>
                  {moeda(
                    Number(it.precoUnit || 0) * Number(it.quantidade || 0)
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.rowBetween}>
              <span>Subtotal</span>
              <span className={styles.bold}>{moeda(subtotal)}</span>
            </div>
            <div className={styles.rowBetween}>
              <span>Frete</span>
              <span>{moeda(shipping)}</span>
            </div>
            <hr />
            <div className={styles.rowBetweenTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{moeda(total)}</span>
            </div>
          </div>
        </div>

        <aside className={styles.right}>
          <div className={styles.paymentBox}>
            <h3>Formas de Pagamento</h3>

            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cartão (Débito/Crédito)
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === "pix"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Pix
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  value="boleto"
                  checked={paymentMethod === "boleto"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Boleto (à vista)
              </label>
            </div>

            <p>
              Faça o pagamento conforme a opção escolhida. Utilize o número do
              seu pedido como referência quando necessário.
            </p>

            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={() => {
                  if (!paymentMethod) {
                    alert("Escolha uma forma de pagamento.");
                    return;
                  }
                  // finalize: show congratulatory alert, clear cart and storage, navigate home
                  alert("Parabéns vc finalizou seu pedido.");
                  // disparar evento de compra para Meta Pixel (se disponível)
                  try {
                    if (
                      typeof window !== "undefined" &&
                      typeof window.fbq === "function"
                    ) {
                      // enviar valor total e moeda quando possível
                      try {
                        window.fbq("track", "Purchase", {
                          value: Number(total) || 0,
                          currency: "BRL",
                        });
                      } catch (_) {
                        // fallback: tentar sem payload
                        try {
                          window.fbq("track", "Purchase");
                        } catch (_) {}
                      }
                    }
                  } catch (_) {
                    /* ignore */
                  }
                  try {
                    clearCart();
                    localStorage.removeItem("smilepet_shipping");
                    localStorage.removeItem("smilepet_checkout_billing");
                  } catch (err) {
                    console.warn("Erro ao limpar dados locais", err);
                  }
                  navigate("/");
                }}
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

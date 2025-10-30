import React, { useEffect, useState } from "react";
import styles from "./carrinho.module.css";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
} from "../../lib/cart";
import { useNavigate } from "react-router-dom";

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

export default function Carrinho() {
  const [cart, setCart] = useState(() => getCart());
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [cep, setCep] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMsg, setShippingMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener("smilepet_cart_update", handler);
    return () => window.removeEventListener("smilepet_cart_update", handler);
  }, []);

  const handleQtyChange = (item, value) => {
    const q = Number(value) || 0;
    updateCartItemQuantity(item.id, item.variante, q);
    setCart(getCart());
  };

  const handleRemove = (item) => {
    removeCartItem(item.id, item.variante);
    setCart(getCart());
  };

  const subtotal = cart.reduce(
    (s, it) => s + Number(it.precoUnit || 0) * Number(it.quantidade || 0),
    0
  );
  // shippingCost is determined by CEP calculation (default 0 until calculated)

  // coupon simple: SMILE10 => 10% off
  const couponDiscount = coupon === "SMILE10" ? subtotal * 0.1 : 0;
  // Total: produtos (subtotal) - cupom + frete (sem VAT)
  const total = subtotal - couponDiscount + (Number(shippingCost) || 0);

  const applyCoupon = (e) => {
    e.preventDefault();
    if (!coupon) {
      setCouponMsg("Insira um código de cupom");
      return;
    }
    if (coupon === "SMILE10") {
      setCouponMsg("Cupom aplicado: 10% off");
    } else {
      setCouponMsg("Cupom inválido");
    }
    setTimeout(() => setCouponMsg(""), 2500);
  };

  const calculateShipping = (e) => {
    e.preventDefault();
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) {
      setShippingMsg("CEP inválido. Digite 8 dígitos.");
      setTimeout(() => setShippingMsg(""), 3000);
      return;
    }
    // Simular cálculo de frete: exemplo fixo baseado no CEP
    const simulated = 12.5; // R$ 12,50 como exemplo
    setShippingCost(simulated);
    setShippingMsg(`Frete calculado: ${moeda(simulated)}`);
    setTimeout(() => setShippingMsg(""), 4000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h1 className={styles.title}>Seu carrinho</h1>

          <div className={styles.itemsList}>
            {cart.length === 0 && (
              <div className={styles.empty}>Seu carrinho está vazio.</div>
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
                    <a href={`/produtos/${it.id}`} className={styles.itemLink}>
                      {it.nome}
                      {it.variante ? ` - ${it.variante}` : ""}
                    </a>
                    <div className={styles.itemUnit}>{moeda(it.precoUnit)}</div>
                  </div>
                </div>
                <div className={styles.itemControls}>
                  <input
                    type="number"
                    min={0}
                    value={it.quantidade}
                    onChange={(e) => handleQtyChange(it, e.target.value)}
                    className={styles.qtyInput}
                    aria-label="Quantidade"
                  />
                </div>
                <div className={styles.itemTotal}>
                  <div className={styles.totalPrice}>
                    {moeda(
                      Number(it.precoUnit || 0) * Number(it.quantidade || 0)
                    )}
                  </div>
                </div>
                <button
                  className={styles.removeBtn}
                  aria-label="Remover item"
                  onClick={() => handleRemove(it)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <form className={styles.couponRow} onSubmit={applyCoupon}>
            <input
              type="text"
              placeholder="Código do cupom"
              className={styles.couponInput}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button type="submit" className={styles.couponBtn}>
              Aplicar cupom
            </button>
          </form>
          {couponMsg && <div className={styles.couponMsg}>{couponMsg}</div>}
        </div>

        <aside className={styles.right}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Total do carrinho</h2>
            <div className={styles.rowBetween}>
              <span>Subtotal</span>
              <div className={styles.colRight}>
                <div className={styles.bold}>{moeda(subtotal)}</div>
              </div>
            </div>

            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Envio</div>
              <div className={styles.cepRow}>
                <input
                  type="text"
                  placeholder="CEP (somente números)"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className={styles.cepInput}
                />
                <button className={styles.cepBtn} onClick={calculateShipping}>
                  Calcular frete
                </button>
              </div>
              {shippingMsg && (
                <div className={styles.shippingMsg}>{shippingMsg}</div>
              )}
              <div className={styles.shippingInfo}>
                As opções de envio serão atualizadas durante a finalização da
                compra.
              </div>
            </div>

            <hr className={styles.sep} />
            <div className={styles.rowBetween}>
              <span>Frete</span>
              <span>{moeda(shippingCost)}</span>
            </div>
            <hr className={styles.sep} />
            <div className={styles.rowBetweenTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{moeda(total)}</span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={() => navigate("/checkout")}
            >
              Finalizar Pedido
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import styles from "./carrinhoModal.module.css";
import {
  getCart,
  getCartCount,
  updateCartItemQuantity,
  removeCartItem,
} from "../../lib/cart";
import { useNavigate, useLocation } from "react-router-dom";

function calcSubtotal(items) {
  return items.reduce((sum, it) => {
    const q = Number(it.quantidade) || 0;
    const p = Number(it.precoUnit) || 0;
    return sum + q * p;
  }, 0);
}

export default function CarrinhoModal() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => getCart());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleUpdate(e) {
      try {
        const c = getCart();
        setItems(c);

        // Evitar abrir o modal se:
        // 1. Já estivermos na página do carrinho (/carrinho)
        // 2. O evento for apenas de atualização de frete (shipping: true)
        // 3. O evento for silencioso (silent: true)
        if (location.pathname === "/carrinho") return;
        if (e?.detail?.shipping) return;
        if (e?.detail?.silent) return;

        // open modal when cart was updated and has items
        const count = getCartCount();
        if (count > 0) setOpen(true);
      } catch {
        /* ignore */
      }
    }

    window.addEventListener("smilepet_cart_update", handleUpdate);
    // also listen to storage in case other tab changed it
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("smilepet_cart_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [location]);

  function close() {
    setOpen(false);
  }

  function goToCart() {
    setOpen(false);
    navigate("/carrinho");
  }

  function inc(item) {
    updateCartItemQuantity(
      item.id,
      item.variante,
      (Number(item.quantidade) || 0) + 1
    );
    setItems(getCart());
  }

  function dec(item) {
    const next = (Number(item.quantidade) || 0) - 1;
    updateCartItemQuantity(item.id, item.variante, next);
    setItems(getCart());
  }

  function remove(item) {
    removeCartItem(item.id, item.variante);
    setItems(getCart());
  }

  if (!open) return null;

  const subtotal = calcSubtotal(items);

  return (
    <div
      className={styles.overlay}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <img src="/noel.png" alt="" className={styles.santaClaus} />
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>Confira sua compra</div>
          <button
            className={styles.closeBtn}
            onClick={close}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>Seu carrinho está vazio.</div>
          ) : (
            items.map((it) => {
              const quantidadeNum = Number(it.quantidade) || 0;
              const precoUnitario = Number(it.precoUnit) || 0;
              const totalItem = quantidadeNum * precoUnitario;

              return (
                <div className={styles.item} key={`${it.id}-${it.variante}`}>
                  <img
                    src={it.imagem_url || ""}
                    alt={it.nome || ""}
                    className={styles.thumb}
                  />
                  <div className={styles.meta}>
                    <div className={styles.name}>{it.nome}</div>
                    <div className={styles.price}>
                      {it.precoUnit != null ? (
                        <>
                          R$ {totalItem.toFixed(2)}
                          {quantidadeNum > 1 && (
                            <span className={styles.priceDetail}>
                              {quantidadeNum} x R$ {precoUnitario.toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#333",
                      }}
                    >
                      <div className={styles.qtyControls}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dec(it)}
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <div style={{ minWidth: 28, textAlign: "center" }}>
                          {it.quantidade}
                        </div>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => inc(it)}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <button
                        style={{
                          marginLeft: 8,
                          background: "transparent",
                          border: 0,
                          color: "#c00",
                          cursor: "pointer",
                        }}
                        onClick={() => remove(it)}
                        aria-label="Remover"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.subtotalRow}>
          <div>Subtotal</div>
          <div style={{ fontWeight: 700 }}>R$ {subtotal.toFixed(2)}</div>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={goToCart}>
            Ir para sacola
          </button>
          <button className={styles.secondaryBtn} onClick={close}>
            Voltar
          </button>
        </div>
      </aside>
    </div>
  );
}

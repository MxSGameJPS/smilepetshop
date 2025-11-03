import React, { useEffect, useMemo, useState } from "react";
import styles from "./cardOfertas.module.css";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";
import { PiDog } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

export default function CardOfertas({ product }) {
  const { id, nome, imagem_url, preco } = product || {};
  const navigate = useNavigate();

  // default promo end: 29d 12:50:50 from now
  const promoDurationMs = useMemo(() => {
    const days = 29;
    const hours = 12;
    const mins = 50;
    const secs = 50;
    return ((days * 24 + hours) * 60 * 60 + mins * 60 + secs) * 1000;
  }, []);

  const promoEnd = useMemo(
    () => Date.now() + promoDurationMs,
    [promoDurationMs]
  );
  const [remaining, setRemaining] = useState(promoEnd - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, promoEnd - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [promoEnd]);

  function formatRemaining(ms) {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(days).padStart(2, "0")}D ${String(hours).padStart(
      2,
      "0"
    )} : ${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
  }

  function goToProduct() {
    if (!id) return;
    navigate(`/produtos/${id}`);
  }

  function handleButtonClick(e) {
    e.stopPropagation();
    goToProduct();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToProduct();
    }
  }

  return (
    <div
      className={styles.card}
      onClick={goToProduct}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${nome}`}
    >
      <div className={styles.topTag}>SMILEFRIDAY</div>

      <div className={styles.hero}>
        <img
          src={imagem_url || "/imgCards/RacaoSeca.png"}
          alt={nome}
          className={styles.image}
          onError={(e) => (e.target.src = "/imgCards/RacaoSeca.png")}
        />
      </div>

      <div className={styles.body}>
        <h3 className={styles.name} title={nome}>
          {" "}
          {nome}{" "}
        </h3>
        <div className={styles.priceRow}>
          <div className={styles.price}>
            R${" "}
            {preco != null ? Number(preco).toFixed(2).replace(".", ",") : "--"}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.promoButton}
          onClick={handleButtonClick}
          aria-label={`Comprar ${nome}`}
        >
          <div className={styles.defaultState}>
            <div className={styles.iconWrapper} aria-hidden>
              <PiDog />
            </div>
            <div className={styles.timerWrapper}>
              <div className={styles.timerLabel}>TERMINA EM:</div>
              <div className={styles.countdown}>
                {formatRemaining(remaining)}
              </div>
            </div>
          </div>

          <div className={styles.hoverState} aria-hidden>
            <MdOutlineShoppingCartCheckout className={styles.hoverIcon} />
            <span className={styles.hoverText}>COMPRAR</span>
          </div>
        </button>
      </div>
    </div>
  );
}

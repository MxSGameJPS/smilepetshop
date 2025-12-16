import React, { useState, useRef, useEffect } from "react";
import styles from "./productCard.module.css";
import { FaPlus, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProductCard({
  image,
  title,
  priceOld,
  price,
  priceSubscriber,
  onAdd,
  productId,
  promocao,
}) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  function handleOpen() {
    if (productId) navigate(`/produtos/${productId}`);
  }

  return (
    <div className={styles.card} onClick={handleOpen} role="button">
      <div className={styles.imageWrap}>
        {promocao && <span className={styles.smileFridayTag}>Natal SmilePet</span>}
        <img src={image} alt={title} className={styles.productImage} />
        <button
          className={added ? `${styles.addBtn} ${styles.added}` : styles.addBtn}
          aria-label={
            added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"
          }
          onClick={(e) => {
            e.stopPropagation();
            if (onAdd) onAdd();
            // feedback visual
            setAdded(true);
            if (addedTimer.current) clearTimeout(addedTimer.current);
            addedTimer.current = setTimeout(() => setAdded(false), 1800);
          }}
        >
          {added ? (
            <FaCheck className={styles.addIcon} />
          ) : (
            <FaPlus className={styles.addIcon} />
          )}
        </button>
        {/* accessibility live region */}
        <span className={styles.srOnly} aria-live="polite">
          {added ? "Produto adicionado ao carrinho" : ""}
        </span>
      </div>

      <div className={styles.info}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>

        <div className={styles.priceBlock}>
          <div className={styles.labelSmall}>A partir de</div>
          <div className={styles.priceRow}>
            {priceOld && <div className={styles.priceOld}>R$ {priceOld}</div>}
            {price && <div className={styles.price}>R$ {price}</div>}
          </div>
          {priceSubscriber && (
            <div className={styles.subscriberPrice}>
              R$ {priceSubscriber}{" "}
              <span className={styles.subscriberNote}>para assinantes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// (cleanup handled with useEffect above)

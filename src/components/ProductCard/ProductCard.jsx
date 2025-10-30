import React from "react";
import styles from "./productCard.module.css";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProductCard({
  image,
  title,
  priceOld,
  price,
  priceSubscriber,
  onAdd,
  productId,
}) {
  const navigate = useNavigate();

  function handleOpen() {
    if (productId) navigate(`/produtos/${productId}`);
  }

  return (
    <div className={styles.card} onClick={handleOpen} role="button">
      <div className={styles.imageWrap}>
        <img src={image} alt={title} className={styles.productImage} />
        <button
          className={styles.addBtn}
          aria-label="Adicionar ao carrinho"
          onClick={(e) => {
            e.stopPropagation();
            if (onAdd) onAdd();
          }}
        >
          <FaPlus className={styles.addIcon} />
        </button>
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

import styles from "./faixa.module.css";
import {
  FaTruck,
  FaStore,
  FaStar,
  FaPhoneAlt,
  FaCommentDots,
} from "react-icons/fa";

export default function Faixa() {
  return (
    <section className={styles.faixaContainer}>
      <div className={styles.faixaContent}>
        <div className={styles.item}>
          <FaTruck className={styles.icon} />
          <div>
            <span>Envio em</span>
            <br />
            <span>24 horas</span>
          </div>
        </div>
        <div className={styles.item}>
          <FaStore className={styles.icon} />
          <div>
            <span>Enviamos para</span>
            <br />
            <span>Todo Brasil</span>
          </div>
        </div>
        <div className={styles.item}>
          <FaStar className={styles.icon} />
          <div>
            <span>Avaliação 4,8/5!</span>
            <br />
            <span>de usuários verificados</span>
          </div>
        </div>
        <div className={styles.item}>
          <FaPhoneAlt className={styles.icon} />
          <div>
            <span>Ligue para nós das 09:00 às 16:00h</span>
            <br />
            <span>(21)99999-9999</span>
          </div>
        </div>
        <div className={styles.item}>
          <FaCommentDots className={styles.icon} />
          <div>
            <span>Mande-nos uma mensagem,</span>
            <br />
            <span>responda no mesmo dia!</span>
          </div>
        </div>
      </div>
    </section>
  );
}

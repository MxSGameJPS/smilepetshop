import styles from "./headerOfertas.module.css";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function HeaderOfertas() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoArea}>
          <a href="/">
            <img
              src="/logo/produtos.webp"
              alt="SmilePet"
              className={styles.logo}
            />
          </a>
        </div>

        <div className={styles.rightArea}>
          <Link
            to="/"
            className={styles.backLink}
            aria-label="Voltar para o site"
          >
            <FaHome className={styles.homeIcon} />
            <span>Voltar para o Site</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

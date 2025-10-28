import styles from "./header.module.css";
import { FaSearch, FaUser, FaShoppingBag } from "react-icons/fa";
import { useState } from "react";

export default function Header() {
  const [cartCount] = useState(0); // Substitua por estado real do carrinho se necessário

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoArea}>
          <a href="/">
            <img
              src="/logo/produtos.webp"
              alt="Logo SmilePet"
              className={styles.logo}
            />
          </a>
          {/* <span className={styles.brand}>SmilePet</span> */}
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <a href="/cachorro">Cachorro</a>
            </li>
            <li>
              <a href="/gato">Gato</a>
            </li>
            <li>
              <a href="/ofertas" className={styles.ofertas}>
                OFERTAS IMPERDÍVEIS
              </a>
            </li>
            <li>
              <a href="/atacado">Compre no Atacado</a>
            </li>
            <li>
              <a href="/smileclub" className={styles.smileClub}>
                SmileClub
              </a>
            </li>
          </ul>
        </nav>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className={styles.searchInput}
            />
          </div>
          <button className={styles.iconBtn} aria-label="Perfil">
            <FaUser
              className={styles.icon}
              focusable="false"
              aria-hidden="true"
            />
          </button>
          <div className={styles.cartIconArea}>
            <button className={styles.iconBtn} aria-label="Sacola de compras">
              <FaShoppingBag
                className={styles.icon}
                focusable="false"
                aria-hidden="true"
              />
            </button>
            <span className={styles.cartCount}>{cartCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

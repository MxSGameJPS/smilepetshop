import styles from "./header.module.css";
import { FaSearch, FaUser, FaShoppingBag } from "react-icons/fa";
import { useState } from "react";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount] = useState(0); // Substitua por estado real do carrinho se necessário

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoArea}>
          <img
            src="/logo/produtos.webp"
            alt="Logo SmilePet"
            className={styles.logo}
          />
          <span className={styles.brand}>SmilePet</span>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <a href="#">Home</a>
            </li>
            <li
              className={styles.shopDropdown}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <a href="#">Shop</a>
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <a href="#" className={styles.dropdownItem}>
                    Cachorro
                  </a>
                  <a href="#" className={styles.dropdownItem}>
                    Gato
                  </a>
                </div>
              )}
            </li>
            <li>
              <a href="#">Ofertas</a>
            </li>
            <li>
              <a href="#">Planos</a>
            </li>
            <li>
              <a href="#">Atacado</a>
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

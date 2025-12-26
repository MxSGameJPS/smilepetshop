import React, { useState } from "react";
import styles from "./headerMobile.module.css";
import { FaSearch, FaShoppingBag, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCartCount } from "../../lib/cart";

export default function HeaderMobile() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const cartCount = getCartCount();

  function submit(e) {
    if (e) e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const qs = params.toString();
    navigate(qs ? `/produtos?${qs}` : "/produtos");
    setOpen(false);
  }

  return (
    <header className={styles.headerMobile}>
      <div className={styles.topRow}>
        <button
          className={styles.bars}
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          type="button"
        >
          <FaBars />
        </button>

        <a href="/" className={styles.logoLink} aria-label="Página inicial">
          <img src="/logo.webp" alt="Logo" className={styles.logo} />
        </a>

        <button
          className={styles.cartBtn}
          aria-label="Abrir carrinho"
          onClick={() => navigate("/carrinho")}
          type="button"
        >
          <FaShoppingBag />
          <span className={styles.cartCount}>{cartCount}</span>
        </button>
      </div>

      <div className={styles.searchRow}>
        <form className={styles.searchForm} onSubmit={submit}>
          <button
            type="submit"
            className={styles.searchBtn}
            aria-label="Buscar"
          >
            <FaSearch />
          </button>
          <input
            className={styles.searchInput}
            placeholder="Pesquisar produtos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      {open && (
        <div className={styles.drawerBackdrop} onClick={() => setOpen(false)} />
      )}

      <div className={`${styles.drawer} ${open ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <button
            className={styles.closeBtn}
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            type="button"
          >
            <FaTimes />
          </button>
        </div>
        <nav className={styles.drawerNav}>
          <ul>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/produtos?pet=Cachorro");
                }}
              >
                Cachorro
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/produtos?pet=Gato");
                }}
              >
                Gato
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/ofertas");
                }}
              >
                OFERTAS IMPERDÍVEIS
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/atacado");
                }}
              >
                Compre no Atacado
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

import styles from "./header.module.css";
import { FaSearch, FaHeart, FaShoppingBag } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCartCount } from "../../lib/cart";

export default function Header() {
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const navigate = useNavigate();

  // submenu state
  const [openCachorro, setOpenCachorro] = useState(false);
  const [openGato, setOpenGato] = useState(false);
  const [categories, setCategories] = useState(null);
  const [products, setProducts] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [activeSubLabel, setActiveSubLabel] = useState("");

  // mapping for submenu item -> target category name(s) for products filter
  // separate maps for cachorro and gato (arrays so we can join multiple categories)
  const submenuCategoryMapCachorro = {
    "Ração Seca": ["Ração para Cachorro"],
    "Ração Úmida": ["Ração Úmida para Cães"],
    "Petiscos": ["Petiscos Dog"],
    "Higiene e Cuidados": ["Higiene e Cuidados para Cães"],
  };

  const submenuCategoryMapGato = {
    "Ração Seca": ["Ração para Gatos"],
    "Ração Úmida": ["Ração Úmida para Gatos"],
    "Petiscos": ["Petiscos Cat"],
    "Higiene e Cuidados": ["Higiene e Cuidados para Gatos"],
  };

  const [activeSubSpecies, setActiveSubSpecies] = useState("");

  async function ensureDataFetched() {
    // fetch categories and products lazily (only once)
    try {
      if (!categories) {
        const resC = await fetch(
          "https://apismilepet.vercel.app/api/categorias/produtos"
        );
        const dataC = await resC.json().catch(() => null);
        setCategories(dataC || []);
      }
      if (!products) {
        const resP = await fetch("https://apismilepet.vercel.app/api/produtos");
        const dataP = await resP.json().catch(() => null);
        // normalize to array
        let arr = [];
        if (Array.isArray(dataP)) arr = dataP;
        else if (Array.isArray(dataP.data)) arr = dataP.data;
        else if (Array.isArray(dataP.produtos)) arr = dataP.produtos;
        setProducts(arr || []);
      }
    } catch (err) {
      console.warn("Erro ao buscar categorias/produtos", err);
    }
  }

  async function handleHoverSubItem(itemLabel, species = "cachorro") {
    setBrands([]);
    setActiveSubLabel(itemLabel);
    setActiveSubSpecies(species);
    const map =
      species === "gato" ? submenuCategoryMapGato : submenuCategoryMapCachorro;
    const targetCategories = map[itemLabel] || [];
    if (!targetCategories || targetCategories.length === 0) return;
    setLoadingBrands(true);
    await ensureDataFetched();
    try {
      const prods = products || [];
      // filter products whose p.categoria is in targetCategories array
      const filtered = prods.filter((p) =>
        targetCategories.includes(String(p.categoria))
      );
      const unique = Array.from(
        new Set(filtered.map((p) => p.marca).filter(Boolean))
      );
      setBrands(unique.sort());
    } catch (err) {
      console.warn("Erro filtrando marcas", err);
      setBrands([]);
    }
    setLoadingBrands(false);
  }

  function handleBrandClick(brand) {
    // determine which species map to use
    const map =
      activeSubSpecies === "gato"
        ? submenuCategoryMapGato
        : submenuCategoryMapCachorro;
    const targetCategories = map[activeSubLabel] || [];
    if (!targetCategories || targetCategories.length === 0) return;
    const params = new URLSearchParams();
    params.set("categorias", targetCategories.join(","));
    if (brand) params.set("marca", brand);
    navigate(`/produtos?${params.toString()}`);
  }

  useEffect(() => {
    const handler = (e) => {
      try {
        const c = e?.detail?.count ?? getCartCount();
        setCartCount(Number(c) || 0);
      } catch {
        setCartCount(getCartCount());
      }
    };
    window.addEventListener("smilepet_cart_update", handler);
    return () => window.removeEventListener("smilepet_cart_update", handler);
  }, []);

  return (
    <header className={styles.header}>
      {/* Top bar: logo | centered search | right actions */}
      <div className={styles.headerTop}>
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

          <div className={styles.searchCenter}>
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.headerRight}>
            <a href="/login" className={styles.loginLink}>
              Entre ou cadastre-se
            </a>
            <div className={styles.iconGroup}>
              <button className={styles.iconBtn} aria-label="Favoritos">
                <FaHeart
                  className={styles.icon}
                  focusable="false"
                  aria-hidden="true"
                />
              </button>
              <div className={styles.cartIconArea}>
                <button
                  className={styles.iconBtn}
                  aria-label="Sacola de compras"
                  type="button"
                  onClick={() => navigate("/carrinho")}
                >
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
        </div>
      </div>

      {/* Bottom bar: main navigation (keeps existing nav/submenu behavior) */}
      <div className={styles.headerBottom}>
        <div className={styles.headerNav}>
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              <li
                className={styles.hasSubmenu}
                onMouseEnter={() => setOpenCachorro(true)}
                onMouseLeave={() => {
                  setOpenCachorro(false);
                }}
              >
                <a href="/cachorro">Cachorro</a>
                {openCachorro && (
                  <div className={styles.submenu} role="menu">
                    <div className={styles.submenuLeft}>
                      {Object.keys(submenuCategoryMapCachorro).map((label) => (
                        <div
                          key={label}
                          className={styles.submenuItem}
                          onMouseEnter={() =>
                            handleHoverSubItem(label, "cachorro")
                          }
                          onClick={() => {
                            const cats =
                              submenuCategoryMapCachorro[label] || [];
                            const params = new URLSearchParams();
                            if (cats.length)
                              params.set("categorias", cats.join(","));
                            navigate(`/produtos?${params.toString()}`);
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className={styles.submenuRight}>
                      <div className={styles.submenuBrandsTitle}>Marcas</div>
                      {loadingBrands ? (
                        <div className={styles.submenuLoading}>
                          Carregando...
                        </div>
                      ) : brands.length === 0 ? (
                        <div className={styles.submenuEmpty}>
                          Passe o mouse sobre uma categoria
                        </div>
                      ) : (
                        <ul className={styles.brandsList}>
                          {brands.map((b) => (
                            <li key={b} onClick={() => handleBrandClick(b)}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
              <li
                className={styles.hasSubmenu}
                onMouseEnter={() => setOpenGato(true)}
                onMouseLeave={() => {
                  setOpenGato(false);
                }}
              >
                <a href="/gato">Gato</a>
                {openGato && (
                  <div className={styles.submenu} role="menu">
                    <div className={styles.submenuLeft}>
                      {Object.keys(submenuCategoryMapGato).map((label) => (
                        <div
                          key={label}
                          className={styles.submenuItem}
                          onMouseEnter={() => handleHoverSubItem(label, "gato")}
                          onClick={() => {
                            const cats = submenuCategoryMapGato[label] || [];
                            const params = new URLSearchParams();
                            if (cats.length)
                              params.set("categorias", cats.join(","));
                            navigate(`/produtos?${params.toString()}`);
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className={styles.submenuRight}>
                      <div className={styles.submenuBrandsTitle}>Marcas</div>
                      {loadingBrands ? (
                        <div className={styles.submenuLoading}>
                          Carregando...
                        </div>
                      ) : brands.length === 0 ? (
                        <div className={styles.submenuEmpty}>
                          Passe o mouse sobre uma categoria
                        </div>
                      ) : (
                        <ul className={styles.brandsList}>
                          {brands.map((b) => (
                            <li key={b} onClick={() => handleBrandClick(b)}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
              <li>
                <a href="/ofertas" className={styles.ofertas}>
                  OFERTAS IMPERDÍVEIS
                </a>
              </li>
              <li>
                <a href="/atacado">Compre no Atacado</a>
              </li>
              {/* <li>
                <a href="/smileclub" className={styles.smileClub}>
                  SmileClub
                </a>
              </li> */}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

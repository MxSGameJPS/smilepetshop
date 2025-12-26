import ChristmasLights from "../Christmas/Lights";
import styles from "./header.module.css";
import {
  FaSearch,
  FaHeart,
  FaShoppingBag,
  FaInstagramSquare,
} from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import HeaderMobile from "../HeaderMobile/headerMobile";
import { useNavigate } from "react-router-dom";
import { getCartCount } from "../../lib/cart";
import { getUser, clearUser, broadcastUserUpdate } from "../../lib/auth";
import { AiFillTikTok } from "react-icons/ai";

export default function Header() {
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width:760px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width:760px)");
    const onChange = (ev) => setIsMobile(ev.matches);
    try {
      mq.addEventListener?.("change", onChange);
      // fallback
      if (!mq.addEventListener) mq.addListener(onChange);
    } catch {
      /* ignore */
    }
    setIsMobile(mq.matches);
    return () => {
      try {
        mq.removeEventListener?.("change", onChange);
        if (!mq.removeEventListener) mq.removeListener(onChange);
      } catch {
        /* ignore */
      }
    };
  }, []);

  // helper: try to extract the actual user object from many possible shapes
  function normalizeUser(payload) {
    if (!payload) return null;
    // unwrap common wrappers
    const tryKeys = ["user", "data", "cliente", "client", "customer"];
    let p = payload;
    // if payload has token and user inside, prefer inner
    for (const k of tryKeys) {
      if (p && typeof p === "object" && k in p && p[k]) {
        p = p[k];
      }
    }
    // if still wrapped (e.g. { user: { user: {...} } }), unwrap repeatedly up to depth
    let depth = 0;
    while (p && typeof p === "object" && (p.user || p.data) && depth < 4) {
      p = p.user ?? p.data ?? p;
      depth += 1;
    }
    return p;
  }

  const [user, setUser] = useState(() => normalizeUser(getUser()));

  // submenu state
  const [openCachorro, setOpenCachorro] = useState(false);
  const [openGato, setOpenGato] = useState(false);
  const [blinkOfertas, setBlinkOfertas] = useState(false);
  const [categories, setCategories] = useState(null);
  const [products, setProducts] = useState(null);
  // const [brands, setBrands] = useState([]);
  // const [loadingBrands, setLoadingBrands] = useState(false);
  // const [activeSubLabel, setActiveSubLabel] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (openCachorro || openGato) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [openCachorro, openGato]);

  // mapping for submenu item -> target category name(s) for products filter
  // separate maps for cachorro and gato (arrays so we can join multiple categories)
  const submenuCategoryMapCachorro = {
    Ração: ["Ração para Cachorro"],
    "Ração Úmida": ["Ração Úmida para Cães"],
    Petiscos: ["Petiscos Dog"],
    "Tapetes Higienicos": ["Higiene e Cuidados para Cães"],
  };

  const submenuCategoryMapGato = {
    Ração: ["Ração para Gatos"],
    "Ração Úmida": ["Ração Úmida para Gatos"],
    Petiscos: ["Petiscos Cat"],
    Areias: ["Higiene e Cuidados para Gatos"],
  };

  // const [activeSubSpecies, setActiveSubSpecies] = useState("");

  const normalizeText = (value) =>
    value == null
      ? ""
      : String(value)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

  // const collectCategoryIds = (product) => {
  //   const ids = new Set();
  //   const push = (val) => {
  //     if (val === null || val === undefined) return;
  //     const str = String(val).trim();
  //     if (str) ids.add(str);
  //   };
  //   const directCategory = product?.categoria;
  //   if (
  //     typeof directCategory === "number" ||
  //     (typeof directCategory === "string" && directCategory.trim() !== "")
  //   ) {
  //     push(directCategory);
  //   }
  //   if (directCategory && typeof directCategory === "object") {
  //     push(directCategory?.id);
  //     push(directCategory?._id);
  //     push(directCategory?.ID);
  //     push(directCategory?.codigo);
  //   }
  //   push(product?.categoria_id);
  //   push(product?.categoriaId);
  //   push(product?.categoriaID);
  //   return ids;
  // };

  const resolveCategoryMeta = (categoryNames, categoriesList) => {
    const names = new Set();
    const normalizedNames = new Set();
    const ids = new Set();

    (categoryNames || []).forEach((entry) => {
      const normalizedEntry = normalizeText(entry);
      if (entry) names.add(entry);
      if (normalizedEntry) normalizedNames.add(normalizedEntry);

      const match = (categoriesList || []).find((cat) => {
        const catNames = [cat?.nome, cat?.descricao, cat?.label, cat?.name];
        return catNames.some(
          (candidate) => normalizeText(candidate) === normalizedEntry
        );
      });

      if (match) {
        if (match.nome) {
          names.add(match.nome);
          normalizedNames.add(normalizeText(match.nome));
        }
        const resolvedId = match.id ?? match._id ?? match.ID ?? match.codigo;
        if (resolvedId !== null && resolvedId !== undefined) {
          const strId = String(resolvedId).trim();
          if (strId) ids.add(strId);
        }
      }
    });

    return {
      names: Array.from(names),
      normalizedNames: Array.from(normalizedNames),
      ids: Array.from(ids),
    };
  };

  const resolveCategoryArray = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.categorias)) return raw.categorias;
    return raw ? [raw] : [];
  };

  const resolveProductsArray = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.produtos)) return raw.produtos;
    if (raw && typeof raw === "object") return Object.values(raw);
    return [];
  };

  // const findCategoryNameById = (idValue, categoriesList) => {
  //   if (idValue === null || idValue === undefined) return "";
  //   const idStr = String(idValue).trim();
  //   if (!idStr) return "";
  //   const match = (categoriesList || []).find((item) => {
  //     const candidateIds = [
  //       item?.id,
  //       item?._id,
  //       item?.ID,
  //       item?.codigo,
  //       item?.categoria_id,
  //       item?.categoriaId,
  //       item?.categoriaID,
  //     ];
  //     return candidateIds.some((candidate) => String(candidate) === idStr);
  //   });
  //   return (
  //     match?.nome ||
  //     match?.name ||
  //     match?.label ||
  //     match?.descricao ||
  //     match?.description ||
  //     ""
  //   );
  // };

  // const collectCategoryNames = (product, categoriesList) => {
  //   const names = new Set();
  //   const pushName = (val) => {
  //     const normalized = normalizeText(val);
  //     if (normalized) names.add(normalized);
  //   };
  //   const directCategory = product?.categoria;
  //   if (
  //     typeof directCategory === "string" ||
  //     typeof directCategory === "number"
  //   ) {
  //     pushName(directCategory);
  //   } else if (directCategory && typeof directCategory === "object") {
  //     [
  //       directCategory.nome,
  //       directCategory.name,
  //       directCategory.label,
  //       directCategory.descricao,
  //       directCategory.description,
  //     ].forEach(pushName);
  //   }
  //   [
  //     product?.categoria_nome,
  //     product?.categoriaName,
  //     product?.categoria_label,
  //     product?.categoriaDescricao,
  //     product?.categoria_description,
  //   ].forEach(pushName);
  //   const candidateIds = [
  //     product?.categoria_id,
  //     product?.categoriaId,
  //     product?.categoriaID,
  //     typeof directCategory === "number" ? directCategory : null,
  //     typeof directCategory === "string" && /^\d+$/.test(directCategory.trim())
  //       ? directCategory.trim()
  //       : null,
  //   ].filter((v) => v !== null && v !== undefined);
  //   candidateIds.forEach((idCandidate) => {
  //     // const nameFromId = findCategoryNameById(idCandidate, categoriesList);
  //     // pushName(nameFromId);
  //   });
  //   return names;
  // };

  // const productMatchesCategory = (product, targetNames, categoriesList) => {
  //   if (!product || !targetNames) return false;
  //   const { names: nameTargets = [], ids: idTargets = [] } = targetNames;
  //   const normalizedNameTargets = (targetNames?.normalizedNames || []).filter(
  //     Boolean
  //   );
  //   // const productNames = collectCategoryNames(product, categoriesList);
  //   // if (normalizedNameTargets.length) {
  //   //   const hasNameMatch = normalizedNameTargets.some((target) =>
  //   //     productNames.has(target)
  //   //   );
  //   //   if (hasNameMatch) return true;
  //   // }
  //   // if (idTargets.length) {
  //   //   const productIds = collectCategoryIds(product);
  //   //   const hasIdMatch = idTargets.some((id) => productIds.has(id));
  //   //   if (hasIdMatch) return true;
  //   // }
  //   // fallback: compare raw names if available
  //   // if (nameTargets.length) {
  //   //   const fallbackMatch = nameTargets.some((label) =>
  //   //     productNames.has(normalizeText(label))
  //   //   );
  //   //   if (fallbackMatch) return true;
  //   // }
  //   return false;
  // };

  async function ensureDataFetched() {
    let categoriesData = categories;
    let productsData = products;
    try {
      if (!categoriesData) {
        const resC = await fetch(
          "https://apismilepet.vercel.app/api/categorias/produtos"
        );
        const dataC = await resC.json().catch(() => null);
        categoriesData = resolveCategoryArray(dataC);
        setCategories(categoriesData);
      }
      if (!productsData) {
        const resP = await fetch("https://apismilepet.vercel.app/api/produtos");
        const dataP = await resP.json().catch(() => null);
        productsData = resolveProductsArray(dataP);
        setProducts(productsData);
      }
    } catch (err) {
      console.warn("Erro ao buscar categorias/produtos", err);
    }
    return {
      categoriesData: categoriesData || [],
      productsData: productsData || [],
    };
  }

  const parsePrice = (valor) => {
    if (valor == null) return NaN;
    if (typeof valor === "number") return valor;
    let s = String(valor).trim();
    if (!s) return NaN;
    s = s.replace(/[^0-9.,-]/g, "");
    if (!s) return NaN;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(/,/g, ".");
    else s = s.replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const formatCurrency = (valor) => {
    if (!Number.isFinite(valor)) return "";
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valor);
    } catch {
      return "";
    }
  };

  const normalizedProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => {
      const name = String(
        p?.nome || p?.title || p?.name || p?.descricao || ""
      ).trim();
      const rawPrice =
        p?.precoMin ??
        p?.preco ??
        p?.precoAssinante ??
        p?.precoMax ??
        p?.price ??
        null;
      const priceNumber = parsePrice(rawPrice);
      const formattedPrice = formatCurrency(priceNumber);
      const image =
        p?.imagem_url && String(p.imagem_url).trim()
          ? String(p.imagem_url).trim()
          : "/imgCards/RacaoSeca.png";
      return {
        raw: p,
        name,
        normalized: normalizeText(name),
        formattedPrice,
        priceNumber,
        image,
      };
    });
  }, [products]);

  const suggestionResults = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return [];
    return normalizedProducts
      .filter((p) => p.name && p.normalized.includes(term))
      .slice(0, 6);
  }, [searchTerm, normalizedProducts]);

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const query = searchTerm.trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const queryString = params.toString();
    navigate(queryString ? `/produtos?${queryString}` : "/produtos");
    setSuggestionsOpen(false);
  }

  function handleSuggestionClick(product) {
    const query = product?.name || searchTerm.trim();
    if (!query) return;
    const params = new URLSearchParams();
    params.set("q", query);
    const queryString = params.toString();
    navigate(queryString ? `/produtos?${queryString}` : "/produtos");
    setSuggestionsOpen(false);
    setSearchTerm(product?.name || "");
  }

  async function handleHoverSubItem(itemLabel, species = "cachorro") {
    if (!showOverlay) setShowOverlay(true);
    // setBrands([]);
    // setActiveSubLabel(itemLabel);
    // setActiveSubSpecies(species);
    const map =
      species === "gato" ? submenuCategoryMapGato : submenuCategoryMapCachorro;
    const targetCategories = map[itemLabel] || [];
    if (!targetCategories || targetCategories.length === 0) return;
    // setLoadingBrands(true);
    try {
      await ensureDataFetched();
      // const targetMeta = resolveCategoryMeta(targetCategories, categoriesData);
      // const filtered = productsData.filter((product) =>
      //   productMatchesCategory(product, targetMeta, categoriesData)
      // );
      // const unique = Array.from(
      //   new Set(
      //     filtered
      //       .map((p) => (p?.marca ? String(p.marca).trim() : ""))
      //       .filter(Boolean)
      //   )
      // );
      // setBrands(
      //   unique.sort((a, b) =>
      //     a.localeCompare(b, "pt-BR", { sensitivity: "base" })
      //   )
      // );
    } catch (err) {
      console.warn("Erro filtrando marcas", err);
      // setBrands([]);
    } finally {
      // setLoadingBrands(false);
    }
  }

  // async function handleBrandClick(brand) {
  //   // determine which species map to use
  //   const map =
  //     activeSubSpecies === "gato"
  //       ? submenuCategoryMapGato
  //       : submenuCategoryMapCachorro;
  //   const targetCategories = map[activeSubLabel] || [];
  //   if (!targetCategories || targetCategories.length === 0) return;
  //   try {
  //     const { categoriesData } = await ensureDataFetched();
  //     const targetMeta = resolveCategoryMeta(targetCategories, categoriesData);
  //     const params = new URLSearchParams();
  //     if (targetMeta.ids.length)
  //       params.set("categorias", targetMeta.ids.join(","));
  //     else params.set("categorias", targetCategories.join(","));
  //     const petLabel = activeSubSpecies === "gato" ? "Gato" : "Cachorro";
  //     params.set("pet", petLabel);
  //     if (brand) params.set("marca", brand);
  //     setOpenCachorro(false);
  //     setOpenGato(false);
  //     setShowOverlay(false);
  //     navigate(`/produtos?${params.toString()}`);
  //   } catch (err) {
  //     console.warn("Erro ao navegar por marca", err);
  //   }
  // }

  async function handleCategoryNavigate(label, species) {
    const map =
      species === "gato" ? submenuCategoryMapGato : submenuCategoryMapCachorro;
    const targetCategories = map[label] || [];
    if (!targetCategories || targetCategories.length === 0) return;
    try {
      const { categoriesData } = await ensureDataFetched();
      const targetMeta = resolveCategoryMeta(targetCategories, categoriesData);
      const params = new URLSearchParams();
      if (targetMeta.ids.length)
        params.set("categorias", targetMeta.ids.join(","));
      else params.set("categorias", targetCategories.join(","));
      params.set("pet", species === "gato" ? "Gato" : "Cachorro");
      setOpenCachorro(false);
      setOpenGato(false);
      setShowOverlay(false);
      navigate(`/produtos?${params.toString()}`);
    } catch (err) {
      console.warn("Erro ao navegar por categoria", err);
    }
  }

  function handlePetNavigation(petName) {
    setOpenCachorro(false);
    setOpenGato(false);
    setShowOverlay(false);
    const params = new URLSearchParams();
    params.set("pet", petName);
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
    // listen for user updates (login/logout)
    const userHandler = (ev) => {
      try {
        const d = ev?.detail ?? getUser();
        const u = normalizeUser(d) ?? normalizeUser(getUser());
        setUser(u || null);
      } catch {
        setUser(normalizeUser(getUser()));
      }
    };
    window.addEventListener("smilepet_user_update", userHandler);
    return () => {
      window.removeEventListener("smilepet_cart_update", handler);
      window.removeEventListener("smilepet_user_update", userHandler);
    };
  }, []);

  // small logout helper
  function handleLogout() {
    clearUser();
    broadcastUserUpdate({ user: null });
    setUser(null);
    navigate("/");
  }

  return (
    <>
      {isMobile ? <HeaderMobile /> : null}
      {!isMobile && (
        <header className={styles.header}>
          <ChristmasLights />
          {/* Top bar: logo | centered search | right actions */}
          <div className={styles.headerTop}>
            <div className={styles.headerContent}>
              <div className={styles.logoArea}>
                <a href="/">
                  <img
                    src="/logo.webp"
                    alt="Logo SmilePet"
                    className={styles.logo}
                  />
                </a>
                {/* <span className={styles.brand}>SmilePet</span> */}
              </div>

              <div className={styles.searchCenter}>
                <form
                  className={styles.searchBox}
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                  }}
                >
                  <button
                    type="submit"
                    className={styles.searchSubmit}
                    aria-label="Buscar produtos"
                  >
                    <FaSearch className={styles.searchIcon} />
                  </button>
                  <input
                    type="text"
                    placeholder="Pesquisar produtos..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSuggestionsOpen(true);
                      void ensureDataFetched();
                    }}
                    onFocus={() => {
                      setSuggestionsOpen(true);
                      void ensureDataFetched();
                    }}
                    onBlur={() => {
                      setTimeout(() => setSuggestionsOpen(false), 120);
                    }}
                  />
                </form>
                {suggestionsOpen && searchTerm.trim() ? (
                  <div className={styles.searchDropdown}>
                    {!products ? (
                      <div className={styles.searchNoResults}>
                        Carregando sugestões...
                      </div>
                    ) : suggestionResults.length > 0 ? (
                      <>
                        <div className={styles.searchSuggestionsHeader}>
                          Produtos sugeridos
                        </div>
                        <ul className={styles.searchSuggestionsList}>
                          {suggestionResults.map((item) => (
                            <li key={item.raw?.id || item.name}>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSuggestionClick(item);
                                }}
                              >
                                <div className={styles.searchSuggestionContent}>
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className={styles.searchSuggestionThumb}
                                  />
                                  <div className={styles.searchSuggestionInfo}>
                                    <span
                                      className={styles.searchSuggestionName}
                                    >
                                      {item.name}
                                    </span>
                                    {item.formattedPrice ? (
                                      <span
                                        className={styles.searchSuggestionPrice}
                                      >
                                        {item.formattedPrice}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        Nenhum produto encontrado
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className={styles.socialMediaIcons}>
                <a
                  href="https://www.tiktok.com/@smilepetoficial?_r=1&_t=ZS-91fqa6rqe29"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok - SmilePet"
                  title="TikTok"
                >
                  <AiFillTikTok color="white" />
                </a>
                <a
                  href="https://www.instagram.com/smilepetbrasil?igsh=cXBuaDY1ODRpcmR6"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram - SmilePet"
                  title="Instagram"
                >
                  <FaInstagramSquare color="white" />
                </a>
              </div>

              <div className={styles.headerRight}>
                {(() => {
                  // tolerate different shapes returned by API
                  const displayName =
                    user?.nome || user?.name || user?.firstName || user?.email;
                  if (displayName) {
                    return (
                      <div className={styles.userArea}>
                        <button
                          className={styles.userNameBtn}
                          onClick={() => navigate("/perfil")}
                          type="button"
                          title={`Ver perfil de ${displayName}`}
                        >
                          Olá, {displayName}
                        </button>
                        <button
                          className={styles.logoutBtn}
                          onClick={handleLogout}
                          type="button"
                        >
                          Sair
                        </button>
                      </div>
                    );
                  }
                  return (
                    <a href="/usuario" className={styles.loginLink}>
                      Entre ou cadastre-se
                    </a>
                  );
                })()}
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
                    <a
                      href="/produtos?pet=Cachorro"
                      className={`${styles.petLink} ${styles.petLinkDog}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePetNavigation("Cachorro");
                        setShowOverlay(true);
                      }}
                    >
                      Cachorro
                    </a>
                    {openCachorro && (
                      <div className={styles.submenu} role="menu">
                        <div className={styles.submenuLeft}>
                          {Object.keys(submenuCategoryMapCachorro).map(
                            (label) => (
                              <div
                                key={label}
                                className={styles.submenuItem}
                                onMouseEnter={() =>
                                  handleHoverSubItem(label, "cachorro")
                                }
                                onClick={() => {
                                  void handleCategoryNavigate(
                                    label,
                                    "cachorro"
                                  );
                                }}
                              >
                                {label}
                              </div>
                            )
                          )}
                        </div>
                        {/* <div className={styles.submenuRight}>
                          <div className={styles.submenuBrandsTitle}>
                            Marcas
                          </div>
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
                                <li
                                  key={b}
                                  onClick={() => void handleBrandClick(b)}
                                >
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div> */}
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
                    <a
                      href="/produtos?pet=Gato"
                      className={`${styles.petLink} ${styles.petLinkCat}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePetNavigation("Gato");
                        setShowOverlay(true);
                      }}
                    >
                      Gato
                    </a>
                    {openGato && (
                      <div className={styles.submenu} role="menu">
                        <div className={styles.submenuLeft}>
                          {Object.keys(submenuCategoryMapGato).map((label) => (
                            <div
                              key={label}
                              className={styles.submenuItem}
                              onMouseEnter={() =>
                                handleHoverSubItem(label, "gato")
                              }
                              onClick={() => {
                                void handleCategoryNavigate(label, "gato");
                              }}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                        {/* <div className={styles.submenuRight}>
                          <div className={styles.submenuBrandsTitle}>
                            Marcas
                          </div>
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
                                <li
                                  key={b}
                                  onClick={() => void handleBrandClick(b)}
                                >
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div> */}
                      </div>
                    )}
                  </li>
                  <li>
                    <a
                      href="/ofertas"
                      className={`${styles.ofertas} ${
                        blinkOfertas ? styles.ofertasBlink : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        // start blinking and navigate to ofertas
                        setBlinkOfertas(true);
                        // stop blinking after a while to avoid permanent animation
                        setTimeout(() => setBlinkOfertas(false), 6000);
                        navigate("/ofertas");
                      }}
                    >
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
      )}
      {showOverlay && <div className={styles.menuOverlay} />}
    </>
  );
}

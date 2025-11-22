import { useEffect, useState } from "react";
import styles from "./produtos.module.css";
import ProductCard from "../ProductCard/ProductCard";
import { addToCart } from "../../lib/cart";
import { useLocation, useNavigate } from "react-router-dom";
import ProdutosMobileFilter from "./ProdutosMobileFilter/ProdutosMobileFilter.jsx";

const MARCA_CLEAR = "__NONE__";

export default function Produtos() {
  const [openGrupo, setOpenGrupo] = useState({
    preco: true,
    categoria: true,
    marca: true,
  });
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [filtroPet, setFiltroPet] = useState("");
  const [filtroOfertas, setFiltroOfertas] = useState(false);
  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(100);
  const [priceRangeMin, setPriceRangeMin] = useState(0);
  const [priceRangeMax, setPriceRangeMax] = useState(100);
  const location = useLocation();
  const navigate = useNavigate();
  // helper: parse prices returned by the API (handles '1.234,56' Brazilian format)
  const parsePrice = (v) => {
    if (v == null) return NaN;
    if (typeof v === "number") return v;
    let s = String(v).trim();
    if (s === "") return NaN;
    // remover prefixos/símbolos não numéricos (R$, $, espaço, letras)
    s = s.replace(/[^0-9.,-]/g, "");
    if (s === "") return NaN;
    // se tiver vírgula, assume formato brasileiro (1.234,56)
    if (s.indexOf(",") >= 0) {
      s = s.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // caso sem vírgula, remover vírgulas remanescentes e deixar pontos decimais
      s = s.replace(/,/g, "");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const formatCurrency = (val) => {
    try {
      const n = Number(val) || 0;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(n);
    } catch {
      return String(val);
    }
  };
  const normalize = (val) =>
    val == null
      ? ""
      : String(val)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

  const getCategoriaNome = (produto) => {
    if (!produto) return "";
    const cat = produto.categoria;
    if (typeof cat === "string" && cat.trim() !== "") return cat;
    if (cat && typeof cat === "object") {
      return (
        cat.nome ||
        cat.name ||
        cat.label ||
        cat.descricao ||
        cat.description ||
        ""
      );
    }
    return (
      produto.categoria_nome ||
      produto.categoriaName ||
      produto.categoriaLabel ||
      produto.categoriaDescricao ||
      produto.categoria_description ||
      ""
    );
  };

  const getCategoriaId = (produto) => {
    if (!produto) return null;
    const direct =
      produto.categoria_id ??
      produto.categoriaId ??
      produto.categoriaID ??
      null;
    if (direct !== null && direct !== undefined && direct !== "") return direct;
    const cat = produto.categoria;
    if (cat && typeof cat === "object") {
      const nested = cat.id ?? cat.ID ?? cat.categoria_id ?? cat.categoriaId;
      if (nested !== null && nested !== undefined && nested !== "")
        return nested;
    }
    if (typeof cat === "number") return cat;
    if (typeof cat === "string" && /^\d+$/.test(cat.trim())) return cat.trim();
    return null;
  };
  // parse categorias from query string (comma separated names)
  const params = new URLSearchParams(location.search);
  const categoriasParam = params.get("categorias") || "";
  const categoriasFiltro = categoriasParam
    ? categoriasParam.split(",").map((s) => s.trim())
    : [];
  const categoriasFiltroNormalized = categoriasFiltro.map((c) => normalize(c));
  const marcaParam = params.get("marca") || "";
  const petParam = params.get("pet") || "";
  const searchQueryParam = params.get("q") || "";
  const normalizedSearchQuery = normalize(searchQueryParam);
  const effectivePetFilter = filtroPet || petParam;

  useEffect(() => {
    fetch("https://apismilepet.vercel.app/api/produtos")
      .then((res) => res.json())
      .then((data) => {
        let arr = [];
        if (Array.isArray(data)) {
          arr = data;
        } else if (Array.isArray(data.data)) {
          arr = data.data;
        } else if (Array.isArray(data.produtos)) {
          arr = data.produtos;
        }
        // manter apenas produtos pai (produto_pai_id === null)
        const parents = arr.filter((p) => {
          return (
            (p && p.produto_pai_id === null) ||
            (p && p.produto && p.produto.produto_pai_id === null)
          );
        });
        setProdutos(parents);
        // calcular faixa de preço disponível a partir da propriedade `preco`
        const prices = parents
          .map((p) =>
            parsePrice(p.preco ?? p.precoMin ?? p.precoMax ?? p.precoAssinante)
          )
          .filter((n) => Number.isFinite(n));
        if (prices.length) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setPriceRangeMin(min);
          setPriceRangeMax(max);
          // inicializar seletores com toda a faixa disponível
          setPrecoMin(min);
          setPrecoMax(max);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar produtos");
        setLoading(false);
      });
    // buscar categorias para os filtros (uma vez)
    fetch("https://apismilepet.vercel.app/api/categorias/produtos")
      .then((r) => r.json())
      .then((data) => {
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.categorias)) arr = data.categorias;
        setCategoriasOptions(arr);
      })
      .catch(() => {
        // silencioso: se falhar, os checkboxes ficarão desabilitados
      });
  }, []);

  // Extrair marcas e categorias dos produtos
  const marcas = Array.from(
    new Set(produtos.map((p) => p.marca).filter(Boolean))
  );
  const marcaSelecionada =
    filtroMarca === MARCA_CLEAR ? "" : filtroMarca || marcaParam;
  // helpers para filtros de checkbox
  const toggleSelectedCategoria = (catInfo) => {
    const normalizedName = normalize(
      catInfo?.nome ?? catInfo?.label ?? catInfo?.nomeBusca ?? ""
    );
    const id =
      catInfo && catInfo.id !== undefined && catInfo.id !== null
        ? String(catInfo.id)
        : catInfo?.idString ?? null;
    setSelectedCategorias((prev) => {
      const exists = prev.some((item) => {
        const matchId = id && item.id && String(item.id) === id;
        const matchName =
          normalizedName && item.normalizedName === normalizedName;
        return matchId || matchName;
      });
      if (exists) {
        return prev.filter((item) => {
          const matchId = id && item.id && String(item.id) === id;
          const matchName =
            normalizedName && item.normalizedName === normalizedName;
          return !(matchId || matchName);
        });
      }
      return [
        ...prev,
        {
          id: id ?? null,
          normalizedName,
        },
      ];
    });
  };
  const specialCategoriasPorPet = {
    Gato: [
      { label: "Ração Seca", nomeBusca: "Ração para Gatos" },
      { label: "Ração Úmida", nomeBusca: "Ração Úmida para Gatos" },
      { label: "Petiscos", nomeBusca: "Petiscos Cat" },
      { label: "Areias", nomeBusca: "Higiene e Cuidados para Gatos" },
    ],
    Cachorro: [
      { label: "Ração Seca", nomeBusca: "Ração para Cachorro" },
      { label: "Ração Úmida", nomeBusca: "Ração Úmida para Cães" },
      { label: "Petiscos", nomeBusca: "Petiscos Dog" },
      { label: "Tapetes", nomeBusca: "Higiene e Cuidados para Cães" },
    ],
  };
  const updatePetParamInUrl = (nextValue) => {
    const nextPet = nextValue || "";
    if (nextPet === (petParam || "")) return;
    const nextParams = new URLSearchParams(location.search);
    if (nextPet) nextParams.set("pet", nextPet);
    else nextParams.delete("pet");
    const searchString = nextParams.toString();
    navigate(searchString ? `/produtos?${searchString}` : "/produtos", {
      replace: true,
    });
  };

  const toggleFiltroPetPorNome = (petNome) => {
    setFiltroPet((prev) => {
      const next = prev === petNome ? "" : petNome;
      updatePetParamInUrl(next);
      return next;
    });
  };
  const buscarCategoriaOption = (nomeBusca) =>
    categoriasOptions.find((cat) => {
      const nomeMatch = normalize(cat?.nome) === normalize(nomeBusca);
      const descricaoMatch = normalize(cat?.descricao) === normalize(nomeBusca);
      return nomeMatch || descricaoMatch;
    });
  const isCategoriaSelecionada = (id, nome) => {
    const normalizedName = normalize(nome);
    const idStr = id != null ? String(id) : null;
    return selectedCategorias.some((item) => {
      const matchName =
        normalizedName && item.normalizedName === normalizedName;
      const matchId = idStr && item.id && String(item.id) === idStr;
      return matchName || matchId;
    });
  };
  const toggleMarca = (marca) => {
    setFiltroMarca((prev) => {
      if (prev === marca) return MARCA_CLEAR;
      return marca;
    });
  };

  const produtosFiltrados = produtos.filter((p) => {
    const effectiveMarca =
      filtroMarca === MARCA_CLEAR ? "" : filtroMarca || marcaParam;
    const marcaOk = !effectiveMarca || p.marca === effectiveMarca;
    const categoriaNome = getCategoriaNome(p);
    const categoriaNomeNorm = normalize(categoriaNome);
    const categoriaId = getCategoriaId(p);
    const categoriaIdStr =
      categoriaId !== null && categoriaId !== undefined
        ? String(categoriaId)
        : null;
    const categoriaIdNorm = categoriaIdStr ? normalize(categoriaIdStr) : "";
    // if categoriasFiltro is provided in URL, match any of them
    let categoriaOk = true;
    if (categoriasFiltroNormalized.length) {
      categoriaOk = categoriasFiltroNormalized.some((target) => {
        if (target === categoriaNomeNorm) return true;
        if (categoriaIdStr && target === categoriaIdStr) return true;
        if (categoriaIdNorm && target === categoriaIdNorm) return true;
        return false;
      });
    } else if (selectedCategorias.length) {
      categoriaOk = selectedCategorias.some((sel) => {
        const matchName =
          sel.normalizedName && sel.normalizedName === categoriaNomeNorm;
        const matchId =
          sel.id != null &&
          (sel.id === categoriaIdStr || sel.id === categoriaIdNorm);
        return matchName || matchId;
      });
    } else {
      const filtroCatNorm = normalize(filtroCategoria);
      categoriaOk = !filtroCatNorm || filtroCatNorm === categoriaNomeNorm;
    }
    // filtrar por pet (ex.: Gato)
    const petOk =
      !effectivePetFilter || normalize(p.pet) === normalize(effectivePetFilter);
    const isPromocao =
      p.promocao === true ||
      p.promocao === "true" ||
      p.promocao === 1 ||
      p.promocao === "1";
    const ofertaOk = !filtroOfertas || isPromocao;
    // Filtrar por faixa de preço usando propriedade `preco` (ou alternativas)
    const raw =
      p.preco ?? p.precoMin ?? p.precoMax ?? p.precoAssinante ?? p.price;
    const pPrice = parsePrice(raw);
    const priceOk = Number.isFinite(pPrice)
      ? pPrice >= precoMin && pPrice <= precoMax
      : true;
    const produtoNomeCandidates = [
      p.nome,
      p.title,
      p.name,
      p.descricao,
      p.descricao_curta,
      p.descricaoCompleta,
    ];
    const searchOk =
      !normalizedSearchQuery ||
      produtoNomeCandidates.some((candidate) =>
        normalize(candidate).includes(normalizedSearchQuery)
      );

    return marcaOk && categoriaOk && priceOk && petOk && ofertaOk && searchOk;
  });

  // paginação incremental: mostrar aos poucos
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // detectar mobile (<=760px) para renderizar o filtro móvel
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:760px)");
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const handleClearFilters = () => {
    setFiltroMarca(MARCA_CLEAR);
    setFiltroCategoria("");
    setSelectedCategorias([]);
    setFiltroPet("");
    setFiltroOfertas(false);
    setPrecoMin(priceRangeMin);
    setPrecoMax(priceRangeMax);
    navigate("/produtos");
  };

  // resetar visíveis quando o conjunto filtrado mudar (novos filtros / pesquisa)
  // usamos apenas o tamanho do array como dependência para evitar executar
  // a cada render (produtosFiltrados é um novo array por render).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [produtosFiltrados.length]);

  // navigation handled inside ProductCard via useNavigate when opening a product

  return (
    <section className={styles.produtosContainer}>
      <div className={styles.produtosSection}>
        <aside className={styles.filtrosAside}>
          <h2 className={styles.filtrosTitulo}>Comida</h2>
          <button
            className={styles.limparTudoBtn}
            onClick={() => {
              setFiltroMarca(MARCA_CLEAR);
              setFiltroCategoria("");
              setSelectedCategorias([]);
              setFiltroPet("");
              setFiltroOfertas(false);
              setPrecoMin(priceRangeMin);
              setPrecoMax(priceRangeMax);
              navigate("/produtos");
            }}
          >
            Limpar tudo
          </button>
          <div className={styles.divisor}></div>
          <div className={styles.filtroGrupo}>
            <div
              className={styles.filtroHeader}
              onClick={() => setOpenGrupo((g) => ({ ...g, preco: !g.preco }))}
              style={{ cursor: "pointer" }}
            >
              <span>Faixa de preço</span>
              <span className={styles.filtroSeta}>
                {openGrupo.preco ? "▲" : "▼"}
              </span>
            </div>
            {openGrupo.preco && (
              <div className={styles.precoFaixa}>
                <div className={styles.filtroPreco}>
                  <input
                    type="range"
                    min={priceRangeMin}
                    max={priceRangeMax}
                    step={1}
                    value={precoMin}
                    onChange={(e) => {
                      const v = Number(e.target.value || priceRangeMin);
                      // ensure min does not surpass max - 1
                      const next = Math.min(v, precoMax - 1);
                      setPrecoMin(next);
                    }}
                  />

                  <input
                    type="range"
                    min={priceRangeMin}
                    max={priceRangeMax}
                    step={1}
                    value={precoMax}
                    onChange={(e) => {
                      const v = Number(e.target.value || priceRangeMax);
                      // ensure max does not go below min + 1
                      const next = Math.max(v, precoMin + 1);
                      setPrecoMax(next);
                    }}
                  />
                </div>
                <span className={styles.precoLabel}>
                  {formatCurrency(precoMin)} – {formatCurrency(precoMax)}
                </span>
              </div>
            )}
          </div>
          <div className={styles.divisor}></div>
          <div className={styles.filtroGrupo}>
            <div
              className={styles.filtroHeader}
              onClick={() =>
                setOpenGrupo((g) => ({ ...g, categoria: !g.categoria }))
              }
              style={{ cursor: "pointer" }}
            >
              <span>Categoria</span>
              <span className={styles.filtroSeta}>
                {openGrupo.categoria ? "▲" : "▼"}
              </span>
            </div>
            {openGrupo.categoria && (
              <ul className={styles.filtroLista}>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={effectivePetFilter === "Gato"}
                      onChange={() => toggleFiltroPetPorNome("Gato")}
                    />
                    Gato
                  </label>
                  <ul className={styles.filtroSublista}>
                    {(specialCategoriasPorPet.Gato || []).map((s) => {
                      const catOption = buscarCategoriaOption(s.nomeBusca);
                      const nomeToUse = catOption?.nome ?? s.nomeBusca;
                      const idStr =
                        catOption &&
                        catOption.id !== undefined &&
                        catOption.id !== null
                          ? String(catOption.id)
                          : null;
                      const checked = isCategoriaSelecionada(idStr, nomeToUse);
                      return (
                        <li key={s.nomeBusca}>
                          <label>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleSelectedCategoria({
                                  id: idStr,
                                  nome: nomeToUse,
                                  nomeBusca: s.nomeBusca,
                                })
                              }
                            />
                            {s.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={filtroOfertas}
                      onChange={() => setFiltroOfertas((prev) => !prev)}
                    />
                    Ofertas
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={effectivePetFilter === "Cachorro"}
                      onChange={() => toggleFiltroPetPorNome("Cachorro")}
                    />
                    Cachorro
                  </label>
                  <ul className={styles.filtroSublista}>
                    {(specialCategoriasPorPet.Cachorro || []).map((s) => {
                      const catOption = buscarCategoriaOption(s.nomeBusca);
                      const nomeToUse = catOption?.nome ?? s.nomeBusca;
                      const idStr =
                        catOption &&
                        catOption.id !== undefined &&
                        catOption.id !== null
                          ? String(catOption.id)
                          : null;
                      const checked = isCategoriaSelecionada(idStr, nomeToUse);
                      return (
                        <li key={s.nomeBusca}>
                          <label>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleSelectedCategoria({
                                  id: idStr,
                                  nome: nomeToUse,
                                  nomeBusca: s.nomeBusca,
                                })
                              }
                            />
                            {s.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            )}
          </div>
          <div className={styles.divisor}></div>
          <div className={styles.filtroGrupo}>
            <div
              className={styles.filtroHeader}
              onClick={() => setOpenGrupo((g) => ({ ...g, marca: !g.marca }))}
              style={{ cursor: "pointer" }}
            >
              <span>Marca</span>
              <span className={styles.filtroSeta}>
                {openGrupo.marca ? "▲" : "▼"}
              </span>
            </div>
            {openGrupo.marca && (
              <ul className={styles.filtroLista}>
                {marcas.map((marca) => (
                  <li key={marca}>
                    <label>
                      <input
                        type="checkbox"
                        checked={marcaSelecionada === marca}
                        onChange={() => toggleMarca(marca)}
                      />
                      {marca}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.divisor}></div>
        </aside>
        {isMobile && (
          <ProdutosMobileFilter
            priceRangeMin={priceRangeMin}
            priceRangeMax={priceRangeMax}
            precoMin={precoMin}
            precoMax={precoMax}
            setPrecoMin={setPrecoMin}
            setPrecoMax={setPrecoMax}
            filtroPet={filtroPet}
            toggleFiltroPetPorNome={toggleFiltroPetPorNome}
            filtroOfertas={filtroOfertas}
            setFiltroOfertas={setFiltroOfertas}
            marcas={marcas}
            filtroMarca={filtroMarca}
            toggleMarca={toggleMarca}
            onClear={handleClearFilters}
          />
        )}
        <div className={styles.produtosGrid}>
          {loading ? (
            <div className={styles.noResultsMessage}>Carregando...</div>
          ) : error ? (
            <div className={styles.noResultsMessage}>{error}</div>
          ) : (
            <>
              {normalizedSearchQuery && produtosFiltrados.length > 0 && (
                <div className={styles.searchResultsSummary}>
                  Resultados para <span>"{searchQueryParam}"</span>
                </div>
              )}
              {produtosFiltrados.length === 0 ? (
                <div className={styles.noResultsMessage}>
                  {normalizedSearchQuery ? (
                    <>
                      Nenhum produto encontrado para
                      <span> "{searchQueryParam}".</span>
                    </>
                  ) : (
                    "Nenhum produto encontrado."
                  )}
                </div>
              ) : (
                <>
                  {produtosFiltrados.slice(0, visibleCount).map((p) => {
                    const image =
                      p.imagem_url && p.imagem_url.trim()
                        ? p.imagem_url
                        : "/imgCards/RacaoSeca.png";
                    const price = p.precoMin || p.preco || null;
                    const priceOld = p.precoMax || null;
                    return (
                      <ProductCard
                        key={p.id}
                        image={image}
                        title={p.nome}
                        priceOld={priceOld}
                        price={price}
                        promocao={p.promocao}
                        productId={p.id}
                        onAdd={() =>
                          addToCart({
                            id: p.id,
                            nome: p.nome,
                            quantidade: 1,
                            precoUnit: price,
                            imagem_url: image,
                            ncm: p?.ncm ?? p?.produto?.ncm ?? null,
                          })
                        }
                      />
                    );
                  })}

                  {produtosFiltrados.length > visibleCount && (
                    <div className={styles.verMaisWrapper}>
                      <button
                        type="button"
                        className={styles.verMaisBtn}
                        onClick={() =>
                          setVisibleCount((v) =>
                            Math.min(v + PAGE_SIZE, produtosFiltrados.length)
                          )
                        }
                      >
                        Ver mais
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

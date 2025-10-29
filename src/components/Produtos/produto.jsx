import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./produto.module.css";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function Produto() {
  const { id } = useParams();
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`https://apismilepet.vercel.app/api/produtos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // normaliza resposta que pode vir com wrapper { data: { ... } }
        let prod = data;
        if (data && typeof data === "object") {
          if (Array.isArray(data)) prod = data[0] ?? null;
          else if (data.data && typeof data.data === "object") prod = data.data;
        }
        setProduto(prod);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar produto");
        setLoading(false);
      });
  }, [id]);

  // Galeria de imagens (mock)
  const [imgSelecionada, setImgSelecionada] = useState();
  const [quantidade, setQuantidade] = useState(1);
  const [variante, setVariante] = useState();
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);
  const [thumbStartIndex, setThumbStartIndex] = useState(0);
  // Accordion state (hook deve ser chamado em topo para evitar chamada condicional)
  const [openIndex, setOpenIndex] = useState(null);
  const toggleAccordion = (i) => setOpenIndex(openIndex === i ? null : i);
  // Favorito
  // Favoritos: manter array centralizado e sincronizar com localStorage
  const [favoritosArray, setFavoritosArray] = useState(() => {
    try {
      const raw = localStorage.getItem("smilepet_favoritos");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [favorito, setFavorito] = useState(false);

  // sincroniza localStorage quando o array muda
  useEffect(() => {
    try {
      localStorage.setItem(
        "smilepet_favoritos",
        JSON.stringify(favoritosArray)
      );
    } catch {
      /* ignore */
    }
  }, [favoritosArray]);

  // atualiza estado do produto atual quando id/produto ou array mudar
  useEffect(() => {
    const sid = String(
      id || produto?.id || produto?.SKU || produto?.codigo || ""
    );
    setFavorito(Boolean(sid && favoritosArray.includes(String(sid))));
  }, [favoritosArray, id, produto]);

  const toggleFavorito = () => {
    const sid = String(
      id || produto?.id || produto?.SKU || produto?.codigo || ""
    );
    if (!sid) return setFavorito((s) => !s);
    setFavoritosArray((prev) => {
      const exists = prev.includes(sid);
      if (exists) return prev.filter((x) => x !== sid);
      return [...prev, sid];
    });
  };

  const toggleFavoritoById = (sid) => {
    sid = String(sid || "");
    if (!sid) return;
    setFavoritosArray((prev) => {
      const exists = prev.includes(sid);
      if (exists) return prev.filter((x) => x !== sid);
      return [...prev, sid];
    });
  };

  // Variações via endpoint específico
  const [variacoesList, setVariacoesList] = useState([]);
  const [mapaPrecosState, setMapaPrecosState] = useState(null);
  const [loadingVariacoes, setLoadingVariacoes] = useState(true);

  useEffect(() => {
    // buscar variações do produto pai (usar produto.produto_pai_id quando disponível)
    // aguardamos que `produto` esteja carregado para descobrir o id do produto pai
    const parentId = produto?.produto_pai_id ?? produto?.id ?? id;
    if (!parentId) return;
    setLoadingVariacoes(true);
    console.debug("buscando variacoes para parentId", parentId);
    fetch(`https://apismilepet.vercel.app/api/produtos/variacoes/${parentId}`)
      .then((res) => res.json())
      .then((data) => {
        let arr = [];
        // casos possíveis: array direto, { data: [...] }, { data: { variacoes: [...] } }, { variacoes: [...] }, { items: [...] }
        if (Array.isArray(data)) arr = data;
        else if (data && Array.isArray(data.data)) arr = data.data;
        else if (data && data.data && Array.isArray(data.data.variacoes))
          arr = data.data.variacoes;
        else if (Array.isArray(data.variacoes)) arr = data.variacoes;
        else if (Array.isArray(data.items)) arr = data.items;
        console.debug(
          "variacoes response normalized length",
          arr.length,
          arr[0]
        );
        // normalize to array of objects
        setVariacoesList(arr);

        // construir mapa de preços com chave sendo o `id` da variação (string)
        const mp = {};
        arr.forEach((v) => {
          const key = String(v?.id ?? v?.codigo ?? v?.sku ?? v?.nome ?? v);
          const price =
            v?.preco ?? v?.price ?? v?.precoMin ?? v?.preco_min ?? null;
          if (price != null) mp[key] = price;
        });
        // incluir o produto pai também no mapa de preços (para exibir como opção)
        try {
          const prodKey = String(
            produto?.id ??
              produto?.SKU ??
              produto?.codigo ??
              produto?.nome ??
              ""
          );
          if (prodKey) {
            const prodPrice = produto?.preco ?? produto?.precoMin ?? null;
            if (prodPrice != null) mp[prodKey] = prodPrice;
          }
        } catch {
          /* ignore */
        }
        // se não houver entradas, mantemos null
        setMapaPrecosState(Object.keys(mp).length ? mp : null);

        // definir variante padrão: preferir o produto pai (mostrar preço do pai por default)
        if (produto && (produto.id ?? produto.SKU ?? produto.codigo)) {
          const prodKey = String(
            produto.id ?? produto.SKU ?? produto.codigo ?? produto.nome
          );
          setVariante((prev) => prev ?? prodKey);
        } else if (arr.length > 0) {
          const first = arr[0];
          const val = String(
            first.id ?? first.codigo ?? first.sku ?? first.nome ?? first
          );
          setVariante((prev) => prev ?? val);
        }
        setLoadingVariacoes(false);
      })
      .catch(() => {
        // silencioso
        setLoadingVariacoes(false);
      });
  }, [produto, id]);

  // Produtos relacionados (hooks posicionados antes dos retornos condicionais)
  const [relacionados, setRelacionados] = useState([]);
  const [loadingRelacionados, setLoadingRelacionados] = useState(true);
  const [errorRelacionados, setErrorRelacionados] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://apismilepet.vercel.app/api/produtos")
      .then((res) => res.json())
      .then((data) => {
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.produtos)) arr = data.produtos;
        const sid = String(
          id || produto?.id || produto?.SKU || produto?.codigo || ""
        );
        const filtrados = arr.filter(
          (p) => String(p.id || p.SKU || p.codigo || p.id) !== sid
        );
        setRelacionados(filtrados.slice(0, 4));
        setLoadingRelacionados(false);
      })
      .catch(() => {
        setErrorRelacionados("Erro ao carregar produtos relacionados");
        setLoadingRelacionados(false);
      });
  }, [id, produto]);

  useEffect(() => {
    if (produto) {
      const imagens = produto.imagens || [
        produto.imagem_url || "/imgCards/RacaoSeca.png",
      ];
      // Seleciona a terceira imagem por padrão se existir, senão a primeira
      const defaultIndex = imagens.length >= 3 ? 2 : 0;
      setIndiceSelecionado(defaultIndex);
      setImgSelecionada(imagens[defaultIndex]);
      // garante que a miniatura selecionada esteja visível
      setThumbStartIndex(Math.max(0, defaultIndex - 1));
      if (produto.variacoes && produto.variacoes.length > 0) {
        setVariante(produto.variacoes[0]);
      }
    }
  }, [produto]);

  // quando as variações vindas do endpoint mudam, definir variante padrão
  useEffect(() => {
    if (variacoesList && variacoesList.length > 0) {
      // pick first variation key
      const first = variacoesList[0];
      const val =
        first.id ?? first.codigo ?? first.nome ?? first.label ?? first;
      setVariante((prev) => prev ?? String(val));
    }
  }, [variacoesList]);

  const imagens = produto?.imagens || [
    produto?.imagem_url || "/imgCards/RacaoSeca.png",
  ];
  // Tenta descobrir o mapa de preços por variação em diferentes formatos possíveis
  const mapaPrecosRaw =
    produto?.precoVariacoes ||
    produto?.precosVariacoes ||
    produto?.variacoesPrecos ||
    produto?.precos_por_variacao ||
    produto?.precosPorVariacao ||
    produto?.precoPorVariacao ||
    produto?.precos;

  // Normaliza para um objeto { variante: preco }
  // preferir mapa vindo do endpoint de variações se disponível
  let mapaPrecos = mapaPrecosState ?? null;
  if (!mapaPrecos) {
    if (Array.isArray(mapaPrecosRaw) && Array.isArray(produto?.variacoes)) {
      mapaPrecos = {};
      produto.variacoes.forEach((v, i) => {
        mapaPrecos[v] = mapaPrecosRaw[i] ?? null;
      });
    } else if (mapaPrecosRaw && typeof mapaPrecosRaw === "object") {
      mapaPrecos = mapaPrecosRaw;
    }
  }

  const formatarPreco = (valor) => {
    if (valor === undefined || valor === null || isNaN(Number(valor)))
      return "";
    try {
      const n = Number(valor);
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(n);
    } catch {
      return String(valor);
    }
  };

  const precoAtual = (() => {
    if (mapaPrecos && variante && mapaPrecos[variante] != null) {
      return mapaPrecos[variante];
    }
    // Fallbacks: preco específico, senão menor preço disponível
    if (produto?.preco != null) return produto.preco;
    if (produto?.precoMin != null) return produto.precoMin;
    return null;
  })();
  const precoPrincipal =
    precoAtual ?? produto?.preco ?? produto?.precoMin ?? produto?.precoMax ?? 0;
  const temIntervalo =
    produto?.precoMin != null &&
    produto?.precoMax != null &&
    Number(produto.precoMin) !== Number(produto.precoMax);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!produto) return <div>Produto não encontrado.</div>;

  // Dados defensivos para campos que podem ter nomes variados
  const titulo = produto.nome || produto.title || produto.name || "Produto";
  const vendedor =
    produto.vendedor || produto.marca || produto.brand || "NextGard";
  const sku = produto.sku || produto.SKU || produto.codigo || "0984504";

  const visiveisThumbs = imagens.slice(thumbStartIndex, thumbStartIndex + 4);

  // valor padrão calculado para o select de variações (prioriza variações do endpoint)
  const defaultVariantValue = (() => {
    if (variacoesList && variacoesList.length > 0) {
      const v = variacoesList[0];
      return String(v?.id ?? v?.codigo ?? v?.sku ?? v?.nome ?? v?.label ?? v);
    }
    if (Array.isArray(produto?.variacoes) && produto.variacoes.length > 0) {
      return String(produto.variacoes[0]);
    }
    return "";
  })();

  // Debugging: mostrar no console os estados relevantes para o select de variações
  console.debug(
    "variacoesList (len)",
    variacoesList?.length,
    variacoesList?.[0]
  );
  console.debug("produto.variacoes", produto?.variacoes);
  console.debug(
    "variante",
    variante,
    "defaultVariantValue",
    defaultVariantValue
  );

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Coluna esquerda: galeria */}
        <div className={styles.galeria}>
          <div className={styles.thumbsColumn}>
            {thumbStartIndex > 0 && (
              <button
                aria-label="Subir miniaturas"
                className={styles.thumbNav}
                onClick={() =>
                  setThumbStartIndex(Math.max(0, thumbStartIndex - 1))
                }
              >
                ▲
              </button>
            )}
            <div className={styles.thumbsList}>
              {visiveisThumbs.map((img, idx) => {
                const globalIndex = thumbStartIndex + idx;
                const selecionada = globalIndex === indiceSelecionado;
                return (
                  <button
                    key={globalIndex}
                    className={`${styles.thumb} ${
                      selecionada ? styles.thumbSelected : ""
                    }`}
                    onClick={() => {
                      setIndiceSelecionado(globalIndex);
                      setImgSelecionada(img);
                    }}
                    aria-label={`Miniatura ${globalIndex + 1}`}
                  >
                    <img src={img} alt={`miniatura-${globalIndex}`} />
                  </button>
                );
              })}
            </div>
            {thumbStartIndex + 4 < imagens.length && (
              <button
                aria-label="Descer miniaturas"
                className={styles.thumbNav}
                onClick={() =>
                  setThumbStartIndex(
                    Math.min(imagens.length - 4, thumbStartIndex + 1)
                  )
                }
              >
                ▼
              </button>
            )}
          </div>

          <div className={styles.imagemPrincipal}>
            <img src={imgSelecionada} alt={titulo} />
          </div>
        </div>

        {/* Coluna direita: informações e ações */}
        <div className={styles.info}>
          <h1 className={styles.titulo}>{titulo}</h1>
          <div className={styles.vendedor}>
            por <a href="#">{vendedor}</a>
          </div>
          <div className={styles.sku}>SKU: {sku}</div>

          <div className={styles.precoArea}>
            {temIntervalo && (
              <div className={styles.faixaPreco}>
                <span className={styles.strike}>
                  {formatarPreco(Number(produto.precoMin))} -{" "}
                  {formatarPreco(Number(produto.precoMax))}
                </span>
              </div>
            )}
            <div className={styles.variacoesRow}>
              <select
                className={styles.select}
                value={variante ?? defaultVariantValue}
                onChange={(e) => {
                  setVariante(e.target.value);
                }}
              >
                {
                  // Preferir variações vindas do endpoint, senão usar produto.variacoes se existir
                }
                {loadingVariacoes ? (
                  <option key="loading" value="">
                    Carregando variações...
                  </option>
                ) : variacoesList && variacoesList.length > 0 ? (
                  // mostrar o produto pai como primeira opção (quando existir), seguido pelas variações
                  <>
                    {produto && produto.nome ? (
                      <option
                        key={String(
                          produto.id ??
                            produto.SKU ??
                            produto.codigo ??
                            produto.nome
                        )}
                        value={String(
                          produto.id ??
                            produto.SKU ??
                            produto.codigo ??
                            produto.nome
                        )}
                      >
                        {`${produto.nome} ${
                          produto.preco
                            ? " - " + formatarPreco(produto.preco)
                            : ""
                        }`}
                      </option>
                    ) : null}
                    {variacoesList.map((v) => {
                      const key = String(
                        v.id ?? v.codigo ?? v.sku ?? v.nome ?? v.label ?? v
                      );
                      const price =
                        v.preco ?? v.price ?? v.precoMin ?? v.preco_min ?? null;
                      const label = `${v.nome ?? v.label ?? key}${
                        price != null ? " - " + formatarPreco(price) : ""
                      }`;
                      return (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      );
                    })}
                  </>
                ) : Array.isArray(produto.variacoes) &&
                  produto.variacoes.length > 0 ? (
                  produto.variacoes.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))
                ) : (
                  <option key="none" value="" disabled>
                    Sem variações
                  </option>
                )}
              </select>

              <div className={styles.precoAtual}>
                {formatarPreco(precoPrincipal)}
              </div>
            </div>

            <div className={styles.acoesRow}>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) =>
                  setQuantidade(Math.max(1, Number(e.target.value) || 1))
                }
                className={styles.qtd}
                aria-label="Quantidade"
              />
              <button className={styles.btnComprar}>
                Adicionar ao carrinho
              </button>
              <button
                className={styles.btnFavorito}
                aria-label={
                  favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
                }
                aria-pressed={favorito}
                onClick={toggleFavorito}
              >
                {favorito ? (
                  <AiFillHeart size={20} color="#e11" />
                ) : (
                  <AiOutlineHeart size={20} color="#000" />
                )}
              </button>
            </div>
          </div>

          <div className={styles.acordeon}>
            {[
              {
                title: "Detalhes",
                content:
                  produto.descricao_curta ||
                  produto.detalhes ||
                  "Sem detalhes.",
              },
              {
                title: "Ingredientes e Análise",
                content:
                  produto.descricao_completa ||
                  "Informação dos ingredientes não disponível.",
              },
              {
                title: "Envio e devoluções",
                content:
                  produto.envio ||
                  produto.devolucoes ||
                  "Política de envio e devoluções.",
              },
            ].map((item, i) => (
              <div key={i} className={styles.itemAcordeon}>
                <button
                  className={styles.itemHeader}
                  onClick={() => toggleAccordion(i)}
                >
                  <span>{item.title}</span>
                  <span className={styles.plus}>
                    {openIndex === i ? "-" : "+"}
                  </span>
                </button>
                {openIndex === i && (
                  <div className={styles.itemBody}>{item.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Produtos relacionados */}
      <div className={styles.relacionadosSection}>
        <h2 className={styles.relacionadosTitulo}>Produtos relacionados</h2>
        <div className={styles.relacionadosGrid}>
          {loadingRelacionados ? (
            <div>Carregando...</div>
          ) : errorRelacionados ? (
            <div>{errorRelacionados}</div>
          ) : (
            relacionados.map((p) => (
              <div
                key={p.id || p.SKU || p.codigo}
                className={styles.relacionadoCard}
                onClick={() =>
                  navigate(`/produtos/${p.id || p.SKU || p.codigo}`)
                }
              >
                {
                  // botão de favorito por produto relacionado
                }
                <button
                  className={styles.cardFavorito}
                  title={
                    favoritosArray.includes(String(p.id || p.SKU || p.codigo))
                      ? "Remover dos favoritos"
                      : "Favoritar"
                  }
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    const sid = String(p.id || p.SKU || p.codigo || "");
                    toggleFavoritoById(sid);
                  }}
                  aria-pressed={favoritosArray.includes(
                    String(p.id || p.SKU || p.codigo)
                  )}
                >
                  {favoritosArray.includes(
                    String(p.id || p.SKU || p.codigo)
                  ) ? (
                    <AiFillHeart size={16} color="#e11" />
                  ) : (
                    <AiOutlineHeart size={16} color="#000" />
                  )}
                </button>
                <img
                  src={
                    p.imagem_url && p.imagem_url.trim()
                      ? p.imagem_url
                      : "/imgCards/RacaoSeca.png"
                  }
                  alt={p.nome || p.title}
                  className={styles.relacionadoImg}
                  onError={(e) => (e.target.src = "/imgCards/RacaoSeca.png")}
                />
                <h3 className={styles.relacionadoNome}>{p.nome || p.title}</h3>
                <div className={styles.relacionadoPreco}>
                  {p.precoMin
                    ? `$ ${p.precoMin}`
                    : p.preco
                    ? `$ ${p.preco}`
                    : ""}
                  {p.precoMax ? `–$ ${p.precoMax}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

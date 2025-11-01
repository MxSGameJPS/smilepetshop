import { useEffect, useState } from "react";
import styles from "./produtosOfertas.module.css";
import ProductCard from "../../ProductCard/ProductCard";
import { addToCart } from "../../../lib/cart.js";
import { useLocation } from "react-router-dom";

export default function ProdutosOfertas() {
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
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(100);
  const location = useLocation();
  // parse categorias from query string (comma separated names)
  const params = new URLSearchParams(location.search);
  const categoriasParam = params.get("categorias") || "";
  const categoriasFiltro = categoriasParam
    ? categoriasParam.split(",").map((s) => s.trim())
    : [];
  const marcaParam = params.get("marca") || "";

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
        setProdutos(arr);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar produtos");
        setLoading(false);
      });
  }, []);

  // Extrair marcas e categorias dos produtos
  const marcas = Array.from(
    new Set(produtos.map((p) => p.marca).filter(Boolean))
  );
  // categorias list intentionally omitted (not used directly)

  const produtosFiltrados = produtos.filter((p) => {
    const effectiveMarca = marcaParam || filtroMarca;
    const marcaOk = !effectiveMarca || p.marca === effectiveMarca;
    // if categoriasFiltro is provided in URL, match any of them
    let categoriaOk = true;
    if (categoriasFiltro.length) {
      categoriaOk = categoriasFiltro.includes(p.categoria);
    } else {
      categoriaOk = !filtroCategoria || p.categoria === filtroCategoria;
    }
    // Simulação de faixa de preço
    return marcaOk && categoriaOk;
  });

  // navigation handled inside ProductCard via useNavigate when opening a product

  return (
    <section className={styles.produtosContainer}>
      <div className={styles.produtosSection}>
        <aside className={styles.filtrosAside}>
          <h2 className={styles.filtrosTitulo}>Comida</h2>
          <button
            className={styles.limparTudoBtn}
            onClick={() => {
              setFiltroMarca("");
              setFiltroCategoria("");
              setPrecoMin(0);
              setPrecoMax(100);
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
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={precoMin}
                  onChange={(e) => setPrecoMin(Number(e.target.value))}
                  className={styles.precoRange}
                />
                <span className={styles.precoLabel}>
                  $ {precoMin},00–$ {precoMax},00
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
                  <input type="checkbox" /> Gato
                  <ul className={styles.filtroSublista}>
                    <li>
                      <input type="checkbox" /> Catnip e grama
                    </li>
                    <li>
                      <input type="checkbox" /> Comida seca
                    </li>
                    <li>
                      <input type="checkbox" /> Toppers de comida
                    </li>
                    <li>
                      <input type="checkbox" /> Comida úmida
                    </li>
                  </ul>
                </li>
                <li>
                  <input type="checkbox" /> Ofertas
                </li>
                <li>
                  <input type="checkbox" /> Cachorro
                  <ul className={styles.filtroSublista}>
                    <li>
                      <input type="checkbox" /> Comida enlatada
                    </li>
                    <li>
                      <input type="checkbox" /> Comida seca
                    </li>
                    <li>
                      <input type="checkbox" /> Toppers de comida
                    </li>
                    <li>
                      <input type="checkbox" /> Dietas Veterinárias Autorizadas
                    </li>
                    <li>
                      <input type="checkbox" /> Comida úmida
                    </li>
                  </ul>
                </li>
                <li>
                  <input type="checkbox" /> Guloseimas
                  <ul className={styles.filtroSublista}>
                    <li>
                      <input type="checkbox" /> Biscoitos e Padaria
                    </li>
                    <li>
                      <input type="checkbox" /> Guloseimas mastigáveis
                    </li>
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
                    <input type="checkbox" /> {marca}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.divisor}></div>
        </aside>
        <div className={styles.produtosGrid}>
          {loading ? (
            <div>Carregando...</div>
          ) : error ? (
            <div>{error}</div>
          ) : produtosFiltrados.length === 0 ? (
            <div>Nenhum produto encontrado.</div>
          ) : (
            produtosFiltrados.map((p) => {
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
                  productId={p.id}
                  onAdd={() =>
                    addToCart({
                      id: p.id,
                      nome: p.nome,
                      quantidade: 1,
                      precoUnit: price,
                      imagem_url: image,
                    })
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

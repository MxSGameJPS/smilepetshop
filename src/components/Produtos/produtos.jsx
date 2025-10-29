import { useEffect, useState } from "react";
import styles from "./produtos.module.css";
import { useNavigate } from "react-router-dom";

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
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(100);

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
  const categorias = Array.from(
    new Set(produtos.map((p) => p.categoria).filter(Boolean))
  );

  const produtosFiltrados = produtos.filter((p) => {
    const marcaOk = !filtroMarca || p.marca === filtroMarca;
    const categoriaOk = !filtroCategoria || p.categoria === filtroCategoria;
    // Simulação de faixa de preço
    return marcaOk && categoriaOk;
  });

  const navigate = useNavigate();

  function abrirProduto(id) {
    navigate(`/produtos/${id}`);
  }

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
            produtosFiltrados.map((p) => (
              <div
                key={p.id}
                className={styles.produtoCard}
                onClick={() => abrirProduto(p.id)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <button
                  className={styles.cardFavorito}
                  title="Favoritar"
                  tabIndex={-1}
                  style={{
                    zIndex: 2,
                    position: "absolute",
                    top: 16,
                    right: 16,
                  }}
                >
                  <span className={styles.cardHeart}>&#9825;</span>
                </button>
                <img
                  src={
                    p.imagem_url && p.imagem_url.trim()
                      ? p.imagem_url
                      : "/imgCards/RacaoSeca.png"
                  }
                  alt={p.nome}
                  className={styles.produtoImg}
                  onError={(e) => (e.target.src = "/imgCards/RacaoSeca.png")}
                />
                <h3 className={styles.produtoNome}>{p.nome}</h3>
                <div className={styles.produtoPreco}>
                  {p.precoMin ? `$ ${p.precoMin}` : `R$ ${p.preco}`}
                  {p.precoMax ? `–$ ${p.precoMax}` : ""}
                </div>
                <button
                  className={styles.cardBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirProduto(p.id);
                  }}
                  style={{ zIndex: 1 }}
                >
                  <span className={styles.cardBtnIcon}>Quero Este</span>
                  <span className={styles.cardBtnHover}>Ver mais</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

import styles from "./destaques.module.css";
import { useEffect, useState } from "react";

export default function Destaques() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const CARDS_PER_PAGE = 5;

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
        setError("Erro ao carregar destaques");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <section className={styles.destaquesSection}>
      <h2 className={styles.titulo}>Experimente, ame</h2>
      <div className={styles.categorias}>
        <button className={styles.categoriaBtn}>🐶 Cães</button>
        <button className={styles.categoriaBtn}>🐱 Gatos</button>
        <a href="/produtos" className={styles.verTudo}>
          Ver tudo delicioso &nbsp;→
        </a>
      </div>
      <div className={styles.cardsGrid}>
        {Array.isArray(produtos) && produtos.length > 0 ? (
          produtos
            .slice(carouselIndex, carouselIndex + CARDS_PER_PAGE)
            .map((produto) => (
              <div className={styles.card} key={produto.id}>
                <img
                  src={
                    produto.imagem_url && produto.imagem_url.trim()
                      ? produto.imagem_url
                      : "/imgCards/RacaoSeca.png"
                  }
                  alt={produto.nome}
                  className={styles.cardImg}
                  onError={(e) => (e.target.src = "/imgCards/RacaoSeca.png")}
                />
                {produto.promocao && (
                  <span className={styles.oferta}>Oferta!</span>
                )}
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{produto.nome}</h3>
                  {/* <p className={styles.cardDesc}>
                    {produto.descricao_curta ||
                      produto.descricao_completa ||
                      ""}
                  </p> */}
                  <div className={styles.cardPreco}>R$ {produto.preco}</div>
                </div>
                <button className={styles.favBtn} aria-label="Favoritar">
                  ♡
                </button>
              </div>
            ))
        ) : (
          <div className={styles.loading}>Nenhum produto encontrado.</div>
        )}
      </div>
      {produtos.length > CARDS_PER_PAGE && (
        <div className={styles.carouselNav}>
          <button
            className={styles.carouselBtn}
            onClick={() =>
              setCarouselIndex((i) => Math.max(i - CARDS_PER_PAGE, 0))
            }
            disabled={carouselIndex === 0}
          >
            ◀
          </button>
          <button
            className={styles.carouselBtn}
            onClick={() =>
              setCarouselIndex((i) =>
                Math.min(i + CARDS_PER_PAGE, produtos.length - CARDS_PER_PAGE)
              )
            }
            disabled={carouselIndex + CARDS_PER_PAGE >= produtos.length}
          >
            ▶
          </button>
        </div>
      )}
    </section>
  );
}

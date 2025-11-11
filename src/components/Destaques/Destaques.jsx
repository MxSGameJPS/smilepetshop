import styles from "./destaques.module.css";
import { useEffect, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import { addToCart } from "../../lib/cart";

export default function Destaques() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const CARDS_PER_PAGE = 10; // duas fileiras de 5 cards

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
        // mostrar apenas produtos pai (produto_pai_id === null)
        const parents = arr.filter((p) => {
          // o campo pode vir nomeado como 'produto_pai_id' ou 'produto.produto_pai_id'
          return (
            (p && p.produto_pai_id === null) ||
            (p && p.produto && p.produto.produto_pai_id === null)
          );
        });
        setProdutos(parents);
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
          (() => {
            const visible = produtos.slice(
              carouselIndex,
              carouselIndex + CARDS_PER_PAGE
            );
            const firstRow = visible.slice(0, 5);
            const secondRow = visible.slice(5, 10);
            return (
              <>
                <div className={styles.cardsRow}>
                  {firstRow.map((produto) => (
                    <ProductCard
                      key={produto.id}
                      image={
                        produto.imagem_url && produto.imagem_url.trim()
                          ? produto.imagem_url
                          : "/imgCards/RacaoSeca.png"
                      }
                      title={produto.nome}
                      price={produto.preco}
                      priceOld={produto.precoOld}
                      promocao={produto.promocao}
                      priceSubscriber={produto.precoAssinante}
                      productId={produto.id}
                      onAdd={() =>
                        addToCart({
                          id: produto.id,
                          nome: produto.nome,
                          quantidade: 1,
                          precoUnit: produto.preco,
                          imagem_url:
                            produto.imagem_url && produto.imagem_url.trim()
                              ? produto.imagem_url
                              : "/imgCards/RacaoSeca.png",
                        })
                      }
                    />
                  ))}
                </div>
                <div className={styles.cardsRow}>
                  {secondRow.map((produto) => (
                    <ProductCard
                      key={produto.id}
                      image={
                        produto.imagem_url && produto.imagem_url.trim()
                          ? produto.imagem_url
                          : "/imgCards/RacaoSeca.png"
                      }
                      title={produto.nome}
                      price={produto.preco}
                      priceOld={produto.precoOld}
                      promocao={produto.promocao}
                      priceSubscriber={produto.precoAssinante}
                      productId={produto.id}
                      onAdd={() =>
                        addToCart({
                          id: produto.id,
                          nome: produto.nome,
                          quantidade: 1,
                          precoUnit: produto.preco,
                          imagem_url:
                            produto.imagem_url && produto.imagem_url.trim()
                              ? produto.imagem_url
                              : "/imgCards/RacaoSeca.png",
                        })
                      }
                    />
                  ))}
                </div>
              </>
            );
          })()
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

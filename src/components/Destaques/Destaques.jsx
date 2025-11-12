import styles from "./destaques.module.css";
import { useEffect, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import { addToCart } from "../../lib/cart";

export default function Destaques() {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activePetFilter, setActivePetFilter] = useState("");
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
        setFilteredProdutos(parents);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar destaques");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const normalize = (val) =>
    val == null
      ? ""
      : String(val)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

  const applyPetFilter = (pet) => {
    setActivePetFilter(pet);
    setCarouselIndex(0);
    if (!pet) {
      setFilteredProdutos(produtos);
      return;
    }
    const normalizedTarget = normalize(pet);
    const next = produtos.filter((produto) => {
      const prodPet = normalize(produto?.pet);
      if (prodPet === normalizedTarget) return true;
      if (normalizedTarget === "cachorro")
        return prodPet === normalize("Cães") || prodPet === normalize("cao");
      if (normalizedTarget === "gato")
        return prodPet === normalize("Gatos") || prodPet === normalize("gata");
      return false;
    });
    setFilteredProdutos(next);
  };

  const handleFilterClick = (pet) => {
    setActivePetFilter((prev) => {
      const next = prev === pet ? "" : pet;
      applyPetFilter(next);
      return next;
    });
  };

  const produtosVisiveis = filteredProdutos;

  return (
    <section className={styles.destaquesSection}>
      <h2 className={styles.titulo}>Experimente, ame</h2>
      <div className={styles.categorias}>
        <button
          className={styles.categoriaBtn}
          type="button"
          onClick={() => handleFilterClick("Cachorro")}
          aria-pressed={activePetFilter === "Cachorro"}
        >
          🐶 Cães
        </button>
        <button
          className={styles.categoriaBtn}
          type="button"
          onClick={() => handleFilterClick("Gato")}
          aria-pressed={activePetFilter === "Gato"}
        >
          🐱 Gatos
        </button>
        <a href="/produtos" className={styles.verTudo}>
          Ver tudo delicioso &nbsp;→
        </a>
      </div>
      <div className={styles.cardsGrid}>
        {Array.isArray(produtosVisiveis) && produtosVisiveis.length > 0 ? (
          (() => {
            const visible = produtosVisiveis.slice(
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
      {produtosVisiveis.length > CARDS_PER_PAGE && (
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
                Math.min(
                  i + CARDS_PER_PAGE,
                  produtosVisiveis.length - CARDS_PER_PAGE
                )
              )
            }
            disabled={carouselIndex + CARDS_PER_PAGE >= produtosVisiveis.length}
          >
            ▶
          </button>
        </div>
      )}
    </section>
  );
}

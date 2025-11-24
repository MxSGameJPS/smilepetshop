import styles from "./destaques.module.css";
import { useEffect, useRef, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import { addToCart } from "../../lib/cart";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";

export default function Destaques() {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePetFilter, setActivePetFilter] = useState("");
  const fallbackImage = "/imgCards/RacaoSeca.png";

  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);

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

  // Split products into two rows
  const topRowProducts = produtosVisiveis.filter((_, idx) => idx % 2 === 0);
  const bottomRowProducts = produtosVisiveis.filter((_, idx) => idx % 2 === 1);
  // If bottom row is empty (e.g. only 1 product), just use top row or handle gracefully
  // If we want to fill space, we can just show what we have.

  const resolveImage = (produto) =>
    produto?.imagem_url && produto.imagem_url.trim()
      ? produto.imagem_url
      : fallbackImage;

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300; // Adjust scroll amount as needed
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

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
          <>
            {/* Top Row */}
            <div className={styles.carouselRowWrapper}>
              <button
                className={`${styles.navBtn} ${styles.prev}`}
                onClick={() => scroll(topRowRef, "left")}
                aria-label="Rolar para esquerda"
              >
                <SlArrowLeft />
              </button>
              <div className={styles.scrollContainer} ref={topRowRef}>
                {topRowProducts.map((produto) => (
                  <div className={styles.cardWrapper} key={produto.id}>
                    <ProductCard
                      image={resolveImage(produto)}
                      title={produto?.nome}
                      price={produto?.preco}
                      priceOld={produto?.precoOld}
                      promocao={produto?.promocao}
                      priceSubscriber={produto?.precoAssinante}
                      productId={produto?.id}
                      onAdd={() =>
                        addToCart({
                          id: produto?.id,
                          nome: produto?.nome,
                          quantidade: 1,
                          precoUnit: produto?.preco,
                          imagem_url: resolveImage(produto),
                          ncm: produto?.ncm ?? produto?.produto?.ncm ?? null,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                className={`${styles.navBtn} ${styles.next}`}
                onClick={() => scroll(topRowRef, "right")}
                aria-label="Rolar para direita"
              >
                <SlArrowRight />
              </button>
            </div>

            {/* Bottom Row */}
            {bottomRowProducts.length > 0 && (
              <div className={styles.carouselRowWrapper}>
                <button
                  className={`${styles.navBtn} ${styles.prev}`}
                  onClick={() => scroll(bottomRowRef, "left")}
                  aria-label="Rolar para esquerda"
                >
                  <SlArrowLeft />
                </button>
                <div className={styles.scrollContainer} ref={bottomRowRef}>
                  {bottomRowProducts.map((produto) => (
                    <div className={styles.cardWrapper} key={produto.id}>
                      <ProductCard
                        image={resolveImage(produto)}
                        title={produto?.nome}
                        price={produto?.preco}
                        priceOld={produto?.precoOld}
                        promocao={produto?.promocao}
                        priceSubscriber={produto?.precoAssinante}
                        productId={produto?.id}
                        onAdd={() =>
                          addToCart({
                            id: produto?.id,
                            nome: produto?.nome,
                            quantidade: 1,
                            precoUnit: produto?.preco,
                            imagem_url: resolveImage(produto),
                            ncm: produto?.ncm ?? produto?.produto?.ncm ?? null,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <button
                  className={`${styles.navBtn} ${styles.next}`}
                  onClick={() => scroll(bottomRowRef, "right")}
                  aria-label="Rolar para direita"
                >
                  <SlArrowRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.loading}>Nenhum produto encontrado.</div>
        )}
      </div>
    </section>
  );
}

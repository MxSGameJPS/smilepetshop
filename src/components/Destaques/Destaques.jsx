import styles from "./destaques.module.css";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../ProductCard/ProductCard";
import { addToCart } from "../../lib/cart";

export default function Destaques() {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePetFilter, setActivePetFilter] = useState("");
  const fallbackImage = "/imgCards/RacaoSeca.png";

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

  const { topLoop, bottomLoop, topDuration, bottomDuration } = useMemo(() => {
    if (!Array.isArray(produtosVisiveis) || produtosVisiveis.length === 0) {
      return {
        topLoop: [],
        bottomLoop: [],
        topDuration: "30s",
        bottomDuration: "30s",
      };
    }

    const topBase = produtosVisiveis.filter((_, idx) => idx % 2 === 0);
    const bottomRaw = produtosVisiveis.filter((_, idx) => idx % 2 === 1);
    const bottomBase = bottomRaw.length > 0 ? bottomRaw : topBase;

    const extendRow = (list) => {
      if (!Array.isArray(list) || list.length === 0) return [];
      const minCopies = list.length < 6 ? Math.ceil(12 / list.length) : 2;
      const extended = [];
      for (let i = 0; i < minCopies; i += 1) {
        extended.push(...list);
      }
      return extended;
    };

    const durationFor = (count) => {
      const base = count > 0 ? count * 4 : 24;
      const clamped = Math.max(24, Math.min(base, 60));
      return `${clamped}s`;
    };

    return {
      topLoop: extendRow(topBase),
      bottomLoop: extendRow(bottomBase),
      topDuration: durationFor(topBase.length || bottomBase.length),
      bottomDuration: durationFor(bottomBase.length || topBase.length),
    };
  }, [produtosVisiveis]);

  const resolveImage = (produto) =>
    produto?.imagem_url && produto.imagem_url.trim()
      ? produto.imagem_url
      : fallbackImage;

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
            <div className={styles.carouselRow}>
              <div
                className={styles.track}
                style={{ "--duration": topDuration }}
              >
                {topLoop.map((produto, index) => (
                  <div
                    className={styles.cardWrapper}
                    key={`${produto?.id ?? "sem-id"}-top-${index}`}
                  >
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
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.carouselRow} ${styles.bottomRow}`}>
              <div
                className={`${styles.track} ${styles.reverse}`}
                style={{ "--duration": bottomDuration }}
              >
                {bottomLoop.map((produto, index) => (
                  <div
                    className={styles.cardWrapper}
                    key={`${produto?.id ?? "sem-id"}-bottom-${index}`}
                  >
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
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.loading}>Nenhum produto encontrado.</div>
        )}
      </div>
    </section>
  );
}

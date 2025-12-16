import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./faixaSmileFriday.module.css";
import { useNavigate } from "react-router-dom";
// import { MdOutlineShoppingCartCheckout } from "react-icons/md";
// import { PiDog } from "react-icons/pi";

const API_URL = "https://apismilepet.vercel.app/api/produtos";
const FALLBACK_IMAGE = "/imgCards/RacaoSeca.png";
const GLOBAL_PROMO_END = new Date("2025-11-30T23:59:59-03:00").getTime();

// const resolvePromoEnd = (value) => {
//   if (!value) return GLOBAL_PROMO_END;
//   const parsed = new Date(value).getTime();
//   return Number.isNaN(parsed) ? GLOBAL_PROMO_END : parsed;
// };

// function formatRemaining(ms) {
//   const totalSec = Math.max(0, Math.floor(ms / 1000));
//   const days = Math.floor(totalSec / (24 * 3600));
//   const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
//   const mins = Math.floor((totalSec % 3600) / 60);
//   const secs = totalSec % 60;
//   return `${String(days).padStart(2, "0")}D ${String(hours).padStart(
//     2,
//     "0"
//   )} : ${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
// }

function MiniOfferCard({ product, onNavigate }) {
  const { id, nome, imagem_url, preco } = product || {};
  // const [remaining, setRemaining] = useState(() => {
  //   const target = resolvePromoEnd(promoFim);
  //   return Math.max(0, target - Date.now());
  // });

  // useEffect(() => {
  //   const target = resolvePromoEnd(promoFim);
  //   setRemaining(Math.max(0, target - Date.now()));
  // }, [promoFim]);

  // useEffect(() => {
  //   const target = resolvePromoEnd(promoFim);
  //   const interval = window.setInterval(() => {
  //     setRemaining(Math.max(0, target - Date.now()));
  //   }, 1000);
  //   return () => window.clearInterval(interval);
  // }, [promoFim]);

  const goToProduct = useCallback(() => {
    if (!id) return false;
    onNavigate(`/produtos/${id}`);
    return true;
  }, [id, onNavigate]);

  const goToOffers = useCallback(() => {
    onNavigate("/ofertas");
  }, [onNavigate]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const navigated = goToProduct();
      if (!navigated) goToOffers();
    }
  };

  return (
    <article
      className={styles.card}
      onClick={(event) => {
        // se houver id, navegar para o produto e impedir bubbling
        const navigated = goToProduct();
        if (navigated) event.stopPropagation();
        else goToOffers();
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={id ? `Ver detalhes de ${nome}` : `Ver ofertas`}
    >
      <div className={styles.cardHeader}>NATAL NA SMILEPET</div>
      <div className={styles.cardHero}>
        <img
          src={imagem_url || FALLBACK_IMAGE}
          alt={nome}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>
      <div className={styles.cardBody}>
        <h3 title={nome}>{nome}</h3>
        <span className={styles.cardPrice}>
          {preco != null
            ? `R$ ${Number(preco).toFixed(2).replace(".", ",")}`
            : "—"}
        </span>
      </div>
      {/* <footer className={styles.cardFooter}>
        <div className={styles.timerBadge}>
          <PiDog aria-hidden />
          <span className={styles.timerLabel}>Termina em</span>
          <span className={styles.timerValue}>
            {formatRemaining(remaining)}
          </span>
        </div>
        <button
          type="button"
          className={styles.cardButton}
          onClick={(event) => {
            event.stopPropagation();
            goToProduct();
          }}
        >
          <MdOutlineShoppingCartCheckout aria-hidden />
          <span>Comprar</span>
        </button>
      </footer> */}
    </article>
  );
}

export default function FaixaSmileFriday() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadProducts = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const fetchOptions = signal ? { signal } : {};
      const response = await fetch(API_URL, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.produtos)
        ? data.produtos
        : [];

      const promos = list.filter((item) =>
        Boolean(item?.promocao ?? item?.promo ?? item?.isPromo)
      );

      setProducts(promos);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Erro ao buscar produtos promocionais:", err);
      setError("Não foi possível carregar as ofertas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const duplicatedList = useMemo(() => {
    if (!products.length) return [];
    return [...products, ...products];
  }, [products]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const handleRetry = () => {
    loadProducts();
  };

  if (loading) {
    return (
      <section className={styles.banner} aria-label="Natal na SmilePet">
        <div className={styles.overlayContent}>
          <p className={styles.status}>Carregando ofertas...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.banner} aria-label="Natal na SmilePet">
        <div className={styles.overlayContent}>
          <p className={styles.status}>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetry}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className={styles.banner} aria-label="Natal na SmilePet">
        <div className={styles.overlayContent}>
          <p className={styles.status}>
            Ainda não há produtos em promoção. Volte mais tarde!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.banner} aria-label="Natal na SmilePet">
      <div
        className={styles.content}
        onClick={(e) => {
          // se o clique não veio de dentro de um card, navegar para /ofertas
          const card =
            e.target.closest && e.target.closest('article[role="button"]');
          if (!card) handleNavigate("/ofertas");
        }}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Natal na SmilePet</h2>
          <p className={styles.subtitle}>O presente perfeito para o seu pet!</p>
        </header>

        <div
          className={styles.carousel}
          role="presentation"
          onClick={(e) => {
            // se o clique não veio de dentro de um card (article[role="button"]),
            // considerar que o usuário clicou no background e navegar para /ofertas
            const card =
              e.target.closest && e.target.closest('article[role="button"]');
            if (!card) handleNavigate("/ofertas");
          }}
        >
          <div className={styles.carouselTrack}>
            {duplicatedList.map((product, index) => (
              <MiniOfferCard
                key={`${product?.id ?? "promo"}-${index}`}
                product={product}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import styles from "./bannerMobile.module.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TiChevronLeftOutline, TiChevronRightOutline } from "react-icons/ti";

export default function BannerMobile() {
  // substitua os nomes abaixo pelas imagens que você colocar em public/banners/
  const slides = [
    "/banners/bannerMobile.png",
    "/banners/bannerMobile2.png",
  ];
  const DELAY = 5000;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!paused) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, DELAY);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length]);

  function goTo(i) {
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function handleBannerClick(i) {
    // exemplo: se quiser que o segundo banner leve a /ofertas
    if (slides[i] && slides[i].includes("ofertas")) {
      navigate("/ofertas");
    }
  }

  return (
    <div className={styles.bannerWrapper}>
      <div
        className={styles.banner}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className={styles.slides}>
          {slides.map((src, i) => (
            <div
              key={src}
              className={`${styles.slide} ${i === index ? styles.active : ""}`}
              aria-hidden={i !== index}
              onClick={() => handleBannerClick(i)}
              style={src.includes("ofertas") ? { cursor: "pointer" } : {}}
            >
              <img
                src={src}
                alt={`Banner mobile ${i + 1}`}
                className={styles.bannerImage}
              />
            </div>
          ))}
        </div>

        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prev}
          aria-label="Anterior"
        >
          <TiChevronLeftOutline />
        </button>
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={next}
          aria-label="Próximo"
        >
          <TiChevronRightOutline />
        </button>
      </div>
      <div className={styles.dots}>
        {slides.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

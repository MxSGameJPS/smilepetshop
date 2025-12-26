import styles from "./banner.module.css";
import { useEffect, useRef, useState } from "react";
import BannerMobile from "./bannerMobile/bannerMobile";
import { useNavigate } from "react-router-dom";
import { TiChevronLeftOutline, TiChevronRightOutline } from "react-icons/ti";

export default function Banner() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      if (typeof window !== "undefined") setIsMobile(window.innerWidth <= 760);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const slides = ["/banners/banner6.webp","/banners/banner3.webp", "/banners/banner5.webp"];
  const DELAY = 5000; // 5 seconds
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobile) return; // não iniciar timer se estamos em versão mobile (BannerMobile será renderizado)
    if (timerRef.current) clearInterval(timerRef.current);
    if (!paused) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, DELAY);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length, isMobile]);

  if (isMobile) return <BannerMobile />;

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
    if (slides[i] === "/banners/banner6.webp") {
      window.open("https://lista.mercadolivre.com.br/pagina/smilepet/", "_blank");
    } else if (
      slides[i] === "/banners/banner5.webp" ||
      slides[i] === "/banners/banner3.webp"
    ) {
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
              style={{ cursor: "pointer" }}
            >
              <img
                src={src}
                alt={`Banner ${i + 1}`}
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

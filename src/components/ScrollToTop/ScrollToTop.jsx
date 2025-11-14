import React, { useEffect, useState } from "react";
import styles from "./scrollToTop.module.css";
import { SlArrowUp } from "react-icons/sl";

export default function ScrollToTop({ threshold = 200 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const handleClick = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  if (!visible) return null;

  return (
    <button
      className={styles.scrollBtn}
      onClick={handleClick}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <SlArrowUp className={styles.icon} />
    </button>
  );
}

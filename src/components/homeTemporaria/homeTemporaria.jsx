import React from "react";
import styles from "./homeTemporaria.module.css";

export default function HomeTemporaria() {
  return (
    <main className={styles.wrapper} role="main" aria-label="Em breve">
      <div className={styles.inner}>
        <img
          src="/homeTemporaria/homeTemporaria.jpg"
          alt="Em breve - SmilePet"
          className={styles.hero}
          loading="eager"
        />
      </div>
    </main>
  );
}

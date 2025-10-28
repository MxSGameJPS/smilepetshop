import styles from "./bannerMeio.module.css";

export default function BannerMeio() {
  return (
    <section className={styles.bannerMeioContainer}>
      <img
        src="/banners/banner4.png"
        alt="Banner promocional"
        className={styles.bannerMeioImg}
      />
    </section>
  );
}

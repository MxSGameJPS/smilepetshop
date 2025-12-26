import styles from "./bannerMeio.module.css";
import { Link } from 'react-router-dom';

export default function BannerMeio() {
  return (
    <section className={styles.bannerMeioContainer}>
      <Link to="/produtos?ofertas=true">
      <img
        src="/banners/banner4.webp"
        alt="Banner promocional"
        className={styles.bannerMeioImg}
      />
      </Link>
    </section>
  );
}

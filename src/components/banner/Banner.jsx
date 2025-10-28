import styles from './banner.module.css';

export default function Banner() {
  return (
    <div className={styles.banner}>
        <img src="/banners/banner3.png" alt="Banner SmilePet" className={styles.bannerImage} />
    </div>
  );
}

import styles from "./marcas.module.css";

const marcas = [
  { nome: "ALPO", img: "/Marcas/ALPO.webp" },
  { nome: "Catchow", img: "/Marcas/catchow.avif" },
  { nome: "Dog Chow", img: "/Marcas/dogchow.png" },
  { nome: "Fancy Feast", img: "/Marcas/Fancy-Feast.png" },
  { nome: "Foster", img: "/Marcas/Foster.png" },
  { nome: "Friskies", img: "/Marcas/friskies.png" },
  { nome: "One", img: "/Marcas/one.png" },
  { nome: "Proplan", img: "/Marcas/proplan.webp" },
  { nome: "Purina", img: "/Marcas/purina.png" },
  { nome: "Qualiday", img: "/Marcas/qualiday.png" },
];

export default function Marcas() {
  return (
    <section className={styles.marcasSection}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Marcas que amamos</h2>
        <a href="/marcas" className={styles.verTudo}>
          Ver tudo &nbsp;→
        </a>
      </div>
      <div className={styles.grid}>
        {marcas.map((marca) => (
          <div className={styles.card} key={marca.nome}>
            <img src={marca.img} alt={marca.nome} className={styles.logo} />
          </div>
        ))}
      </div>
    </section>
  );
}

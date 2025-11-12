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
  { nome: "Prolife", img: "/Marcas/prolife.png" },
  { nome: "ProHealth", img: "/Marcas/prohealth.png" },
  { nome: "Kanina", img: "/Marcas/kanina.png" },
  { nome: "AllCanis", img: "/Marcas/allcanis.png" },
  { nome: "CleanPads", img: "/Marcas/cleanpads.png" },
  { nome: "DentaLife", img: "/Marcas/dentalife.png" },
  { nome: "Doguitos", img: "/Marcas/doguitos.png" },
  { nome: "SpecialCroc", img: "/Marcas/specialcroc.png" },
  { nome: "TapeTudo", img: "/Marcas/tapetudo.png" },
  { nome: "FluffyRoe", img: "/Marcas/fluffy.png" },
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
      <div className={styles.marquee}>
        <div className={styles.marqueeTrack} aria-hidden="false">
          {[...marcas, ...marcas].map((marca, idx) => (
            <div className={styles.card} key={`${marca.nome}-${idx}`}>
              <img
                src={marca.img}
                alt={marca.nome}
                className={styles.logo}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import styles from "./avaliacao.module.css";
import { FaStar } from "react-icons/fa";

const avaliacoes = [
  {
    nota: 4.5,
    tempo: "3 dias atrás",
    titulo: "Experiência Superiosa",
    texto:
      "O serviço desta empresa foi simplesmente maravilhoso! Com certeza usarei os produtos deles novamente!",
    autor: "Narrador Navid",
  },
  {
    nota: 5,
    tempo: "3 dias atrás",
    titulo: "Altamente recomendado",
    texto:
      "Recomendo esta empresa sem sombra de dúvidas. Bom trabalho, pessoal!",
    autor: "Emma Carter",
  },
  {
    nota: 5,
    tempo: "3 dias atrás",
    titulo: "Tão bom quanto o esperado",
    texto:
      "Experimentei muitos outros serviços, mas este foi o melhor e atendeu completamente às minhas expectativas.",
    autor: "Pedro Jones",
  },
];

export default function Avaliacao() {
  return (
    <section className={styles.avaliacaoSection}>
      <div className={styles.avaliacaoHeader}>
            <h2 className={styles.titulo}>Excelente</h2>
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) => (
              <FaStar
              key={i}
              className={i < 4 ? styles.starFull : styles.starHalf}
              />
            ))}
        </div>
        <div className={styles.baseado}>
          Baseado em <a href="#">20.921 avaliações</a>
        </div>
        <div className={styles.trustpilot}>
          {/* <FaStar className={styles.starFull} /> */}
          <img className={styles.imagemLogoML} src="/Mercado-Livre-logo.png" alt="Mercado Livre" />
        </div>
      </div>
      <div className={styles.avaliacoesGrid}>
        {avaliacoes.map((a, idx) => (
          <div className={styles.avaliacaoCard} key={idx}>
            <div className={styles.stars}>
              {[...Array(Math.floor(a.nota))].map((_, i) => (
                <FaStar key={i} className={styles.starFull} />
              ))}
              {a.nota % 1 !== 0 && <FaStar className={styles.starHalf} />}
            </div>
            <span className={styles.tempo}>{a.tempo}</span>
            <h3 className={styles.cardTitulo}>{a.titulo}</h3>
            <p className={styles.cardTexto}>{a.texto}</p>
            <span className={styles.autor}>{a.autor}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

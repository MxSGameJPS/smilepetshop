import styles from "./avaliacao.module.css";
import { FaStar } from "react-icons/fa";

const avaliacoes = [
  {
    nota: 4.5,
    tempo: "7 dias atrás",
    titulo: "Experiência Superior",
    texto:
      "Veio bem embaladinho e os gatos adoraram esse sachê, uma deles é bem fresquinha pra comer e comeu bem, mesmo eu misturando com bastante água. Recomendo!",
  },
  {
    nota: 5,
    tempo: "2 dias atrás",
    titulo: "Altamente recomendado",
    texto:
      "Maravilhoso produto recomendo 🐈🐾🥰.",
  },
  {
    nota: 5,
    tempo: "13 dias atrás",
    titulo: "Tão bom quanto o esperado",
    texto:
      "É uma boa ração, macia, o meu cachorrinho idoso gosta muito, melhorou o bafinho dele. Recomendo. Vendedor super atencioso. Chegou antes do prazo. Obrigada.",
    
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
          Baseado em <a href="https://lista.mercadolivre.com.br/pagina/smilepet/#global_position=1" target="_blank" rel="noopener noreferrer">12 Mil avaliações</a>
        </div>
        <div className={styles.trustpilot}>
          {/* <FaStar className={styles.starFull} /> */}
          <a href='https://lista.mercadolivre.com.br/pagina/smilepet/#global_position=1' target="_blank" rel="noopener noreferrer">
          <img className={styles.imagemLogoML} src="/Mercado-Livre-logo.png" alt="Mercado Livre" />
          
          </a>
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

import { SlArrowRight } from "react-icons/sl";
import styles from "./card.module.css";

const cardsData = [
  {
    title: "Ração Seca",
    img: "/imgCards/RacaoSeca.png",
    description: "Comprar Ração Seca",
  },
  {
    title: "Ração Úmida",
    img: "/imgCards/RacaoUmida.png",
    description: "Comprar Ração Úmida",
  },
  {
    title: "Petiscos",
    img: "/imgCards/Petisco.png",
    description: "Comprar Petiscos",
  },
];

export default function Cards() {
  return (
    <div className={styles.cardsContainer}>
      {cardsData.map((card, idx) => (
        <div className={styles.card} key={card.title}>
          <img src={card.img} alt={card.title} className={styles.cardImg} />
          <div className={styles.cardInfo}>
            <span className={styles.cardDesc}>{card.description}</span>
            <h2 className={styles.cardTitle}>{card.title}</h2>
            <button
              className={styles.cardBtn}
              aria-label={`Ver mais sobre ${card.title}`}
            >
              <SlArrowRight size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

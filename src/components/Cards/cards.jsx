import { SlArrowRight } from "react-icons/sl";
import styles from "./card.module.css";
import { useNavigate } from "react-router-dom";

const cardsData = [
  {
    title: "Ração Seca",
    img: "/imgCards/RacaoSeca.png",
    description: "Ver Ração Seca",
  },
  {
    title: "Ração Úmida",
    img: "/imgCards/RacaoUmida.png",
    description: "Ver Ração Úmida",
  },
  {
    title: "Petiscos",
    img: "/imgCards/Petisco.png",
    description: "Ver Petiscos",
  },
  {
    title: "Higiene",
    img: "/imgCards/higiene.png",
    description: "Ver produtos de Higiene e Cuidados",
  },
];

export default function Cards() {
  const navigate = useNavigate();

  const mapping = {
    "Ração Seca": ["Ração para Gatos", "Ração para Cachorro"],
    "Ração Úmida": ["Ração Úmida para Gatos", "Ração Úmida para Cães"],
    Petiscos: ["Petiscos Cat", "Petiscos Dog"],
    "Higiene e Cuidados": [
      "Higiene e Cuidados para Cães",
      "Higiene e Cuidados para Gatos",
    ],
  };

  function handleOpen(cardTitle) {
    const cats = mapping[cardTitle] || [];
    const params = new URLSearchParams();
    if (cats.length) params.set("categorias", cats.join(","));
    navigate(`/produtos?${params.toString()}`);
  }

  return (
    <div className={styles.cardsContainer}>
      {cardsData.map((card) => (
        <div className={styles.card} key={card.title}>
          <img src={card.img} alt={card.title} className={styles.cardImg} />
          <div className={styles.cardInfo}>
            <span className={styles.cardDesc}>{card.description}</span>
            <h2 className={styles.cardTitle}>{card.title}</h2>
            <button
              className={styles.cardBtn}
              aria-label={`Ver mais sobre ${card.title}`}
              onClick={() => handleOpen(card.title)}
            >
              <SlArrowRight size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

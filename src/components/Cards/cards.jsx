import styles from "./card.module.css";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const cardsData = [
  {
    title: "Ração Seca",
    img: "/ImagensRacoes/1.png",
    description: "Ver Ração Seca",
  },
  {
    title: "Ração Úmida",
    img: "/ImagensRacoes/2.png",
    description: "Ver Ração Úmida",
  },
  {
    title: "Petiscos",
    img: "/ImagensRacoes/4.png",
    description: "Ver Petiscos",
  },
  {
    title: "Higiene",
    img: "/ImagensRacoes/5.png",
    description: "Ver Higiene ",
  },
];

export default function Cards() {
  const navigate = useNavigate();
  const categoriesCacheRef = useRef(null);
  const categoriesPromiseRef = useRef(null);

  const mapping = {
    "Ração Seca": ["Ração para Gatos", "Ração para Cachorro"],
    "Ração Úmida": ["Ração Úmida para Gatos", "Ração Úmida para Cães"],
    Petiscos: ["Petiscos Cat", "Petiscos Dog"],
    Higiene: ["Higiene e Cuidados para Cães", "Higiene e Cuidados para Gatos"],
  };

  const normalizeText = (value) =>
    value == null
      ? ""
      : String(value)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

  const resolveCategoryIds = (categoryNames, categoriesList) => {
    if (!Array.isArray(categoryNames) || !categoryNames.length) return [];
    const normalizedTargets = categoryNames
      .map((name) => normalizeText(name))
      .filter(Boolean);
    if (!normalizedTargets.length) return [];

    const collected = new Set();
    (categoriesList || []).forEach((item) => {
      const candidateNames = [
        item?.nome,
        item?.descricao,
        item?.label,
        item?.name,
      ]
        .map((n) => normalizeText(n))
        .filter(Boolean);
      const intersects = candidateNames.some((candidate) =>
        normalizedTargets.includes(candidate)
      );
      if (!intersects) return;
      const candidateId =
        item?.id ?? item?._id ?? item?.ID ?? item?.codigo ?? null;
      if (candidateId !== null && candidateId !== undefined) {
        const str = String(candidateId).trim();
        if (str) collected.add(str);
      }
    });
    return Array.from(collected);
  };

  async function ensureCategoriesLoaded() {
    if (categoriesCacheRef.current !== null) return categoriesCacheRef.current;
    if (!categoriesPromiseRef.current) {
      categoriesPromiseRef.current = fetch(
        "https://apismilepet.vercel.app/api/categorias/produtos"
      )
        .then((res) => res.json())
        .then((data) => {
          let arr = [];
          if (Array.isArray(data)) arr = data;
          else if (Array.isArray(data?.data)) arr = data.data;
          else if (Array.isArray(data?.categorias)) arr = data.categorias;
          else if (data && typeof data === "object")
            arr = Object.values(data).filter((item) => item);
          categoriesCacheRef.current = arr;
          return arr;
        })
        .catch(() => {
          categoriesCacheRef.current = [];
          return [];
        })
        .finally(() => {
          categoriesPromiseRef.current = null;
        });
    }
    return categoriesPromiseRef.current;
  }

  async function handleOpen(cardTitle) {
    const cats = mapping[cardTitle] || [];
    const params = new URLSearchParams();
    if (cats.length) {
      const categoriesData = await ensureCategoriesLoaded();
      const ids = resolveCategoryIds(cats, categoriesData);
      if (ids.length) params.set("categorias", ids.join(","));
      else params.set("categorias", cats.join(","));
    }
    const target = params.toString()
      ? `/produtos?${params.toString()}`
      : "/produtos";
    navigate(target);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  return (
    <div className={styles.cardsContainer}>
      {cardsData.map((card) => (
        <div
          className={styles.card}
          key={card.title}
          role="button"
          tabIndex={0}
          onClick={() => {
            void handleOpen(card.title);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void handleOpen(card.title);
            }
          }}
        >
          <img src={card.img} alt={card.title} className={styles.cardImg} />
          <div className={styles.cardInfo}>
            <span className={styles.cardDesc}>{card.description}</span>
            <h2 className={styles.cardTitle}>{card.title}</h2>
            {/* <button
              className={styles.cardBtn}
              aria-label={`Ver mais sobre ${card.title}`}
              onClick={() => handleOpen(card.title)}
            >
              <SlArrowRight size={15} />
            </button> */}
          </div>
        </div>
      ))}
    </div>
  );
}

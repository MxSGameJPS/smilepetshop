import React from "react";
import styles from "./marcastodas.module.css";

const marcas = [
  {
    nome: "Alpo",
    img: "/Marcas/ALPO.webp",
    texto:
      "Alpo é referência em nutrição para cães, oferecendo alimentos saborosos e balanceados para todas as fases da vida do seu pet.",
  },
  {
    nome: "Cat Chow",
    img: "/Marcas/catchow.avif",
    texto:
      "Cat Chow é especialista em nutrição felina, com fórmulas que cuidam da saúde e do bem-estar dos gatos.",
  },
  {
    nome: "Dog Chow",
    img: "/Marcas/dogchow.png",
    texto:
      "Dog Chow oferece alimentos completos para cães, com ingredientes selecionados e tecnologia Purina.",
  },
  {
    nome: "Fancy Feast",
    img: "/Marcas/Fancy-Feast.png",
    texto:
      "Fancy Feast é sinônimo de requinte para gatos, com receitas gourmet e ingredientes premium.",
  },
  {
    nome: "Foster",
    img: "/Marcas/Foster.png",
    texto:
      "Foster Premium traz qualidade e tradição em nutrição animal, com opções para diferentes necessidades.",
  },
  {
    nome: "Friskies",
    img: "/Marcas/friskies.png",
    texto:
      "Friskies é diversão e sabor para gatos, com variedade de sabores e texturas que agradam todos os felinos.",
  },
  {
    nome: "One",
    img: "/Marcas/one.png",
    texto:
      "Purina ONE combina ciência e natureza para oferecer nutrição avançada para cães e gatos.",
  },
  {
    nome: "Pro Plan",
    img: "/Marcas/proplan.webp",
    texto:
      "Pro Plan é a linha super premium da Purina, desenvolvida por veterinários para máxima performance e saúde.",
  },
  {
    nome: "Purina",
    img: "/Marcas/purina.png",
    texto:
      "Purina é líder mundial em nutrição animal, com décadas de pesquisa e inovação para o bem-estar dos pets.",
  },
  {
    nome: "Qualiday",
    img: "/Marcas/qualiday.png",
    texto:
      "Qualiday Especial Premium oferece alimentos de alta qualidade para cães e gatos, com foco em saúde e sabor.",
  },
];

export default function MarcasTodas() {
  return (
    <section className={styles.marcasTodasSection}>
      <h1 className={styles.title}>Todas as marcas</h1>
      <div className={styles.grid}>
        {marcas.map((marca) => (
          <div key={marca.nome} className={styles.card}>
            <img src={marca.img} alt={marca.nome} className={styles.logo} />
            <h2 className={styles.nome}>{marca.nome}</h2>
            <p className={styles.texto}>{marca.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

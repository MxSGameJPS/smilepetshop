import React from "react";
import styles from "./marcastodas.module.css";

const marcas = [
  {
    nome: "Alpo",
    img: "/Marcas/ALPO.png",
    texto:
      "Alpo é referência em nutrição para cães, oferecendo alimentos saborosos e balanceados para todas as fases da vida do seu pet.",
  },
  {
    nome: "Cat Chow",
    img: "/Marcas/catchow.png",
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
    img: "/Marcas/proplan.png",
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
  {
    nome: "Prolife",
    img: "/Marcas/prolife.png",
    texto:
      "Prolife traz fórmulas balanceadas e ingredientes selecionados para manter a saúde e a vitalidade do seu pet.",
  },
  {
    nome: "ProHealth",
    img: "/Marcas/prohealth.png",
    texto:
      "ProHealth desenvolve produtos com foco em bem-estar e nutrição funcional para necessidades específicas.",
  },
  {
    nome: "Kanina",
    img: "/Marcas/kanina.png",
    texto:
      "Kanina oferece opções práticas e nutritivas para animais de estimação, com foco em qualidade e sabor.",
  },
  {
    nome: "AllCanis",
    img: "/Marcas/allcanis.png",
    texto:
      "AllCanis tem uma linha completa de produtos para cuidados diários e alimentação de cães, com bom custo-benefício.",
  },
  {
    nome: "CleanPads",
    img: "/Marcas/cleanpads.png",
    texto:
      "CleanPads oferece soluções de higiene para pets, incluindo tapetes higiênicos e acessórios práticos.",
  },
  {
    nome: "DentaLife",
    img: "/Marcas/dentalife.png",
    texto:
      "DentaLife ajuda na higiene oral do seu pet com produtos especializados que auxiliam na prevenção do tártaro.",
  },
  {
    nome: "Doguitos",
    img: "/Marcas/doguitos.png",
    texto:
      "Doguitos produz petiscos crocantes e saborosos, perfeitos para recompensas e treinamento.",
  },
  {
    nome: "SpecialCroc",
    img: "/Marcas/specialcroc.png",
    texto:
      "SpecialCroc oferece alimentos premium com formulações específicas para diferentes fases e necessidades.",
  },
  {
    nome: "TapeTudo",
    img: "/Marcas/tapetudo.png",
    texto:
      "TapeTudo traz acessórios e produtos práticos para o cuidado e conforto do lar com pets.",
  },
  {
    nome: "FluffyRoe",
    img: "/Marcas/fluffy.png",
    texto:
      "FluffyRoe apresenta produtos estéticos e nutritivos para quem busca cuidar da pelagem e do bem-estar do pet.",
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

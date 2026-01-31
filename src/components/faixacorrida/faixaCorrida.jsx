import React from "react";
import styles from "./faixaCorrida.module.css";
import { PiDog } from "react-icons/pi";
import { FaCat } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const texto = (
  <>
    <span className={styles.frase}>CARNAVAL NA SMILEPET</span>
    <span className={styles.icone}>
      <PiDog />
    </span>
    <span className={styles.oferta}>15% a 25% OFF</span>
    <span className={styles.icone}>
      <FaCat />
    </span>
  </>
);

export default function FaixaCorrida() {
  const navigate = useNavigate();
  return (
    <div className={styles.faixaSmileFriday}>
      <div className={styles.marqueeWrapper}>
        <div
          className={styles.marqueeContent}
          onClick={() => navigate("/ofertas")}
          style={{ cursor: "pointer" }}
          title="Ver ofertas"
        >
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
          {texto}
        </div>
      </div>
    </div>
  );
}
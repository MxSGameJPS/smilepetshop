import React, { useState } from "react";
import styles from "./produtosMobileFilter.module.css";

export default function ProdutosMobileFilter({
  priceRangeMin,
  priceRangeMax,
  precoMin,
  precoMax,
  setPrecoMin,
  setPrecoMax,
  filtroPet,
  toggleFiltroPetPorNome,
  filtroOfertas,
  setFiltroOfertas,
  marcas,
  filtroMarca,
  toggleMarca,
  onClear,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.mobileFilterWrapper} aria-hidden={false}>
      <button
        className={styles.fabButton}
        onClick={() => setOpen(true)}
        aria-label="Abrir filtros"
      >
        Filtrar
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.panelHeader}>
              <strong>Filtros</strong>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Fechar filtros"
              >
                ✕
              </button>
            </div>

            <div className={styles.panelBody}>
              <section className={styles.section}>
                <label className={styles.sectionTitle}>Faixa de preço</label>
                <div className={styles.rangeRow}>
                  <input
                    type="range"
                    min={priceRangeMin}
                    max={priceRangeMax}
                    step={1}
                    value={precoMin}
                    onChange={(e) => {
                      const v = Number(e.target.value || priceRangeMin);
                      const next = Math.min(v, precoMax - 1);
                      setPrecoMin(next);
                    }}
                  />
                  <input
                    type="range"
                    min={priceRangeMin}
                    max={priceRangeMax}
                    step={1}
                    value={precoMax}
                    onChange={(e) => {
                      const v = Number(e.target.value || priceRangeMax);
                      const next = Math.max(v, precoMin + 1);
                      setPrecoMax(next);
                    }}
                  />
                </div>
                <div className={styles.rangeLabel}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(precoMin)}
                  <span> — </span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(precoMax)}
                </div>
              </section>

              <section className={styles.section}>
                <label className={styles.sectionTitle}>Pet</label>
                <div className={styles.petRow}>
                  <button
                    className={`${styles.petBtn} ${
                      filtroPet === "Cachorro" ? styles.active : ""
                    }`}
                    onClick={() => toggleFiltroPetPorNome("Cachorro")}
                  >
                    Cachorro
                  </button>
                  <button
                    className={`${styles.petBtn} ${
                      filtroPet === "Gato" ? styles.active : ""
                    }`}
                    onClick={() => toggleFiltroPetPorNome("Gato")}
                  >
                    Gato
                  </button>
                </div>
              </section>

              <section className={styles.section}>
                <label className={styles.sectionTitle}>Ofertas</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!filtroOfertas}
                    onChange={() => setFiltroOfertas((p) => !p)}
                  />
                  Mostrar apenas ofertas
                </label>
              </section>

              <section className={styles.section}>
                <label className={styles.sectionTitle}>Marca</label>
                <select
                  className={styles.select}
                  value={filtroMarca || ""}
                  onChange={(e) => toggleMarca(e.target.value || "")}
                >
                  <option value="">Todas</option>
                  {marcas &&
                    marcas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </section>
            </div>

            <div className={styles.panelFooter}>
              <button
                className={styles.clearBtn}
                onClick={() => {
                  onClear && onClear();
                  setOpen(false);
                }}
              >
                Limpar
              </button>
              <button
                className={styles.applyBtn}
                onClick={() => setOpen(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

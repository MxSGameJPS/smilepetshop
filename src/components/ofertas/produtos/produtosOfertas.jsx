import React, { useEffect, useState } from "react";
import CardOfertas from "./cardOfertas/cardOfertas";
import style from "./produtosOfertas.module.css";

export default function ProdutosOfertas() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("https://apismilepet.vercel.app/api/produtos")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        // data can be an array or an object with a list property
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.produtos)) arr = data.produtos;
        else if (Array.isArray(data.items)) arr = data.items;

        // garantia: normalize id field
        const normalized = (arr || []).map((p) => ({
          ...p,
          id: p.id || p._id || p.uid,
        }));
        const promocoes = normalized.filter(
          (p) => p && (p.promocao === true || p.promocao === "true")
        );
        setProdutos(promocoes);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Erro ao buscar produtos:", err);
        setError(err.message || String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return <div className={style.produtosOfertas}>Carregando ofertas...</div>;
  if (error)
    return (
      <div className={style.produtosOfertas}>Erro ao carregar: {error}</div>
    );

  return (
    <div className={style.produtosOfertas}>
      <div className={style.produtosHeader}>
        <h1>Nossa Primeira Smile <span>Friday</span></h1>
        <p>Confira nossas ofertas especiais para seu pet!</p>
      </div>
      <div className={style.produtosGrid}>
      {produtos.length === 0 ? (
        <div>Nenhuma promoção ativa no momento.</div>
      ) : (
        produtos.map((p, idx) => <CardOfertas key={p.id || idx} product={p} />)
      )}
      </div>
    </div>
  );
}

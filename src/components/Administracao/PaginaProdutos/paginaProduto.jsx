import React, { useEffect, useState } from "react";
import styles from "./paginaProdutos.module.css";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function PaginaProdutos() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const resolveStockValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? "-" : trimmed;
    }
    if (Array.isArray(value)) {
      return value.length ? resolveStockValue(value[0]) : "-";
    }
    if (typeof value === "object") {
      const preferredKeys = [
        "valor",
        "value",
        "estoque",
        "quantidade",
        "amount",
        "current",
      ];
      for (const key of preferredKeys) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const nested = resolveStockValue(value[key]);
          if (nested !== "-") return nested;
        }
      }
      const first = Object.values(value)[0];
      return first !== undefined ? resolveStockValue(first) : "-";
    }
    return String(value);
  };

  const formatPrice = (v) => {
    const num = Number(v) || 0;
    const norm = num > 10000 ? num / 100 : num;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(norm);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://apismilepet.vercel.app/api/produtos", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`Erro ${res.status}`);
        setProducts([]);
        return;
      }

      // normalize to array
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.produtos)) list = data.produtos;
      else if (data && typeof data === "object") {
        // maybe object keyed by id or single product
        if (Object.keys(data).length > 0 && !data._id && !data.id) {
          list = Object.values(data);
        } else {
          list = [data];
        }
      }

      setProducts(list || []);
    } catch (err) {
      setError(String(err));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  // filter products by name or sku (case-insensitive)
  const filteredProducts = (products || []).filter((it) => {
    if (!query || !query.trim()) return true;
    const q = String(query).trim().toLowerCase();
    const name = (it.nome || it.title || it.name || it.productName || "")
      .toString()
      .toLowerCase();
    const sku = (it.sku || it.SKU || it.codigo || "").toString().toLowerCase();
    return name.includes(q) || sku.includes(q);
  });

  const totalPages = Math.max(
    1,
    Math.ceil((filteredProducts.length || 0) / 100)
  );
  const pageItems = filteredProducts.slice(page * 100, (page + 1) * 100);

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        alert(`Erro ao excluir: ${res.status}`);
        return;
      }
      setProducts((p) =>
        p.filter((it) => String(it._id || it.id) !== String(id))
      );
    } catch (err) {
      alert(`Erro de rede: ${String(err)}`);
    }
  };

  const navigate = useNavigate();
  const handleView = (id) => navigate(`/adm/produtos/${id}`);
  // abrir a página do produto (rota de edição/visualização)
  const handleEdit = (id) => navigate(`/adm/produtos/${id}`);
  const handleCreate = () => navigate(`/adm/produtos/novo`);

  return (
    <section className={styles.paginaProdutosBg}>
      <h3>Página de Produtos — Administração</h3>

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <div className={styles.actionsRow}>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              setPage(0);
              fetchProducts();
            }}
            disabled={loading}
          >
            Atualizar
          </button>
          <button
            className={styles.btnSuccess}
            onClick={handleCreate}
            type="button"
          >
            <FaPlus style={{ marginRight: 6 }} /> Cadastrar produto
          </button>
        </div>
        <div className={styles.searchWrapper}>
          <input
            className={styles.searchInput}
            placeholder="Pesquisar por nome ou SKU"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setPage(0);
              }
            }}
          />
          {query && (
            <button
              className={`${styles.btnSecondary} ${styles.searchClear}`}
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className={styles.infoText}>Carregando produtos…</p>
      ) : error ? (
        <p className={`${styles.infoSub} ${styles.error}`}>
          Erro ao carregar: {String(error)}
        </p>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <strong>Total de produtos:</strong> {filteredProducts.length}
            {filteredProducts.length !== products.length && (
              <span style={{ marginLeft: 8, color: "#666" }}>
                (de {products.length} no total)
              </span>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>SKU</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((it) => {
                  const id = it._id || it.id || it.codigo || it.sku || "";
                  const name =
                    it.nome ||
                    it.title ||
                    it.name ||
                    it.productName ||
                    "(sem nome)";
                  const sku = it.sku || it.SKU || it.codigo || "-";
                  const priceRaw =
                    Number(
                      it.precoUnit ??
                        it.preco ??
                        it.price ??
                        it.valor ??
                        it.unit_price ??
                        0
                    ) || 0;
                  const stockRaw =
                    it.estoque ?? it.stock ?? it.qtd ?? it.quantity ?? null;
                  const stock = resolveStockValue(stockRaw);
                  return (
                    <tr key={String(id)}>
                      <td>{name}</td>
                      <td>{sku}</td>
                      <td>{formatPrice(priceRaw)}</td>
                      <td>{stock}</td>
                      <td>
                        <button
                          className={styles.iconBtn}
                          title="Visualizar"
                          onClick={() => handleView(id)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className={styles.iconBtn}
                          title="Editar"
                          onClick={() => handleEdit(id)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={styles.iconBtnDanger}
                          title="Excluir"
                          onClick={() => handleDelete(id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <button
              className={styles.btnPrimary}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </button>
            <span>
              {" "}
              Página {page + 1} de {totalPages}{" "}
            </span>
            <button
              className={styles.btnPrimary}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Próximo
            </button>
          </div>
        </>
      )}
    </section>
  );

  // end of component - main UI returned above
}

import React, { useEffect, useState } from "react";
import styles from "./paginaProdutos.module.css";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaPen,
  FaTrash,
  FaBoxOpen,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";

function tryParseArray(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  if (Array.isArray(respData.produtos)) return respData.produtos;
  return [];
}

export default function PaginaProdutos() {
  const [parentProducts, setParentProducts] = useState([]); // Only parents
  const [childrenMap, setChildrenMap] = useState({}); // parentId -> [children]

  const [filteredParents, setFilteredParents] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [expandedRows, setExpandedRows] = useState({}); // { parentId: boolean }

  const navigate = useNavigate();

  const resolveStock = (p) => {
    let raw = p.estoque || p.stock || p.quantidade || p.qtd || 0;
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      try {
        const trimmed = raw.trim();
        if (trimmed.startsWith("{")) {
          const parsed = JSON.parse(trimmed);
          if (parsed && parsed.valor !== undefined) return Number(parsed.valor);
        }
      } catch (e) {}
      const parsedNum = Number(raw);
      return isNaN(parsedNum) ? 0 : parsedNum;
    }
    if (typeof raw === "object" && raw !== null && raw.valor !== undefined)
      return Number(raw.valor);
    return 0;
  };

  const getProductImage = (p) => {
    if (p.imagem_url) return p.imagem_url;
    if (p.images && Array.isArray(p.images) && p.images.length > 0)
      return p.images[0];
    if (p.img) return p.img;
    if (p.image) return p.image;
    if (p.foto) return p.foto;
    return null;
  };

  async function load() {
    setLoading(true);
    try {
      // Fetch Products
      const pResp = await fetch("https://apismilepet.vercel.app/api/produtos", {
        cache: "no-store",
      });
      const pData = await pResp.json().catch(() => []);
      const arr = tryParseArray(pData);

      // Fetch Categories
      const cResp = await fetch(
        "https://apismilepet.vercel.app/api/categorias/produtos"
      );
      const cData = await cResp.json().catch(() => []);
      const catArr = Array.isArray(cData) ? cData : cData.data || [];

      const map = {};
      catArr.forEach((c) => {
        const id = c.id || c._id;
        const name = c.nome || c.name;
        if (id && name) map[String(id)] = name;
      });
      setCategoriesMap(map);

      // Process Grouping
      const valid = arr.filter((x) => x && typeof x === "object");

      const parents = [];
      const cMap = {};

      valid.forEach((p) => {
        // Identify parent: produto_pai_id is NULL or undefined (or maybe 0 depending on API, but sticking to null requirement)
        const isParent = !p.produto_pai_id;

        if (isParent) {
          parents.push(p);
        } else {
          const pid = String(p.produto_pai_id);
          if (!cMap[pid]) cMap[pid] = [];
          cMap[pid].push(p);
        }
      });

      // Propagate Parent Stock to Children as requested
      parents.forEach((parent) => {
        const pid = String(parent.id || parent._id || parent.codigo);
        const kids = cMap[pid];
        if (kids) {
          kids.forEach((k) => {
            k.estoque = parent.estoque;
            k.stock = parent.stock;
            k.quantidade = parent.quantidade;
            k.qtd = parent.qtd;
          });
        }
      });

      setParentProducts(parents);
      setChildrenMap(cMap);
      setFilteredParents(parents); // Init filter
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();

    // Filter Parents: Match self OR match any child
    const filtered = parentProducts.filter((p) => {
      const pid = String(p.id || p._id || p.codigo);
      const children = childrenMap[pid] || [];

      const matches = (prod) => {
        const name = (prod.nome || prod.name || prod.title || "").toLowerCase();
        const sku = (prod.sku || prod.codigo || "").toLowerCase();
        return name.includes(lower) || sku.includes(lower);
      };

      if (matches(p)) return true;
      // Check children
      return children.some((c) => matches(c));
    });

    setFilteredParents(filtered);
    setCurrentPage(1);
  }, [searchTerm, parentProducts, childrenMap]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`))
      return;
    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/produtos/${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        alert("Produto excluído com sucesso.");
        load(); // Reload to re-group properly
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredParents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredParents.length / itemsPerPage);

  const getStatusBadge = (qty) => {
    if (qty <= 0)
      return (
        <span className={`${styles.statusBadge} ${styles.statusOutOfStock}`}>
          • Esgotado
        </span>
      );
    if (qty < 5)
      return (
        <span className={`${styles.statusBadge} ${styles.statusLowStock}`}>
          • Baixo
        </span>
      );
    return (
      <span className={`${styles.statusBadge} ${styles.statusInStock}`}>
        • Em Estoque
      </span>
    );
  };

  const formatPrice = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const getCategoryName = (id) => {
    if (!id) return "-";
    return categoriesMap[String(id)] || id;
  };

  const renderRow = (p, isChild = false) => {
    const id = p.id || p._id || p.codigo;
    const pid = String(id);
    const name = p.nome || p.name || p.title || "Sem Nome";
    const sku = p.sku || p.codigo || "SKU--";
    const catId = p.categoria || p.categoryId;
    const categoryName = getCategoryName(catId);
    const price = Number(p.preco || p.price || p.valor || 0);
    const stock = resolveStock(p);
    const imgUrl = getProductImage(p);

    const hasChildren =
      !isChild && childrenMap[pid] && childrenMap[pid].length > 0;
    const isExpanded = expandedRows[pid];

    const rowStyle = isChild
      ? { backgroundColor: "#f9fafb", fontSize: "0.95em" }
      : {};
    const paddingLeft = isChild ? "60px" : "24px";

    return (
      <React.Fragment key={pid}>
        <tr style={rowStyle}>
          <td style={{ width: "50px", paddingLeft: isChild ? "30px" : "24px" }}>
            <input type="checkbox" />
          </td>
          <td style={{ paddingLeft: paddingLeft }}>
            <div className={styles.productInfo}>
              {/* Expand Button for Parents */}
              {!isChild && hasChildren && (
                <button
                  onClick={() => toggleRow(pid)}
                  style={{
                    marginRight: "8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isExpanded ? (
                    <FaChevronDown size={12} />
                  ) : (
                    <FaChevronRight size={12} />
                  )}
                </button>
              )}
              {/* Spacer if no children or is child */}
              {(!hasChildren || isChild) && (
                <div style={{ width: "20px" }}></div>
              )}

              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={name}
                  className={styles.productImg}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div
                  className={styles.productImg}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ccc",
                  }}
                >
                  <FaBoxOpen size={20} />
                </div>
              )}
              <div className={styles.productNameCol}>
                <h5>
                  {name}{" "}
                  {isChild && (
                    <span style={{ fontSize: "10px", color: "#a855f7" }}>
                      (Variação)
                    </span>
                  )}
                </h5>
                <span className={styles.skuSub}>{sku}</span>
              </div>
            </div>
          </td>
          <td>{categoryName}</td>
          <td>{formatPrice(price)}</td>
          <td>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {getStatusBadge(stock)}
              <span
                style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}
              >
                {stock} unid.
              </span>
            </div>
          </td>
          <td>
            <div className={styles.actions}>
              <button
                className={`${styles.actionBtn} ${styles.editBtn}`}
                title="Editar"
                onClick={() => navigate(`/adm/produtos/${id}/editar`)}
              >
                <FaPen size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                title="Deletar"
                onClick={() => handleDelete(id, name)}
              >
                <FaTrash size={14} />
              </button>
            </div>
          </td>
        </tr>
        {/* Render Children if Expanded */}
        {hasChildren &&
          isExpanded &&
          childrenMap[pid].map((child) => renderRow(child, true))}
      </React.Fragment>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Produtos</h2>
        <div className={styles.searchBar}>
          <FaSearch color="#9ca3af" />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={styles.addButton}
          onClick={() => navigate("/adm/produtos/novo")}
        >
          <FaPlus /> Novo Produto
        </button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Lista de Produtos</div>
          <div className={styles.paginationInfo}>
            {filteredParents.length > 0
              ? `${indexOfFirstItem + 1} - ${Math.min(
                  indexOfLastItem,
                  filteredParents.length
                )} de ${filteredParents.length}`
              : "0 de 0"}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>
                  <input type="checkbox" />
                </th>
                <th>Nome do Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Status / Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Carregando produtos...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                currentItems.map((p) => renderRow(p, false))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                border: "1px solid #eee",
                background: "white",
                borderRadius: "4px",
              }}
            >
              &lt;
            </button>
            <span style={{ alignSelf: "center", fontSize: "14px" }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                border: "1px solid #eee",
                background: "white",
                borderRadius: "4px",
              }}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

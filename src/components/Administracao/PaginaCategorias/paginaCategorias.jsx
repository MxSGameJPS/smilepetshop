import React, { useEffect, useState } from "react";
import styles from "./paginaCategorias.module.css";
import {
  FaSearch,
  FaPlus,
  FaPen,
  FaTrash,
  FaArrowLeft,
  FaSave,
} from "react-icons/fa";

function tryParseArray(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  return [];
}

export default function PaginaCategorias() {
  const [view, setView] = useState("list"); // 'list' | 'form'
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    descricao: "",
  });

  // Pagination (Client Side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://apismilepet.vercel.app/api/categorias/produtos"
      );
      const data = await res.json().catch(() => []);
      const arr = tryParseArray(data);

      // Sort by id desc or name? Let's sort by ID descending to see new ones
      arr.sort((a, b) => (b.id || 0) - (a.id || 0));

      setCategories(arr);
      setFilteredCategories(arr);
    } catch (error) {
      console.error("Erro ao carregar categorias", error);
      alert("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = categories.filter((c) => {
      const name = (c.nome || "").toLowerCase();
      const desc = (c.descricao || "").toLowerCase();
      return name.includes(lower) || desc.includes(lower);
    });
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const handleCreate = () => {
    setFormData({ id: null, nome: "", descricao: "" });
    setView("form");
  };

  const handleEdit = (cat) => {
    setFormData({
      id: cat.id || cat._id,
      nome: cat.nome || "",
      descricao: cat.descricao || "",
    });
    setView("form");
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deseja excluir a categoria "${name}"?`)) return;

    try {
      const res = await fetch(
        `https://apismilepet.vercel.app/api/categorias/produtos/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        alert("Categoria excluída com sucesso!");
        loadCategories();
      } else {
        alert("Erro ao excluir categoria.");
      }
    } catch (e) {
      alert("Erro de conexão.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const url = isEdit
      ? `https://apismilepet.vercel.app/api/categorias/produtos/${formData.id}`
      : `https://apismilepet.vercel.app/api/categorias/produtos`;

    const method = isEdit ? "PUT" : "POST";

    // Payload
    const payload = {
      nome: formData.nome,
      descricao: formData.descricao,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Categoria ${isEdit ? "atualizada" : "criada"} com sucesso!`);
        setView("list");
        loadCategories();
      } else {
        const txt = await res.text();
        alert(`Erro ao salvar: ${txt}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao salvar.");
    }
  };

  // Render List
  if (view === "list") {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCategories.slice(
      indexOfFirstItem,
      indexOfLastItem
    );
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Categorias</h2>
          <div className={styles.searchBar}>
            <FaSearch color="#9ca3af" />
            <input
              className={styles.searchInput}
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.addButton} onClick={handleCreate}>
            <FaPlus /> Nova Categoria
          </button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Lista de Categorias</div>
            <div className={styles.paginationInfo}>
              {filteredCategories.length > 0
                ? `${indexOfFirstItem + 1} - ${Math.min(
                    indexOfLastItem,
                    filteredCategories.length
                  )} de ${filteredCategories.length}`
                : "0 de 0"}
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      Carregando...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      Nenhuma categoria encontrada.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((cat, idx) => (
                    <tr key={idx}>
                      <td>#{cat.id || cat._id}</td>
                      <td>
                        <strong>{cat.nome}</strong>
                      </td>
                      <td>{cat.descricao}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            title="Editar"
                            onClick={() => handleEdit(cat)}
                          >
                            <FaPen size={14} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Excluir"
                            onClick={() =>
                              handleDelete(cat.id || cat._id, cat.nome)
                            }
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
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

  // Render Form
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {formData.id ? "Editar Categoria" : "Nova Categoria"}
        </h2>
        <button
          className={styles.addButton}
          style={{ backgroundColor: "#6b7280" }}
          onClick={() => setView("list")}
        >
          <FaArrowLeft /> Voltar
        </button>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formTitle}>Dados da Categoria</div>
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome da Categoria</label>
            <input
              className={styles.input}
              required
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Ração para Gatos"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.textarea}
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descreva a categoria..."
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => setView("list")}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              <FaSave style={{ marginRight: 8 }} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

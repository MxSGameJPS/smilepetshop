import React, { useEffect, useState } from "react";
import styles from "./cupons.module.css";
import {
  FaSearch,
  FaPlus,
  FaPen,
  FaTrash,
  FaArrowLeft,
  FaSave,
} from "react-icons/fa";

const API_BASE = "https://apismilepet.vercel.app/api/coupons";

function tryParseArray(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  return [];
}

export default function Cupons() {
  const [view, setView] = useState("list"); // 'list' | 'form'
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase: 0,
    max_discount: 0,
    start_date: "",
    end_date: "",
    usage_limit: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Falha ao buscar cupons");
      const data = await res.json();
      const list = tryParseArray(data);
      setCoupons(list);
      setFilteredCoupons(list);
    } catch (err) {
      alert("Erro ao carregar cupons: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = coupons.filter((c) => {
      const code = (c.code || "").toLowerCase();
      return code.includes(lower);
    });
    setFilteredCoupons(filtered);
    setCurrentPage(1);
  }, [searchTerm, coupons]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: 0,
      max_discount: 0,
      start_date: "",
      end_date: "",
      usage_limit: 0,
      active: true,
    });
    setView("form");
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      code: c.code || "",
      discount_type: c.discount_type || "percentage",
      discount_value: c.discount_value || 0,
      min_purchase: c.min_purchase || 0,
      max_discount: c.max_discount || 0,
      start_date: c.start_date ? c.start_date.slice(0, 16) : "",
      end_date: c.end_date ? c.end_date.slice(0, 16) : "",
      usage_limit: c.usage_limit || 0,
      active: c.active ?? true,
    });
    setView("form");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      fetchCoupons();
      alert("Cupom excluído com sucesso.");
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_purchase: Number(formData.min_purchase),
        max_discount: Number(formData.max_discount),
        usage_limit: Number(formData.usage_limit),
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : null,
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Erro ao salvar cupom");
      }

      alert(`Cupom ${editingId ? "atualizado" : "criado"} com sucesso!`);
      setView("list");
      fetchCoupons();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // List View
  if (view === "list") {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCoupons.slice(
      indexOfFirstItem,
      indexOfLastItem
    );
    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gerenciar Cupons</h2>
          <div className={styles.searchBar}>
            <FaSearch color="#9ca3af" />
            <input
              className={styles.searchInput}
              placeholder="Buscar por código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.addButton} onClick={handleCreate}>
            <FaPlus /> Novo Cupom
          </button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Lista de Cupons</div>
            <div className={styles.paginationInfo}>
              {filteredCoupons.length > 0
                ? `${indexOfFirstItem + 1} - ${Math.min(
                    indexOfLastItem,
                    filteredCoupons.length
                  )} de ${filteredCoupons.length}`
                : "0 de 0"}
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Mínimo</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      Carregando cupons...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      Nenhum cupom encontrado.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.code}</strong>
                      </td>
                      <td>
                        {c.discount_type === "percentage"
                          ? "Porcentagem"
                          : "Valor Fixo"}
                      </td>
                      <td>
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}%`
                          : `R$ ${Number(c.discount_value).toFixed(2)}`}
                      </td>
                      <td>R$ {Number(c.min_purchase).toFixed(2)}</td>
                      <td>
                        {c.end_date
                          ? new Date(c.end_date).toLocaleDateString()
                          : "Indeterminado"}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            c.active
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {c.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            title="Editar"
                            onClick={() => handleEdit(c)}
                          >
                            <FaPen size={14} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Excluir"
                            onClick={() => handleDelete(c.id)}
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

  // Form View (New/Edit)
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {editingId ? "Editar Cupom" : "Novo Cupom"}
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
        <div className={styles.formTitle}>Dados do Cupom</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Código do Cupom *</label>
              <input
                className={styles.input}
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="Ex: SMILE10"
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Desconto</label>
              <select
                className={styles.select}
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed_amount">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Valor do Desconto *</label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Compra Mínima (R$)</label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                name="min_purchase"
                value={formData.min_purchase}
                onChange={handleChange}
              />
            </div>
            {formData.discount_type === "percentage" && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Desconto Máximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  name="max_discount"
                  value={formData.max_discount}
                  onChange={handleChange}
                  placeholder="0 para ilimitado"
                />
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Data de Início</label>
              <input
                type="datetime-local"
                className={styles.input}
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Data de Término</label>
              <input
                type="datetime-local"
                className={styles.input}
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Limite de Uso</label>
              <input
                type="number"
                className={styles.input}
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                placeholder="0 para ilimitado"
              />
            </div>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                />
                <span>Cupom Ativo?</span>
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => setView("list")}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              <FaSave style={{ marginRight: 8 }} />{" "}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

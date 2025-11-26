import React, { useEffect, useState } from "react";
import styles from "./cupons.module.css";

const API_BASE = "https://apismilepet.vercel.app/api/coupons";

export default function Cupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for Modal/Form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
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

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Falha ao buscar cupons");
      const data = await res.json();
      // Normalize data if wrapped
      const list = Array.isArray(data) ? data : data.data || [];
      setCoupons(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    setShowModal(true);
  };

  const handleEdit = async (coupon) => {
    setEditingId(coupon.id);
    // Fetch details to ensure we have latest data
    try {
      const res = await fetch(`${API_BASE}/${coupon.id}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.data || data; // normalize
        setFormData({
          code: c.code || "",
          discount_type: c.discount_type || "percentage",
          discount_value: c.discount_value || 0,
          min_purchase: c.min_purchase || 0,
          max_discount: c.max_discount || 0,
          start_date: c.start_date ? c.start_date.slice(0, 16) : "", // format for datetime-local
          end_date: c.end_date ? c.end_date.slice(0, 16) : "",
          usage_limit: c.usage_limit || 0,
          active: c.active ?? true,
        });
      } else {
        // Fallback to list data if fetch fails
        setFormData({
          code: coupon.code || "",
          discount_type: coupon.discount_type || "percentage",
          discount_value: coupon.discount_value || 0,
          min_purchase: coupon.min_purchase || 0,
          max_discount: coupon.max_discount || 0,
          start_date: coupon.start_date ? coupon.start_date.slice(0, 16) : "",
          end_date: coupon.end_date ? coupon.end_date.slice(0, 16) : "",
          usage_limit: coupon.usage_limit || 0,
          active: coupon.active ?? true,
        });
      }
      setShowModal(true);
    } catch (err) {
      alert("Erro ao carregar detalhes do cupom");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Erro ao excluir cupom: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "PUT" : "POST";

      // Prepare payload
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_purchase: Number(formData.min_purchase),
        max_discount: Number(formData.max_discount),
        usage_limit: Number(formData.usage_limit),
        // Ensure dates are ISO strings if needed, or keep as is depending on backend
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

      setShowModal(false);
      fetchCoupons(); // Refresh list
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerenciar Cupons</h1>
        <button className={styles.createBtn} onClick={handleCreate}>
          + Novo Cupom
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className={styles.tableContainer}>
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
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <strong>{coupon.code}</strong>
                    </td>
                    <td>
                      {coupon.discount_type === "percentage"
                        ? "Porcentagem"
                        : "Fixo"}
                    </td>
                    <td>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `R$ ${Number(coupon.discount_value).toFixed(2)}`}
                    </td>
                    <td>R$ {Number(coupon.min_purchase).toFixed(2)}</td>
                    <td>
                      {coupon.end_date
                        ? new Date(coupon.end_date).toLocaleDateString()
                        : "Indeterminado"}
                    </td>
                    <td>
                      <span
                        className={
                          coupon.active
                            ? styles.activeBadge
                            : styles.inactiveBadge
                        }
                      >
                        {coupon.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEdit(coupon)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(coupon.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingId ? "Editar Cupom" : "Novo Cupom"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Código do Cupom *</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="Ex: SMILE10"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tipo de Desconto</label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleChange}
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed_amount">Valor Fixo (R$)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Valor do Desconto *</label>
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Compra Mínima (R$)</label>
                <input
                  type="number"
                  name="min_purchase"
                  value={formData.min_purchase}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              {formData.discount_type === "percentage" && (
                <div className={styles.formGroup}>
                  <label>Desconto Máximo (R$)</label>
                  <input
                    type="number"
                    name="max_discount"
                    value={formData.max_discount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0 para ilimitado"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Data de Início</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Data de Término</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Limite de Uso</label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleChange}
                  min="0"
                  placeholder="0 para ilimitado"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  Ativo
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

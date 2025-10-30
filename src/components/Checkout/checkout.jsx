import React, { useState } from "react";
import styles from "./checkout.module.css";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    numero: "",
    address2: "",
    city: "",
    state: "",
    postal: "",
    phone: "",
    email: "",
    shipDifferent: false,
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePostalChange = (e) => {
    // allow only digits
    const digits = (e.target.value || "").replace(/\D/g, "");
    // limit to 8 characters (CEP padrão BR)
    const limited = digits.slice(0, 8);
    setForm((f) => ({ ...f, postal: limited }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ENDPOINT =
      "https://apismilepet.vercel.app/api/checkout/billing/create";
    try {
      // map local camelCase form fields to API expected snake_case
      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        company: form.company,
        address1: form.address1,
        numero: form.numero,
        address2: form.address2,
        city: form.city,
        state: form.state,
        postal: form.postal,
        phone: form.phone,
        email: form.email,
        ship_different: !!form.shipDifferent,
        notes: form.notes,
      };

      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error("Erro ao enviar checkout:", data);
        alert("Erro ao enviar dados. Tente novamente mais tarde.");
        return;
      }
      // salvar localmente também como backup
      try {
        localStorage.setItem("smilepet_checkout_billing", JSON.stringify(form));
      } catch (err) {
        console.warn("localStorage save failed", err);
      }
      // navegar para a página de confirmação do pedido
      navigate("/pedido", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Erro de conexão. Verifique se o servidor de API está rodando.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Detalhes de faturamento</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Primeiro nome *</span>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Sobrenome *</span>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Nome da empresa (opcional)</span>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>CEP *</span>
              <input
                name="postal"
                value={form.postal}
                onChange={handlePostalChange}
                inputMode="numeric"
                pattern="\d*"
                maxLength={8}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Estado</span>
              <input name="state" value={form.state} onChange={handleChange} />
            </label>
          </div>

          <div className={`${styles.row2} ${styles.rowAddress}`}>
            <label className={styles.field}>
              <span>Endereço da Rua *</span>
              <input
                name="address1"
                value={form.address1}
                onChange={handleChange}
                required
                placeholder="Nome da rua"
              />
            </label>
            <label className={styles.field}>
              <span>Número *</span>
              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                required
                placeholder="Ex: 123"
              />
            </label>
          </div>
          <label className={styles.field}>
            <span>Complemento</span>
            <input
              name="address2"
              value={form.address2}
              onChange={handleChange}
              placeholder="Apartamento, suíte, unidade, etc. (opcional)"
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Cidade *</span>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Telefone *</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Endereço de email *</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Observações sobre o pedido (opcional)</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Observações sobre o seu pedido, por exemplo, notas especiais para a entrega."
            ></textarea>
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn}>
              Continuar
            </button>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

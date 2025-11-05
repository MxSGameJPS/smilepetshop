import React, { useState, useEffect } from "react";
import styles from "./checkout.module.css";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../lib/auth";

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cpf: "",
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

  // pre-fill form from logged-in user if available
  useEffect(() => {
    let mounted = true;
    async function loadUserData() {
      try {
        const u = getUser();
        if (!u) return;

        // determine id field (support several possible shapes)
        let id =
          u.id ||
          u._id ||
          u.uuid ||
          u.clientId ||
          u.cliente_id ||
          (u.user && (u.user.id || u.user._id)) ||
          null;

        let data = null;
        if (id) {
          const resp = await fetch(
            `https://apismilepet.vercel.app/api/client/${id}`
          );
          // consider 2xx and 304 as acceptable (server may return 304 Not Modified)
          if (resp.status >= 200 && resp.status < 400)
            data = await resp.json().catch(() => null);
        }

        // if we still don't have id/email but we have a token (JWT), try decode it
        if (!data && !id && u && typeof u.token === "string") {
          try {
            const t = u.token;
            const parts = t.split(".");
            if (parts.length === 3) {
              const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
              const json = decodeURIComponent(
                atob(payload)
                  .split("")
                  .map(function (c) {
                    return (
                      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                  })
                  .join("")
              );
              const obj = JSON.parse(json);
              // try common fields
              id = id || obj.id || obj._id || obj.sub || obj.userId || null;
              if (!data && id) {
                const resp2 = await fetch(
                  `https://apismilepet.vercel.app/api/client/${id}`
                );
                if (resp2.status >= 200 && resp2.status < 400)
                  data = await resp2.json().catch(() => null);
              }
              // if token payload has email, we can use it later for fallback
              if (!u.email && obj.email) u.email = obj.email;
            }
          } catch {
            // ignore decode errors
          }
        }

        // if we didn't get data by id, try to find by email (fallback)
        if (!data && u.email) {
          try {
            const listResp = await fetch(
              `https://apismilepet.vercel.app/api/client`
            );
            if (listResp.status >= 200 && listResp.status < 400) {
              const listData = await listResp.json().catch(() => null);
              const arr = Array.isArray(listData)
                ? listData
                : listData?.data || listData?.items || listData?.clientes || [];
              const matched = arr.find((it) => {
                const em = (it.email || it.e_mail || it.correo || "") + "";
                return em.toLowerCase() === String(u.email).toLowerCase();
              });
              if (matched) data = matched;
            }
          } catch {
            // ignore
          }
        }

        if (!data) return;

        // normalize returned client data to our form shape
        const client = data?.data || data?.client || data;
        const mapped = {
          firstName: client.first_name || client.nome || client.name || "",
          lastName: client.last_name || client.sobrenome || "",
          cpf: client.cpf || client.cpf_cnpj || client.document || "",
          company: client.company || "",
          address1: client.address1 || client.rua || client.logradouro || "",
          numero: client.numero || client.number || "",
          address2: client.address2 || client.complemento || "",
          city: client.city || client.cidade || "",
          state: client.state || client.estado || "",
          postal: client.postal || client.cep || client.cep_cliente || "",
          phone: client.phone || client.whatsapp || client.telefone || "",
          email: client.email || "",
        };

        if (mounted) {
          // debug: log what we are about to set so developer can inspect
          try {
            console.debug("checkout: fetched client ->", client);
            console.debug("checkout: mapped form ->", mapped);
          } catch {
            // ignore
          }
          setForm((f) => ({ ...f, ...mapped }));
        }
      } catch {
        // ignore failures silently
      }
    }

    loadUserData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCpfChange = (e) => {
    // allow only digits for CPF
    const digits = (e.target.value || "").replace(/\D/g, "");
    // limit to 11 digits (CPF)
    const limited = digits.slice(0, 11);
    setForm((f) => ({ ...f, cpf: limited }));
  };

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
        cpf: form.cpf,
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
            <label className={styles.field}>
              <span>CPF</span>
              <input
                name="cpf"
                value={form.cpf}
                onChange={handleCpfChange}
                inputMode="numeric"
                placeholder="Apenas números"
                maxLength={11}
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

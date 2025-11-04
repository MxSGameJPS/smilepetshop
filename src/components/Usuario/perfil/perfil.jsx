import React, { useState, useEffect } from "react";
import styles from "./perfil.module.css";
import {
  getUser,
  setUser,
  clearUser,
  broadcastUserUpdate,
} from "../../../lib/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Perfil() {
  const navigate = useNavigate();
  const saved = getUser();
  // compute a stable id value (primitive) so we can depend on it without triggering
  // the effect on every render due to object identity changes from JSON.parse
  const savedId =
    saved?.id ??
    saved?._id ??
    saved?.clienteId ??
    saved?.clientId ??
    saved?.id_cliente ??
    saved?.data?.id ??
    saved?.data?._id ??
    null;

  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    whatsapp: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // if we have a saved user, try to fetch the canonical record from the API
    async function loadClient() {
      const currentSaved = getUser();
      if (!currentSaved) return;
      const id = savedId;
      if (!id) {
        // fallback: populate from saved local copy
        setForm((f) => ({
          ...f,
          nome: currentSaved?.nome ?? currentSaved?.name ?? "",
          sobrenome: currentSaved?.sobrenome ?? currentSaved?.lastName ?? "",
          rua: currentSaved?.rua ?? currentSaved?.street ?? "",
          numero: currentSaved?.numero ?? currentSaved?.number ?? "",
          bairro: currentSaved?.bairro ?? currentSaved?.neighborhood ?? "",
          cidade: currentSaved?.cidade ?? currentSaved?.city ?? "",
          estado: currentSaved?.estado ?? currentSaved?.state ?? "",
          whatsapp: currentSaved?.whatsapp ?? currentSaved?.phone ?? "",
          email: currentSaved?.email ?? currentSaved?.emailAddress ?? "",
        }));
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `https://apismilepet.vercel.app/api/client/${id}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          // if fetch fails, still populate from saved local copy
          setForm((f) => ({
            ...f,
            nome: currentSaved?.nome ?? currentSaved?.name ?? "",
            sobrenome: currentSaved?.sobrenome ?? currentSaved?.lastName ?? "",
            rua: currentSaved?.rua ?? currentSaved?.street ?? "",
            numero: currentSaved?.numero ?? currentSaved?.number ?? "",
            bairro: currentSaved?.bairro ?? currentSaved?.neighborhood ?? "",
            cidade: currentSaved?.cidade ?? currentSaved?.city ?? "",
            estado: currentSaved?.estado ?? currentSaved?.state ?? "",
            whatsapp: currentSaved?.whatsapp ?? currentSaved?.phone ?? "",
            email: currentSaved?.email ?? currentSaved?.emailAddress ?? "",
          }));
          setError(data?.error || "Não foi possível carregar dados do perfil");
          return;
        }

        // API may return the client under data, client, user, or directly
        const client = data?.data ?? data?.client ?? data?.user ?? data ?? null;
        if (client) {
          setForm((f) => ({
            ...f,
            nome: client.nome ?? client.name ?? "",
            sobrenome: client.sobrenome ?? client.lastName ?? "",
            rua: client.rua ?? client.street ?? "",
            numero: client.numero ?? client.number ?? "",
            bairro: client.bairro ?? client.neighborhood ?? "",
            cidade: client.cidade ?? client.city ?? "",
            estado: client.estado ?? client.state ?? "",
            whatsapp: client.whatsapp ?? client.phone ?? "",
            email: client.email ?? client.emailAddress ?? "",
          }));
          // also update localStorage with canonical data
          try {
            setUser(client);
            broadcastUserUpdate(client);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do perfil");
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, [savedId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      // Assumimos que API aceita PATCH /api/client com corpo contendo dados do cliente.
      // Se sua API usar outro endpoint/contrato, cole aqui a resposta do servidor e eu ajusto.
      const payload = { ...form };
      // use id if available
      const id = savedId;
      const url = id
        ? `https://apismilepet.vercel.app/api/client/${id}`
        : `https://apismilepet.vercel.app/api/client`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Falha ao atualizar perfil");
        return;
      }
      // atualiza localStorage com os novos dados (merge)
      const returned = data?.user ?? data ?? payload;
      const newUser = { ...(saved || {}), ...(returned || {}) };
      try {
        setUser(newUser);
        broadcastUserUpdate(newUser);
      } catch (err) {
        console.warn("Não foi possível atualizar localStorage", err);
      }
      setMessage("Perfil atualizado com sucesso.");
    } catch (err) {
      console.error(err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Confirma exclusão da sua conta? Esta ação não pode ser desfeita."
      )
    )
      return;
    setError("");
    setLoading(true);
    const id = savedId;
    try {
      // tentativa de DELETE; muitos backends usam DELETE /api/client/:id
      // aqui enviamos email como identificador no corpo. Ajusto se sua API usar outro contrato.
      // prefer DELETE /api/client/{id} when we have an id
      const deleteUrl = id
        ? `https://apismilepet.vercel.app/api/client/${id}`
        : "https://apismilepet.vercel.app/api/client";
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: id ? undefined : JSON.stringify({ email: form.email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Falha ao excluir conta");
        return;
      }
      // removemos localStorage e redirecionamos
      clearUser();
      broadcastUserUpdate(null);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.perfilSection}>
      <h1>Meu Perfil</h1>
      <p>Atualize seus dados pessoais abaixo.</p>

      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.row}>
          <label>Nome</label>
          <input name="nome" value={form.nome} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>Sobrenome</label>
          <input
            name="sobrenome"
            value={form.sobrenome}
            onChange={handleChange}
          />
        </div>
        <div className={styles.row}>
          <label>Rua / AV</label>
          <input name="rua" value={form.rua} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>Número</label>
          <input name="numero" value={form.numero} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>Bairro</label>
          <input name="bairro" value={form.bairro} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>Cidade</label>
          <input name="cidade" value={form.cidade} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>Estado</label>
          <input name="estado" value={form.estado} onChange={handleChange} />
        </div>
        <div className={styles.row}>
          <label>WhatsApp</label>
          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
          />
        </div>
        <div className={styles.row}>
          <label>E-mail</label>
          <input name="email" value={form.email} onChange={handleChange} />
        </div>

        {message && <div className={styles.message}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.saveBtn} type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={loading}
          >
            Excluir conta
          </button>

          <Link to="/meus-pedidos" className={styles.ordersBtn}>
            Meus pedidos
          </Link>
        </div>
      </form>
    </section>
  );
}

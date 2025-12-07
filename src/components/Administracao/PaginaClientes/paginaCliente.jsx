import React, { useEffect, useState } from "react";
import styles from "./paginaCliente.module.css";
import {
  FaSearch,
  FaPlus,
  FaUsers,
  FaUserPlus,
  FaPen,
  FaTrash,
  FaArrowLeft,
  FaSave,
} from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";

function tryParseArray(respData) {
  if (!respData) return [];
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData.data)) return respData.data;
  if (Array.isArray(respData.items)) return respData.items;
  if (Array.isArray(respData.clientes)) return respData.clientes;
  if (Array.isArray(respData.client)) return respData.client;
  return [];
}

export default function PaginaClientes() {
  const [view, setView] = useState("list"); // 'list' | 'form'
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats
  const [stats, setStats] = useState({ total: 0, new: 0 });

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    nome: "",
    sobrenome: "",
    email: "",
    whatsapp: "",
    cpf: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  async function load() {
    setLoading(true);
    try {
      const resp = await fetch("https://apismilepet.vercel.app/api/client");
      const data = await resp.json().catch(() => []);
      const arr = tryParseArray(data);

      const reversed = [...arr].reverse();

      setClients(reversed);
      setFilteredClients(reversed);

      // Stats
      const total = reversed.length;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newUsersCount = reversed.filter((c) => {
        const dateStr = c.created_at || c.createdAt || c.data_criacao;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      }).length;

      setStats({ total, new: newUsersCount });
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
    const filtered = clients.filter(
      (c) =>
        (c.nome || "").toLowerCase().includes(lower) ||
        (c.email || "").toLowerCase().includes(lower) ||
        (c.cpf || "").includes(lower)
    );
    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [searchTerm, clients]);

  // Actions
  const handleAddNew = () => {
    setFormData({
      id: "",
      nome: "",
      sobrenome: "",
      email: "",
      whatsapp: "",
      cpf: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    });
    setView("form");
  };

  const handleEdit = (c) => {
    // Determine address fields, checking nested objects first, then root level
    // Some APIs return address in 'endereco' or 'address' object, others at root.
    const addr = c.endereco || c.address || {};

    setFormData({
      id: c.id || c._id || "",
      nome: c.nome || "",
      sobrenome: c.sobrenome || "",
      email: c.email || "",
      whatsapp: c.whatsapp || c.celular || c.telefone || "",
      cpf: c.cpf || c.cnpj || "",

      cep: addr.cep || c.cep || "",
      rua: addr.rua || addr.logradouro || c.rua || "",
      numero: addr.numero || c.numero || "",
      complemento: addr.complemento || c.complemento || "",
      bairro: addr.bairro || c.bairro || "",
      cidade: addr.cidade || addr.city || c.cidade || c.city || "",
      estado: addr.estado || addr.uf || c.estado || c.uf || "",
    });
    setView("form");
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${name}?`))
      return;
    try {
      const resp = await fetch(
        `https://apismilepet.vercel.app/api/client/${id}`,
        { method: "DELETE" }
      );
      if (resp.ok) {
        alert("Usuário removido com sucesso!");
        load();
      } else {
        alert("Erro ao remover usuário.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão ao tentar remover.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const url = isEdit
      ? `https://apismilepet.vercel.app/api/client/${formData.id}`
      : `https://apismilepet.vercel.app/api/client`;

    const method = isEdit ? "PUT" : "POST";

    // Build payload
    const payload = {
      nome: formData.nome,
      sobrenome: formData.sobrenome,
      email: formData.email,
      whatsapp: formData.whatsapp,
      cpf: formData.cpf,
      // Address fields are top-level based on user input example
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
    };

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        alert("Usuário salvo com sucesso!");
        setView("list");
        load();
      } else {
        const txt = await resp.text();
        alert(`Erro ao salvar: ${txt}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Address Helper
  function formatLocation(c) {
    const addr = c.endereco || c.address;
    let city = "",
      state = "";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object" && addr) {
      city = addr.cidade || addr.city || "";
      state = addr.estado || addr.state || addr.uf || "";
    }
    if (!city && !state) {
      city = c.cidade || c.city || "";
      state = c.estado || c.state || c.uf || "";
    }
    if (city && state) return `${city}, ${state}`;
    if (state) return state;
    return "Brasil";
  }

  // Colors
  const avatarColors = ["#e0e7ff", "#fae8ff", "#dcfce7", "#ffedd5"];
  const textColors = ["#4338ca", "#a21caf", "#15803d", "#c2410c"];

  // --- FORM VIEW ---
  if (view === "form") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setView("list")}
              className={styles.actionBtn}
              style={{ fontSize: "20px" }}
            >
              <FaArrowLeft />
            </button>
            <h2 className={styles.title}>
              {formData.id ? "Editar Usuário" : "Novo Usuário"}
            </h2>
          </div>
        </div>

        <div className={styles.tableCard} style={{ padding: "20px" }}>
          <form
            onSubmit={handleSave}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Basic Info */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Nome</label>
              <input
                required
                className={styles.inputForm}
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Sobrenome</label>
              <input
                className={styles.inputForm}
                value={formData.sobrenome}
                onChange={(e) =>
                  setFormData({ ...formData, sobrenome: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Email</label>
              <input
                required
                type="email"
                className={styles.inputForm}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>WhatsApp / Telefone</label>
              <input
                className={styles.inputForm}
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
              />
            </div>

            {/* Address Header */}
            <div
              style={{
                gridColumn: "1/-1",
                borderBottom: "1px solid #eee",
                margin: "10px 0",
              }}
            ></div>
            <h4 style={{ gridColumn: "1/-1", margin: 0, color: "#666" }}>
              Endereço
            </h4>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>CEP</label>
              <input
                className={styles.inputForm}
                value={formData.cep}
                onChange={(e) =>
                  setFormData({ ...formData, cep: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Estado (UF)</label>
              <input
                className={styles.inputForm}
                style={{ width: "80px" }}
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                maxLength={2}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Cidade</label>
              <input
                className={styles.inputForm}
                value={formData.cidade}
                onChange={(e) =>
                  setFormData({ ...formData, cidade: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Bairro</label>
              <input
                className={styles.inputForm}
                value={formData.bairro}
                onChange={(e) =>
                  setFormData({ ...formData, bairro: e.target.value })
                }
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Rua</label>
              <input
                className={styles.inputForm}
                value={formData.rua}
                onChange={(e) =>
                  setFormData({ ...formData, rua: e.target.value })
                }
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label className={styles.label}>Número</label>
              <input
                className={styles.inputForm}
                style={{ width: "100px" }}
                value={formData.numero}
                onChange={(e) =>
                  setFormData({ ...formData, numero: e.target.value })
                }
              />
            </div>

            <div
              style={{
                gridColumn: "1/-1",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <label className={styles.label}>Complemento</label>
              <input
                className={styles.inputForm}
                value={formData.complemento}
                onChange={(e) =>
                  setFormData({ ...formData, complemento: e.target.value })
                }
              />
            </div>

            <div
              style={{
                gridColumn: "1/-1",
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setView("list")}
                className={styles.actionBtn}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.addButton}
                style={{ padding: "10px 30px" }}
              >
                <FaSave /> Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Clientes</h2>
        <div className={styles.searchBar}>
          <FaSearch color="#9ca3af" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou cpf..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.addButton} onClick={handleAddNew}>
          <FaPlus /> Adicionar usuário
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.iconBox}
            style={{ background: "#e0e7ff", color: "#4f46e5" }}
          >
            <FaUsers />
          </div>
          <div className={styles.statContent}>
            <h4>Usuários Totais</h4>
            <p>{stats.total}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <BsThreeDots color="#9ca3af" />
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.iconBox}
            style={{ background: "#ffedd5", color: "#ea580c" }}
          >
            <FaUserPlus />
          </div>
          <div className={styles.statContent}>
            <h4>Novos Usuários (7 dias)</h4>
            <p>{stats.new}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <BsThreeDots color="#9ca3af" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Todos os Usuários</div>
          <div className={styles.paginationInfo}>
            {filteredClients.length > 0
              ? `${indexOfFirstItem + 1} - ${Math.min(
                  indexOfLastItem,
                  filteredClients.length
                )} de ${filteredClients.length}`
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
                <th>Nome</th>
                <th>Telefone</th>
                <th>Localização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Carregando clientes...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                currentItems.map((c, idx) => {
                  const id = c.id || c._id;
                  const name = c.nome || c.name || "Sem Nome";
                  const email = c.email || "sem@email.com";
                  const phone =
                    c.whatsapp || c.celular || c.phone || c.telefone || "--";
                  const location = formatLocation(c);

                  // Mock Avatar Color
                  const colorIndex = (name.length + idx) % avatarColors.length;
                  const bg = avatarColors[colorIndex];
                  const col = textColors[colorIndex];
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <tr key={idx}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className={styles.userInfo}>
                          <div
                            className={styles.avatar}
                            style={{ backgroundColor: bg, color: col }}
                          >
                            {initial}
                          </div>
                          <div className={styles.nameCol}>
                            <h5>{name}</h5>
                            <span className={styles.emailSub}>{email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{phone}</td>
                      <td>{location}</td>
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
                            title="Deletar"
                            onClick={() => handleDelete(id, name)}
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              style={{ padding: "5px 10px", cursor: "pointer" }}
            >
              &lt;
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{ padding: "5px 10px", cursor: "pointer" }}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

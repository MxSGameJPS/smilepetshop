import React, { useEffect, useState } from "react";
import styles from "./paginaCliente.module.css";

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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const resp = await fetch("https://apismilepet.vercel.app/api/client");
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const data = await resp.json().catch(() => null);
        const arr = tryParseArray(data);
        if (mounted) setClients(arr);
      } catch {
        if (mounted) setError("Falha ao carregar clientes.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={styles.wrap}>
      <h3>Clientes cadastrados</h3>

      {loading ? (
        <p>Carregando clientes...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : clients.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <ul className={styles.list}>
          {clients.map((c, idx) => {
            const id = c.id || c._id || c.uuid || idx;
            const nome = c.nome || c.name || c.usuario || c.login || "—";
            const email = c.email || c.e_mail || c.correo || "—";
            const telefone = c.whatsapp || c.celular || c.phone || "—";

            // normalize endereco: can be a string, an object with rua/numero/bairro/cidade/estado,
            // or scattered at top-level keys. Build a human-friendly single-line address.
            function formatAddress(addr, src) {
              if (!addr && !src) return "—";
              const a = addr || src;
              if (typeof a === "string") return a;
              if (typeof a === "object") {
                const rua =
                  a.rua || a.logradouro || a.street || a.address || null;
                const numero = a.numero || a.number || null;
                const bairro = a.bairro || a.neighborhood || null;
                const cidade = a.cidade || a.city || null;
                const estado = a.estado || a.state || null;

                const parts = [];
                if (rua) parts.push(rua + (numero ? ", " + numero : ""));
                if (bairro) parts.push(bairro);
                const cityState = [cidade, estado].filter(Boolean).join(" - ");
                if (cityState) parts.push(cityState);
                if (parts.length) return parts.join(" — ");
              }
              return "—";
            }

            const endereco = formatAddress(c.endereco, c.address || c);
            return (
              <li key={id} className={styles.item}>
                <div className={styles.row}>
                  <div className={styles.name}>{nome}</div>
                  <div className={styles.meta}>{email}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.small}>ID: {id}</div>
                  <div className={styles.small}>Telefone: {telefone}</div>
                  <div className={styles.small}>Endereço: {endereco}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

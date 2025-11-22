import React, { useState, useEffect } from "react";
import styles from "./checkout.module.css";
import { useNavigate } from "react-router-dom";
import { getUser, setUser as setStoredUser } from "../../lib/auth";
import { getCart } from "../../lib/cart";

const EMAIL_STORAGE_KEY = "smilepet_checkout_email";

// empty form template used to reset/initialize checkout form
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  cpf: "",
  company: "",
  address1: "",
  numero: "",
  bairro: "",
  address2: "",
  city: "",
  state: "",
  postal: "",
  phone: "",
  email: "",
  shipDifferent: false,
  notes: "",
};

export default function Checkout() {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }));
  const [step, setStep] = useState("personal");
  const [cartItems, setCartItems] = useState(() => getCart() || []);
  const [shippingNumeric, setShippingNumeric] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");

  // helper: map various user shapes to our form fields (shared)
  const mapUserToForm = (u) => ({
    firstName: u?.nome || u?.firstName || u?.name || "",
    lastName: u?.sobrenome || u?.lastName || "",
    email: u?.email || u?.emailAddress || "",
    cpf: u?.cpf || u?.cpf_cliente || "",
    phone: u?.whatsapp || u?.phone || u?.telefone || "",
    address1: u?.rua || u?.street || u?.address1 || "",
    numero: u?.numero || u?.number || "",
    bairro: u?.bairro || u?.neighborhood || "",
    city: u?.cidade || u?.city || "",
    state: u?.estado || u?.state || "",
    postal: u?.cep || u?.postal || "",
  });

  // helper to pick a stable id from various user shapes
  const pickUserId = (u) =>
    u?.id || u?._id || u?.clienteId || u?.clientId || u?.client || null;
  // fetch remote user; if id provided, call /api/client/{id}, else /api/client
  const fetchRemoteUser = async (id) => {
    try {
      const headers = {};
      const possibleToken =
        localStorage.getItem("smilepet_token") ||
        localStorage.getItem("token") ||
        (getUser() && (getUser().token || getUser().accessToken)) ||
        null;
      if (possibleToken) headers["Authorization"] = `Bearer ${possibleToken}`;

      const url = id
        ? `https://apismilepet.vercel.app/api/client/${encodeURIComponent(id)}`
        : "https://apismilepet.vercel.app/api/client";

      const res = await fetch(url, {
        cache: "no-store",
        credentials: headers.Authorization ? "omit" : "include",
        headers,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return null;
      let client = data?.data ?? data?.client ?? data?.user ?? data ?? null;
      if (Array.isArray(client) && client.length > 0) client = client[0];
      return client;
    } catch (err) {
      console.debug("Não foi possível buscar usuário remoto:", err);
      return null;
    }
  };

  useEffect(() => {
    // Compute finalForm from: canonical server user (by id if available) + local stored user + saved draft.
    // Draft (`smilepet_checkout_billing`) keeps precedence over user values.
    (async () => {
      let savedDraft = null;
      let savedDraftOwner = null;
      try {
        const raw = localStorage.getItem("smilepet_checkout_billing");
        savedDraft = raw ? JSON.parse(raw) : null;
        try {
          savedDraftOwner = localStorage.getItem(
            "smilepet_checkout_billing_owner"
          );
        } catch {
          savedDraftOwner = null;
        }
      } catch {
        savedDraft = null;
      }

      const localUser = getUser();
      let finalUser = null;

      // prefer fetching the canonical user by id when possible to avoid using stale local data
      const pickId = (u) =>
        u?.id || u?._id || u?.clienteId || u?.clientId || u?.client || null;

      if (localUser) {
        const id = pickId(localUser);
        if (id) {
          const remote = await fetchRemoteUser(id);
          finalUser = remote
            ? { ...(localUser || {}), ...(remote || {}) }
            : localUser;
        } else {
          // no id available — try to fetch generic endpoint as fallback
          const remote = await fetchRemoteUser();
          finalUser = remote
            ? { ...(localUser || {}), ...(remote || {}) }
            : localUser;
        }
      } else {
        // no local user — try to fetch remote (may return null or a single client)
        const remote = await fetchRemoteUser();
        if (remote) finalUser = remote;
      }

      const mapped = finalUser ? mapUserToForm(finalUser) : {};

      // If a draft exists but belongs to a different user, ignore it.
      let useDraft = savedDraft && typeof savedDraft === "object";
      if (useDraft && finalUser) {
        const finalId = pickUserId(finalUser);
        if (savedDraftOwner) {
          if (finalId && savedDraftOwner !== String(finalId)) useDraft = false;
        } else if (savedDraft.email) {
          // best-effort: if draft email doesn't match server email, ignore draft
          if (
            String(mapped.email || "").toLowerCase() !==
            String(savedDraft.email || "").toLowerCase()
          )
            useDraft = false;
        }
      }

      let finalForm = useDraft ? { ...mapped, ...savedDraft } : { ...mapped };

      try {
        const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
        if (storedEmail) {
          finalForm = { ...finalForm, email: storedEmail };
        } else if (
          typeof finalForm.email === "string" &&
          finalForm.email.trim()
        ) {
          const normalized = finalForm.email.trim();
          finalForm = { ...finalForm, email: normalized };
          localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
        }
      } catch {
        /* ignore */
      }

      // replace whole form atomically to avoid carrying previous user's values
      setForm(() => ({ ...EMPTY_FORM, ...finalForm }));

      // persist a merged canonical user (but preserve tokens) so other UI reads up-to-date data
      try {
        if (finalUser) {
          const existing = getUser() || {};
          const merged = { ...existing, ...finalUser };
          if (!merged.token && existing.token) merged.token = existing.token;
          if (!merged.accessToken && existing.accessToken)
            merged.accessToken = existing.accessToken;
          setStoredUser(merged);
        }
      } catch {
        // ignore storage failures
      }
    })();
  }, []);

  // listen for user updates (login/logout) and storage changes to refresh the form
  useEffect(() => {
    const handleUserUpdate = (ev) => {
      (async () => {
        try {
          const draftRaw = localStorage.getItem("smilepet_checkout_billing");
          const draft = draftRaw ? JSON.parse(draftRaw) : null;
          const detail = ev?.detail ?? null;
          const payload = detail || getUser();

          // if payload is falsy -> logout happened, clear form and draft
          if (!payload) {
            setForm(() => ({ ...EMPTY_FORM }));
            try {
              localStorage.removeItem("smilepet_checkout_billing");
            } catch {
              /* ignore */
            }
            try {
              localStorage.removeItem(EMAIL_STORAGE_KEY);
            } catch {
              /* ignore */
            }
            return;
          }

          // unwrap wrappers if necessary
          const userObj =
            payload?.data ??
            payload?.user ??
            payload?.client ??
            payload ??
            null;

          // prefer to fetch canonical server record when we have an id to avoid stale local copies
          const id =
            userObj?.id ||
            userObj?._id ||
            userObj?.clienteId ||
            userObj?.clientId ||
            null;
          let finalUserObj = userObj;
          if (id) {
            const remote = await fetchRemoteUser(id);
            if (remote) {
              finalUserObj = { ...(userObj || {}), ...(remote || {}) };
              // persist the canonical merged user
              try {
                const existing = getUser() || {};
                const merged = { ...existing, ...finalUserObj };
                if (!merged.token && existing.token)
                  merged.token = existing.token;
                if (!merged.accessToken && existing.accessToken)
                  merged.accessToken = existing.accessToken;
                setStoredUser(merged);
              } catch {
                // ignore
              }
            }
          }

          const mapped = finalUserObj ? mapUserToForm(finalUserObj) : {};
          let finalForm =
            draft && typeof draft === "object"
              ? { ...mapped, ...draft }
              : { ...mapped };

          try {
            const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
            if (storedEmail) {
              finalForm = { ...finalForm, email: storedEmail };
            } else if (
              typeof finalForm.email === "string" &&
              finalForm.email.trim()
            ) {
              const normalized = finalForm.email.trim();
              finalForm = { ...finalForm, email: normalized };
              localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
            }
          } catch {
            /* ignore */
          }

          setForm(() => ({ ...EMPTY_FORM, ...finalForm }));
        } catch (err) {
          console.debug("Erro ao aplicar user update no checkout:", err);
        }
      })();
    };

    window.addEventListener("smilepet_user_update", handleUserUpdate);
    const onStorage = (e) => {
      if (
        e.key === "smilepet_user" ||
        e.key === "smilepet_checkout_billing" ||
        e.key === EMAIL_STORAGE_KEY
      ) {
        handleUserUpdate({ detail: getUser() });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("smilepet_user_update", handleUserUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // subscribe to cart changes (custom events and storage fallback)
  useEffect(() => {
    const reload = () => {
      setCartItems(getCart() || []);
      // sincronizar frete salvo pelo carrinho
      try {
        const s = localStorage.getItem("smilepet_shipping");
        const sl = localStorage.getItem("smilepet_shipping_label");
        const n = s != null ? Number(s) : NaN;
        setShippingNumeric(Number.isFinite(n) ? n : 0);
        setShippingLabel(sl || "");
      } catch {
        setShippingNumeric(0);
        setShippingLabel("");
      }
    };

    // common custom event names (project used a custom event to broadcast cart updates)
    window.addEventListener("smilepet_cart_update", reload);
    window.addEventListener("smilepet_cart_updated", reload);
    window.addEventListener("cart-update", reload);

    // storage event (cross-tab) - when localStorage smilepet_cart changes
    const onStorage = (e) => {
      if (
        e.key === "smilepet_cart" ||
        e.key === "smilepet_shipping" ||
        e.key === "smilepet_shipping_label"
      )
        reload();
    };
    window.addEventListener("storage", onStorage);

    // sincronizar imediatamente ao montar
    try {
      reload();
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener("smilepet_cart_update", reload);
      window.removeEventListener("smilepet_cart_updated", reload);
      window.removeEventListener("cart-update", reload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const formatPrice = (v) => {
    const num = Number(v) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const summaryTotal = cartItems.reduce((acc, it) => {
    const qty =
      Number(it.quantidade ?? it.quantity ?? it.qtd ?? it.qty ?? 1) || 0;
    const priceRaw =
      Number(
        it.precoUnit ?? it.preco ?? it.price ?? it.valor ?? it.unit_price ?? 0
      ) || 0;
    // assume precoUnit is already BRL number; if very large, treat as cents
    const priceNorm = priceRaw > 10000 ? priceRaw / 100 : priceRaw;
    return acc + qty * priceNorm;
  }, 0);

  const handleCpfChange = (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "");
    setForm((f) => ({ ...f, cpf: digits.slice(0, 11) }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setForm((f) => ({ ...f, [name]: nextValue }));

    if (name === "email" && typeof nextValue === "string") {
      const trimmed = nextValue.trim();
      try {
        if (trimmed) {
          localStorage.setItem(EMAIL_STORAGE_KEY, trimmed);
        } else {
          localStorage.removeItem(EMAIL_STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const handlePostalChange = (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "");
    setForm((f) => ({ ...f, postal: digits.slice(0, 8) }));
  };

  const goToDelivery = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      alert(
        "Preencha Primeiro nome, Sobrenome, E-mail e Telefone antes de continuar."
      );
      return;
    }
    setStep("delivery");
    try {
      localStorage.setItem("smilepet_checkout_billing", JSON.stringify(form));
      // persist owner id so we can avoid applying stale drafts between different users
      try {
        const user = getUser();
        const ownerId = pickUserId(user) || "";
        if (ownerId)
          localStorage.setItem(
            "smilepet_checkout_billing_owner",
            String(ownerId)
          );
      } catch {
        /* ignore */
      }
    } catch (e) {
      void e;
    }
  };

  const goToPayment = () => {
    if (!form.postal || !form.address1 || !form.numero || !form.city) {
      alert(
        "Preencha CEP, Rua, Número e Cidade antes de continuar para o pagamento."
      );
      return;
    }
    setStep("payment");
  };

  const handleFinalizeCheckout = async () => {
    // URL da API que criamos no passo 1
    // Se você salvou em pages/api/checkout/payment.js, a URL é essa:
    const ENDPOINT_MP = "https://apismilepet.vercel.app/api/checkout/payment";

    // (Opcional) Você pode manter sua chamada original para "billing/create" antes
    // para salvar o pedido no seu banco de dados como "Pendente"

    try {
      // monta lista de itens no formato exigido pelo backend
      const normalizedItems = (cartItems || []).map((it) => ({
        id: it.id ?? it.productId ?? it.sku ?? null,
        nome: it.nome ?? it.title ?? it.name ?? "",
        variante: it.variante ?? it.variant ?? null,
        quantidade: Number(it.quantidade ?? it.quantity ?? it.qty ?? 1) || 1,
        precoUnit:
          Number(it.precoUnit ?? it.preco ?? it.price ?? it.unit_price ?? 0) ||
          0,
        imagem_url:
          it.imagem_url || it.imagem || it.image_url || it.image || null,
        ncm: it.ncm || null,
      }));

      // Se algum item não tiver NCM, tentar buscar do catálogo remoto
      const missingNcm = normalizedItems.some((it) => !it.ncm);
      if (missingNcm) {
        try {
          const res = await fetch(
            "https://apismilepet.vercel.app/api/produtos",
            {
              cache: "no-store",
            }
          );
          if (res.ok) {
            const data = await res.json().catch(() => null);
            let lista = [];
            if (Array.isArray(data)) lista = data;
            else if (Array.isArray(data?.data)) lista = data.data;
            else if (Array.isArray(data?.produtos)) lista = data.produtos;

            const mapById = new Map();
            lista.forEach((p) => {
              const pid = p.id ?? p._id ?? p.uid ?? p.sku ?? null;
              if (pid) mapById.set(String(pid), p);
            });

            normalizedItems.forEach((it) => {
              if (!it.ncm && it.id) {
                const found = mapById.get(String(it.id));
                if (found && (found.ncm || found.produto?.ncm))
                  it.ncm = found.ncm || found.produto.ncm || null;
              }
            });
          }
        } catch (err) {
          // se a busca falhar, seguimos sem ncm — backend pode rejeitar, então avisamos
          console.debug("Falha ao buscar catálogo para NCM:", err);
        }
      }

      // buscar dados de frete salvos no localStorage (serviço e id são obrigatórios pelo backend)
      let savedShippingCost = Number(shippingNumeric || 0) || 0;
      try {
        const raw = localStorage.getItem("smilepet_shipping");
        if (raw != null) {
          const num = Number(raw);
          if (Number.isFinite(num)) savedShippingCost = num;
        }
      } catch {
        /* ignore */
      }

      const shippingServiceName =
        (function () {
          try {
            return (
              localStorage.getItem("smilepet_shipping_service_name") ||
              JSON.parse(
                localStorage.getItem("smilepet_shipping_option") || "null"
              )?.name ||
              null
            );
          } catch {
            return null;
          }
        })() || null;

      const shippingServiceId =
        (function () {
          try {
            return (
              localStorage.getItem("smilepet_shipping_service_id") ||
              JSON.parse(
                localStorage.getItem("smilepet_shipping_option") || "null"
              )?.id ||
              null
            );
          } catch {
            return null;
          }
        })() || null;

      if (!shippingServiceName) {
        // aviso leve ao usuário — backend exige nome do serviço
        const proceed = window.confirm(
          "Não foi possível recuperar o serviço de frete selecionado. Deseja continuar e enviar o pedido sem o nome do serviço?"
        );
        if (!proceed) return;
      }

      // Prepara o payload com TUDO que o backend precisa
      const payload = {
        user: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          cpf: form.cpf,
          phone: form.phone,
          address1: form.address1,
          numero: form.numero,
          postal: form.postal,
          city: form.city || null,
          state: form.state || null,
        },
        items: normalizedItems,
        shippingCost: Number(savedShippingCost) || 0,
        shippingServiceName: shippingServiceName || null,
        shippingServiceId: shippingServiceId || null,
      };

      const resp = await fetch(ENDPOINT_MP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao gerar link de pagamento.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao criar pagamento.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>
          <main className={styles.leftCol}>
            <h1 className={styles.title}>Dados pessoais</h1>

            {step === "personal" ? (
              <form className={styles.form}>
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

                <div className={styles.actionsSingle}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={goToDelivery}
                  >
                    IR PARA A ENTREGA
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.personCard}>
                <div className={styles.personHeader}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => setStep("personal")}
                  >
                    Alterar
                  </button>
                </div>
                <div className={styles.personBody}>
                  <div className={styles.personEmail}>{form.email}</div>
                  <div className={styles.personName}>
                    {(form.firstName || "") +
                      (form.lastName ? ` ${form.lastName}` : "")}
                  </div>
                  <div className={styles.personPhone}>{form.phone}</div>
                </div>
              </div>
            )}
          </main>

          <aside className={styles.centerCol}>
            {step === "personal" && (
              <>
                <div className={styles.box}>
                  <h3>Entrega</h3>
                  <div className={styles.boxContent}>
                    Aguardando o preenchimento dos dados
                  </div>
                </div>
                <div className={styles.box}>
                  <h3>Pagamento</h3>
                  <div className={styles.boxContent}>
                    Aguardando o preenchimento dos dados
                  </div>
                </div>
              </>
            )}

            {step === "delivery" && (
              <div className={styles.box}>
                <h3>Entrega</h3>
                <div className={styles.boxContent}>
                  <div className={styles.row2}>
                    <label className={styles.field}>
                      <span>CEP *</span>
                      <input
                        name="postal"
                        value={form.postal}
                        onChange={handlePostalChange}
                        inputMode="numeric"
                        pattern="\\d*"
                        maxLength={8}
                        required
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Estado</span>
                      <input
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <div className={`${styles.row2} ${styles.rowAddress}`}>
                    <label className={styles.field}>
                      <span>Rua *</span>
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

                  <div className={styles.row2}>
                    <label className={styles.field}>
                      <span>Complemento</span>
                      <input
                        name="address2"
                        value={form.address2}
                        onChange={handleChange}
                        placeholder="Apartamento, suíte, unidade, etc. (opcional)"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Bairro</span>
                      <input
                        name="bairro"
                        value={form.bairro}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

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
                    <div className={styles.deliveryActions}>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => setStep("personal")}
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        className={styles.primaryAction}
                        onClick={goToPayment}
                      >
                        Ir para o Pagamento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "payment" && (
              <>
                <div className={styles.deliverySummary}>
                  <div className={styles.deliveryHeader}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => setStep("delivery")}
                    >
                      Alterar
                    </button>
                  </div>
                  <div className={styles.deliveryBody}>
                    <div className={styles.deliveryAddressLine}>
                      {form.address1} {form.numero}
                      {form.address2 ? `, ${form.address2}` : ""}
                    </div>
                    <div className={styles.deliveryAddressLine}>
                      {form.bairro ? `${form.bairro} - ` : ""}
                      {form.city} - {form.state}
                    </div>
                    <div className={styles.deliveryAddressLine}>
                      {form.postal}
                    </div>
                    <div className={styles.deliveryNote}>
                      Entrega estimada: Em até 9 dias úteis
                    </div>
                  </div>
                </div>

                <div className={styles.box}>
                  <h3>Pagamento</h3>
                  <div className={styles.boxContent}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => setStep("delivery")}
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={handleFinalizeCheckout} // Alterado aqui
                      >
                        Pagar com Mercado Pago
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </aside>

          <aside className={styles.rightCol}>
            <div className={styles.summaryCard}>
              <h3>Resumo da Compra</h3>
              <div className={styles.summaryItems}>
                {cartItems && cartItems.length > 0 ? (
                  cartItems.map((it, idx) => {
                    const name =
                      it.title ||
                      it.nome ||
                      it.name ||
                      it.productName ||
                      it.nome_produto ||
                      "Item";
                    const qty =
                      Number(
                        it.quantity ?? it.quantidade ?? it.qtd ?? it.qty ?? 1
                      ) || 1;
                    // prefer the cart's precoUnit field (canonical in cart.js),
                    // then fall back to other common names
                    const priceRaw =
                      Number(
                        it.precoUnit ??
                          it.preco ??
                          it.price ??
                          it.valor ??
                          it.unit_price ??
                          0
                      ) || 0;
                    const price = priceRaw > 10000 ? priceRaw / 100 : priceRaw;
                    const lineTotal = qty * price;
                    const imageUrl =
                      it.imagem_url ||
                      it.imagem ||
                      it.image_url ||
                      it.image ||
                      it.picture;
                    return (
                      <div key={idx} className={styles.summaryItem}>
                        <img
                          src={imageUrl || "/imgCards/RacaoSeca.png"}
                          alt={name}
                          className={styles.summaryThumb}
                        />
                        <div className={styles.itemLeft}>
                          <div className={styles.itemName}>{name}</div>
                          {(it.variant || it.variante) && (
                            <div className={styles.itemVariant}>
                              {/* {it.variant || it.variante} */}
                            </div>
                          )}
                        </div>
                        <div className={styles.itemRight}>
                          <div className={styles.itemQty}>x{qty}</div>
                          <div className={styles.itemPrice}>
                            {formatPrice(lineTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptySummary}>
                    Nenhum item selecionado
                  </div>
                )}
              </div>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(summaryTotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete</span>
                <span>
                  {shippingLabel ? shippingLabel : formatPrice(shippingNumeric)}
                </span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>
                  {formatPrice(summaryTotal + (Number(shippingNumeric) || 0))}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

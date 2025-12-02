import React, { useState, useEffect } from "react";
import styles from "./checkout.module.css";
// useNavigate not required here
import { getUser, setUser as setStoredUser } from "../../lib/auth";
import { trackEvent } from "../../lib/meta";
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
  // not using navigate here; keep import if needed elsewhere

  // mostrar dados do usuário local imediatamente após login/cadastro

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }));
  const [step, setStep] = useState("personal");
  const [cartItems, setCartItems] = useState(() => getCart() || []);
  const [shippingNumeric, setShippingNumeric] = useState(0);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const [shippingLabel, setShippingLabel] = useState("");

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  // helper: map various user shapes to our form fields (shared)
  const mapUserToForm = (u) => ({
    firstName: u?.nome || u?.firstName || u?.name || u?.first_name || "",
    lastName: u?.sobrenome || u?.lastName || u?.last_name || "",
    email: u?.email || u?.emailAddress || "",
    cpf: u?.cpf || u?.cpf_cliente || u?.doc || "",
    phone: u?.whatsapp || u?.phone || u?.telefone || u?.celular || "",
    address1: u?.rua || u?.street || u?.address1 || u?.logradouro || "",
    numero: u?.numero || u?.number || "",
    bairro: u?.bairro || u?.neighborhood || "",
    city: u?.cidade || u?.city || u?.municipio || "",
    state: u?.estado || u?.state || u?.uf || "",
    postal: u?.cep || u?.postal || u?.zip || "",
  });

  // helper to pick a stable id from various user shapes
  const pickUserId = (u) =>
    u?.id ||
    u?._id ||
    u?.clienteId ||
    u?.clientId ||
    u?.client ||
    u?.uid ||
    u?.user_id ||
    null;
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

      console.debug("Fetching remote user from:", url);
      const res = await fetch(url, {
        cache: "no-store",
        credentials: headers.Authorization ? "omit" : "include",
        headers,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("Remote user fetch failed:", res.status, data);
        return null;
      }
      let client = data?.data ?? data?.client ?? data?.user ?? data ?? null;
      if (Array.isArray(client) && client.length > 0) client = client[0];
      console.debug("Remote user data:", client);
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
      console.debug("Local user found:", localUser);

      // prefill immediately from locally stored user to avoid empty form
      // while we fetch the canonical server record. This makes checkout
      // show the user's data right after auto-login/registration.
      try {
        if (localUser)
          setForm(() => ({ ...EMPTY_FORM, ...mapUserToForm(localUser) }));
      } catch {
        /* ignore */
      }
      let finalUser = null;

      // prefer fetching the canonical user by id when possible to avoid using stale local data
      const pickId = (u) =>
        u?.id ||
        u?._id ||
        u?.clienteId ||
        u?.clientId ||
        u?.client ||
        u?.uid ||
        u?.user_id ||
        u?.user?.id ||
        u?.data?.id ||
        null;

      if (localUser) {
        const id = pickId(localUser);
        console.debug("Checkout: localUser", localUser, "extracted id", id);
        if (id) {
          // se tivermos um id confiável, buscar registro canônico por id
          const remote = await fetchRemoteUser(id);
          finalUser = remote
            ? { ...(localUser || {}), ...(remote || {}) }
            : localUser;
        } else {
          // Fallback: se temos usuário local mas sem ID aparente, tentar endpoint genérico com token
          // Isso pode acontecer se o objeto salvo no login estiver incompleto
          console.debug("Checkout: ID não encontrado, tentando fetch genérico");
          const remote = await fetchRemoteUser(null);
          finalUser = remote
            ? { ...(localUser || {}), ...(remote || {}) }
            : localUser;
        }
      } else {
        // sem usuário local, não chamar o endpoint genérico — manter finalUser nulo
        finalUser = null;
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

      // Merge strategy: mapped user data is base. Draft overrides ONLY if it has values.
      // However, if draft is stale or empty, we prefer mapped data.
      // Simple merge:
      let finalForm = useDraft ? { ...mapped, ...savedDraft } : { ...mapped };

      // Ensure critical fields from mapped user are not overwritten by empty draft fields if draft was partial
      if (useDraft) {
        Object.keys(mapped).forEach((key) => {
          if (mapped[key] && !finalForm[key]) {
            finalForm[key] = mapped[key];
          }
        });
      }

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

  useEffect(() => {
    // Load coupon from storage
    try {
      const stored = localStorage.getItem("smilepet_coupon");
      if (stored) {
        const parsed = JSON.parse(stored);
        const user = getUser();
        const userId = user
          ? user.id || user._id || user.sub || user.uid || user.email
          : null;
        const appliedBy = parsed.appliedBy;

        if (appliedBy && appliedBy !== "guest" && appliedBy !== userId) {
          localStorage.removeItem("smilepet_coupon");
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Track InitiateCheckout when entering checkout (use cart snapshot to compute value)
  useEffect(() => {
    try {
      const cart = getCart() || [];
      const subtotal = cart.reduce((acc, it) => {
        const qty = Number(it.quantidade ?? it.quantity ?? 1) || 0;
        const priceRaw = Number(it.precoUnit ?? it.preco ?? it.price ?? 0) || 0;
        const price = priceRaw > 10000 ? priceRaw / 100 : priceRaw;
        return acc + qty * price;
      }, 0);
      const shipping =
        Number(localStorage.getItem("smilepet_shipping") || 0) || 0;

      const content_ids = cart
        .map((it) => String(it.id ?? it.productId ?? it.sku ?? ""))
        .filter(Boolean);
      const num_items = cart.reduce(
        (acc, it) => acc + (Number(it.quantidade ?? it.quantity ?? 1) || 0),
        0
      );

      trackEvent("InitiateCheckout", {
        content_ids,
        content_type: "product",
        num_items,
        value: Number(subtotal + shipping) || 0,
        currency: "BRL",
      });
    } catch {
      /* ignore */
    }
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
            // Clear coupon on logout
            setAppliedCoupon(null);
            try {
              localStorage.removeItem("smilepet_coupon");
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

  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.min_purchase && summaryTotal < appliedCoupon.min_purchase)
      return 0;

    let discount = 0;
    if (appliedCoupon.discount_type === "percentage") {
      discount = summaryTotal * (Number(appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount && discount > appliedCoupon.max_discount) {
        discount = Number(appliedCoupon.max_discount);
      }
    } else {
      discount = Number(appliedCoupon.discount_value);
    }
    return Math.min(discount, summaryTotal);
  })();

  const finalTotal =
    summaryTotal - couponDiscount + (Number(shippingNumeric) || 0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;
    setCouponMsg("Validando...");
    try {
      const res = await fetch("https://apismilepet.vercel.app/api/coupons");
      if (!res.ok) throw new Error("Erro ao validar");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const found = list.find((c) => c.code === couponInput);

      if (!found) throw new Error("Cupom não encontrado");
      if (!found.active) throw new Error("Cupom inativo");
      const now = new Date();
      if (found.start_date && new Date(found.start_date) > now)
        throw new Error("Ainda não válido");
      if (found.end_date && new Date(found.end_date) < now)
        throw new Error("Expirado");
      if (found.min_purchase && summaryTotal < found.min_purchase)
        throw new Error(`Mínimo: R$ ${found.min_purchase}`);

      const user = getUser();
      const userId = user
        ? user.id || user._id || user.sub || user.uid || user.email
        : "guest";
      const couponData = { ...found, appliedBy: userId };

      setAppliedCoupon(couponData);
      localStorage.setItem("smilepet_coupon", JSON.stringify(couponData));
      setCouponMsg("Aplicado!");
    } catch (err) {
      setCouponMsg(err.message);
      setAppliedCoupon(null);
      localStorage.removeItem("smilepet_coupon");
    }
    setTimeout(() => setCouponMsg(""), 3000);
  };

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
    try {
      localStorage.setItem("smilepet_checkout_billing", JSON.stringify(form));
    } catch (e) {
      void e;
    }
  };

  const calculateShipping = async () => {
    if (!form.postal) {
      alert("Por favor, informe o CEP para calcular o frete.");
      return;
    }
    setIsCalculatingShipping(true);
    try {
      const payload = {
        from: { postal_code: "21535-030" }, // CEP de origem fixo
        to: { postal_code: form.postal },
        products: cartItems.map((item) => ({
          id: item.id,
          weight: item.weight || 0.1, // Usar peso do item ou um padrão
          width: item.width || 11,
          height: item.height || 2,
          length: item.length || 16,
          quantity: Number(item.quantidade ?? item.quantity ?? 1),
          insurance_value: Number(item.precoUnit ?? item.price ?? 0),
        })),
      };

      const response = await fetch(
        "https://apismilepet.vercel.app/api/melhorenvio/quote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao calcular o frete.");
      }

      const data = await response.json();

      if (data && data.error) {
        console.error("Erro da API de frete:", data.error);
        throw new Error(data.error.message || "Erro ao calcular o frete.");
      }

      let sourceArray = [];
      if (Array.isArray(data)) {
        sourceArray = data;
      } else if (data && Array.isArray(data.result)) {
        sourceArray = data.result;
      }
      // map options (exclude any free option here)
      let options = sourceArray
        .filter((option) => option.price)
        .map((option) => ({
          id: option.id,
          name: option.name,
          price: Number(option.price),
          label: `${option.name} - Em até ${option.delivery_time} dias úteis`,
          delivery_time: option.delivery_time,
          picture: option.company?.picture || null,
        }));

      // Se o subtotal for maior que R$50, tratamos frete grátis como uma
      // mensagem fixa — não adicionamos a opção 'gratis' na lista de opções
      // para evitar que o usuário veja múltiplas opções; selecionamos a
      // opção grátis automaticamente e persistimos no localStorage.
      if (summaryTotal > 50) {
        const label = "Parabéns! Você ganhou FRETE GRÁTIS!";
        setShippingOptions([]);
        setSelectedShipping({ id: "gratis", price: 0, label });
        setShippingNumeric(0);
        setShippingLabel(label);
        try {
          localStorage.setItem("smilepet_shipping", String(0));
          localStorage.setItem("smilepet_shipping_label", label);
          localStorage.setItem(
            "smilepet_shipping_service_name",
            "Frete Grátis"
          );
          localStorage.setItem("smilepet_shipping_service_id", "gratis");
        } catch {
          // ignore storage failures
        }
        setStep("shipping");
      } else {
        setShippingOptions(options);
        // reset any previously auto-selected free shipping
        setSelectedShipping(null);
        setShippingLabel("");
        setShippingNumeric(0);
        setStep("shipping");
      }
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      alert("Não foi possível calcular o frete. Tente novamente.");
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSelectShipping = (option) => {
    setSelectedShipping(option);
    setShippingNumeric(option.price);
    setShippingLabel(option.label);
    try {
      localStorage.setItem("smilepet_shipping", String(option.price));
      localStorage.setItem("smilepet_shipping_label", option.label);
      localStorage.setItem("smilepet_shipping_service_name", option.name);
      localStorage.setItem("smilepet_shipping_service_id", option.id);
    } catch (e) {
      console.error("Falha ao salvar frete no localStorage", e);
    }
  };

  const handleFinalizeCheckout = async () => {
    if (!selectedShipping) {
      alert("Por favor, selecione uma opção de frete antes de continuar.");
      return;
    }

    // URL da API que criamos no passo 1
    // Se você salvou em pages/api/checkout/payment.js, a URL é essa:
    const ENDPOINT_MP = "https://apismilepet.vercel.app/api/checkout/payment";

    // (Opcional) Você pode manter sua chamada original para "billing/create" antes
    // para salvar o pedido no seu banco de dados como "Pendente"

    goToPayment();

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
      const currentUser = getUser();
      const currentUserId = pickUserId(currentUser);

      const payload = {
        user: {
          id: currentUserId, // Backend precisa do ID para validar limite de uso do cupom
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
        coupon: appliedCoupon?.code || null,
        // discount: Number(couponDiscount) || 0, // REMOVIDO: Backend calcula o desconto agora
      };

      // Save order details for Purchase event on Thank You page (since we redirect away)
      try {
        const totalValue =
          payload.items.reduce(
            (acc, it) => acc + it.quantidade * it.precoUnit,
            0
          ) +
          payload.shippingCost -
          couponDiscount; // Subtract discount for tracking
        const purchaseData = {
          content_ids: payload.items.map((it) => String(it.id)),
          content_type: "product",
          value: totalValue,
          currency: "BRL",
          num_items: payload.items.reduce((acc, it) => acc + it.quantidade, 0),
        };
        localStorage.setItem(
          "smilepet_last_order",
          JSON.stringify(purchaseData)
        );
      } catch (e) {
        console.error("Erro ao salvar dados do pedido para tracking:", e);
      }

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
                        onClick={calculateShipping}
                      >
                        Ir para o Pagamento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(step === "shipping" || step === "payment") && (
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
              </>
            )}

            {step === "shipping" && (
              <div className={styles.box}>
                <h3>Opções de Frete</h3>
                <div className={styles.boxContent}>
                  {isCalculatingShipping ? (
                    <div>Calculando frete...</div>
                  ) : summaryTotal > 50 ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 6,
                        background: "#e6ffed",
                        color: "#0b6b2d",
                      }}
                    >
                      <strong>Parabéns!</strong> Você ganhou{" "}
                      <strong>FRETE GRÁTIS</strong> para este pedido.
                    </div>
                  ) : (
                    shippingOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={styles.shippingOption}
                        style={{ backgroundColor: "transparent" }}
                      >
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={selectedShipping?.id === opt.id}
                          onChange={() => handleSelectShipping(opt)}
                        />
                        {opt.picture && (
                          <img
                            src={opt.picture}
                            alt={opt.name}
                            className={styles.shippingImage}
                            width="50"
                            height="50"
                          />
                        )}
                        <span>{opt.label}</span>
                        <span>{formatPrice(opt.price)}</span>
                      </label>
                    ))
                  )}
                  <div className={styles.deliveryActions}>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => setStep("delivery")}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={handleFinalizeCheckout}
                      disabled={!selectedShipping}
                    >
                      Ir para o Pagamento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "payment" && (
              <>
                <div className={styles.box}>
                  <h3>Pagamento</h3>
                  <div className={styles.boxContent}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => setStep("shipping")}
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

              {couponDiscount > 0 && (
                <div className={styles.summaryRow} style={{ color: "#28a745" }}>
                  <span>Desconto ({appliedCoupon?.code})</span>
                  <span>- {formatPrice(couponDiscount)}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Frete</span>
                <span>
                  {shippingLabel ? shippingLabel : formatPrice(shippingNumeric)}
                </span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              {!appliedCoupon && (
                <div className={styles.couponContainer}>
                  <div className={styles.couponRow}>
                    <input
                      placeholder="Cupom de desconto"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className={styles.couponInput}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className={styles.couponBtn}
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponMsg && (
                    <div
                      className={`${styles.couponMsg} ${
                        couponMsg.includes("Aplicado")
                          ? styles.couponMsgSuccess
                          : styles.couponMsgError
                      }`}
                    >
                      {couponMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

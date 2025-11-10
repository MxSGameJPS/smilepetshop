import React, { useState, useEffect } from "react";
import styles from "./checkout.module.css";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../lib/auth";
import { getCart } from "../../lib/cart";

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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
    paymentMethod: "",
    cardNumber: "",
    installments: 1,
    cardName: "",
    cardMonth: "",
    cardYear: "",
    cardCvv: "",
    cardCpf: "",
  });
  const [step, setStep] = useState("personal");
  const [cartItems, setCartItems] = useState(() => getCart() || []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("smilepet_checkout_billing");
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved === "object")
        setForm((f) => ({ ...f, ...saved }));
    } catch (e) {
      void e;
    }

    try {
      const user = getUser();
      if (!user) return;
      const mapped = {
        firstName: user.nome || user.firstName || user.name || "",
        lastName: user.sobrenome || user.lastName || "",
        email: user.email || user.emailAddress || "",
        cpf: user.cpf || user.cpf_cliente || "",
        phone: user.whatsapp || user.phone || user.telefone || "",
        address1: user.rua || user.street || user.address1 || "",
        numero: user.numero || user.number || "",
        bairro: user.bairro || user.neighborhood || "",
        city: user.cidade || user.city || "",
        state: user.estado || user.state || "",
        postal: user.cep || user.postal || "",
      };
      setForm((current) => ({ ...mapped, ...current }));
    } catch (e) {
      void e;
    }
  }, []);

  // subscribe to cart changes (custom events and storage fallback)
  useEffect(() => {
    const reload = () => setCartItems(getCart() || []);

    // common custom event names (project used a custom event to broadcast cart updates)
    window.addEventListener("smilepet_cart_update", reload);
    window.addEventListener("smilepet_cart_updated", reload);
    window.addEventListener("cart-update", reload);

    // storage event (cross-tab) - when localStorage smilepet_cart changes
    const onStorage = (e) => {
      if (e.key === "smilepet_cart") reload();
    };
    window.addEventListener("storage", onStorage);

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
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
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

  const handlePaymentMethod = (method) =>
    setForm((f) => ({ ...f, paymentMethod: method }));
  const handleCardChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const performPayment = async () => {
    alert("Compra finalizada");
    try {
      await handleSubmit({ preventDefault: () => {} });
    } catch (e) {
      void e;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ENDPOINT =
      "https://apismilepet.vercel.app/api/checkout/billing/create";
    try {
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
      try {
        localStorage.setItem("smilepet_checkout_billing", JSON.stringify(form));
      } catch (err) {
        console.warn("localStorage save failed", err);
      }
      navigate("/pedido", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Erro de conexão. Verifique se o servidor de API está rodando.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>
          <main className={styles.leftCol}>
            <h1 className={styles.title}>Dados pessoais</h1>

            {step === "personal" ? (
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
                    <div className={styles.field}>
                      <span>Método de pagamento</span>
                      <div className={styles.payMethods}>
                        <button
                          type="button"
                          className={`${styles.payBtn} ${
                            form.paymentMethod === "PIX" ? styles.active : ""
                          }`}
                          onClick={() => handlePaymentMethod("PIX")}
                        >
                          PIX
                        </button>
                        <button
                          type="button"
                          className={`${styles.payBtn} ${
                            form.paymentMethod === "BOLETO" ? styles.active : ""
                          }`}
                          onClick={() => handlePaymentMethod("BOLETO")}
                        >
                          BOLETO
                        </button>
                        <button
                          type="button"
                          className={`${styles.payBtn} ${
                            form.paymentMethod === "CARD" ? styles.active : ""
                          }`}
                          onClick={() => handlePaymentMethod("CARD")}
                        >
                          CARTÃO DE CRÉDITO
                        </button>
                      </div>
                    </div>

                    {form.paymentMethod === "CARD" && (
                      <div>
                        <label className={styles.field}>
                          <span>Número do cartão</span>
                          <input
                            name="cardNumber"
                            value={form.cardNumber}
                            onChange={handleCardChange}
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Parcelas</span>
                          <select
                            name="installments"
                            value={form.installments}
                            onChange={handleCardChange}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}x
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Nome impresso no cartão</span>
                          <input
                            name="cardName"
                            value={form.cardName}
                            onChange={handleCardChange}
                          />
                        </label>
                        <div className={styles.row2}>
                          <label className={styles.field}>
                            <span>Mes</span>
                            <select
                              name="cardMonth"
                              value={form.cardMonth}
                              onChange={handleCardChange}
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (m) => (
                                  <option
                                    key={m}
                                    value={String(m).padStart(2, "0")}
                                  >
                                    {String(m).padStart(2, "0")}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                          <label className={styles.field}>
                            <span>Ano</span>
                            <select
                              name="cardYear"
                              value={form.cardYear}
                              onChange={handleCardChange}
                            >
                              {Array.from(
                                { length: 11 },
                                (_, i) => new Date().getFullYear() + i
                              ).map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className={styles.row2}>
                          <label className={styles.field}>
                            <span>Codigo de segurança</span>
                            <input
                              name="cardCvv"
                              value={form.cardCvv}
                              onChange={handleCardChange}
                            />
                          </label>
                          <label className={styles.field}>
                            <span>CPF do Titular</span>
                            <input
                              name="cardCpf"
                              value={form.cardCpf}
                              onChange={handleCardChange}
                            />
                          </label>
                        </div>
                      </div>
                    )}

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
                        onClick={performPayment}
                      >
                        Efetuar pagamento
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
                    return (
                      <div key={idx} className={styles.summaryItem}>
                        <div className={styles.itemLeft}>
                          <div className={styles.itemName}>{name}</div>
                          {(it.variant || it.variante) && (
                            <div className={styles.itemVariant}>
                              {it.variant || it.variante}
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
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(summaryTotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

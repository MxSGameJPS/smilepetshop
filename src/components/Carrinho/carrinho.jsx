import React, { useEffect, useState } from "react";
import styles from "./carrinho.module.css";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
} from "../../lib/cart";
import { useNavigate } from "react-router-dom";

const moeda = (v) => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v) || 0);
  } catch {
    return String(v);
  }
};

export default function Carrinho() {
  const [cart, setCart] = useState(() => getCart());
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [cep, setCep] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMsg, setShippingMsg] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingLabel, setShippingLabel] = useState("");
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);
  const [erroSugestoes, setErroSugestoes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener("smilepet_cart_update", handler);
    return () => window.removeEventListener("smilepet_cart_update", handler);
  }, []);

  useEffect(() => {
    let ativo = true;

    const extrairLista = (payload) => {
      if (Array.isArray(payload)) return payload;
      if (payload && typeof payload === "object") {
        const chaves = ["data", "produtos", "items", "lista", "results"];
        for (const chave of chaves) {
          const valor = payload[chave];
          if (Array.isArray(valor)) return valor;
        }
      }
      return [];
    };

    async function buscarSugestoes() {
      try {
        setCarregandoSugestoes(true);
        setErroSugestoes("");
        const resposta = await fetch(
          "https://apismilepet.vercel.app/api/produtos"
        );
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const dados = await resposta.json();
        const lista = extrairLista(dados);
        const normalizados = lista.map((p) => ({
          ...p,
          id: p.id || p._id || p.uid || p.slug,
        }));

        // mostrar apenas produtos 'pai' (produto_pai_id === null)
        const pais = normalizados.filter((p) => {
          const topLevel =
            Object.prototype.hasOwnProperty.call(p, "produto_pai_id") &&
            p.produto_pai_id === null;
          const nested =
            p &&
            p.produto &&
            Object.prototype.hasOwnProperty.call(p.produto, "produto_pai_id") &&
            p.produto.produto_pai_id === null;
          return Boolean(topLevel || nested);
        });

        if (ativo) setSugestoes(pais.slice(0, 4));
      } catch (err) {
        if (ativo) {
          console.warn("Falha ao buscar produtos para 'Compre também'", err);
          setSugestoes([]);
          setErroSugestoes("Não foi possível carregar sugestões agora.");
        }
      } finally {
        if (ativo) setCarregandoSugestoes(false);
      }
    }

    buscarSugestoes();
    return () => {
      ativo = false;
    };
  }, []);

  const handleQtyChange = (item, value) => {
    const q = Number(value) || 0;
    // update silently on cart page to avoid triggering the global modal open
    updateCartItemQuantity(item.id, item.variante, q, true);
    setCart(getCart());
  };

  const [pendingRemove, setPendingRemove] = useState(null);

  const subtotal = cart.reduce(
    (s, it) => s + Number(it.precoUnit || 0) * Number(it.quantidade || 0),
    0
  );
  // shippingCost is determined by CEP calculation (default 0 until calculated)

  // coupon simple: SMILE10 => 10% off
  const couponDiscount = coupon === "SMILE10" ? subtotal * 0.1 : 0;
  // Total: produtos (subtotal) - cupom + frete (sem VAT)
  const total = subtotal - couponDiscount + (Number(shippingCost) || 0);

  const applyCoupon = (e) => {
    e.preventDefault();
    if (!coupon) {
      setCouponMsg("Insira um código de cupom");
      return;
    }
    if (coupon === "SMILE10") {
      setCouponMsg("Cupom aplicado: 10% off");
    } else {
      setCouponMsg("Cupom inválido");
    }
    setTimeout(() => setCouponMsg(""), 2500);
  };

  const calculateShipping = async (e) => {
    e && e.preventDefault();
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) {
      setShippingMsg("CEP inválido. Digite 8 dígitos.");
      setTimeout(() => setShippingMsg(""), 3000);
      return;
    }

    if (subtotal >= 50) {
      const freeShippingOption = { name: "Frete Grátis", price: 0 };
      setShippingCost(0);
      setShippingLabel("Frete Grátis");
      setShippingMsg("Você ganhou frete grátis!");
      setShippingOptions([]);
      setSelectedShipping(freeShippingOption);
      try {
        localStorage.setItem("smilepet_shipping", "0");
        localStorage.setItem("smilepet_shipping_label", "Frete Grátis");
        localStorage.setItem(
          "smilepet_shipping_option",
          JSON.stringify(freeShippingOption)
        );
      } catch (e) {
        void e;
      }
      return;
    }

    if (!cart || !cart.length) {
      setShippingMsg("Carrinho vazio. Adicione produtos para calcular frete.");
      setTimeout(() => setShippingMsg(""), 3000);
      return;
    }

    setShippingLoading(true);
    setShippingMsg("Calculando frete...");
    setShippingLabel("");
    setShippingOptions([]);
    setSelectedShipping(null);
    setShippingCost(0);

    try {
      const productsPayload = cart.map((it, idx) => {
        return {
          id: String(it.id || it.sku || `sku-${idx}`),
          width: Number(it.width) || 10,
          height: Number(it.height) || 10,
          length: Number(it.length) || 10,
          weight: Number(it.weight) || 0.3,
          insurance_value: Number(it.precoUnit) || 0,
          quantity: Number(it.quantidade) || 1,
        };
      });

      const payload = {
        to: { postal_code: digits },
        products: productsPayload,
      };

      const res = await fetch(
        "https://apismilepet.vercel.app/api/melhorenvio/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let errBody = {};
        try {
          errBody = await res.json();
        } catch {
          // ignore
        }
        const msg = errBody.message || `Erro na cotação (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const options = await res.json();
      const optionsData = Array.isArray(options)
        ? options
        : Array.isArray(options?.result)
        ? options.result
        : [];

      const validOptions = optionsData.filter(
        (opt) => opt.price && !opt.error
      );

      if (validOptions.length > 0) {
        setShippingOptions(validOptions);
        setShippingMsg("Escolha uma opção de frete abaixo.");
      } else {
        setShippingMsg("Nenhuma opção de frete disponível para este CEP.");
      }
    } catch (err) {
      console.error("Erro ao calcular frete:", err);
      setShippingMsg(err.message || "Erro ao calcular frete");
      setShippingCost(0);
    } finally {
      setShippingLoading(false);
      setTimeout(() => setShippingMsg(""), 6000);
    }
  };

  const handleShippingSelection = (option) => {
    setSelectedShipping(option);
    const price = Number(option.price) || 0;
    const label = moeda(price);
    setShippingCost(price);
    setShippingLabel(label);
    setShippingMsg(`Frete ${option.name} selecionado.`);
    try {
      localStorage.setItem("smilepet_shipping", String(price));
      localStorage.setItem("smilepet_shipping_label", label);
    } catch (e) {
      console.warn("Falha ao salvar frete no localStorage", e);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h1 className={styles.title}>Seu carrinho</h1>

          <div className={styles.itemsList}>
            {cart.length === 0 && (
              <div className={styles.empty}>Seu carrinho está vazio.</div>
            )}
            {cart.map((it, idx) => (
              <div
                key={`${it.id}-${it.variante}-${idx}`}
                className={styles.itemRow}
              >
                <div className={styles.itemMain}>
                  <img
                    src={it.imagem_url || "/imgCards/RacaoSeca.png"}
                    alt={it.nome}
                    className={styles.thumb}
                  />
                  <div className={styles.itemInfo}>
                    <a href={`/produtos/${it.id}`} className={styles.itemLink}>
                      {it.nome}
                      {it.variante ? ` - ${it.variante}` : ""}
                    </a>
                    <div className={styles.itemUnit}>{moeda(it.precoUnit)}</div>
                  </div>
                </div>
                <div className={styles.itemControls}>
                  <div
                    className={styles.qtyControl}
                    role="group"
                    aria-label={`Quantidade de ${it.nome}`}
                  >
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      aria-label="Diminuir quantidade"
                      onClick={(e) => {
                        e.stopPropagation();
                        const atual = Number(it.quantidade) || 1;
                        const novo = Math.max(1, atual - 1);
                        handleQtyChange(it, novo);
                      }}
                    >
                      −
                    </button>
                    <div
                      className={styles.qtyDisplay}
                      aria-live="polite"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Math.max(1, Number(it.quantidade) || 1)}
                    </div>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      aria-label="Aumentar quantidade"
                      onClick={(e) => {
                        e.stopPropagation();
                        const atual = Number(it.quantidade) || 1;
                        const novo = Math.min(10, atual + 1);
                        handleQtyChange(it, novo);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={styles.itemTotal}>
                  <div className={styles.totalPrice}>
                    {moeda(
                      Number(it.precoUnit || 0) * Number(it.quantidade || 0)
                    )}
                  </div>
                </div>
                <button
                  className={styles.removeBtn}
                  aria-label="Remover item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingRemove(it);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <form className={styles.couponRow} onSubmit={applyCoupon}>
            <input
              type="text"
              placeholder="Código do cupom"
              className={styles.couponInput}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button type="submit" className={styles.couponBtn}>
              Aplicar cupom
            </button>
          </form>
          {couponMsg && <div className={styles.couponMsg}>{couponMsg}</div>}
        </div>

        <aside className={styles.right}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Total do carrinho</h2>
            <div className={styles.rowBetween}>
              <span>Subtotal</span>
              <div className={styles.colRight}>
                <div className={styles.bold}>{moeda(subtotal)}</div>
              </div>
            </div>

            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Envio</div>
              <div className={styles.cepRow}>
                <input
                  type="text"
                  placeholder="CEP (somente números)"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className={styles.cepInput}
                />
                <button
                  className={styles.cepBtn}
                  onClick={calculateShipping}
                  disabled={shippingLoading}
                >
                  {shippingLoading ? "Calculando..." : "Calcular frete"}
                </button>
              </div>
              {shippingMsg && (
                <div
                  className={
                    subtotal >= 50
                      ? styles.shippingMsgSuccess
                      : styles.shippingMsg
                  }
                >
                  {shippingMsg}
                </div>
              )}

              {shippingOptions.length > 0 && (
                <div className={styles.shippingOptionsContainer}>
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={styles.shippingOption}
                      htmlFor={`shipping-option-${option.id}`}
                    >
                      <input
                        type="radio"
                        id={`shipping-option-${option.id}`}
                        name="shippingOption"
                        value={option.id}
                        checked={selectedShipping?.id === option.id}
                        onChange={() => handleShippingSelection(option)}
                        className={styles.shippingRadio}
                      />
                      <img
                        src={option.company.picture}
                        alt={option.company.name}
                        className={styles.shippingCompanyLogo}
                      />
                      <span className={styles.shippingName}>{option.name}</span>
                      <span className={styles.shippingPrice}>
                        {moeda(option.price)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <hr className={styles.sep} />
            <div className={styles.rowBetween}>
              <span>Frete</span>
              <span>{shippingLabel ? shippingLabel : moeda(shippingCost)}</span>
            </div>
            <hr className={styles.sep} />
            <div className={styles.rowBetweenTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{moeda(total)}</span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={() => navigate("/coletadeemail")}
            >
              Finalizar Pedido
            </button>
          </div>
        </aside>
      </div>

      <section className={styles.compreTambemSection}>
        <h2 className={styles.compreTambemTitle}>Compre também...</h2>
        {carregandoSugestoes ? (
          <div className={styles.compreTambemMensagem}>
            Carregando sugestões...
          </div>
        ) : erroSugestoes ? (
          <div className={styles.compreTambemMensagem}>{erroSugestoes}</div>
        ) : sugestoes.length === 0 ? (
          <div className={styles.compreTambemMensagem}>
            Não encontramos sugestões no momento.
          </div>
        ) : (
          <div className={styles.compreTambemGrid}>
            {sugestoes.map((produto) => {
              const idProduto =
                produto.id || produto._id || produto.uid || produto.slug;
              return (
                <article
                  key={idProduto || produto.nome}
                  className={styles.compreTambemCard}
                >
                  <button
                    type="button"
                    className={styles.compreTambemLink}
                    onClick={() => navigate(`/produtos/${idProduto}`)}
                  >
                    <img
                      src={produto.imagem_url || "/imgCards/RacaoSeca.png"}
                      alt={produto.nome}
                      className={styles.compreTambemImg}
                    />
                    <span className={styles.compreTambemNome}>
                      {produto.nome}
                    </span>
                  </button>
                  <div className={styles.compreTambemPreco}>
                    {moeda(produto.preco_promocional || produto.preco)}
                  </div>
                  <button
                    type="button"
                    className={styles.compreTambemBtn}
                    onClick={() => navigate(`/produtos/${idProduto}`)}
                  >
                    Ver produto
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingRemove && (
        <div
          className={styles.removeOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setPendingRemove(null)}
        >
          <div
            className={styles.removeDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.removeTitle}>Confirmar exclusão</div>
            <div className={styles.removeMessage}>
              Ao excluir o produto, ele será removido do carrinho. Tem certeza
              que deseja continuar?
            </div>
            <div className={styles.removeActions}>
              <button
                type="button"
                className={styles.removeCancelBtn}
                onClick={() => setPendingRemove(null)}
              >
                Voltar
              </button>
              <button
                type="button"
                className={styles.removeConfirmBtn}
                onClick={() => {
                  // perform removal and close
                  removeCartItem(
                    pendingRemove.id,
                    pendingRemove.variante,
                    true
                  );
                  setCart(getCart());
                  setPendingRemove(null);
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

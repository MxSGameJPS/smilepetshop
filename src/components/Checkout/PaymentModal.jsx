import React, { useEffect, useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import styles from "./paymentModal.module.css";
import { FaBarcode, FaPix } from "react-icons/fa6";
import { BsCreditCard2FrontFill } from "react-icons/bs";

const API_ENDPOINT = "https://apismilepet.vercel.app/api/checkout/transparent";

export default function PaymentModal({
  isOpen,
  onClose,
  items = [],
  user = null,
  formData = null,
  shippingCost = 0,
  shippingServiceName = null,
  coupon = null,
  onSuccess = null,
}) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState(null);
  const [boletoUrl, setBoletoUrl] = useState(null);

  // Calcular total para o Brick
  const itemsTotal = items.reduce((acc, item) => {
    const p = item.precoUnit || item.price || item.valor || 0;
    const q = item.quantity || item.quantidade || item.qty || 1;
    return acc + p * q;
  }, 0);
  // Nota: O desconto do cupom não está disponível aqui facilmente se for calculado no backend,
  // mas o Brick precisa de um valor aproximado para exibir as parcelas.
  // Se tiver o valor do desconto no frontend, subtraia aqui.
  const totalAmount = itemsTotal + Number(shippingCost || 0);

  useEffect(() => {
    try {
      const key = import.meta.env.VITE_MP_PUBLIC_KEY;
      if (key) initMercadoPago(key, { locale: "pt-BR" }); 
    } catch (err) {
      console.debug("MP init failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setLoading(false);
      setError("");
      setPixData(null);
      setBoletoUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commonPayload = (extra = {}) => ({
    items,
    user: user || null,
    shippingCost: Number(shippingCost) || 0,
    shippingServiceName: shippingServiceName || null,
    coupon: coupon || null,
    payer: {
      // prefer values from the live checkout form (formData), fallback to user
      email:
        (formData && formData.email) ||
        (user && (user.email || user.emailAddress)) ||
        "",
      identification: {
        type: "CPF",
        number:
          (formData && formData.cpf) ||
          (user && (user.cpf || user.cpf_cliente)) ||
          "",
      },
    },
    ...extra,
  });

  const doPix = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = commonPayload({ payment_method_id: "pix" });
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Erro ao gerar PIX");
      const qr = data?.point_of_interaction?.transaction_data?.qr_code || null;
      const qrBase64 =
        data?.point_of_interaction?.transaction_data?.qr_code_base64 ||
        data?.qr_code_base64 ||
        data?.point_of_interaction?.transaction_data?.qr_codeBase64 ||
        null;
      setPixData({ qr, qrBase64 });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao processar PIX");
    } finally {
      setLoading(false);
    }
  };

  const doBoleto = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = commonPayload({ payment_method_id: "bolbradesco" });
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Erro ao gerar boleto");
      const url = data?.transaction_details?.external_resource_url || null;
      setBoletoUrl(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao processar boleto");
    } finally {
      setLoading(false);
    }
  };

  // Função chamada pelo Brick quando o usuário clica em Pagar
  const handleCardSubmit = async (paymentFormData) => {
    setLoading(true);
    setError("");
    try {
      // O Brick retorna os dados necessários (token, issuer_id, payment_method_id, installments, etc)
      const { token, issuer_id, payment_method_id, installments, payer } =
        paymentFormData;

      const payload = commonPayload({
        token,
        issuer_id,
        payment_method_id,
        installments,
        // O Brick pode retornar dados do payer (email) se preenchido lá, mas já temos no commonPayload
      });

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Erro no pagamento com cartão"
        );

      if (data?.status === "approved") {
        if (onSuccess) onSuccess(data);
        window.location.href = "/obrigado";
      } else if (data?.status === "in_process" || data?.status === "pending") {
        // Pagamento em análise, redireciona avisando que está pendente
        if (onSuccess) onSuccess(data);
        window.location.href = "/obrigado?status=pending";
      } else if (data?.status === "rejected") {
        // Pagamento recusado - NÃO redirecionar
        let msg = "Pagamento recusado.";
        if (data.status_detail === "cc_rejected_insufficient_amount") {
          msg = "Saldo insuficiente.";
        } else if (
          data.status_detail === "cc_rejected_bad_filled_card_number"
        ) {
          msg = "Número do cartão inválido.";
        } else if (data.status_detail === "cc_rejected_bad_filled_date") {
          msg = "Data de validade incorreta.";
        } else if (
          data.status_detail === "cc_rejected_bad_filled_security_code"
        ) {
          msg = "Código de segurança incorreto.";
        } else if (data.status_detail === "cc_rejected_call_for_authorize") {
          msg = "Autorização necessária. Ligue para o banco.";
        } else {
          msg = "Pagamento recusado pelo banco ou operadora.";
        }
        throw new Error(msg);
      } else {
        // Outros status desconhecidos
        throw new Error(data?.message || "Erro ao processar pagamento.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro no pagamento com cartão");
      // Importante: Retornar Promise.reject() para o Brick saber que falhou
      return Promise.reject();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Escolha a forma de pagamento</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>
        <div className={styles.body}>
          {!selected ? (
            <div className={styles.optionsRow}>
              <div className={styles.card} onClick={() => setSelected("pix")}>
                <div className={styles.icon}>
                  <FaPix />
                </div>
                <div className={styles.cardTitle}>PIX</div>
                <div className={styles.cardSubtitle}>Aprovação Imediata</div>
              </div>
              <div
                className={styles.card}
                onClick={() => setSelected("boleto")}
              >
                <div className={styles.iconBoleto}>
                  <FaBarcode />
                </div>
                <div className={styles.cardTitle}>Boleto Bancário</div>
                <div className={styles.cardSubtitle}>Até 3 dias úteis</div>
              </div>
              <div className={styles.card} onClick={() => setSelected("card")}>
                <div className={styles.iconCartao}>
                  <BsCreditCard2FrontFill />
                </div>
                <div className={styles.cardTitle}>Cartão de Crédito</div>
                <div className={styles.cardSubtitle}>Até 10x</div>
                <div className={styles.cardImg}>
                  <img
                    className={styles.cardImgem}
                    src="../cartao.png"
                    alt=""
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.selectedPanel}>
              <button
                className={styles.backBtn}
                onClick={() => setSelected(null)}
              >
                ← Voltar
              </button>
              {selected === "pix" && (
                <div className={styles.pixOnly}>
                  <div className={styles.iconLarge}>
                    <FaPix />
                  </div>
                  <h3>PIX - Aprovação Imediata</h3>
                  {!pixData ? (
                    <div className={styles.cardAction}>
                      <button
                        onClick={doPix}
                        className={styles.primaryAction}
                        disabled={loading}
                      >
                        Gerar PIX
                      </button>
                    </div>
                  ) : (
                    <div className={styles.pixBox}>
                      {pixData.qrBase64 ? (
                        <img
                          alt="PIX QR"
                          src={`data:image/png;base64,${pixData.qrBase64}`}
                          style={{ maxWidth: 320 }}
                        />
                      ) : null}
                      {pixData.qr && (
                        <div className={styles.qrText}>
                          <textarea readOnly value={pixData.qr} rows={4} />
                          <button
                            className={styles.primaryAction}
                            onClick={() => {
                              navigator.clipboard?.writeText(pixData.qr);
                            }}
                          >
                            Copiar Código
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selected === "boleto" && (
                <div className={styles.boletoOnly}>
                  <div className={styles.iconLargeBoleto}>
                    <FaBarcode />
                  </div>
                  <h3>Boleto Bancário - Até 3 dias úteis</h3>
                  {!boletoUrl ? (
                    <div className={styles.cardAction}>
                      <button
                        onClick={doBoleto}
                        className={styles.primaryAction}
                        disabled={loading}
                      >
                        Gerar Boleto
                      </button>
                    </div>
                  ) : (
                    <div className={styles.boletoBox}>
                      <a
                        href={boletoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.primaryAction}
                      >
                        Baixar Boleto
                      </a>
                      <div className={styles.info}>
                        O boleto também será enviado por e-mail automaticamente.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected === "card" && (
                <div className={styles.cardOnly}>
                  <div className={styles.iconLargeCartao}>
                    <BsCreditCard2FrontFill />
                  <h3>Cartão de Crédito</h3> 
                  </div>
                  <div className={styles.cardAction}>
                    <CardPayment
                      initialization={{ amount: totalAmount }}
                      onSubmit={handleCardSubmit}
                      customization={{
                        paymentMethods: {
                          minInstallments: 1,
                          maxInstallments: 12,
                        },
                        visual: {
                          style: {
                            theme: "default", // 'default' | 'dark' | 'bootstrap' | 'flat'
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {loading && <div className={styles.info}>Processando...</div>}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

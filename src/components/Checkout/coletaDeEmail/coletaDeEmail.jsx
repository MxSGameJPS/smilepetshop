import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./coletaDeEmail.module.css";
import { getUser } from "../../../lib/auth";

const EMAIL_STORAGE_KEY = "smilepet_checkout_email";

const flattenUser = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const direct = raw;
  const nestedKeys = ["data", "user", "client", "cliente", "payload", "conta"];
  for (const key of nestedKeys) {
    if (direct[key] && typeof direct[key] === "object") {
      const nested = flattenUser(direct[key]);
      if (nested) return nested;
    }
  }
  return direct;
};

const extractEmail = (raw) => {
  const user = flattenUser(raw);
  if (!user || typeof user !== "object") return "";
  const fields = [
    "email",
    "emailAddress",
    "email_cliente",
    "emailCliente",
    "emailUsuario",
    "emailusuario",
  ];
  for (const field of fields) {
    const value = user[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (user.contact && typeof user.contact === "object") {
    const nested = extractEmail(user.contact);
    if (nested) return nested;
  }
  if (user.contato && typeof user.contato === "object") {
    const nested = extractEmail(user.contato);
    if (nested) return nested;
  }
  return "";
};

const readStoredEmail = () => {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const persistEmail = (value) => {
  try {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(EMAIL_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(EMAIL_STORAGE_KEY);
    }
  } catch {
    // ignore persistence failures
  }
};

export default function ColetaDeEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userEmail = extractEmail(getUser());
    const storedEmail = readStoredEmail();
    if (userEmail) {
      setEmail(userEmail);
      persistEmail(userEmail);
      return;
    }
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      const nextEmail = extractEmail(event?.detail ?? getUser());
      if (!nextEmail) return;
      setEmail(nextEmail);
      persistEmail(nextEmail);
    };

    const handleStorage = (event) => {
      if (event.key === EMAIL_STORAGE_KEY) {
        if (typeof event.newValue === "string") {
          setEmail(event.newValue);
        } else if (!event.newValue) {
          setEmail("");
        }
      }
      if (event.key === "smilepet_user") {
        handleUserUpdate({ detail: getUser() });
      }
    };

    window.addEventListener("smilepet_user_update", handleUserUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("smilepet_user_update", handleUserUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Informe um e-mail para continuar.");
      return;
    }
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(trimmed)) {
      setError("Digite um e-mail válido.");
      return;
    }
    setSubmitting(true);
    persistEmail(trimmed);
    navigate("/checkout");
  };

  const handleChange = (event) => {
    setEmail(event.target.value);
    if (error) setError("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <section className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Quase lá!</h1>
            <p className={styles.subtitle}>
              Precisamos do seu e-mail para enviar atualizações do pedido e o
              comprovante da compra.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="checkout-email">
              E-mail
              <input
                id="checkout-email"
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="seunome@email.com"
                autoComplete="email"
                required
                className={styles.input}
              />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryAction}
                disabled={submitting}
              >
                Continuar para o checkout
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => navigate("/carrinho")}
              >
                Voltar ao carrinho
              </button>
            </div>
          </form>

          <div className={styles.securityNote}>
            <div className={styles.lockIcon} aria-hidden="true" />
            <div>
              <strong className={styles.securityTitle}>
                Seus dados estão protegidos
              </strong>
              <p className={styles.securityText}>
                Utilizamos o e-mail somente para comunicação sobre o seu pedido.
                Você poderá atualizar essa informação a qualquer momento durante
                o checkout.
              </p>
            </div>
          </div>

          <ul className={styles.benefits}>
            <li className={styles.benefitItem}>
              Receba o comprovante de pagamento imediatamente.
            </li>
            <li className={styles.benefitItem}>
              Acompanhe o status do pedido passo a passo.
            </li>
            <li className={styles.benefitItem}>
              Seja avisado sobre promoções exclusivas da Smile Pet.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

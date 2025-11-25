import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./coletaDeEmail.module.css";
import { getUser, setUser, broadcastUserUpdate } from "../../../lib/auth";

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
  const [stepChoice, setStepChoice] = useState(null); // null | "have" | "not"
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [password, setPassword] = useState("");
  // registration full form (copied from CadastroUsuario)
  const [regForm, setRegForm] = useState({
    nome: "",
    sobrenome: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    whatsapp: "",
    company: "",
    address2: "",
    postal: "",
    email: "",
    senha: "",
  });
  const [regErrors, setRegErrors] = useState({});
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSubmitError, setRegSubmitError] = useState("");
  // email-only helper removed; we rely on login/register flows

  useEffect(() => {
    // if already logged in -> go to checkout directly
    const current = getUser();
    if (current) {
      navigate("/checkout");
      return;
    }

    const userEmail = extractEmail(current);
    const storedEmail = readStoredEmail();
    if (userEmail) {
      setEmail(userEmail);
      persistEmail(userEmail);
      return;
    }
    if (storedEmail) setEmail(storedEmail);
  }, [navigate]);

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

  // note: simple email-only continue flow preserved via inline action in choice UI

  // --- Login flow (existing user) ---
  const handleLogin = async (ev) => {
    ev && ev.preventDefault();
    setAuthError("");
    if (!email.trim() || !password) {
      setAuthError("Informe e-mail e senha para entrar.");
      return;
    }
    setLoadingAuth(true);
    try {
      const res = await fetch(
        "https://apismilepet.vercel.app/api/client/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAuthError((data && data.error) || "Credenciais inválidas.");
        return;
      }
      const user = data?.user ?? data;
      if (!user) {
        setAuthError("Resposta inesperada do servidor.");
        return;
      }
      try {
        setUser(user);
        broadcastUserUpdate(user);
      } catch (e) {
        void e;
      }
      navigate("/checkout");
    } catch (err) {
      console.error(err);
      setAuthError("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingAuth(false);
    }
  };

  // --- Registration flow (new user) ---
  function isEmailValid(v) {
    return /^\S+@\S+\.\S+$/.test(String(v).toLowerCase());
  }
  function isSenhaValid(v) {
    return typeof v === "string" && v.length >= 8;
  }

  function handleRegChange(e) {
    const { name: nm, value } = e.target;
    setRegForm((f) => ({ ...f, [nm]: value }));
  }

  function handleRegPostalChange(e) {
    const digits = (e.target.value || "").replace(/\D/g, "");
    const limited = digits.slice(0, 8);
    setRegForm((f) => ({ ...f, postal: limited }));
  }

  function validateReg() {
    const err = {};
    if (!regForm.nome) err.nome = "Informe o nome";
    if (!regForm.sobrenome) err.sobrenome = "Informe o sobrenome";
    if (!regForm.rua) err.rua = "Informe a rua/avenida";
    if (!regForm.numero) err.numero = "Informe o número";
    if (!regForm.bairro) err.bairro = "Informe o bairro";
    if (!regForm.cidade) err.cidade = "Informe a cidade";
    if (!regForm.estado) err.estado = "Informe o estado";
    if (!regForm.whatsapp) err.whatsapp = "Informe o WhatsApp";
    if (!isEmailValid(regForm.email)) err.email = "Email inválido";
    if (!isSenhaValid(regForm.senha))
      err.senha = "Senha deve ter ao menos 8 caracteres";
    setRegErrors(err);
    return Object.keys(err).length === 0;
  }

  const handleRegister = async (ev) => {
    ev && ev.preventDefault();
    setRegSubmitError("");
    if (!validateReg()) return;
    setRegSubmitting(true);
    try {
      const payload = {
        first_name: regForm.nome || regForm.first_name,
        last_name: regForm.sobrenome || regForm.last_name,
        company: null,
        address1: regForm.rua || null,
        numero: regForm.numero || null,
        address2: regForm.address2 || null,
        city: regForm.cidade || null,
        state: regForm.estado || null,
        bairro: regForm.bairro || null,
        postal: regForm.postal || null,
        phone: regForm.whatsapp || null,
        email: regForm.email,
        password: regForm.senha,
      };

      const res = await fetch("https://apismilepet.vercel.app/api/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        if (data && (data.message || data.error))
          msg = data.message || data.error;
        setRegSubmitError(String(msg));
        return;
      }

      const user = data?.user ?? data;
      if (!user) {
        setRegSubmitError("Resposta inesperada do servidor.");
        return;
      }

      try {
        setUser(user);
        broadcastUserUpdate(user);
        try {
          localStorage.setItem("smilepet_newly_registered", "1");
        } catch (e) {
          void e;
        }
      } catch (e) {
        void e;
      }

      navigate("/checkout");
    } catch (err) {
      console.error(err);
      setRegSubmitError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // email input handlers are in-place in the login/choice forms

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <section className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Quase lá!</h1>
            {/* <p className={styles.subtitle}>
              Precisamos do seu e-mail para enviar atualizações do pedido e o
              comprovante da compra.
            </p> */}
          </header>

          {/* Escolha inicial: já tem cadastro ? */}
          {stepChoice === null && (
            <div className={styles.choiceRow}>
              <p>Você já tem cadastro no site?</p>
              <div className={styles.choiceBtns}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => setStepChoice("have")}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => setStepChoice("not")}
                >
                  Não
                </button>
              </div>
              {/* <div className={styles.orSeparator}>ou</div>
              <div className={styles.smallNote}>
                Você também pode apenas informar um e-mail e continuar sem criar
                conta.
              </div>
              <div className={styles.actions}>
                <label className={styles.label} htmlFor="checkout-email">
                  E-mail
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="seunome@email.com"
                    autoComplete="email"
                    className={styles.input}
                  />
                </label>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actionsInline}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={handleSubmit}
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
              </div> */}
            </div>
          )}

          {/* Formulário de login (usuário existente) */}
          {stepChoice === "have" && (
            <form className={styles.form} onSubmit={handleLogin}>
              <label className={styles.label} htmlFor="login-email">
                E-mail
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </label>
              <label className={styles.label} htmlFor="login-password">
                Senha
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </label>
              {authError && <div className={styles.error}>{authError}</div>}
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryAction}
                  disabled={loadingAuth}
                >
                  {loadingAuth ? "Entrando..." : "Entrar"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => setStepChoice(null)}
                >
                  Voltar
                </button>
              </div>
            </form>
          )}

          {/* Formulário de cadastro (novo usuário) */}
          {stepChoice === "not" && (
            <form className={styles.form} onSubmit={handleRegister} noValidate>
              <label className={styles.label}>
                Nome
                <input
                  name="nome"
                  value={regForm.nome}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.nome && (
                  <div className={styles.error}>{regErrors.nome}</div>
                )}
              </label>

              <label className={styles.label}>
                Sobrenome
                <input
                  name="sobrenome"
                  value={regForm.sobrenome}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.sobrenome && (
                  <div className={styles.error}>{regErrors.sobrenome}</div>
                )}
              </label>

              <label className={styles.label}>
                Rua/AV
                <input
                  name="rua"
                  value={regForm.rua}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.rua && (
                  <div className={styles.error}>{regErrors.rua}</div>
                )}
              </label>

              <label className={styles.label}>
                Número
                <input
                  name="numero"
                  value={regForm.numero}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.numero && (
                  <div className={styles.error}>{regErrors.numero}</div>
                )}
              </label>

              <label className={styles.label}>
                Complemento
                <input
                  name="address2"
                  value={regForm.address2}
                  onChange={handleRegChange}
                  className={styles.input}
                  placeholder="Apartamento, bloco (opcional)"
                />
              </label>

              <label className={styles.label}>
                CEP
                <input
                  name="postal"
                  value={regForm.postal}
                  onChange={handleRegPostalChange}
                  className={styles.input}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Somente números"
                />
              </label>

              <label className={styles.label}>
                Bairro
                <input
                  name="bairro"
                  value={regForm.bairro}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.bairro && (
                  <div className={styles.error}>{regErrors.bairro}</div>
                )}
              </label>

              <label className={styles.label}>
                Cidade
                <input
                  name="cidade"
                  value={regForm.cidade}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.cidade && (
                  <div className={styles.error}>{regErrors.cidade}</div>
                )}
              </label>

              <label className={styles.label}>
                Estado
                <input
                  name="estado"
                  value={regForm.estado}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.estado && (
                  <div className={styles.error}>{regErrors.estado}</div>
                )}
              </label>

              <label className={styles.label}>
                WhatsApp
                <input
                  name="whatsapp"
                  value={regForm.whatsapp}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.whatsapp && (
                  <div className={styles.error}>{regErrors.whatsapp}</div>
                )}
              </label>

              <label className={styles.label}>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.email && (
                  <div className={styles.error}>{regErrors.email}</div>
                )}
              </label>

              <label className={styles.label}>
                Senha
                <input
                  name="senha"
                  type="password"
                  value={regForm.senha}
                  onChange={handleRegChange}
                  className={styles.input}
                />
                {regErrors.senha && (
                  <div className={styles.error}>{regErrors.senha}</div>
                )}
              </label>

              {regSubmitError && (
                <div className={styles.error}>{regSubmitError}</div>
              )}
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryAction}
                  disabled={regSubmitting}
                >
                  {regSubmitting ? "Cadastrando..." : "Cadastrar"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => setStepChoice(null)}
                >
                  Voltar
                </button>
              </div>
            </form>
          )}

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

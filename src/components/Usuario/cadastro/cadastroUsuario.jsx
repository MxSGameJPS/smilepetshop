import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./cadastroUsuario.module.css";
import { RxFontRoman } from "react-icons/rx";

const estadosBR = [
  { sigla: "", nome: "Selecione..." },
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isEmailValid = (v) => /^\S+@\S+\.\S+$/.test(String(v).toLowerCase());
  const isSenhaValid = (v) => typeof v === "string" && v.length >= 8;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handlePostalChange(e) {
    const digits = (e.target.value || "").replace(/\D/g, "");
    const limited = digits.slice(0, 8);
    setForm((f) => ({ ...f, postal: limited }));

    if (limited.length === 8) {
      buscarEndereco(limited);
    }
  }

  async function buscarEndereco(cep) {
    const cepLimpo = (cep || "").toString().replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        alert("CEP não encontrado!");
        return;
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        estado: data.uf || f.estado,
      }));
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    }
  }

  function validate() {
    const err = {};
    if (!form.nome) err.nome = "Informe o nome";
    if (!form.sobrenome) err.sobrenome = "Informe o sobrenome";
    if (!form.rua) err.rua = "Informe a rua/avenida";
    if (!form.numero) err.numero = "Informe o número";
    if (!form.bairro) err.bairro = "Informe o bairro";
    if (!form.cidade) err.cidade = "Informe a cidade";
    if (!form.estado) err.estado = "Informe o estado";
    if (!form.whatsapp) err.whatsapp = "Informe o WhatsApp";
    if (!isEmailValid(form.email)) err.email = "Email inválido";
    if (!isSenhaValid(form.senha))
      err.senha = "Senha deve ter ao menos 8 caracteres";
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    // Enviar para o endpoint de cadastro
    (async () => {
      try {
        setErrors({});
        setSubmitError("");
        setSubmitting(true);
        // mapear o formulário para a mesma estrutura usada no checkout
        // (campos em snake_case e nomes compatíveis)
        const payload = {
          first_name: form.nome || form.first_name,
          last_name: form.sobrenome || form.last_name,
          company: null,
          address1: form.rua || null,
          numero: form.numero || null,
          address2: form.complemento || form.address2 || null,
          city: form.cidade || null,
          state: form.estado || null,
          bairro: form.bairro || null,
          postal: form.cep || form.postal || null,
          phone: form.whatsapp || form.phone || null,
          email: form.email,
          password: form.senha,
        };

        const res = await fetch("https://apismilepet.vercel.app/api/client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          // sucesso: redirecionar para login
          navigate("/login");
        } else {
          // tentar ler mensagem de erro
          let msg = `Erro ${res.status}`;
          try {
            const data = await res.json();
            if (data && data.message) msg = String(data.message);
            else if (data && data.error) msg = String(data.error);
          } catch {
            // ignore
          }
          setSubmitError(msg);
        }
      } catch {
        setSubmitError("Erro ao conectar com o servidor. Tente novamente.");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  return (
    <section className={styles.cadastroSection}>
      <h1>Cadastro</h1>
      <p>Preencha seus dados para criar uma conta.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.row}>
          <div className={styles.col}>
            <label>Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.nome && <div className={styles.error}>{errors.nome}</div>}
          </div>
          <div className={styles.col}>
            <label>Sobrenome</label>
            <input
              name="sobrenome"
              value={form.sobrenome}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.sobrenome && (
              <div className={styles.error}>{errors.sobrenome}</div>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Rua/AV</label>
            <input
              name="rua"
              value={form.rua}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.rua && <div className={styles.error}>{errors.rua}</div>}
          </div>
          <div className={styles.colSmall}>
            <label>Numero</label>
            <input
              name="numero"
              value={form.numero}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.numero && (
              <div className={styles.error}>{errors.numero}</div>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Complemento</label>
            <input
              name="address2"
              value={form.address2}
              onChange={handleChange}
              className={styles.input}
              placeholder="Apartamento, bloco, complemento (opcional)"
            />
          </div>
          <div className={styles.colSmall}>
            <label>CEP</label>
            <input
              name="postal"
              value={form.postal}
              onChange={handlePostalChange}
              className={styles.input}
              inputMode="numeric"
              maxLength={8}
              placeholder="Somente números"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Bairro</label>
            <input
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.bairro && (
              <div className={styles.error}>{errors.bairro}</div>
            )}
          </div>
          <div className={styles.col}>
            <label>Cidade</label>
            <input
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.cidade && (
              <div className={styles.error}>{errors.cidade}</div>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.colSmall}>
            <label>Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className={styles.input}
            >
              {estadosBR.map((est) => (
                <option key={est.sigla} value={est.sigla}>
                  {est.sigla || est.nome}
                </option>
              ))}
            </select>
            {errors.estado && (
              <div className={styles.error}>{errors.estado}</div>
            )}
          </div>
          <div className={styles.col}>
            <label>WhatsApp</label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.whatsapp && (
              <div className={styles.error}>{errors.whatsapp}</div>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <label>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>
          <div className={styles.col}>
            <label>Senha</label>
            <input
              name="senha"
              type="password"
              value={form.senha}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.senha && <div className={styles.error}>{errors.senha}</div>}
          </div>
        </div>

        {submitError && <div className={styles.error}>{submitError}</div>}
        <button
          className={styles.submitBtn}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </section>
  );
}

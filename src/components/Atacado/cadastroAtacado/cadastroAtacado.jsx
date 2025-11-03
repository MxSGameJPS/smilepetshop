import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./cadastroAtacado.module.css";

const initialState = {
  razaoSocial: "",
  fantasia: "",
  cnpj: "",
  rua: "",
  cep: "",
  bairro: "",
  cidade: "",
  estado: "",
  email: "",
  telefone: "",
  whatsapp: "",
  senha: "",
};

export default function CadastroAtacado() {
  const [form, setForm] = useState(initialState);
  const [erros, setErros] = useState({});
  const [sucesso, setSucesso] = useState("");
  const navigate = useNavigate();

  function validate() {
    const e = {};
    if (!form.razaoSocial) e.razaoSocial = "Campo obrigatório";
    if (!form.cnpj || form.cnpj.replace(/\D/g, "").length !== 14)
      e.cnpj = "CNPJ deve ter 14 números";
    if (!form.rua) e.rua = "Campo obrigatório";
    if (!form.cep) e.cep = "Campo obrigatório";
    if (!form.bairro) e.bairro = "Campo obrigatório";
    if (!form.cidade) e.cidade = "Campo obrigatório";
    if (!form.estado) e.estado = "Campo obrigatório";
    if (!form.email) e.email = "Campo obrigatório";
    if (!form.whatsapp) e.whatsapp = "Campo obrigatório";
    if (!form.senha) e.senha = "Campo obrigatório";
    else if (
      !/^.*[A-Z].*[!@#$%^&*()_+\-=\[\]{};':",.<>/?].*$/.test(form.senha) ||
      form.senha.length < 8
    )
      e.senha = "Mínimo 8 dígitos, 1 maiúscula e 1 especial";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const eValid = validate();
    setErros(eValid);
    if (Object.keys(eValid).length === 0) {
      try {
        const res = await fetch(
          "https://apismilepet.vercel.app/api/atacado/parceiros",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
        if (res.ok) {
          setSucesso("Cadastro enviado!");
          setForm(initialState);
          setTimeout(() => navigate("/loginatacado"), 1200);
        } else {
          setSucesso("Erro ao enviar cadastro. Tente novamente.");
        }
      } catch {
        setSucesso("Erro de conexão. Tente novamente.");
      }
    } else {
      setSucesso("");
    }
  }

  return (
    <div className={styles.bgCadastroAtacado}>
      <form className={styles.cardCadastroAtacado} onSubmit={handleSubmit}>
        <h1 className={styles.titulo}>Cadastro Atacado</h1>
        <div className={styles.gridForm}>
          <div className={styles.inputGroup}>
            <label>Razão Social*</label>
            <input
              name="razaoSocial"
              value={form.razaoSocial}
              onChange={handleChange}
              required
            />
            {erros.razaoSocial && (
              <span className={styles.erro}>{erros.razaoSocial}</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Fantasia</label>
            <input
              name="fantasia"
              value={form.fantasia}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>CNPJ* Apenas números</label>
            <input
              name="cnpj"
              value={form.cnpj}
              onChange={(e) => {
                // Aceita apenas números
                const value = e.target.value.replace(/\D/g, "");
                setForm((f) => ({ ...f, cnpj: value }));
              }}
              maxLength={14}
              inputMode="numeric"
              required
            />
            {erros.cnpj && <span className={styles.erro}>{erros.cnpj}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label>Rua/AV* e número</label>
            <input
              name="rua"
              value={form.rua}
              onChange={handleChange}
              required
            />
            {erros.rua && <span className={styles.erro}>{erros.rua}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label>CEP*</label>
            <input
              name="cep"
              value={form.cep}
              onChange={handleChange}
              required
            />
            {erros.cep && <span className={styles.erro}>{erros.cep}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label>Bairro*</label>
            <input
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              required
            />
            {erros.bairro && (
              <span className={styles.erro}>{erros.bairro}</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Cidade*</label>
            <input
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              required
            />
            {erros.cidade && (
              <span className={styles.erro}>{erros.cidade}</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Estado*</label>
            <input
              name="estado"
              value={form.estado}
              onChange={handleChange}
              required
            />
            {erros.estado && (
              <span className={styles.erro}>{erros.estado}</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>Email*</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            {erros.email && <span className={styles.erro}>{erros.email}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label>Telefone</label>
            <input
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>WhatsApp*</label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              required
            />
            {erros.whatsapp && (
              <span className={styles.erro}>{erros.whatsapp}</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label>
              Senha* 8 dígitos, incluindo Letra Maiúscula e Caracteres especiais
            </label>
            <input
              name="senha"
              type="password"
              value={form.senha}
              onChange={handleChange}
              required
            />
            {erros.senha && <span className={styles.erro}>{erros.senha}</span>}
          </div>
        </div>
        <button type="submit" className={styles.btnCadastrar}>
          Cadastrar
        </button>
        <p className={styles.info}>
          {" "}
          A senha deve ter 8 digitos incluindo Letra Maiúscula e Caracteres
          especiais
        </p>
        {sucesso && <div className={styles.sucesso}>{sucesso}</div>}
      </form>
    </div>
  );
}

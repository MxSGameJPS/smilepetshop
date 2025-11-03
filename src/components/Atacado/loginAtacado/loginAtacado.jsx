import React, { useState } from "react";
import styles from "./loginAtacado.module.css";

export default function LoginAtacado() {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [erroCnpj, setErroCnpj] = useState("");

  function handleCnpjChange(e) {
    const value = e.target.value.replace(/\D/g, "");
    setCnpj(value);
    if (value.length > 14) setErroCnpj("CNPJ deve ter 14 números");
    else setErroCnpj("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (cnpj.length !== 14) {
      setErroCnpj("CNPJ deve ter 14 números");
      return;
    }
    // Aqui você pode adicionar lógica de autenticação
    alert("Login enviado!");
  }

  return (
    <div className={styles.bgLoginAtacado}>
      <form className={styles.cardLoginAtacado} onSubmit={handleSubmit}>
        <h1 className={styles.titulo}>Login Atacado</h1>
        <div className={styles.inputGroup}>
          <label htmlFor="cnpj">CNPJ</label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            inputMode="numeric"
            pattern="\d{14}"
            maxLength={14}
            value={cnpj}
            onChange={handleCnpjChange}
            required
            className={erroCnpj ? styles.inputErro : ""}
            autoComplete="off"
          />
          {erroCnpj && <span className={styles.erro}>{erroCnpj}</span>}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <button type="submit" className={styles.btnEntrar}>
          Entrar
        </button>
        <div className={styles.linkCadastro}>
          <a href="/cadastroatacado">Ainda Não Tenho Cadastro.</a>
        </div>
      </form>
    </div>
  );
}

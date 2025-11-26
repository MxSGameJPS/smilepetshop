import React from "react";
import styles from "./paginaDeObrigado.module.css";
import { getUser } from "../../lib/auth";

export default function PaginaDeObrigado() {
  const user = typeof window !== "undefined" ? getUser() : null;
  const email = user?.email || user?.login || "";

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Obrigado pela sua compra!</h1>
        <p className={styles.text}>
          Recebemos seu pedido e o pagamento está sendo processado.
        </p>
        <p className={styles.text}>
          Enviaremos a confirmação para
          <span className={styles.email}>
            {" "}
            {email || "o e-mail cadastrado"}
          </span>
          . Aguarde o e-mail de confirmação.
        </p>
        <p className={styles.small}>
          Caso não receba em alguns minutos, verifique a caixa de spam.
        </p>
      </div>
    </section>
  );
}

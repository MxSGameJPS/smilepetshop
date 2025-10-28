import React from "react";
import styles from "./devolucoes.module.css";

export default function Devolucoes() {
  return (
    <section className={styles.devolucoesSection}>
      <h1 className={styles.title}>
        Devoluções <span className={styles.titleHighlight}>!</span>
      </h1>
      <div className={styles.block}>
        <h2 className={styles.heading}>Política de devolução</h2>
        <p className={styles.text}>
          Aceitaremos itens para troca ou devolução com crédito total dentro de
          14 dias a partir da data de recebimento.
          <br />
          <br />
          Não reembolsamos o valor do frete, a menos que tenhamos enviado um
          item incorreto. Após o recebimento dos itens devolvidos, a Zoomies
          reserva-se o direito de negar o reembolso caso a mercadoria não atenda
          aos requisitos da nossa política de devolução.
          <br />
          <br />
          Pedidos personalizados e itens de venda final não podem ser trocados
          ou devolvidos em nenhum momento.
          <br />
          <br />
          Com o recibo original, as solicitações de ajuste de preço serão
          atendidas se a mercadoria tiver sido comprada pelo preço integral e se
          ela for reduzida dentro de 7 dias após o recebimento do pacote.
          <br />
          <br />
          Será emitido um crédito no valor da compra do item devolvido ou
          trocado, desde que o item esteja em sua condição original, sem uso e
          na embalagem original. A nota fiscal ou uma cópia da transação deve
          ser anexada à sua devolução.
          <br />
          <br />
          Envie sua devolução ou troca por um método de envio rastreável, como
          UPS, FEDEX ou USPS (Serviço Postal dos Estados Unidos) com seguro.
          Guarde o número de rastreamento da devolução até receber o reembolso.
          <br />
          <br />
          Os custos de envio de devolução e seguro são de responsabilidade do
          cliente.
          <br />
          <br />
          O cliente é responsável por quaisquer despesas de envio de pacotes
          devolvidos ou não entregues.
          <br />
          <br />
          Aplicaremos o seu reembolso à forma de pagamento original dentro de 2
          a 3 dias úteis após o recebimento. A Zoomiesnyc.com notificará você
          por e-mail para o endereço que você forneceu no seu pedido quando o
          reembolso for aplicado.
          <br />
          <br />
          Observe que seu banco pode levar mais dias para processar e lançar
          esta transação em sua conta.
        </p>
      </div>
      <hr className={styles.divider} />
    </section>
  );
}

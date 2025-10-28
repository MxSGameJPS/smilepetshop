import React, { useState } from "react";
import styles from "./faq.module.css";

const faqData = [
  {
    section: "Fazendo um pedido",
    questions: [
      {
        q: "Que tipo de produtos você vende?",
        a: "Vendemos produtos para animais de estimação, como rações, brinquedos, acessórios e produtos de higiene."
      },
      
      {
        q: "Que comida devo dar ao meu animal de estimação?",
        a: "Nossa equipe pode ajudar a escolher a melhor opção de acordo com a espécie, porte e idade do seu pet."
      },
      
      {
        q: "Posso devolver um item não utilizado e fechado?",
        a: "Sim, aceitamos devoluções de itens não utilizados e fechados dentro do prazo de nossa política."
      }
    ]
  },
  {
    section: "Envio e entrega",
    questions: [
      {
        q: "Por que não consigo finalizar a compra se o valor do pedido for menor que o valor mínimo?",
        a: "Existe um valor mínimo para pedidos online. Adicione mais itens para atingir o valor mínimo."
      },
      
      {
        q: "Não consigo encontrar um produto. O que isso significa?",
        a: "O produto pode estar fora de estoque ou descontinuado. Consulte nossa equipe para mais informações."
      },
      {
        q: "Posso cancelar meu pedido?",
        a: "Sim, desde que o pedido ainda não tenha sido enviado."
      },
      {
        q: "Posso adicionar um produto ao pedido?",
        a: "Entre em contato rapidamente após o pedido para tentar adicionar itens."
      },
      
    ]
  },
  {
    section: "Pagamento",
    questions: [
      {
        q: "Posso alterar meu endereço de entrega?",
        a: "Sim, antes do envio. Após o envio, não é possível alterar o endereço."
      },
      {
        q: "O que acontece se meu pedido atrasar?",
        a: "Entre em contato para que possamos verificar o status do seu pedido."
      },
      {
        q: "Quando meu pedido será enviado?",
        a: "Pedidos são enviados em até 2 dias úteis após a confirmação do pagamento."
      },
      {
        q: "Onde está meu pacote?",
        a: "Você pode acompanhar pelo código de rastreamento enviado por e-mail."
      },
      {
        q: "E se eu não tiver recebido meu pedido?",
        a: "Entre em contato para que possamos abrir uma investigação junto à transportadora."
      }
    ]
  },
  {
    section: "Devoluções e reembolsos",
    questions: [
      {
        q: "Quais são as diferentes formas de pagamento disponíveis?",
        a: "Aceitamos cartão de crédito, débito, Pix e boleto bancário."
      },
      {
        q: "Onde está minha fatura?",
        a: "A fatura é enviada por e-mail após a confirmação do pedido."
      },
      {
        q: "Estou com problemas para pagar no caixa.",
        a: "Nossa equipe está disponível para ajudar em caso de dificuldades no pagamento."
      }
    ]
  }
];

export default function Faq() {
  const [open, setOpen] = useState({});

  const toggle = (sectionIdx, qIdx) => {
    setOpen((prev) => ({
      ...prev,
      [`${sectionIdx}-${qIdx}`]: !prev[`${sectionIdx}-${qIdx}`]
    }));
  };

  return (
    <section className={styles.faqSection}>
      <h1 className={styles.title}>Perguntas frequentes <span className={styles.titleHighlight}>!</span></h1>
      
      {faqData.map((section, sectionIdx) => (
        <div key={section.section} className={styles.block}>
          <h2 className={styles.heading}>{section.section}</h2>
          {section.questions.map((item, qIdx) => (
            <div key={item.q} className={styles.questionBlock}>
              <button
                className={styles.question}
                onClick={() => toggle(sectionIdx, qIdx)}
                aria-expanded={!!open[`${sectionIdx}-${qIdx}`]}
              >
                {item.q}
                <span className={styles.icon}>{open[`${sectionIdx}-${qIdx}`] ? "-" : "+"}</span>
              </button>
              {open[`${sectionIdx}-${qIdx}`] && (
                <div className={styles.answer}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

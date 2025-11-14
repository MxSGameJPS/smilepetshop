import React from "react";
import styles from "./footer.module.css";
import { Link } from "react-router-dom";
import { 
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.columnsContainer}>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h4>Atendimento ao Cliente</h4>
            <ul>
              <li>
                <a href="/contato">Contate-nos</a>
              </li>
              <li>
                <a href="/envio">Envio</a>
              </li>
              <li>
                <a href="/devolucoes">Devoluções</a>
              </li>
              <li>
                <a href="/faq">Perguntas frequentes</a>
              </li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>SmilePetShop</h4>
            <ul>
              <li>Sobre nós</li>
              <li>Cartões-presente</li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>Comprar</h4>
            <ul>
              <li>
                <Link to="/produtos?pet=Cachorro">Cachorro</Link>
                </li>
              <li><Link to="/produtos?pet=Gato">Gato</Link></li>
            </ul>
          </div>
          {/* <div className={styles.column}>
            <h4>Planos</h4>
            <ul>
              <li>Plano 1</li>
              <li>Plano 2</li>
              <li>Plano 3</li>
              <li>Plano 4</li>
            </ul>
          </div> */}
          <div className={styles.column}>
            <h4>Contato</h4>
            <ul>
              <li>SmilePetShop</li>
              <li>(21) 97666-3909</li>
              <li>
                <a href="mailto:info@shopdogandco.com">
                  contato@smilepetshop.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.newsletterContainer}>
          <h4>Assine! Novos assinantes ganham 20% de desconto!</h4>
          <p>
            Promoções, novos produtos e ofertas. Diretamente na sua caixa de
            entrada.
          </p>
          <form className={styles.newsletterForm}>
            <input
              type="email"
              placeholder="E-mail"
              className={styles.inputEmail}
            />
            <button type="submit" className={styles.subscribeBtn}>
              <span role="img" aria-label="coração">
                💌
              </span>{" "}
              Inscreva-se
            </button>
          </form>
        </div>
      </div>
      <div className={styles.socialAndLegal}>
        <div className={styles.socialIcons}>
          <a href="#" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="#" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="#" aria-label="Twitter">
            <FaTwitter />
          </a>
          <a href="#" aria-label="Pinterest">
            <FaPinterestP />
          </a>
        </div>
        <div className={styles.legal}>
          <span>©2025 SmilePetShop. Todos os direitos reservados.</span>
          <span>política de Privacidade</span>
          <span>Termos de Uso</span>
          <span>Procurar</span>
        </div>
      </div>
    </footer>
  );
}

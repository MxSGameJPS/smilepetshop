import React from "react";
import styles from "./whatsappFloating.module.css";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppFloating({
  phone = "5511999999999",
  message = "Olá! Preciso de ajuda.",
}) {
  const safePhone = String(phone).replace(/[^0-9+]/g, "");
  const encoded = encodeURIComponent(message);
  const href = `https://wa.me/${safePhone}?text=${encoded}`;

  return (
    <a
      className={styles.whatsappBtn}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir WhatsApp"
    >
      <FaWhatsapp className={styles.icon} />
    </a>
  );
}

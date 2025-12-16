import React, { useEffect, useState } from "react";
import "./Snow.css";

export default function Snow() {
  const [flakes, setFlakes] = useState([]);

  useEffect(() => {
    // Quantidade de flocos
    const flakeCount = 50;
    const newFlakes = [];

    for (let i = 0; i < flakeCount; i++) {
      // Posição horizontal aleatória (0 a 100vw)
      const left = Math.random() * 100;
      // Duração da animação aleatória (entre 5s e 15s)
      const duration = Math.random() * 10 + 5;
      // Atraso aleatório (entre 0s e 5s)
      const delay = Math.random() * 5;
      // Tamanho aleatório (entre 0.5rem e 1.5rem, ou px)
      const size = Math.random() * 10 + 5;
      // Opacidade
      const opacity = Math.random() * 0.5 + 0.3;

      newFlakes.push({
        id: i,
        style: {
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
        },
      });
    }

    setFlakes(newFlakes);
  }, []);

  return (
    <div className="snow-container">
      {flakes.map((flake) => (
        <div key={flake.id} className="snowflake" style={flake.style}>
          ❄
        </div>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import "./Confetti.css";

export default function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Quantidade de confetes
    const pieceCount = 60;
    const newPieces = [];
    const colors = [
      "#FFD700",
      "#FF00FF",
      "#00FF00",
      "#00FFFF",
      "#FF0000",
      "#9400D3",
    ];

    for (let i = 0; i < pieceCount; i++) {
      const left = Math.random() * 100;
      const duration = Math.random() * 5 + 3; // Mais rápido que a neve
      const delay = Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const width = Math.random() * 10 + 5;
      const height = Math.random() * 20 + 10;

      newPieces.push({
        id: i,
        style: {
          left: `${left}%`,
          animationDuration: `${duration}s, ${Math.random() * 2 + 1}s`, // fall duration, rotate duration
          animationDelay: `${delay}s, ${delay}s`,
          backgroundColor: color,
          width: `${width}px`,
          height: `${height}px`,
        },
      });
    }

    setPieces(newPieces);
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={piece.style}
        ></div>
      ))}
    </div>
  );
}

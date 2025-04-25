// src/components/MainMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainMenu.css";   // ← Asegúrate de que la ruta es correcta

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="main-menu">
      <h1 className="main-menu-title">AREPAS GUERRERO</h1>
      <button className="menu-button" onClick={() => navigate("/pos")}>
        POS
      </button>
      <button className="menu-button" onClick={() => navigate("/cargue")}>
        Cargue
      </button>
      <button className="menu-button" onClick={() => navigate("/pedidos")}>
        Pedidos
      </button>
      <button className="menu-button" onClick={() => navigate("/inventario")}>
        Inventario
      </button>
    </div>
  );
}

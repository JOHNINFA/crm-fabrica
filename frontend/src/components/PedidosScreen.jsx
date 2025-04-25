// src/components/PedidosScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PedidosScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h2>Pantalla de Pedidos</h2>
      <p>Gestión y visualización de pedidos.</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
        Volver
      </button>
    </div>
  );
}
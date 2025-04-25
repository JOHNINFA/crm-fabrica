// src/components/InventarioScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function InventarioScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h2>Pantalla de Inventario</h2>
      <p>Visualización y ajustes de inventario.</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
        Volver
      </button>
    </div>
  );
}
// src/components/PosScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PosScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h2>Pantalla POS</h2>
      <p>Aquí iría la interfaz de Punto de Venta.</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
        Volver
      </button>
    </div>
  );
}

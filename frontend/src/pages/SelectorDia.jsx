// src/components/SelectorDia.jsx
import React from "react";


import { useNavigate } from "react-router-dom";


const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function SelectorDia() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 32 }}>
      <h2>Selecciona el día para cargar productos</h2>
      {dias.map(dia => (
        <button
          key={dia}
          style={{ margin: 10 }}
          onClick={() => navigate(`/cargue/${dia}`)}
        >
          {dia}
        </button>
      ))}
    </div>
  );
}

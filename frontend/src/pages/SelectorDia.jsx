// src/components/SelectorDia.jsx
import React from "react";


import { useNavigate } from "react-router-dom";


const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function SelectorDia() {
  const navigate = useNavigate();

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title mb-4 text-center">Selecciona el día para cargar productos</h2>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            {dias.map(dia => (
              <button
                key={dia}
                className="btn btn-outline-primary py-3"
                onClick={() => navigate(`/cargue/${dia}`)}
                style={{ 
                  fontWeight: '500',
                  minWidth: '120px',
                  flex: '1 1 auto',
                  maxWidth: '150px'
                }}
              >
                {dia}
              </button>
            ))}
          </div>
          <div className="text-center mt-4">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/pos')}
            >
              Regresar al POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

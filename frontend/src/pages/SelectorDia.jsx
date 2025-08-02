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
          <div className="row g-3">
            {dias.map(dia => (
              <div key={dia} className="col-md-4 col-lg-2">
                <button
                  className="btn btn-outline-primary w-100 py-3"
                  onClick={() => navigate(`/cargue/${dia}`)}
                  style={{ fontWeight: '500' }}
                >
                  {dia}
                </button>
              </div>
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

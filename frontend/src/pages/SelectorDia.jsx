// src/pages/SelectorDia.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from '../hooks/usePageTitle';
import './SelectorDia.css';

const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function SelectorDia() {
  usePageTitle('Cargue');
  const navigate = useNavigate();

  const handleDayClick = (dia) => {
    console.log(`Día seleccionado: ${dia}`);
    navigate(`/cargue/${dia}`);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4 p-md-5 selector-dia-container">
        <div className="card-body">
          <h1 className="fw-bold text-center text-dark">
            Selecciona el día para cargar productos
          </h1>

          <div className="row g-5 mb-4">
            {dias.map((dia) => (
              <div className="col-6 col-sm-4 col-md-2" key={dia}>
                <button
                  className="btn btn-primary w-100 py-3 fw-semibold shadow-sm"
                  onClick={() => handleDayClick(dia)}
                >
                  {dia}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              className="btn btn-secondary py-3 px-4 d-inline-flex align-items-center shadow-sm"
              onClick={() => navigate('/')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

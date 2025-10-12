import React from 'react';
import { useNavigate } from 'react-router-dom';
import icono from '../assets/images/icono.png';

const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

export default function SelectorDiasPedidosScreen() {
  const navigate = useNavigate();

  const handleDayClick = (dia) => {
    console.log(`Día seleccionado: ${dia}`);
    navigate(`/pedidos/${dia}`);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4 p-md-5 selector-dia-container">
        <div className="card-body">
          <div className="text-center mb-4">
            <img src={icono} alt="Logo" style={{ width: '180px', height: 'auto', marginTop: '-20px', filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))' }} />
          </div>
          <h1 className="fw-bold text-center" style={{ color: '#8b95a1' }}>
            Selecciona el día para realizar pedido
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

          <div className="text-center" style={{ marginTop: '40px' }}>
            <button 
              className="btn btn-secondary py-3 px-4 d-inline-flex align-items-center shadow-sm"
              onClick={() => navigate('/remisiones')}
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

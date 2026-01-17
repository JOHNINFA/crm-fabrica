import React from "react";
import { useNavigate } from "react-router-dom";
import '../styles/MainMenu.css';
import icono from '../assets/images/icono.png';
import bannermenu from '../assets/images/bannermenu.png';
import usePageTitle from '../hooks/usePageTitle';

export default function MainMenu() {
  const navigate = useNavigate();
  usePageTitle('Menú Principal');

  // 🆕 Detectar si está en modo ejecutable
  const isPosOnlyMode = window.POS_ONLY_MODE || false;

  // 🆕 Función para manejar click en tarjetas
  const handleCardClick = (route, isBlocked = false) => {
    if (isPosOnlyMode && isBlocked) {
      alert('⚠️ Este módulo no está disponible en el modo POS.\n\nSolo puedes acceder a:\n- Punto de Venta (POS)\n- Configuración de Impresión (en Otros)');
      return;
    }
    navigate(route);
  };

  return (
    <div className="main-menu" style={{ backgroundImage: `url(${bannermenu})` }}>
      <div className="logo-container">
        <img src={icono} alt="Logo Arepas Guerrero" className="logo-img" />
      </div>

      <div className="menu-grid">
        <button onClick={() => handleCardClick("/pos")} className="menu-card">
          <i className="bi bi-cart3"></i>
          <h3>Punto de Venta</h3>
          <p>Facturación rápida y control de caja.</p>
        </button>

        <button
          onClick={() => handleCardClick("/inventario", true)}
          className="menu-card"
          disabled={isPosOnlyMode}
          style={isPosOnlyMode ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
        >
          {isPosOnlyMode && <i className="bi bi-lock text-danger position-absolute top-0 end-0 m-2"></i>}
          <i className="bi bi-box-seam"></i>
          <h3>Inventario</h3>
          <p>Stock, producción y materia prima.</p>
        </button>

        <button
          onClick={() => handleCardClick("/cargue", true)}
          className="menu-card"
          disabled={isPosOnlyMode}
          style={isPosOnlyMode ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
        >
          {isPosOnlyMode && <i className="bi bi-lock text-danger position-absolute top-0 end-0 m-2"></i>}
          <i className="bi bi-people"></i>
          <h3>Cargue</h3>
          <p>Salidas a vendedores y devoluciones.</p>
        </button>

        <button
          onClick={() => handleCardClick("/remisiones", true)}
          className="menu-card"
          disabled={isPosOnlyMode}
          style={isPosOnlyMode ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
        >
          {isPosOnlyMode && <i className="bi bi-lock text-danger position-absolute top-0 end-0 m-2"></i>}
          <i className="bi bi-file-earmark-text"></i>
          <h3>Pedidos</h3>
          <p>Gestión de pedidos de clientes.</p>
        </button>

        <button
          onClick={() => handleCardClick("/trazabilidad", true)}
          className="menu-card"
          disabled={isPosOnlyMode}
          style={isPosOnlyMode ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
        >
          {isPosOnlyMode && <i className="bi bi-lock text-danger position-absolute top-0 end-0 m-2"></i>}
          <i className="bi bi-diagram-3"></i>
          <h3>Trazabilidad</h3>
          <p>Historial y lotes de productos.</p>
        </button>

        <button onClick={() => handleCardClick("/otros")} className="menu-card">
          <i className="bi bi-gear"></i>
          <h3>Otros</h3>
          <p>Configuración y utilidades.</p>
        </button>
      </div>
    </div>
  );
}
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
    <div className="main-menu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundImage: `url(${bannermenu})`, backgroundSize: '120% auto', backgroundPosition: '50% 50%', backgroundRepeat: 'no-repeat' }}>
      <div style={{ marginBottom: '5px', textAlign: 'center' }}>
        <img src={icono} alt="Logo" style={{ width: '230px', height: 'auto', objectFit: 'contain', imageRendering: 'high-quality' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 240px)', gridTemplateRows: 'repeat(2, 140px)', columnGap: '40px', rowGap: '25px', justifyContent: 'center', padding: '30px 40px' }}>
        <div onClick={() => handleCardClick("/pos")} className="menu-card">
          <i className="bi bi-cart"></i>
          <h3>Punto de Venta (POS)</h3>
          <p>Gestiona ventas y facturación en tiempo real.</p>
        </div>
        <div
          onClick={() => handleCardClick("/inventario", true)}
          className="menu-card"
          style={isPosOnlyMode ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <i className="bi bi-box"></i>
          <h3>Inventario</h3>
          <p>Controla el stock y los movimientos de productos.</p>
          {isPosOnlyMode && <span style={{ fontSize: '10px', color: '#dc3545', marginTop: '5px' }}>🔒 Bloqueado</span>}
        </div>
        <div
          onClick={() => handleCardClick("/cargue", true)}
          className="menu-card"
          style={isPosOnlyMode ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <i className="bi bi-people"></i>
          <h3>Cargue</h3>
          <p>Gestiona producción y devoluciones de vendedores.</p>
          {isPosOnlyMode && <span style={{ fontSize: '10px', color: '#dc3545', marginTop: '5px' }}>🔒 Bloqueado</span>}
        </div>
        <div
          onClick={() => handleCardClick("/remisiones", true)}
          className="menu-card"
          style={isPosOnlyMode ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <i className="bi bi-file-text"></i>
          <h3>Pedidos</h3>
          <p>Crea y administra los pedidos de clientes.</p>
          {isPosOnlyMode && <span style={{ fontSize: '10px', color: '#dc3545', marginTop: '5px' }}>🔒 Bloqueado</span>}
        </div>
        <div
          onClick={() => handleCardClick("/trazabilidad", true)}
          className="menu-card"
          style={isPosOnlyMode ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <i className="bi bi-diagram-3"></i>
          <h3>Trazabilidad</h3>
          <p>Rastrea el ciclo de vida de tus productos.</p>
          {isPosOnlyMode && <span style={{ fontSize: '10px', color: '#dc3545', marginTop: '5px' }}>🔒 Bloqueado</span>}
        </div>
        <div onClick={() => handleCardClick("/otros")} className="menu-card">
          <i className="bi bi-gear"></i>
          <h3>Otros</h3>
          <p>Otras opciones y configuraciones del sistema.</p>
        </div>
      </div>
    </div>
  );
}
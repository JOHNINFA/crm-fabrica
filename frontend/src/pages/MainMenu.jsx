import React from "react";
import { useNavigate } from "react-router-dom";
import '../styles/MainMenu.css';
import icono from '../assets/images/icono.png';
import bannermenu from '../assets/images/bannermenu.png';

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="main-menu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundImage: `url(${bannermenu})`, backgroundSize: '120% auto', backgroundPosition: '50% 50%', backgroundRepeat: 'no-repeat' }}>
      <div style={{ marginBottom: '5px', textAlign: 'center' }}>
        <img src={icono} alt="Logo" style={{ width: '230px', height: 'auto', objectFit: 'contain', imageRendering: 'high-quality' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', gridTemplateRows: 'repeat(2, 140px)', columnGap: '50px', rowGap: '25px', justifyContent: 'center', padding: '30px 40px' }}>
        <div onClick={() => navigate("/pos")} className="menu-card">
          <i className="bi bi-cart"></i>
          <h3>Punto de Venta (POS)</h3>
          <p>Gestiona ventas y facturación en tiempo real.</p>
        </div>
        <div onClick={() => navigate("/inventario")} className="menu-card">
          <i className="bi bi-box"></i>
          <h3>Inventario</h3>
          <p>Controla el stock y los movimientos de productos.</p>
        </div>
        <div onClick={() => navigate("/cargue")} className="menu-card">
          <i className="bi bi-people"></i>
          <h3>Cargue</h3>
          <p>Registra la producción y devoluciones de los vendedores.</p>
        </div>
        <div onClick={() => navigate("/remisiones")} className="menu-card">
          <i className="bi bi-file-text"></i>
          <h3>Remisiones</h3>
          <p>Crea y administra las guías de remisión.</p>
        </div>
        <div onClick={() => navigate("/trazabilidad")} className="menu-card">
          <i className="bi bi-diagram-3"></i>
          <h3>Trazabilidad</h3>
          <p>Rastrea el ciclo de vida de tus productos.</p>
        </div>
        <div onClick={() => navigate("/otros")} className="menu-card">
          <i className="bi bi-gear"></i>
          <h3>Otros</h3>
          <p>Otras opciones y configuraciones del sistema.</p>
        </div>
      </div>
    </div>
  );
}
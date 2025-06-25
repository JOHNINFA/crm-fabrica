// src/components/Pos/Sidebar.jsx
import React, { useState } from "react";
import { useModalContext } from '../../context/ModalContext';
import ProductsModal from './ProductsModal';
import AddProductModal from './AddProductModal';
import logo from '../../assets/images/icono.png';
import { consultarTablaProducto } from '../../utils/consultaProductos';

export default function Sidebar({ onWidthChange }) {
  const { openProductsModal } = useModalContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const shouldShowText = isExpanded || isHovered;
  const sidebarWidth = shouldShowText ? 210 : 60;
  
  // Estilo para los elementos del menú
  const getMenuItemStyle = () => ({
    whiteSpace: 'nowrap',
    paddingLeft: shouldShowText ? '12px' : '18px',  // Más padding a la izquierda cuando está colapsado
    paddingRight: shouldShowText ? '12px' : '8px'
  });
  
  React.useEffect(() => {
    if (onWidthChange) {
      onWidthChange(sidebarWidth);
    }
  }, [sidebarWidth, onWidthChange]);

  return (
    <>
      <nav
        className="sidebar-bg d-flex flex-column align-items-start p-0"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          position: "fixed",
          zIndex: 10,
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          transition: 'width 0.3s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-100 d-flex align-items-center justify-content-center border-bottom" style={{ height: '44px', paddingTop: '6px', paddingBottom: '6px', backgroundColor: '#ffffff' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: shouldShowText ? '36px' : '32px',
              width: 'auto',
              transition: 'height 0.3s ease'
            }} 
          />
        </div>

        <div className="w-100 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <ul className="nav flex-column w-100 mt-3">
            {/* Inicio primero */}
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>home</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Inicio</span>}
            </li>
            
            {/* Productos con Modal */}
            <li 
              className="nav-item sidebar-item py-2" 
              onClick={openProductsModal}
              style={{ cursor: 'pointer', ...getMenuItemStyle() }}
            >
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>apps</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Productos</span>}
            </li>

            {/* Factura Rápida */}
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>point_of_sale</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Factura Rápida(POS)</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>keyboard_double_arrow_down</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Ingresos</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>upload</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Gastos</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>balance</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Inventarios</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>local_shipping</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Logística</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>groups</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Clientes</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>person_search</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Proveedores</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>account_balance</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Bancos</span>}
            </li>
            <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>calculate</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Contabilidad</span>}
            </li>
            <li 
              className="nav-item sidebar-item py-2" 
              onClick={() => consultarTablaProducto()}
              style={{ cursor: 'pointer', ...getMenuItemStyle() }}
            >
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>table_chart</span>
              {shouldShowText && <span style={{ fontSize: '14px' }}>Consultar API</span>}
            </li>
          </ul>
        </div>
        
        <div className="flex-grow-1"></div>
      </nav>

      {/* Modales */}
      <ProductsModal />
      <AddProductModal />
    </>
  );
}

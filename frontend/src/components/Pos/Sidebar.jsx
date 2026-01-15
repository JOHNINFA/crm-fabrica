// src/components/Pos/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModalContext } from '../../context/ModalContext';
import ProductsModal from './ProductsModal';
import AddProductModal from './AddProductModal';
import logo from '../../assets/images/icono.png';
import './Sidebar.css';

export default function Sidebar({ onWidthChange, onOpenCategoryManager }) {
  const { openProductsModal } = useModalContext();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Detectar si estamos en modo POS_ONLY (Electron)
  const isPosOnlyMode = window.POS_ONLY_MODE || false;

  // Sidebar siempre colapsado por defecto, se expande solo al hacer clic en hamburguesa
  const sidebarWidth = isExpanded ? 210 : 0;

  // Estilo para los elementos del menú
  const getMenuItemStyle = () => ({
    whiteSpace: 'nowrap',
    paddingLeft: '12px',
    paddingRight: '12px'
  });

  React.useEffect(() => {
    if (onWidthChange) {
      onWidthChange(sidebarWidth);
    }
  }, [sidebarWidth, onWidthChange]);


  // Función para toggle del sidebar
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Logo flotante que abre/cierra el menú */}
      <div
        style={{
          position: 'fixed',
          top: '5px',
          left: isExpanded ? '220px' : '10px',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'left 0.3s ease'
        }}
      >
        {/* Logo que abre el menú al hacer clic */}
        <img
          src={logo}
          alt="Logo"
          className="hamburger-logo"
          onClick={toggleSidebar}
          title={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>

      {/* Overlay oscuro cuando el sidebar está abierto */}
      {isExpanded && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        className="sidebar-bg d-flex flex-column align-items-start p-0"
        style={{
          width: '210px',
          position: "fixed",
          zIndex: 1000,
          left: isExpanded ? 0 : '-210px',
          top: 0,
          bottom: 0,
          height: '100vh',
          transition: 'left 0.3s ease',
          boxShadow: isExpanded ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div className="w-100 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', paddingTop: '10px' }}>
          <ul className="nav flex-column w-100">
            {/* Inicio - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  navigate('/');
                  setIsExpanded(false);
                }}
                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>home</span>
                <span style={{ fontSize: '14px' }}>Inicio</span>
              </li>
            )}

            {/* Productos - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  sessionStorage.setItem('origenModulo', 'pos');
                  navigate('/productos');
                  setIsExpanded(false);
                }}
                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>apps</span>
                <span style={{ fontSize: '14px' }}>Productos</span>
              </li>
            )}

            {/* Inventarios - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  localStorage.setItem('inventarioActiveTab', 'kardex');
                  navigate('/inventario');
                  setIsExpanded(false);
                }}
                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>balance</span>
                <span style={{ fontSize: '14px' }}>Inventarios</span>
              </li>
            )}

            {/* Pedidos - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  navigate('/remisiones');
                  setIsExpanded(false);
                }}
                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>shopping_cart</span>
                <span style={{ fontSize: '14px' }}>Pedidos</span>
              </li>
            )}

            {/* Informe de Ventas - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  navigate('/informes/general');
                  setIsExpanded(false);
                }}
                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>assessment</span>
                <span style={{ fontSize: '14px' }}>Informe de Ventas</span>
              </li>
            )}

            {/* Caja - Solo en modo web */}
            {!isPosOnlyMode && (
              <li
                className="nav-item sidebar-item py-2"
                onClick={() => {
                  navigate('/caja');
                  setIsExpanded(false);
                }}
                style={{
                  cursor: 'pointer', ...getMenuItemStyle()
                }}
              >
                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>point_of_sale</span>
                <span style={{ fontSize: '14px' }}>Caja</span>
              </li>
            )}

            {/* Gestionar - Disponible siempre */}
            <li
              className="nav-item sidebar-item py-2"
              onClick={() => {
                if (onOpenCategoryManager) {
                  onOpenCategoryManager();
                }
                setIsExpanded(false);
              }}
              style={{ cursor: 'pointer', ...getMenuItemStyle() }}
            >
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>settings</span>
              <span style={{ fontSize: '14px' }}>Gestionar</span>
            </li>

            {/* 🆕 Configuración de Impresión (siempre disponible) */}
            <li
              className="nav-item sidebar-item py-2"
              onClick={() => {
                navigate('/configuracion/impresion');
                setIsExpanded(false);
              }}
              style={{ cursor: 'pointer', ...getMenuItemStyle() }}
            >
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>print</span>
              <span style={{ fontSize: '14px' }}>Config. Impresión</span>
            </li>
            {/*
            <li
              className="nav-item sidebar-item py-2"
              onClick={() => {
                window.open('/informes/transferencias', '_blank');
                setIsExpanded(false);
              }}
              style={{ cursor: 'pointer', ...getMenuItemStyle() }}
            >
              <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>account_balance</span>
              <span style={{ fontSize: '14px' }}>Bancos</span>
            </li>
            */}
          </ul>
        </div>

        <div className="flex-grow-1"></div>
      </nav >

      {/* Modales */}
      < ProductsModal />
      <AddProductModal />
    </>
  );
}

// src/components/Pos/Sidebar.jsx
import React from "react";
import { useModalContext } from '../../context/ModalContext';
import ProductsModal from './ProductsModal';
import AddProductModal from './AddProductModal';

export default function Sidebar() {
  const { openProductsModal } = useModalContext();

  return (
    <>
      <nav
        className="sidebar-bg d-flex flex-column align-items-start p-0 vh-100"
        style={{
          width: 210,
          minWidth: 210,
          position: "fixed",
          zIndex: 10,
          left: 0,
          top: 0,
        }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between px-3 py-2 border-bottom" style={{ minHeight: 64 }}>
          <span>
            <span className="brand-blue fw-bold" style={{ fontSize: 32, letterSpacing: -2 }}>c</span>
            <span className="brand-yellow fw-bold" style={{ fontSize: 32, letterSpacing: -2 }}>A</span>
            <span className="brand-blue fw-bold" style={{ fontSize: 32, letterSpacing: -2 }}>nti</span>
          </span>
          <span className="material-icons text-white d-block d-lg-none" style={{ cursor: "pointer" }}>menu</span>
        </div>

        <div className="w-100 flex-grow-1 overflow-auto">
          <ul className="nav flex-column w-100 mt-3">
            {/* Inicio primero */}
            <li className="nav-item sidebar-item active px-3 py-2"><span className="material-icons me-2 align-middle">home</span>Inicio</li>
            
            {/* Productos con Modal */}
            <li 
              className="nav-item sidebar-item px-3 py-2" 
              onClick={openProductsModal}
              style={{ cursor: 'pointer' }}
            >
              <span className="material-icons me-2 align-middle">apps</span>Productos
            </li>

            {/* Factura Rápida */}
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">point_of_sale</span>Factura Rápida(POS)</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">keyboard_double_arrow_down</span>Ingresos</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">upload</span>Gastos</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">balance</span>Inventarios</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">local_shipping</span>Logística</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">groups</span>Contactos</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">person_search</span>CRM</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">account_balance</span>Bancos</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">calculate</span>Contabilidad</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">finance</span>Informes</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">storefront</span>Tiendi</li>
            <li className="nav-item sidebar-item px-3 py-2"><span className="material-icons me-2 align-middle">payments</span>Nómina</li>
          </ul>
        </div>

        <div className="w-100 px-3 pb-3" style={{ fontSize: "0.96rem" }}>
          <span className="text-white-50">Recarg. Facturas</span>
        </div>
      </nav>

      {/* Modales */}
      <ProductsModal />
      <AddProductModal />
    </>
  );
}

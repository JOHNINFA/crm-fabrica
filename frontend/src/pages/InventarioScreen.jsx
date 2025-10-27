// src/pages/InventarioScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InventarioScreen.css";
import "../styles/InventarioProduccion.css";
import InventarioProduccion from "../components/inventario/InventarioProduccion";
import InventarioMaquilas from "../components/inventario/InventarioMaquilas";
import InventarioPlaneacion from "../components/inventario/InventarioPlaneacion";
import TablaKardex from "../components/inventario/TablaKardex";
import { ProductosProvider } from "../context/ProductosContext";

export default function InventarioScreen() {
  const navigate = useNavigate();
  // Recuperar pestaña activa desde localStorage o usar "produccion" por defecto
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('inventarioActiveTab') || "produccion";
  });

  // Guardar pestaña activa en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('inventarioActiveTab', activeTab);
  }, [activeTab]);

  return (
    <ProductosProvider>
      <div className="inventario-screen">
        <div className="header">
          <button onClick={() => navigate(-1)} className="back-button">
            Volver al Menú
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'produccion' ? 'active' : ''}`}
            onClick={() => setActiveTab('produccion')}
          >
            Producción
          </button>
          <button
            className={`tab-button ${activeTab === 'maquilas' ? 'active' : ''}`}
            onClick={() => setActiveTab('maquilas')}
          >
            Maquilas
          </button>
          <button
            className={`tab-button ${activeTab === 'planeacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('planeacion')}
          >
            Planeación
          </button>
          <button
            className={`tab-button ${activeTab === 'kardex' ? 'active' : ''}`}
            onClick={() => setActiveTab('kardex')}
          >
            Kardex
          </button>
        </div>

        {activeTab === 'produccion' && (
          <div className="tab-content">
            <h2 className="mb-4">Ingreso de Productos</h2>
            <InventarioProduccion />
          </div>
        )}

        {activeTab === 'maquilas' && (
          <div className="tab-content">
            <h2 className="mb-4">Gestión de Maquilas</h2>
            <InventarioMaquilas />
          </div>
        )}

        {activeTab === 'planeacion' && (
          <div className="tab-content">
            <h2 className="mb-4">Planeación de Producción</h2>
            <InventarioPlaneacion />
          </div>
        )}

        {activeTab === 'kardex' && (
          <div className="tab-content">
            <div className="card-bg">
              <h3>Kardex de Inventario</h3>
              <div className="card">
                <div className="card-body">
                  <TablaKardex />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProductosProvider>
  );
}
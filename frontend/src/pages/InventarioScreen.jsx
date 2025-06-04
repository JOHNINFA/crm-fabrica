// src/pages/InventarioScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InventarioScreen.css";
import "../styles/InventarioProduccion.css";
import InventarioProduccion from "../components/inventario/InventarioProduccion";
import InventarioMaquilas from "../components/inventario/InventarioMaquilas";
import TablaKardex from "../components/inventario/TablaKardex";

export default function InventarioScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produccion");
  const [search, setSearch] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Datos de ejemplo para inventario
  const [inventarioData, setInventarioData] = useState([
    { id: 1, producto: "AREPA TIPO OBLEAS", stock: 1200 },
    { id: 2, producto: "AREPA MEDIANA", stock: 850 },
    { id: 3, producto: "AREPA TIPO PINCHO", stock: 600 },
    { id: 4, producto: "AREPA CON QUESO - CORRIENTE", stock: 950 },
    { id: 5, producto: "MASA DE MAÍZ", stock: 300 },
    { id: 6, producto: "EMPANADA DE CARNE", stock: 450 },
    { id: 7, producto: "EMPANADA DE POLLO", stock: 350 },
    { id: 8, producto: "ENVUELTO DE MAÍZ", stock: 200 }
  ]);
  
  // Cargar datos iniciales de movimientos
  useEffect(() => {
    const movimientosIniciales = [
      { 
        id: 1, 
        fecha: '2023-05-10', 
        hora: '10:30', 
        producto: 'AREPA TIPO OBLEA', 
        cantidad: 5, 
        tipo: 'Entrada', 
        usuario: 'Admin',
        lote: 'L001',
        fechaVencimiento: '10/11/2023'
      },
      { 
        id: 2, 
        fecha: '2023-05-09', 
        hora: '15:45', 
        producto: 'AREPA MEDIANA', 
        cantidad: 3, 
        tipo: 'Salida', 
        usuario: 'Usuario',
        lote: 'L002',
        fechaVencimiento: '-'
      },
    ];
    
    setMovimientos(movimientosIniciales);
  }, []);
  
  // Función para actualizar movimientos desde los componentes de inventario
  const handleActualizarMovimientos = (nuevosMovimientos) => {
    setMovimientos(nuevosMovimientos);
  };
  
  // Función para actualizar productos desde los componentes de inventario
  const handleActualizarProductos = (nuevosProductos) => {
    setProductos(nuevosProductos);
  };
  
  // Filtrar productos por búsqueda
  const filteredInventario = inventarioData.filter(item => 
    item.producto.toLowerCase().includes(search.toLowerCase())
  );

  return (
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
          <InventarioProduccion 
            onActualizarMovimientos={handleActualizarMovimientos}
            onActualizarProductos={handleActualizarProductos}
          />
        </div>
      )}
      
      {activeTab === 'maquilas' && (
        <div className="tab-content">
          <h2 className="mb-4">Gestión de Maquilas</h2>
          <InventarioMaquilas 
            onActualizarMovimientos={handleActualizarMovimientos}
            onActualizarProductos={handleActualizarProductos}
          />
        </div>
      )}
      
      {activeTab === 'planeacion' && (
        <div className="tab-content">
          <div className="card-bg">
            <h3>Planeación de Producción</h3>
            <p className="text-muted">Módulo en desarrollo. Estará disponible próximamente.</p>
          </div>
        </div>
      )}
      
      {activeTab === 'kardex' && (
        <div className="tab-content">
          <div className="card-bg">
            <h3>Kardex de Inventario</h3>
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Historial de Movimientos</h5>
              </div>
              <div className="card-body">
                <TablaKardex movimientos={movimientos} productos={productos} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
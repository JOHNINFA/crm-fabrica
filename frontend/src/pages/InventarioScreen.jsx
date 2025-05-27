// src/pages/InventarioScreen.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InventarioScreen.css";
import "../styles/InventarioProduccion.css";
import InventarioProduccion from "../components/inventario/InventarioProduccion";

export default function InventarioScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produccion");
  const [search, setSearch] = useState("");
  
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
  
  // Filtrar productos por búsqueda
  const filteredInventario = inventarioData.filter(item => 
    item.producto.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inventario-screen">
      <div className="header">
        <h2>Gestión de Producción e Inventario</h2>
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
          className={`tab-button ${activeTab === 'inventario' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventario')}
        >
          Inventario
        </button>
      </div>
      
      {activeTab === 'produccion' && (
        <div className="tab-content">
          <InventarioProduccion />
        </div>
      )}
      
      {activeTab === 'inventario' && (
        <div className="tab-content">
          <div className="d-flex align-items-center gap-2 mb-3">
            <input 
              className="form-control" 
              style={{ maxWidth: 300 }} 
              placeholder="Buscar en Inventario" 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="card-bg">
            <h3>Estado del Inventario</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventario.map(item => (
                  <tr key={item.id}>
                    <td>{item.producto}</td>
                    <td>{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
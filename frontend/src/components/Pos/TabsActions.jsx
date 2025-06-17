import React, { useState } from "react";
import ProductManagerDirect from "./ProductManagerDirect";

export default function TabsActions({ selectedTab, setSelectedTab }) {
  const [showProductManager, setShowProductManager] = useState(false);
  
  return (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <button 
        className="btn btn-light border" 
        style={{ minWidth: 40, minHeight: 40 }}
        onClick={() => setShowProductManager(true)}
        title="Gestionar Productos"
      >
        <span className="material-icons">inventory</span>
      </button>
    
      <div className="dropdown">
        <button className="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
          Informes de Ventas
        </button>
      </div>
      
      {/* Modal de gestión de productos */}
      <ProductManagerDirect 
        show={showProductManager} 
        onHide={() => setShowProductManager(false)} 
      />
    </div>
  );
}
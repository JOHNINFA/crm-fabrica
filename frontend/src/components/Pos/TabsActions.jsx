import React from "react";

export default function TabsActions({ selectedTab, setSelectedTab }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <button className="btn btn-light border" style={{ minWidth: 40, minHeight: 40 }}>
        <span className="material-icons">add</span>
      </button>
    
     
      <div className="dropdown">
        <button className="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
          Informes de Ventas
        </button>
      </div>
      
    </div>
  );
}
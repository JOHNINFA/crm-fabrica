import React, { useState } from "react";
import SyncButton from "./SyncButton";
import ReloadButton from "./ReloadButton";
import BackendConnectionTester from "../BackendConnectionTester";

export default function TabsActions({ selectedTab, setSelectedTab }) {
  const [showConnectionTester, setShowConnectionTester] = useState(false);
  
  return (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <SyncButton />
      
      <ReloadButton />
      
      <button 
        className="btn btn-info border" 
        style={{ minWidth: 40, minHeight: 40 }}
        onClick={() => setShowConnectionTester(true)}
        title="Probar Conexión con Backend"
      >
        <span className="material-icons">network_check</span>
      </button>
      
      <div className="dropdown">
        <button className="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
          Informes de Ventas
        </button>
      </div>
      
      {/* Modal para probar la conexión con el backend */}
      <BackendConnectionTester
        show={showConnectionTester}
        onHide={() => setShowConnectionTester(false)}
      />
    </div>
  );
}
import React from "react";

export default function Topbar() {
  return (
    <nav className="topbar-bg d-flex align-items-center justify-content-end px-3 py-2 position-sticky">
     
      <div className="d-flex align-items-center gap-2">
        
      
        <span className="material-icons mx-2">wifi</span>
        
     

        <span className="position-relative mx-2">
          <span className="material-icons">notifications</span>
          <span className="badge bg-warning position-absolute top-0 start-100 translate-middle p-1 rounded-circle" style={{ fontSize: 10 }}>0</span>
        </span>
        <span className="material-icons mx-2" style={{ fontSize: 24 }}>account_circle</span>
        <span className="mx-2" style={{ fontSize: 13 }}>GUERRERO- Id: 1</span>
      </div>
    </nav>
  );
}
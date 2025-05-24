import React from "react";
import "./PanelToolbar.css";

export default function PanelToolbar() {
  return (
    <div className="panel-toolbar">
      <button className="panel-toolbar-button">
        Eco
      </button>
      <button className="panel-toolbar-button icon-only" title="Ayuda">
        <span className="material-icons" style={{fontSize: '16px'}}>help_outline</span>
      </button>
      <button className="panel-toolbar-button icon-only" title="Eliminar">
        <span className="material-icons" style={{fontSize: '16px'}}>delete</span>
      </button>
      <button className="panel-toolbar-button icon-only" title="Ventanas" style={{position: 'relative'}}>
        <span className="material-icons" style={{fontSize: '16px'}}>view_module</span>
        <span className="badge">4</span>
      </button>
      <input
        type="text"
        className="panel-toolbar-window"
        value="#ventana 1"
        disabled
      />
      <button className="panel-toolbar-button icon-only" title="Agregar ventana">
        <span className="material-icons" style={{fontSize: '16px'}}>add</span>
      </button>
      <button className="panel-toolbar-button icon-only" title="Caja">
        <span className="material-icons" style={{fontSize: '16px'}}>point_of_sale</span>
      </button>
      <button className="panel-toolbar-button icon-only" title="Tabla">
        <span className="material-icons" style={{fontSize: '16px'}}>dns</span>
      </button>
      <button className="panel-toolbar-button icon-only" title="Registrar venta">
        <span className="material-icons" style={{fontSize: '16px'}}>calculate</span>
      </button>
    </div>
  );
}
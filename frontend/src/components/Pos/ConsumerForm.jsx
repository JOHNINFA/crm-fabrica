import React from "react";
import "./ConsumerForm.css";

export default function ConsumerForm({ date, seller, setDate, setSeller, sellers }) {
  return (
    <div className="consumer-form">
      <div className="consumer-form-header">
        <h6 className="consumer-form-title">CONSUMIDOR FINAL</h6>
        <div className="consumer-form-actions">
          <button title="Editar cliente">
            <span className="material-icons" style={{fontSize: '16px'}}>edit</span>
          </button>
          <button className="btn-primary" title="Agregar cliente">
            <span className="material-icons" style={{fontSize: '16px'}}>person_add</span>
          </button>
        </div>
      </div>
      
      <div className="consumer-form-row">
        <div className="consumer-form-group">
          <label className="consumer-form-label">Fecha Documento</label>
          <input 
            type="date" 
            className="consumer-form-control" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Vendedor</label>
          <select 
            className="consumer-form-select" 
            value={seller} 
            onChange={e => setSeller(e.target.value)}
          >
            {sellers.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import "./ConsumerForm.css";

export default function ConsumerForm({ date, seller, setDate, setSeller, sellers }) {
  const [clientName, setClientName] = useState("CONSUMIDOR FINAL");
  const [priceList, setPriceList] = useState("Cliente");
  const priceLists = ["Cliente"];
  return (
    <div className="consumer-form">
      <div className="consumer-form-header">
        <div className="consumer-form-title-container">
          <input 
            type="text" 
            value={clientName} 
            onChange={(e) => setClientName(e.target.value)}
            className="form-control consumer-form-title-input" 
            autoComplete="off"
            style={{ 
              fontSize: '12px',
              fontWeight: 'bold',
              width: '370px',
              backgroundColor: '#ffffff',
              color: '#6c757d',
              height: '28px',
              padding: '2px 8px'
            }} 
          />
        </div>
        <div className="consumer-form-actions">
          <button title="Editar cliente">
            <span className="material-icons" style={{fontSize: '16px'}}>edit</span>
          </button>
          <button className="btn-primary" title="Agregar cliente">
            <span className="material-icons" style={{fontSize: '16px'}}>person_add</span>
          </button>
          <button title="Eliminar">
            <span className="material-icons" style={{fontSize: '16px'}}>delete</span>
          </button>
        </div>
      </div>
      
      <div className="consumer-form-row">
        <div className="consumer-form-group">
          <label className="consumer-form-label">Fecha Documento</label>
          <input 
            type="date" 
            className="form-control consumer-form-title-input" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            style={{ 
              fontSize: '12px',
              height: '28px',
              padding: '2px 8px'
            }}
          />
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Lista de Precios</label>
          <div className="position-relative">
            <select 
              className="form-control consumer-form-title-input" 
              value={priceList} 
              onChange={e => setPriceList(e.target.value)}
              style={{ 
                fontSize: '12px',
                height: '28px',
                padding: '2px 8px',
                paddingRight: '20px',
                appearance: 'none'
              }}
            >
              {priceLists.map(pl => (
                <option key={pl} value={pl}>{pl}</option>
              ))}
            </select>
            <span className="material-icons position-absolute" style={{ 
              right: '5px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              fontSize: '14px',
              pointerEvents: 'none',
              color: '#6c757d'
            }}>
              arrow_drop_down
            </span>
          </div>
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Vendedor</label>
          <select 
            className="form-control consumer-form-title-input" 
            value={seller} 
            onChange={e => setSeller(e.target.value)}
            style={{ 
              fontSize: '12px',
              height: '28px',
              padding: '2px 8px'
            }}
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
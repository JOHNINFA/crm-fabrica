import React, { useState, useEffect } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ show, onClose, cart, total }) => {
  const safeTotal = typeof total === 'number' ? total : 0;
  const [entregado, setEntregado] = useState(safeTotal);
  const [nota, setNota] = useState("");
  const [banco, setBanco] = useState("Caja General");
  const [centroCosto, setCentroCosto] = useState("");
  const [impresion, setImpresion] = useState("Ninguna");
  const [bodega, setBodega] = useState("Principal");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  
  // Actualizar dinero entregado cuando cambia el total
  useEffect(() => {
    setEntregado(safeTotal);
  }, [safeTotal]);

  const devuelta = Math.max(0, entregado - safeTotal);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para procesar el pago
    console.log('Pago procesado:', { 
      total: safeTotal,
      entregado,
      devuelta,
      metodoPago,
      banco,
      centroCosto,
      impresion,
      bodega,
      nota
    });
    onClose();
  };

  // Definición de las pestañas de métodos de pago con sus iconos
  const tabs = [
    { id: 'Efectivo', label: 'Efectivo', icon: 'currency-dollar' },
    { id: 'Tarjeta', label: 'Tarjeta', icon: 'credit-card' },
    { id: 'T. Crédito', label: 'T. Crédito', icon: 'credit-card-2-front' },
    { id: 'Qr', label: 'Qr', icon: 'qr-code' },
    { id: 'Transf', label: 'Transf', icon: 'arrow-left-right' },
    { id: 'RAPPIPAY', label: 'RAPPIPAY', icon: 'wallet2' },
    { id: 'Bonos', label: 'Bonos', icon: 'ticket-perforated' },
    { id: 'Otros', label: 'Otros', icon: 'three-dots' }
  ];
  
  // Función para actualizar el dinero entregado al valor del total
  const setDineroExacto = () => {
    setEntregado(safeTotal);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        {/* Header */}
        <div className="payment-modal-header">
          <h4>
            Cliente: <strong>CONSUMIDOR FINAL</strong> | Fecha: <strong>{new Date().toISOString().split("T")[0]}</strong>
          </h4>
          <button className="close-button" onClick={onClose} title="Eliminar">
            <i className="bi bi-trash"></i>
          </button>
        </div>
        
        <div className="payment-modal-body">
          {/* Totales */}
          <div className="payment-summary">
            <div className="payment-summary-box total">
              <div>TOTAL A PAGAR</div>
              <strong>💵 ${safeTotal.toLocaleString()}</strong>
            </div>
            <div className="payment-summary-box pending">
              <div>PENDIENTE x PAGAR</div>
              <strong>🏷️ $0.00</strong>
            </div>
            <div className="payment-summary-box change">
              <div>DEVUELTA EFECTIVO</div>
              <strong>💵 ${devuelta.toLocaleString()}</strong>
            </div>
          </div>

          {/* Métodos de Pago - Nuevo estilo */}
          <div className="payment-methods">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`payment-method-btn ${metodoPago === tab.id ? 'active' : ''}`}
                onClick={() => setMetodoPago(tab.id)}
              >
                <i className={`bi bi-${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          <div className="payment-form">
            {/* Campos de entrada */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label text-muted small">Dinero Entregado</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    className="form-control money-input"
                    value={`$ ${entregado.toLocaleString()}`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').replace('$ ', '');
                      setEntregado(value ? Number(value) : 0);
                    }}
                  />
                  <button 
                    type="button" 
                    className="exact-amount-btn" 
                    onClick={setDineroExacto}
                    title="Establecer monto exacto"
                  >
                    <i className="bi bi-check2-circle"></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-muted small">Devuelta</label>
                <input
                  type="text"
                  className="form-control money-input"
                  value={`$ ${devuelta.toLocaleString()}`}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label text-muted small">Valor</label>
                <input
                  type="text"
                  className="form-control money-input"
                  value={`$ ${safeTotal.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>

            {/* Nota */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nota</label>
                <textarea 
                  className="form-control compact-textarea"
                  rows={2}
                  value={nota} 
                  onChange={(e) => setNota(e.target.value)}
                />
              </div>
            </div>

            {/* Fila con Bancos y Centro de Costo */}
            <div className="form-row compact-row">
              <div className="form-group">
                <label className="form-label compact-label">Bancos</label>
                <select 
                  className="form-select compact-select"
                  value={banco} 
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option>Caja General</option>
                  <option>Bancolombia</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Centro de Costo <i className="bi bi-info-circle"></i></label>
                <select 
                  className="form-select compact-select"
                  value={centroCosto} 
                  onChange={(e) => setCentroCosto(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Centro 1">Centro 1</option>
                </select>
              </div>
            </div>
            
            {/* Fila con Resumen de Pagos, Impresión y Bodega */}
            <div className="form-row compact-row">
              <div className="form-group">
                <label className="form-label compact-label">Resumen de Pagos</label>
                <div className="payment-summary-detail">
                  <div className="payment-method-amount">{metodoPago} - $ {entregado.toLocaleString()}</div>
                  <div className="payment-bank">{banco}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Impresión</label>
                <select 
                  className="form-select compact-select"
                  value={impresion} 
                  onChange={(e) => setImpresion(e.target.value)}
                >
                  <option>Ninguna</option>
                  <option>Tirilla</option>
                  <option>Carta</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Bodega</label>
                <select 
                  className="form-select compact-select"
                  value={bodega} 
                  onChange={(e) => setBodega(e.target.value)}
                >
                  <option>Principal</option>
                  <option>Secundaria</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botones */}
        <div className="payment-modal-footer">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            <i className="bi bi-x-lg"></i> Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <i className="bi bi-check-lg"></i> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
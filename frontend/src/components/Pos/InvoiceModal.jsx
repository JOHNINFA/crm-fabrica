import React, { useState } from 'react';
import './InvoiceModal.css';
import PaymentModal from './PaymentModal';

const InvoiceModal = ({ show, onClose, cart, total }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    customerName: 'CONSUMIDOR FINAL',
    customerDocument: '',
    paymentMethod: 'Efectivo',
    date: new Date().toISOString().slice(0, 10), // Fecha actual en formato YYYY-MM-DD
    notes: ''
  });

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = () => {
    setShowPaymentModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para procesar la factura
    console.log('Factura generada:', { items: cart, total, ...invoiceData });
    handleProceedToPayment();
  };

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal">
        <div className="invoice-modal-header">
          <h4>Generar Factura</h4>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="invoice-modal-body">
          <form className="invoice-form" onSubmit={handleSubmit}>
            <div className="invoice-form-group">
              <label>Cliente</label>
              <input
                type="text"
                className="invoice-form-control"
                name="customerName"
                value={invoiceData.customerName}
                onChange={handleChange}
              />
            </div>
            
            <div className="invoice-form-group">
              <label>Documento</label>
              <input
                type="text"
                className="invoice-form-control"
                name="customerDocument"
                value={invoiceData.customerDocument}
                onChange={handleChange}
                placeholder="NIT/CC"
              />
            </div>
            
            <div className="invoice-form-group">
              <label>Fecha</label>
              <input
                type="date"
                className="invoice-form-control"
                name="date"
                value={invoiceData.date}
                onChange={handleChange}
              />
            </div>
            
            <div className="invoice-form-group">
              <label>Método de Pago</label>
              <select
                className="invoice-form-control"
                name="paymentMethod"
                value={invoiceData.paymentMethod}
                onChange={handleChange}
              >
                <option>Efectivo</option>
                <option>Tarjeta de Crédito</option>
                <option>Transferencia</option>
              </select>
            </div>
            
            <div className="invoice-form-group">
              <label>Notas</label>
              <textarea
                className="invoice-form-control"
                name="notes"
                value={invoiceData.notes}
                onChange={handleChange}
                rows="2"
              ></textarea>
            </div>
          </form>
          
          <div className="invoice-items">
            <div className="invoice-items-header">
              Productos
            </div>
            <div className="invoice-items-body">
              {cart.map(item => (
                <div key={item.id} className="invoice-item">
                  <div>{item.name}</div>
                  <div>{item.qty}</div>
                  <div>${item.price.toLocaleString('es-CO', {minimumFractionDigits: 0})}</div>
                  <div>${(item.qty * item.price).toLocaleString('es-CO', {minimumFractionDigits: 0})}</div>
                  <div>{item.tax || 'IVA(0%)'}</div>
                  <div></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="invoice-totals">
            <table className="invoice-totals-table">
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td>${total.toLocaleString('es-CO', {minimumFractionDigits: 0})}</td>
                </tr>
                <tr>
                  <td>IVA:</td>
                  <td>$0</td>
                </tr>
                <tr>
                  <td>Total:</td>
                  <td>${total.toLocaleString('es-CO', {minimumFractionDigits: 0})}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="invoice-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleProceedToPayment}>
            Proceder al Pago
          </button>
        </div>
      </div>
      
      {/* Modal de pago */}
      <PaymentModal 
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        total={total}
      />
    </div>
  );
};

export default InvoiceModal;
import React, { useState } from "react";
import "./Cart.css";
import PaymentModal from "./PaymentModal";

export default function Cart({ 
  cart = [], 
  removeProduct = () => {}, 
  changeQty = () => {}, 
  subtotal = 0, 
  imp = 0, 
  desc = 0, 
  total = 0, 
  setImp = () => {}, 
  setDesc = () => {} 
}) {
  const [nota, setNota] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h5>Carrito de Compras</h5>
        <div className="cart-header-actions">
          <button title="Limpiar carrito">
            <i className="bi bi-trash"></i>
          </button>
          <button title="Opciones">
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        </div>
      </div>

      <div className="cart-body">
        {cart.length > 0 ? (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-row">
                <div className="cart-item-info">
                  <div className="cart-item-name">
                    <i className="bi bi-chevron-right"></i>
                    <span className="product-badge">{item.name}</span>
                  </div>
                  <div className="cart-item-actions">
                    <button onClick={() => removeProduct(item.id)} title="Eliminar">
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-control">
                    <button 
                      onClick={() => changeQty(item.id, -1)}
                      disabled={item.qty <= 1}
                      className="qty-btn"
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      className="qty-input"
                      value={item.qty}
                      onChange={(e) => changeQty(item.id, parseInt(e.target.value) - item.qty || 0)}
                    />
                    <button 
                      onClick={() => changeQty(item.id, 1)}
                      className="qty-btn"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="cart-item-calculation">
                {item.qty}x {item.price?.toLocaleString("es-CO") || '0'} = ${((item.qty || 0) * (item.price || 0)).toLocaleString("es-CO")}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-cart">
            <i className="bi bi-cart"></i>
            <p>No hay productos en el carrito</p>
          </div>
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-summary">
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Impuestos</span>
            <span className="summary-value">
              <input 
                type="number" 
                value={imp} 
                onChange={(e) => setImp(Number(e.target.value))}
                className="summary-input"
              />
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Descuento</span>
            <span className="summary-value">
              <input 
                type="number" 
                value={desc} 
                onChange={(e) => setDesc(Number(e.target.value))}
                className="summary-input"
              />
            </span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="cart-note">
          <input
            type="text"
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Nota (opcional)"
            maxLength={150}
          />
        </div>

        <button 
          className="checkout-button"
          onClick={() => setShowPaymentModal(true)}
        >
          Realizar Factura
        </button>
      </div>
      
      {/* Modal de pago directo */}
      <PaymentModal 
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        total={total}
      />
    </div>
  );
}
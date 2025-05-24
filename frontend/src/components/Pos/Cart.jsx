import React, { useState } from "react";
import "./Cart.css";

export default function Cart({
  cart, removeProduct, changeQty, subtotal, imp, desc, total, setImp, setDesc
}) {
  const [nota, setNota] = useState("");

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h5>Carrito de Compras</h5>
        <div className="cart-header-actions">
          <button title="Limpiar carrito">
            <span className="material-icons" style={{fontSize: '16px'}}>delete_outline</span>
          </button>
          <button title="Opciones">
            <span className="material-icons" style={{fontSize: '16px'}}>more_vert</span>
          </button>
        </div>
      </div>

      <div className="cart-body">
        {cart.length > 0 ? (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-header">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-actions">
                  <button onClick={() => removeProduct(item.id)} title="Eliminar">
                    <span className="material-icons" style={{fontSize: '16px'}}>close</span>
                  </button>
                </div>
              </div>
              <div className="cart-item-details">
                <div className="quantity-control">
                  <button 
                    onClick={() => changeQty(item.id, -1)}
                    disabled={item.qty <= 1}
                  >-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)}>+</button>
                </div>
                <div className="cart-item-price">
                  {item.qty} x ${item.price.toLocaleString("es-CO", {maximumFractionDigits: 0})}
                </div>
                <div className="cart-item-total">
                  ${(item.qty * item.price).toLocaleString("es-CO", {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-cart">
            <span className="material-icons empty-cart-icon">shopping_cart</span>
            <p>No hay productos en el carrito</p>
          </div>
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-summary">
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">${subtotal.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Impuestos</span>
            <span className="summary-value">
              <input 
                type="number" 
                value={imp} 
                onChange={(e) => setImp(Number(e.target.value))}
                style={{width: '80px', textAlign: 'right', padding: '2px 5px', border: '1px solid #ced4da', borderRadius: '3px'}}
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
                style={{width: '80px', textAlign: 'right', padding: '2px 5px', border: '1px solid #ced4da', borderRadius: '3px'}}
              />
            </span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
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

        <button className="checkout-button">
          Realizar Factura
        </button>
      </div>
    </div>
  );
}
import React, { useState, useRef } from "react";
import Swal from 'sweetalert2';
import "./Cart.css";
import PaymentModal from "./PaymentModal";
import { useCajero } from "../../context/CajeroContext";

export default function Cart({
  cart = [],
  removeProduct = () => { },
  changeQty = () => { },
  subtotal = 0,
  imp = 0,
  desc = 0,
  total = 0,
  setImp = () => { },
  setDesc = () => { },
  seller = 'Sistema',
  client = 'CONSUMIDOR FINAL',
  clearCart = () => { },
  address = '',
  phone = '',
  userLogueado = 'Sistema' // 🆕
}) {
  const { cajeroLogueado, isAuthenticated, turnoActivo, openLoginModal } = useCajero();
  const [nota, setNota] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estado para drag scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const cartBodyRef = useRef(null);

  // Formatear moneda
  const formatCurrency = (amount) => `$${(amount || 0).toLocaleString('es-CO')}`;

  // Funciones para drag scroll
  const handleMouseDown = (e) => {
    if (!cartBodyRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY - cartBodyRef.current.offsetTop);
    setScrollTop(cartBodyRef.current.scrollTop);
    cartBodyRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (cartBodyRef.current) cartBodyRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (cartBodyRef.current) cartBodyRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !cartBodyRef.current) return;
    e.preventDefault();
    const y = e.pageY - cartBodyRef.current.offsetTop;
    const walk = (y - startY) * 2;
    cartBodyRef.current.scrollTop = scrollTop - walk;
  };

  // 🆕 Manejar click en checkout - validar cajero logueado Y turno activo
  const handleCheckout = () => {
    if (!isAuthenticated || !cajeroLogueado) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Requerido',
        html: `
          <p>Para realizar una venta debes iniciar sesión como <strong>Cajero</strong>.</p>
          <p style="font-size: 14px; color: #6c757d; margin-top: 10px;">
            <i class="bi bi-info-circle"></i> 
            Haz clic en el botón <strong>"Login Cajero"</strong> en la barra superior.
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        footer: '<small>Ingresa con tu usuario y contraseña de cajero</small>'
      }).then(() => {
        // Abrir modal de login si existe la función
        if (openLoginModal) {
          openLoginModal();
        }
      });
      return;
    }

    // 🆕 Validar que haya turno activo
    if (!turnoActivo) {
      Swal.fire({
        icon: 'warning',
        title: 'Turno No Iniciado',
        html: `
          <p>Para realizar una venta debes <strong>abrir un turno</strong> primero.</p>
          <p style="font-size: 14px; color: #6c757d; margin-top: 10px;">
            <i class="bi bi-info-circle"></i> 
            Haz clic en el botón <strong>"Login"</strong> en la barra superior para abrir turno.
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    // Si está logueado y tiene turno, abrir modal de pago
    setShowPaymentModal(true);
  };

  // Renderizar item del carrito
  const renderCartItem = (item) => (
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
              onClick={(e) => e.target.select()}
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
        {item.qty}x {formatCurrency(item.price)} = {formatCurrency((item.qty || 0) * (item.price || 0))}
      </div>
    </div>
  );

  // Renderizar fila de resumen
  const renderSummaryRow = (label, value, isInput = false, onChange = null) => (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">
        {isInput ? (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            onClick={(e) => e.target.select()}
            className="summary-input"
          />
        ) : (
          formatCurrency(value)
        )}
      </span>
    </div>
  );

  return (
    <div className="cart-container">
      {/* Body */}
      <div
        className="cart-body"
        ref={cartBodyRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: cart.length > 0 ? 'grab' : 'default' }}
      >
        {cart.length > 0 ? (
          cart.map(renderCartItem)
        ) : (
          <div className="empty-cart">
            <i className="bi bi-cart"></i>
            <p>No hay productos en el carrito</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="cart-footer">
        <div className="cart-summary">
          <div className="summary-row-horizontal">
            <div className="summary-item">
              <span className="summary-label">Imp:</span>
              <span className="summary-value-inline">{formatCurrency(imp)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Desc:</span>
              <span className="summary-value-inline">{formatCurrency(desc)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Subtotal:</span>
              <span className="summary-value-inline">{formatCurrency(subtotal)}</span>
            </div>
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
          className="checkout-button pos-checkout-btn"
          onClick={handleCheckout}
        >
          Realizar Factura {formatCurrency(total)}
        </button>
      </div>

      {/* Modal de pago */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        total={total}
        subtotal={subtotal}
        impuestos={imp}
        descuentos={desc}
        seller={seller}
        userLogueado={userLogueado} // 🆕
        client={client}
        clearCart={clearCart}
        // 🆕 Datos extra para el ticket
        address={address}
        phone={phone}
      />
    </div>
  );
}
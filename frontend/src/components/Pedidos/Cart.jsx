import React, { useState } from "react";
import "./Cart.css";
import PaymentModal from "./PaymentModal";

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
    clientData = null,
    clearCart = () => { },
    resetForm = () => { }
}) {
    const [nota, setNota] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Formatear moneda
    const formatCurrency = (amount) => `${(amount || 0).toLocaleString('es-CO')}`;

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
            {/* Header */}
            <div className="cart-header">
                <h5>Carrito de Pedidos</h5>
                <div className="cart-header-actions">
                    <button title="Limpiar carrito">
                        <i className="bi bi-trash"></i>
                    </button>
                    <button title="Opciones">
                        <i className="bi bi-three-dots-vertical"></i>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="cart-body">
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
                    {renderSummaryRow("Subtotal", subtotal)}
                    {renderSummaryRow("Impuestos", imp, true, setImp)}
                    {renderSummaryRow("Descuento", desc, true, setDesc)}
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
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
                    className="checkout-button pedidos-checkout-btn"
                    onClick={() => setShowPaymentModal(true)}
                >
                    Generar Pedido
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
                client={client}
                clientData={clientData}
                clearCart={clearCart}
                resetForm={resetForm}
            />
        </div>
    );
}
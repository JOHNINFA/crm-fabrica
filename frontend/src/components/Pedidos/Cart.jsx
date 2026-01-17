import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import "./Cart.css";
import PaymentModal from "./PaymentModal";
import { useCajeroPedidos } from "../../context/CajeroPedidosContext";

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
    resetForm = () => { },
    date = null
}) {
    const navigate = useNavigate();
    const { cajeroLogueado, isAuthenticated, openLoginModal } = useCajeroPedidos();
    const [nota, setNota] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    // Estado persistente para el toggle
    const [volverGestion, setVolverGestion] = useState(() => {
        const saved = localStorage.getItem('pedidos_volverGestion');
        return saved === 'true';
    });

    // Guardar en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('pedidos_volverGestion', volverGestion);
    }, [volverGestion]);

    // Estado para drag scroll
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const cartBodyRef = useRef(null);

    // Formatear moneda
    const formatCurrency = (amount) => `${(amount || 0).toLocaleString('es-CO')}`;

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

    // 🆕 Manejar click en generar pedido - validar cajero logueado
    const handleCheckout = () => {
        if (!isAuthenticated || !cajeroLogueado) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Requerido',
                html: `
                    <p>Para generar un pedido debes iniciar sesión como <strong>Usuario</strong>.</p>
                    <p style="font-size: 14px; color: #6c757d; margin-top: 10px;">
                        <i class="bi bi-info-circle"></i> 
                        Haz clic en el botón <strong>"Login Cajero"</strong> en la barra superior.
                    </p>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6',
                footer: '<small>Ingresa con tu usuario y contraseña</small>'
            }).then(() => {
                // Abrir modal de login si existe la función
                if (openLoginModal) {
                    openLoginModal();
                }
            });
            return;
        }

        // Si está logueado, abrir modal de pago
        setShowPaymentModal(true);
    };

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

                {/* Toggle para volver a gestión */}
                <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <span
                        style={{
                            color: '#333',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            fontWeight: '500'
                        }}
                        onClick={() => {
                            // Si el toggle está activado, intentar volver al día específico
                            if (volverGestion) {
                                const dia = localStorage.getItem('pedidos_retorno_dia');
                                const fecha = localStorage.getItem('pedidos_retorno_fecha');
                                if (dia && fecha) {
                                    navigate(`/pedidos/${dia}?fecha=${fecha}`);
                                } else {
                                    navigate('/pedidos'); // Fallback
                                }
                            } else {
                                // Si el toggle NO está activado, ir a la interfaz general de días
                                navigate('/pedidos');
                            }
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1D4ED8'}
                        onMouseLeave={(e) => e.target.style.color = '#333'}
                        title="Regresar a la gestión del día donde estabas trabajando"
                    >
                        Volver a gestión del día
                    </span>
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="volverGestionSwitch"
                            checked={volverGestion}
                            onChange={(e) => setVolverGestion(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                </div>

                <button
                    className="checkout-button pedidos-checkout-btn"
                    onClick={handleCheckout}
                    style={{ marginTop: '0' }}
                >
                    Generar Pedido ${formatCurrency(total)}
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
                volverGestion={volverGestion}
                date={date}
                navigate={navigate}
                nota={nota} // 🆕 Pasar nota
            />
        </div>
    );
}
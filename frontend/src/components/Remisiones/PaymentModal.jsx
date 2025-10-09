import React, { useState, useEffect } from 'react';
import { remisionService } from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({
    show, onClose, cart, total, subtotal = 0, impuestos = 0, descuentos = 0,
    seller = 'Sistema', client = 'CONSUMIDOR FINAL', clientData = null, clearCart = () => { }
}) => {
    const safeTotal = typeof total === 'number' ? total : 0;
    const [destinatario, setDestinatario] = useState(client);
    const [direccionEntrega, setDireccionEntrega] = useState("");
    const [telefonoContacto, setTelefonoContacto] = useState("");
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [nota, setNota] = useState("");
    const [tipoRemision, setTipoRemision] = useState("ENTREGA");
    const [transportadora, setTransportadora] = useState("Propia");
    const [processing, setProcessing] = useState(false);

    // Inicializar fecha de entrega y datos del cliente
    useEffect(() => {
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        setFechaEntrega(mañana.toISOString().split('T')[0]);
    }, []);

    // Cargar datos del cliente si vienen de Pedidos
    useEffect(() => {
        if (clientData) {
            console.log('📋 Cargando datos del cliente en modal:', clientData);
            if (clientData.direccion) setDireccionEntrega(clientData.direccion);
            if (clientData.telefono) setTelefonoContacto(clientData.telefono);
            if (clientData.fecha) setFechaEntrega(clientData.fecha);
        }
    }, [clientData]);

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        if (!destinatario.trim()) {
            alert('Debe especificar el destinatario');
            return;
        }

        if (!direccionEntrega.trim()) {
            alert('Debe especificar la dirección de entrega');
            return;
        }

        setProcessing(true);

        try {
            // Función para obtener fecha local
            const getFechaLocal = () => {
                const hoy = new Date();
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                const hour = String(hoy.getHours()).padStart(2, '0');
                const minute = String(hoy.getMinutes()).padStart(2, '0');
                const second = String(hoy.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
            };

            // Preparar datos de la remisión
            const remisionData = {
                fecha: getFechaLocal(),
                vendedor: seller,
                destinatario: destinatario,
                direccion_entrega: direccionEntrega,
                telefono_contacto: telefonoContacto,
                fecha_entrega: fechaEntrega,
                tipo_remision: tipoRemision,
                transportadora: transportadora,
                subtotal: subtotal,
                impuestos: impuestos,
                descuentos: descuentos,
                total: safeTotal,
                estado: 'PENDIENTE',
                nota: nota,
                detalles: cart.map(item => ({
                    producto: item.id,
                    cantidad: item.qty,
                    precio_unitario: item.price
                }))
            };

            console.log('Procesando remisión:', remisionData);

            // Crear la remisión
            const result = await remisionService.create(remisionData);

            if (result && !result.error) {
                console.log('✅ Remisión creada exitosamente:', result);
                alert(`¡Remisión generada exitosamente!\nNúmero: ${result.numero_remision}\nDestinatario: ${destinatario}\nTotal: ${safeTotal.toLocaleString()}`);

                // Limpiar carrito y cerrar modal
                clearCart();
                onClose();
            } else {
                console.error('❌ Error al crear remisión:', result);
                alert('Error al generar la remisión. Intente nuevamente.');
            }
        } catch (error) {
            console.error('❌ Error al procesar remisión:', error);
            alert('Error al generar la remisión. Intente nuevamente.');
        } finally {
            setProcessing(false);
        }
    };

    // Tipos de remisión
    const tiposRemision = [
        { id: 'ENTREGA', label: 'Entrega', icon: 'truck' },
        { id: 'TRASLADO', label: 'Traslado', icon: 'arrow-left-right' },
        { id: 'DEVOLUCION', label: 'Devolución', icon: 'arrow-return-left' },
        { id: 'MUESTRA', label: 'Muestra', icon: 'gift' }
    ];

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal">
                {/* Header */}
                <div className="payment-modal-header">
                    <h4>
                        Destinatario: <strong>{destinatario}</strong> | Fecha: <strong>{(() => {
                            const hoy = new Date();
                            const year = hoy.getFullYear();
                            const month = String(hoy.getMonth() + 1).padStart(2, '0');
                            const day = String(hoy.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })()}</strong> | Vendedor: <strong>{seller}</strong>
                    </h4>
                    <button className="close-button" onClick={onClose} title="Cerrar">
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                <div className="payment-modal-body">
                    {/* Totales */}
                    <div className="payment-summary">
                        <div className="payment-summary-box total">
                            <div>TOTAL REMISIÓN</div>
                            <strong>📦 ${safeTotal.toLocaleString()}</strong>
                        </div>
                        <div className="payment-summary-box pending">
                            <div>ESTADO</div>
                            <strong>📋 PENDIENTE</strong>
                        </div>
                        <div className="payment-summary-box change">
                            <div>PRODUCTOS</div>
                            <strong>📦 {cart.length} items</strong>
                        </div>
                    </div>

                    {/* Tipos de Remisión */}
                    <div className="payment-methods">
                        {tiposRemision.map((tipo) => (
                            <button
                                key={tipo.id}
                                className={`payment-method-btn ${tipoRemision === tipo.id ? 'active' : ''}`}
                                onClick={() => setTipoRemision(tipo.id)}
                            >
                                <i className={`bi bi-${tipo.icon}`}></i> {tipo.label}
                            </button>
                        ))}
                    </div>

                    <div className="payment-form">
                        {/* Información del destinatario */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label text-muted small">Destinatario</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={destinatario}
                                    onChange={(e) => setDestinatario(e.target.value)}
                                    placeholder="Nombre del destinatario"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-muted small">Teléfono de Contacto</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={telefonoContacto}
                                    onChange={(e) => setTelefonoContacto(e.target.value)}
                                    placeholder="Teléfono"
                                />
                            </div>
                        </div>

                        {/* Dirección y fecha */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label text-muted small">Dirección de Entrega</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={direccionEntrega}
                                    onChange={(e) => setDireccionEntrega(e.target.value)}
                                    placeholder="Dirección completa de entrega"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-muted small">Fecha de Entrega</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaEntrega}
                                    onChange={(e) => setFechaEntrega(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Nota */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Observaciones</label>
                                <textarea
                                    className="form-control compact-textarea"
                                    rows={2}
                                    value={nota}
                                    onChange={(e) => setNota(e.target.value)}
                                    placeholder="Instrucciones especiales, observaciones..."
                                />
                            </div>
                        </div>

                        {/* Transportadora */}
                        <div className="form-row compact-row">
                            <div className="form-group">
                                <label className="form-label compact-label">Transportadora</label>
                                <select
                                    className="form-select compact-select"
                                    value={transportadora}
                                    onChange={(e) => setTransportadora(e.target.value)}
                                >
                                    <option>Propia</option>
                                    <option>Servientrega</option>
                                    <option>Coordinadora</option>
                                    <option>TCC</option>
                                    <option>Interrapidísimo</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label compact-label">Tipo de Remisión</label>
                                <select
                                    className="form-select compact-select"
                                    value={tipoRemision}
                                    onChange={(e) => setTipoRemision(e.target.value)}
                                >
                                    <option value="ENTREGA">Entrega</option>
                                    <option value="TRASLADO">Traslado</option>
                                    <option value="DEVOLUCION">Devolución</option>
                                    <option value="MUESTRA">Muestra</option>
                                </select>
                            </div>
                        </div>

                        {/* Resumen de productos */}
                        <div className="form-row compact-row">
                            <div className="form-group">
                                <label className="form-label compact-label">Resumen de Productos</label>
                                <div className="payment-summary-detail">
                                    <div className="payment-method-amount">{cart.length} productos - $ {safeTotal.toLocaleString()}</div>
                                    <div className="payment-bank">Entrega: {fechaEntrega}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="payment-modal-footer">
                    <button className="btn btn-outline-secondary" onClick={onClose}>
                        <i className="bi bi-x-lg"></i> Cancelar
                    </button>
                    <button
                        className="btn btn-primary remisiones-payment-confirm-btn"
                        onClick={handleSubmit}
                        disabled={processing || cart.length === 0}
                    >
                        {processing ? (
                            <>
                                <i className="bi bi-hourglass-split"></i> Generando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg"></i> Generar Pedido
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
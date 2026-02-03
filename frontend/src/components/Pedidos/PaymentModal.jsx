import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services/api';
import TicketPreviewModal from '../Print/TicketPreviewModal';
import { useCajeroPedidos } from '../../context/CajeroPedidosContext'; // 🆕 Para obtener nombre del usuario logueado
import './PaymentModal.css';

const PaymentModal = ({
    show, onClose, cart, total, subtotal = 0, impuestos = 0, descuentos = 0,
    seller = 'Sistema', client = 'CONSUMIDOR FINAL', clientData = null, clearCart = () => { }, resetForm = () => { },
    volverGestion = false, date = null, navigate = null, nota: notaInicial = ""
}) => {
    const safeTotal = typeof total === 'number' ? total : 0;

    // 🆕 Obtener nombre del usuario logueado (cajero)
    const { cajeroLogueado } = useCajeroPedidos();
    const generadoPor = cajeroLogueado?.nombre || 'SISTEMA';

    const [destinatario, setDestinatario] = useState(client);
    const [direccionEntrega, setDireccionEntrega] = useState("");
    const [telefonoContacto, setTelefonoContacto] = useState("");
    const [zonaBarrio, setZonaBarrio] = useState(""); // 🆕 Zona/Barrio del cliente
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [nota, setNota] = useState(notaInicial);

    // 🆕 Sincronizar nota si cambia desde el padre
    useEffect(() => {
        setNota(notaInicial);
    }, [notaInicial]);
    const [tipoPedido, setTipoRemision] = useState("ENTREGA");
    const [metodoPago, setMetodoPago] = useState("Efectivo");
    const [transportadora, setTransportadora] = useState("Propia");
    const [processing, setProcessing] = useState(false);
    const [showOtrosOptions, setShowOtrosOptions] = useState(false);
    const [banco, setBanco] = useState("Caja General");
    const [bancos, setBancos] = useState([]);
    const [centroCosto, setCentroCosto] = useState("");
    const [impresion, setImpresion] = useState(() => {
        // Cargar preferencia guardada o usar "Ninguna" por defecto
        return localStorage.getItem('preferencia_impresion_pedidos') || "Ninguna";
    });
    const [bodega, setBodega] = useState("Principal");
    const [pedidoCreado, setPedidoCreado] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // 🆕 Estado para pantalla de éxito interna
    const [showError, setShowError] = useState(false); // 🆕 Estado para pantalla de error
    const [errorMessage, setErrorMessage] = useState({ title: '', text: '' }); // 🆕 Datos del error

    // Cargar bancos desde localStorage
    useEffect(() => {
        const bancosGuardados = localStorage.getItem('bancos');
        if (bancosGuardados) {
            const bancosList = JSON.parse(bancosGuardados);
            const bancosActivos = bancosList.filter(b => b.activo);
            setBancos(bancosActivos);
            if (bancosActivos.length > 0) {
                setBanco(bancosActivos[0].nombre);
            }
        } else {
            const bancosDefault = [
                { id: 1, nombre: 'Caja General', activo: true }
            ];
            setBancos(bancosDefault);
            setBanco('Caja General');
        }
    }, []);


    // Actualizar destinatario cuando cambia el prop client
    useEffect(() => {
        setDestinatario(client);
    }, [client]);

    // Inicializar fecha de entrega y datos del cliente
    useEffect(() => {
        if (date) {
            setFechaEntrega(date);
        } else {
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            setFechaEntrega(mañana.toISOString().split('T')[0]);
        }
    }, [date]);

    // Cargar datos del cliente si vienen de Pedidos
    useEffect(() => {
        if (clientData) {


            if (clientData.direccion) setDireccionEntrega(clientData.direccion);
            // 🆕 Priorizar movil, luego telefono_1, luego telefono_contacto
            const telefono = clientData.movil || clientData.telefono_1 || clientData.telefono_contacto || '';
            if (telefono) setTelefonoContacto(telefono);
            if (clientData.zona_barrio) setZonaBarrio(clientData.zona_barrio); // 🆕
            if (clientData.fecha) setFechaEntrega(clientData.fecha);
            // No asignamos vendedor automáticamente, el usuario debe hacerlo manualmente
        }
    }, [clientData]);

    if (!show) return null;

    const handleCloseAndReset = () => {
        // Resetear estados del modal
        setDestinatario("DESTINATARIO GENERAL");
        setDireccionEntrega("");
        setTelefonoContacto("");
        if (date) {
            setFechaEntrega(date);
        } else {
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            setFechaEntrega(mañana.toISOString().split('T')[0]);
        }
        setNota("");
        setTipoRemision("ENTREGA");
        setTransportadora("Propia");
        setPedidoCreado(null);

        // Resetear formulario completo y cerrar modal
        resetForm();
        onClose();

        // Si el toggle está activado, navegar a gestión del día
        if (volverGestion && navigate) {
            // Priorizar contexto guardado (cuando vienes desde "Ir a Pedidos")
            const diaGuardado = localStorage.getItem('pedidos_retorno_dia');
            const fechaGuardada = localStorage.getItem('pedidos_retorno_fecha');

            if (diaGuardado && fechaGuardada) {
                // Limpiar después de usar
                localStorage.removeItem('pedidos_retorno_dia');
                localStorage.removeItem('pedidos_retorno_fecha');
                navigate(`/pedidos/${diaGuardado}?fecha=${fechaGuardada}`);
            } else if (date) {
                // Fallback: usar fecha del pedido
                const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
                const fechaObj = new Date(date + 'T00:00:00');
                const dia = diasSemana[fechaObj.getDay()];
                navigate(`/pedidos/${dia}?fecha=${date}`);
            }
        }
    };


    // Nueva función aislada para crear pedido (puede ser llamada tras validar o forzar)
    const executeCreation = async () => {
        setProcessing(true);
        try {
            // Función para obtener fecha local (solo fecha, sin hora para evitar problemas de zona horaria)
            const getFechaLocal = () => {
                const hoy = new Date();
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Preparar datos del pedido
            const pedidoData = {
                fecha: getFechaLocal(), // Fecha de creación (hoy)
                vendedor: seller,
                destinatario: destinatario,
                direccion_entrega: direccionEntrega,
                telefono_contacto: telefonoContacto,
                zona_barrio: zonaBarrio,
                fecha_entrega: fechaEntrega, // Fecha programada entrega
                tipo_remision: tipoPedido,
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
                    precio_unitario: parseFloat(item.price)
                }))
            };

            const result = await pedidoService.create(pedidoData);

            if (result && !result.error) {
                if (impresion === 'Tirilla') {
                    setPedidoCreado(result);
                    setShowTicketModal(true);
                } else {
                    setPedidoCreado(result);
                    setShowSuccess(true);
                }
            } else {
                console.error('❌ Error al crear pedido:', result);
                alert('Error al generar el pedido. Intente nuevamente.');
            }
        } catch (error) {
            console.error('❌ Error al procesar pedido:', error);
            alert('Error al generar el pedido. Intente nuevamente.');
        } finally {
            setProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cart.length === 0) { alert('El carrito está vacío'); return; }
        if (!destinatario.trim()) { alert('Debe especificar el destinatario'); return; }
        if (!direccionEntrega.trim()) { alert('Debe especificar la dirección de entrega'); return; }

        // 🛡️ Validación de Duplicados
        try {
            const pedidosExistentes = await pedidoService.getAll({ fecha_entrega: fechaEntrega });
            if (Array.isArray(pedidosExistentes)) {
                const normalize = s => s ? s.toString().trim().toLowerCase() : '';
                const targetName = normalize(destinatario);

                // Comparación de fechas segura (substring 10 chars)
                const sameDate = (d1, d2) => {
                    if (!d1 || !d2) return false;
                    return d1.toString().substring(0, 10) === d2.toString().substring(0, 10);
                };

                const duplicado = pedidosExistentes.find(p =>
                    normalize(p.destinatario) === targetName &&
                    sameDate(p.fecha_entrega, fechaEntrega) &&
                    p.estado !== 'ANULADA'
                );

                if (duplicado) {
                    setErrorMessage({
                        title: '⛔ ACCIÓN DENEGADA',
                        text: `Ya existe un pedido activo (#${duplicado.numero_pedido}) para el cliente "${destinatario}" con fecha de entrega ${fechaEntrega}.\n\n` +
                            `Vendedor: ${duplicado.vendedor || 'Desconocido'}\n\n` +
                            `El sistema NO permite duplicados idénticos para el mismo día.`
                    });
                    setShowError(true);
                    return;
                }
            }
        } catch (error) {
            console.warn('Error verificando duplicados:', error);
        }

        // Si pasa validaciones
        await executeCreation();
    };

    // Métodos de pago
    const metodosPago = [
        { id: 'Efectivo', label: 'Efectivo', icon: 'currency-dollar' },
        { id: 'Tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { id: 'T. Crédito', label: 'T. Crédito', icon: 'credit-card-2-front' },
        { id: 'Qr', label: 'Qr', icon: 'qr-code' },
        { id: 'Transf', label: 'Transf', icon: 'arrow-left-right' },
        { id: 'RAPPIPAY', label: 'RAPPIPAY', icon: 'wallet2' },
        { id: 'Bonos', label: 'Bonos', icon: 'ticket-perforated' },
        { id: 'Otros', label: 'Otros', icon: 'three-dots' }
    ];

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal pedidos-modal">
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
                            <div>TOTAL PEDIDO</div>
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

                    {/* Métodos de Pago */}
                    <div className="payment-methods">
                        {metodosPago.map((metodo) => (
                            <button
                                key={metodo.id}
                                className={`payment-method-btn ${metodoPago === metodo.id ? 'active' : ''}`}
                                onClick={() => {
                                    setMetodoPago(metodo.id);
                                    if (metodo.id === 'Otros') {
                                        setShowOtrosOptions(true);
                                    } else {
                                        setShowOtrosOptions(false);
                                    }
                                }}
                            >
                                <i className={`bi bi-${metodo.icon}`}></i> {metodo.label}
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



                        {/* Opciones adicionales - Solo visible cuando se selecciona "Otros" */}
                        {showOtrosOptions && (
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
                                    <label className="form-label compact-label">Tipo de Pedido</label>
                                    <select
                                        className="form-select compact-select"
                                        value={tipoPedido}
                                        onChange={(e) => setTipoRemision(e.target.value)}
                                    >
                                        <option value="ENTREGA">Entrega</option>
                                        <option value="TRASLADO">Traslado</option>
                                        <option value="DEVOLUCION">Devolución</option>
                                        <option value="MUESTRA">Muestra</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Fila con Bancos y Centro de Costo */}
                        <div className="form-row compact-row">
                            <div className="form-group">
                                <label className="form-label compact-label">Bancos</label>
                                <select
                                    className="form-select compact-select"
                                    value={banco}
                                    onChange={(e) => setBanco(e.target.value)}
                                >
                                    {bancos.length === 0 ? (
                                        <option>Caja General</option>
                                    ) : (
                                        bancos.map(b => (
                                            <option key={b.id} value={b.nombre}>{b.nombre}</option>
                                        ))
                                    )}
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
                                    <div className="payment-method-amount">{metodoPago} - $ {safeTotal.toLocaleString()}</div>
                                    <div className="payment-bank">{banco}</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label compact-label">Impresión</label>
                                <select
                                    className="form-select compact-select"
                                    value={impresion}
                                    onChange={(e) => {
                                        const nuevoValor = e.target.value;
                                        setImpresion(nuevoValor);
                                        // Guardar preferencia en localStorage
                                        localStorage.setItem('preferencia_impresion_pedidos', nuevoValor);
                                    }}
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
                    <button
                        className="btn btn-primary pedidos-payment-confirm-btn"
                        onClick={handleSubmit}
                        disabled={processing || cart.length === 0}
                    >
                        {processing ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Generando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg"></i> Generar Pedido
                            </>
                        )}
                    </button>
                </div>

                {/* 🆕 Pantalla de Éxito Interna (Overlay) */}
                {showSuccess && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#d1e7dd',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            <i className="bi bi-check-lg" style={{ fontSize: '40px', color: '#198754' }}></i>
                        </div>

                        <h3 style={{ color: '#198754', fontWeight: 'bold', marginBottom: '10px' }}>¡Pedido Generado!</h3>

                        <p style={{ fontSize: '16px', color: '#6c757d', marginBottom: '30px' }}>
                            El pedido <strong style={{ color: '#212529' }}>#{pedidoCreado?.numero_pedido}</strong> ha sido creado exitosamente.
                        </p>

                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleCloseAndReset}
                            style={{ padding: '10px 40px', fontSize: '16px', fontWeight: '500' }}
                        >
                            Aceptar
                        </button>
                    </div>
                )}

                {/* 🆕 Pantalla de Error Interna (Overlay) */}
                {showError && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        zIndex: 30,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px',
                        animation: 'fadeIn 0.3s ease-in-out',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '40px', color: '#dc3545' }}></i>
                        </div>

                        <h3 style={{ color: '#dc3545', fontWeight: 'bold', marginBottom: '10px' }}>{errorMessage.title}</h3>

                        <p style={{ fontSize: '16px', color: '#6c757d', marginBottom: '30px', whiteSpace: 'pre-line' }}>
                            {errorMessage.text}
                        </p>

                        <button
                            className="btn btn-danger"
                            onClick={() => setShowError(false)}
                            style={{ padding: '10px 20px', fontSize: '16px', fontWeight: '500' }}
                        >
                            Entendido
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de vista previa del ticket */}
            {pedidoCreado && (
                <TicketPreviewModal
                    show={showTicketModal}
                    onClose={() => {
                        setShowTicketModal(false);
                        handleCloseAndReset();
                    }}
                    autoPrint={impresion === 'Tirilla'}
                    ticketData={{
                        tipo: 'pedido',
                        numero: pedidoCreado.numero_pedido,
                        fecha: pedidoCreado.fecha,
                        cliente: destinatario,
                        vendedor: seller,
                        items: cart,
                        subtotal: subtotal,
                        impuestos: impuestos,
                        descuentos: descuentos,
                        total: safeTotal,
                        direccionEntrega: direccionEntrega,
                        clienteTelefono: telefonoContacto, // 🆕 Para el ticket
                        clienteZona: zonaBarrio, // 🆕 Para el ticket
                        fechaEntrega: fechaEntrega,
                        tipoPedido: tipoPedido,
                        transportadora: transportadora,
                        generadoPor: generadoPor, // 🆕 Usuario que generó el pedido
                        nota: nota
                    }}
                />
            )}
        </div>
    );
};

export default PaymentModal;
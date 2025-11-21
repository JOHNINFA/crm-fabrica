import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services/api';
import TicketPreviewModal from '../Print/TicketPreviewModal';
import './PaymentModal.css';

const PaymentModal = ({
    show, onClose, cart, total, subtotal = 0, impuestos = 0, descuentos = 0,
    seller = 'Sistema', client = 'CONSUMIDOR FINAL', clientData = null, clearCart = () => { }, resetForm = () => { },
    volverGestion = false, date = null, navigate = null
}) => {
    const safeTotal = typeof total === 'number' ? total : 0;
    const [destinatario, setDestinatario] = useState(client);
    const [direccionEntrega, setDireccionEntrega] = useState("");
    const [telefonoContacto, setTelefonoContacto] = useState("");
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [nota, setNota] = useState("");
    const [tipoPedido, setTipoRemision] = useState("ENTREGA");
    const [metodoPago, setMetodoPago] = useState("Efectivo");
    const [transportadora, setTransportadora] = useState("Propia");
    const [processing, setProcessing] = useState(false);
    const [showOtrosOptions, setShowOtrosOptions] = useState(false);
    const [banco, setBanco] = useState("Caja General");
    const [bancos, setBancos] = useState([]);
    const [centroCosto, setCentroCosto] = useState("");
    const [impresion, setImpresion] = useState("Ninguna");
    const [bodega, setBodega] = useState("Principal");
    const [pedidoCreado, setPedidoCreado] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);

    // ===== NUEVOS ESTADOS PARA AFECTAR INVENTARIO =====
    const [afectarInventario, setAfectarInventario] = useState(false);
    const [asignadoATipo, setAsignadoATipo] = useState('NINGUNO');
    const [asignadoAId, setAsignadoAId] = useState('');
    const [showInventoryOptions, setShowInventoryOptions] = useState(false); // Estado para colapsar opciones de inventario
    const [domiciliarios, setDomiciliarios] = useState([]);
    const [vendedores, setVendedores] = useState([]); // ✅ Estado para vendedores

    // Efecto para automatizar el check de inventario cuando se asigna vendedor o domiciliario
    useEffect(() => {
        // ✅ Cuando se selecciona "VENDEDOR", asignar el vendedor del cliente automáticamente
        if (asignadoATipo === 'VENDEDOR' && !asignadoAId && clientData?.vendedor_asignado) {
            console.log('👤 Vendedor asignado del cliente (original):', clientData.vendedor_asignado);

            // Extraer el ID del vendedor del formato "Jose (ID2)" -> "ID2"
            const match = clientData.vendedor_asignado.match(/\(([^)]+)\)/);
            const vendedorId = match ? match[1] : clientData.vendedor_asignado;

            console.log('👤 ID del vendedor extraído:', vendedorId);
            setAsignadoAId(vendedorId);
        }

        // ✅ Activar checkbox automáticamente cuando se asigna un vendedor o domiciliario
        if (asignadoATipo === 'DOMICILIARIO' && asignadoAId) {
            setAfectarInventario(true);
        } else if (asignadoATipo === 'VENDEDOR' && asignadoAId) {
            setAfectarInventario(true);
        } else if (asignadoATipo === 'NINGUNO') {
            // Desmarcar si se vuelve a "Ninguno"
            setAfectarInventario(false);
            setAsignadoAId(''); // Limpiar el ID también
        }
    }, [asignadoATipo, asignadoAId, clientData]);

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

    // Cargar vendedores desde la API
    useEffect(() => {
        const cargarVendedores = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/vendedores/');
                if (response.ok) {
                    const data = await response.json();
                    setVendedores(data);
                    console.log('✅ Vendedores cargados:', data);
                }
            } catch (error) {
                console.error('❌ Error cargando vendedores:', error);
            }
        };
        cargarVendedores();
    }, []);

    // Cargar domiciliarios desde la API
    useEffect(() => {
        const cargarDomiciliarios = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/domiciliarios/?activo=true');
                if (response.ok) {
                    const data = await response.json();
                    setDomiciliarios(data);
                    console.log('✅ Domiciliarios cargados:', data);
                }
            } catch (error) {
                console.error('❌ Error cargando domiciliarios:', error);
            }
        };
        cargarDomiciliarios();
    }, []);

    // Actualizar destinatario cuando cambia el prop client
    useEffect(() => {
        setDestinatario(client);
    }, [client]);

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
            console.log('👤 Vendedor asignado del cliente:', clientData.vendedor_asignado);
            if (clientData.direccion) setDireccionEntrega(clientData.direccion);
            if (clientData.telefono) setTelefonoContacto(clientData.telefono);
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
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        setFechaEntrega(mañana.toISOString().split('T')[0]);
        setNota("");
        setTipoRemision("ENTREGA");
        setTransportadora("Propia");
        setPedidoCreado(null);

        // Resetear formulario completo y cerrar modal
        resetForm();
        onClose();

        // Si el toggle está activado, navegar a gestión del día
        if (volverGestion && date && navigate) {
            const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
            const fechaObj = new Date(date + 'T00:00:00');
            const dia = diasSemana[fechaObj.getDay()];
            navigate(`/pedidos/${dia}?fecha=${date}`);
        }
    };

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
                fecha: getFechaLocal(),
                vendedor: seller,
                destinatario: destinatario,
                direccion_entrega: direccionEntrega,
                telefono_contacto: telefonoContacto,
                fecha_entrega: fechaEntrega,
                tipo_remision: tipoPedido,
                transportadora: transportadora,
                subtotal: subtotal,
                impuestos: impuestos,
                descuentos: descuentos,
                total: safeTotal,
                estado: 'PENDIENTE',
                nota: nota,
                // ===== NUEVOS CAMPOS =====
                afectar_inventario_inmediato: afectarInventario,
                asignado_a_tipo: asignadoATipo,
                asignado_a_id: asignadoAId || null,
                detalles: cart.map(item => ({
                    producto: item.id,
                    cantidad: item.qty,
                    precio_unitario: parseFloat(item.price)
                }))
            };

            console.log('Procesando pedido:', pedidoData);
            console.log('Detalles del carrito:', cart);
            console.log('Detalles a enviar:', pedidoData.detalles);

            // Crear el pedido
            const result = await pedidoService.create(pedidoData);

            if (result && !result.error) {
                console.log('✅ Pedido creado exitosamente:', result);

                // Construir mensaje de éxito
                let mensaje = `✅ Pedido #${result.numero_pedido} creado exitosamente\n`;

                if (afectarInventario) {
                    mensaje += `\n⚡ Inventario afectado inmediatamente`;
                }

                if (asignadoATipo === 'VENDEDOR' && asignadoAId) {
                    mensaje += `\n👤 Asignado al vendedor: ${asignadoAId}`;
                } else if (asignadoATipo === 'DOMICILIARIO' && asignadoAId) {
                    mensaje += `\n🛵 Asignado al domiciliario: ${asignadoAId}`;
                }

                alert(mensaje);

                if (impresion === 'Tirilla') {
                    setPedidoCreado(result);
                    setShowTicketModal(true);
                } else {
                    handleCloseAndReset();
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

                        {/* Botón para expandir opciones de inventario */}
                        <div
                            onClick={() => setShowInventoryOptions(!showInventoryOptions)}
                            style={{
                                marginTop: '15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#0d6efd',
                                fontSize: '14px',
                                fontWeight: '500',
                                userSelect: 'none'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px', marginRight: '5px', transition: 'transform 0.2s', transform: showInventoryOptions ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                expand_more
                            </span>
                            Afectación de inventario
                        </div>

                        {/* Nueva sección: Opciones de Inventario y Asignación (Expandible) */}
                        {showInventoryOptions && (
                            <div style={{
                                marginTop: '10px',
                                padding: '15px',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                backgroundColor: '#f8f9fa',
                                animation: 'fadeIn 0.3s ease-in-out'
                            }}>
                                {/* Checkbox: Afectar Inventario */}
                                <div className="form-group" style={{ width: '48%', marginBottom: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                        <input
                                            type="checkbox"
                                            id="afectarInventario"
                                            checked={afectarInventario}
                                            onChange={(e) => setAfectarInventario(e.target.checked)}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                                marginTop: 0,
                                                position: 'relative',
                                                boxShadow: 'none',
                                                outline: 'none',
                                                backgroundColor: 'transparent',
                                                border: '1px solid #ced4da'
                                            }}
                                        />
                                        <label
                                            htmlFor="afectarInventario"
                                            style={{
                                                fontWeight: '600',
                                                fontSize: '15px',
                                                color: '#495057',
                                                cursor: 'pointer',
                                                margin: 0
                                            }}
                                        >
                                            ⚡ Afectar inventario inmediatamente
                                        </label>
                                    </div>
                                    <small style={{ color: '#6c757d', marginLeft: '30px', display: 'block' }}>
                                        Si marcas esta opción, el inventario se descontará al crear el pedido
                                    </small>
                                </div>

                                {/* Dropdown: Tipo de Asignación */}
                                <div className="form-group" style={{ width: '48%' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: '#495057' }}>
                                        Asignar a:
                                    </label>
                                    <select
                                        className="form-select"
                                        value={asignadoATipo}
                                        onChange={(e) => {
                                            setAsignadoATipo(e.target.value);
                                            setAsignadoAId(''); // Reset ID al cambiar tipo
                                        }}
                                        style={{ borderColor: '#ced4da', fontWeight: '500' }}
                                    >
                                        <option value="NINGUNO">Ninguno</option>
                                        <option value="VENDEDOR">Vendedor</option>
                                        <option value="DOMICILIARIO">Domiciliario</option>
                                    </select>
                                </div>

                                {/* Dropdown condicional: Vendedor */}
                                {asignadoATipo === 'VENDEDOR' && (
                                    <div className="form-group" style={{ width: '48%', marginTop: '10px' }}>
                                        <label className="form-label" style={{ fontWeight: '600', color: '#495057' }}>
                                            Vendedor:
                                        </label>
                                        <select
                                            className="form-select"
                                            value={asignadoAId}
                                            onChange={(e) => setAsignadoAId(e.target.value)}
                                            style={{ borderColor: '#ced4da', fontWeight: '500' }}
                                        >
                                            <option value="">Seleccione vendedor</option>
                                            {vendedores.map(vend => (
                                                <option key={vend.id_vendedor} value={vend.id_vendedor}>
                                                    {vend.id_vendedor} - {vend.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {vendedores.length === 0 && (
                                            <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                                                Cargando vendedores...
                                            </small>
                                        )}
                                    </div>
                                )}

                                {/* Dropdown condicional: Domiciliario */}
                                {asignadoATipo === 'DOMICILIARIO' && (
                                    <div className="form-group" style={{ width: '48%', marginTop: '10px' }}>
                                        <label className="form-label" style={{ fontWeight: '600', color: '#495057' }}>
                                            Domiciliario:
                                        </label>
                                        <select
                                            className="form-select"
                                            value={asignadoAId}
                                            onChange={(e) => setAsignadoAId(e.target.value)}
                                            style={{ borderColor: '#ced4da', fontWeight: '500' }}
                                        >
                                            <option value="">Seleccione domiciliario</option>
                                            {domiciliarios.map(dom => (
                                                <option key={dom.codigo} value={dom.codigo}>
                                                    {dom.codigo} - {dom.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {domiciliarios.length === 0 && (
                                            <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                                                No hay domiciliarios registrados. Por favor créelos primero.
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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
                    <button
                        className="btn btn-primary pedidos-payment-confirm-btn"
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
                        telefonoContacto: telefonoContacto,
                        fechaEntrega: fechaEntrega,
                        tipoPedido: tipoPedido,
                        transportadora: transportadora,
                        nota: nota
                    }}
                />
            )}
        </div>
    );
};

export default PaymentModal;
import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Nav, Tab } from 'react-bootstrap';
import { responsableStorage } from '../../utils/responsableStorage';
import { pedidoService } from '../../services/api';

const BotonVerPedidos = ({ dia, idSheet, fechaSeleccionada }) => {
    const [showModal, setShowModal] = useState(false);
    const [pedidos, setPedidos] = useState([]); // Productos agrupados
    const [pedidosClientes, setPedidosClientes] = useState([]); // Pedidos individuales por cliente
    const [loading, setLoading] = useState(false);
    const [nombreVendedor, setNombreVendedor] = useState('');
    const [activeTab, setActiveTab] = useState('resumen');
    const [pedidoExpandido, setPedidoExpandido] = useState(null); // Para ver detalle de un pedido

    // Estados para anulación
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [pedidoAAnular, setPedidoAAnular] = useState(null);
    const [anulando, setAnulando] = useState(false);

    // Cargar nombre del vendedor desde responsableStorage
    useEffect(() => {
        const nombre = responsableStorage.get(idSheet);
        setNombreVendedor(nombre || '');
        console.log(`📋 Vendedor ${idSheet}: "${nombre}"`);
    }, [idSheet]);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            // Obtener todos los pedidos
            const response = await fetch(`http://localhost:8000/api/pedidos/`);
            const todosPedidos = await response.json();

            console.log(`🔍 Total pedidos en BD: ${todosPedidos.length}`);
            console.log(`🔍 Filtrando por: fecha=${fechaSeleccionada}, vendedor=${nombreVendedor}, idSheet=${idSheet}`);

            // Filtrar pedidos por fecha, vendedor y estado
            const pedidosFiltrados = todosPedidos.filter(pedido => {
                const coincideFecha = pedido.fecha_entrega === fechaSeleccionada;
                const noAnulado = pedido.estado !== 'ANULADA';

                // Verificar si el vendedor coincide (por nombre o por ID) - CASE INSENSITIVE
                let coincideVendedor = false;
                if (pedido.vendedor) {
                    const vendedorPedido = pedido.vendedor.toLowerCase().trim();
                    const vendedorBuscado = (nombreVendedor || '').toLowerCase().trim();
                    const idSheetLower = idSheet.toLowerCase();

                    // Opción 1: El pedido tiene formato "Nombre (ID1)"
                    if (pedido.vendedor.toLowerCase().includes(`(${idSheetLower})`)) {
                        coincideVendedor = true;
                    }
                    // Opción 2: El pedido tiene solo el nombre y coincide con el responsable (case insensitive)
                    else if (vendedorBuscado && vendedorPedido === vendedorBuscado) {
                        coincideVendedor = true;
                    }
                }

                if (coincideFecha && coincideVendedor && noAnulado) {
                    console.log(`✅ Pedido encontrado: ${pedido.numero_pedido} - ${pedido.vendedor}`);
                }

                return coincideFecha && coincideVendedor && noAnulado;
            });

            console.log(`✅ Pedidos filtrados: ${pedidosFiltrados.length}`);

            // 🆕 Guardar pedidos individuales con info de cliente
            setPedidosClientes(pedidosFiltrados.map(p => ({
                id: p.id,
                numeroPedido: p.numero_pedido,
                cliente: p.destinatario || p.direccion_entrega || 'Cliente',
                telefono: p.telefono_contacto || '',
                total: parseFloat(p.total || 0),
                estado: p.estado,
                metodo_pago: p.metodo_pago || 'EFECTIVO', // 🆕 Método de pago (default: EFECTIVO)
                detalles: p.detalles || [],
                fechaCreacion: p.fecha_creacion
            })));

            // Agrupar productos por nombre y sumar cantidades (para pestaña Resumen)
            const productosAgrupados = {};

            pedidosFiltrados.forEach(pedido => {
                if (pedido.detalles && pedido.detalles.length > 0) {
                    pedido.detalles.forEach(detalle => {
                        const nombre = detalle.producto_nombre;
                        const cantidad = detalle.cantidad;
                        const precio = detalle.precio_unitario;

                        if (!productosAgrupados[nombre]) {
                            productosAgrupados[nombre] = {
                                nombre: nombre,
                                cantidad: 0,
                                precio: precio,
                                total: 0
                            };
                        }

                        productosAgrupados[nombre].cantidad += cantidad;
                        productosAgrupados[nombre].total += cantidad * precio;
                    });
                }
            });

            // Convertir a array y ordenar
            const productosArray = Object.values(productosAgrupados).sort((a, b) =>
                a.nombre.localeCompare(b.nombre)
            );

            setPedidos(productosArray);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            setPedidos([]);
            setPedidosClientes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        // Solo abrir modal si hay nombre de vendedor
        if (!nombreVendedor || nombreVendedor === 'RESPONSABLE') {
            alert('⚠️ No se puede ver pedidos: No hay vendedor asignado a esta ruta');
            return;
        }

        setShowModal(true);
        setActiveTab('resumen');
        setPedidoExpandido(null);
        cargarPedidos();
    };

    const formatCurrency = (value) => {
        return `${value.toLocaleString('es-CO')}`;
    };

    // 🆕 Función para ir a gestionar pedido (abre en nueva pestaña)
    const handleGestionarPedido = (e, pedido) => {
        e.stopPropagation();
        // Abrir en nueva pestaña para no perder el modal actual
        window.open(`/pedidos/${dia.toUpperCase()}?fecha=${fechaSeleccionada}`, '_blank');
    };

    // 🆕 Función para anular pedido
    const handleAnularClick = (e, pedido) => {
        e.stopPropagation();
        setPedidoAAnular(pedido);
        setShowAnularModal(true);
    };

    const confirmarAnulacion = async () => {
        setAnulando(true);
        try {
            const result = await pedidoService.anularPedido(pedidoAAnular.id, 'Anulado desde cargue');

            if (result.success) {
                alert(`✅ ${result.message}`);
                setShowAnularModal(false);
                setPedidoAAnular(null);
                // Recargar pedidos
                await cargarPedidos();
                // Disparar evento para actualizar totales
                window.dispatchEvent(new CustomEvent('recargarPedidos'));
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            console.error('❌ Error al anular pedido:', error);
            alert(`❌ Error al anular el pedido: ${error.message}`);
        } finally {
            setAnulando(false);
        }
    };

    // 🆕 Función para cambiar método de pago
    const handleCambiarMetodoPago = async (pedidoId, nuevoMetodo) => {
        try {
            const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ metodo_pago: nuevoMetodo })
            });

            if (response.ok) {
                // Actualizar estado local
                setPedidosClientes(prev => prev.map(p =>
                    p.id === pedidoId ? { ...p, metodo_pago: nuevoMetodo } : p
                ));
                console.log(`✅ Método de pago actualizado a ${nuevoMetodo} para pedido ${pedidoId}`);
            } else {
                alert('Error al actualizar método de pago');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar método de pago');
        }
    };

    const totalUnidades = pedidos.reduce((sum, p) => sum + p.cantidad, 0);
    const totalValor = pedidos.reduce((sum, p) => sum + p.total, 0);

    return (
        <>
            <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleOpenModal}
                title="Ver detalle de pedidos"
                style={{ color: '#198754', fontWeight: '500' }}
            >
                📋 Pedidos
            </button>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
                style={{ maxHeight: '90vh' }}
            >
                <Modal.Header closeButton style={{ borderBottom: '1px solid #e0e0e0', padding: '14px 24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>📋</span>
                            <h5 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                Detalle de Pedidos - {nombreVendedor || idSheet} - {dia.toUpperCase()}
                            </h5>
                        </div>
                        <p style={{ margin: '2px 0 0 36px', fontSize: '13px', color: '#95a5a6' }}>
                            Fecha: {fechaSeleccionada}
                        </p>
                    </div>
                </Modal.Header>

                {/* 🆕 Pestañas */}
                <div style={{ borderBottom: '1px solid #e0e0e0', padding: '0 24px' }}>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setPedidoExpandido(null); }}>
                        <Nav.Item>
                            <Nav.Link eventKey="resumen" style={{ fontWeight: activeTab === 'resumen' ? '600' : '400' }}>
                                📦 Resumen Productos
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="clientes" style={{ fontWeight: activeTab === 'clientes' ? '600' : '400' }}>
                                👥 Pedidos Clientes ({pedidosClientes.length})
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                <Modal.Body style={{ padding: '0', maxHeight: 'calc(90vh - 250px)', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-3" style={{ color: '#7f8c8d' }}>Cargando pedidos...</p>
                        </div>
                    ) : (
                        <>
                            {/* ========== PESTAÑA RESUMEN ========== */}
                            {activeTab === 'resumen' && (
                                pedidos.length === 0 ? (
                                    <div style={{
                                        margin: '20px',
                                        padding: '16px',
                                        backgroundColor: '#e3f2fd',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                                        <span style={{ color: '#1976d2', fontSize: '14px' }}>
                                            No hay pedidos registrados para {nombreVendedor} en la fecha {fechaSeleccionada} ({dia}).
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ padding: '16px 24px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase' }}>PRODUCTO</th>
                                                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', width: '100px' }}>CANTIDAD</th>
                                                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', width: '100px' }}>PRECIO</th>
                                                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', width: '120px' }}>TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pedidos.map((producto, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '10px 8px', color: '#7f8c8d', fontSize: '14px' }}>{producto.nombre}</td>
                                                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#2c3e50', fontSize: '14px' }}><strong>{producto.cantidad}</strong> und</td>
                                                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#7f8c8d', fontSize: '14px' }}>${formatCurrency(producto.precio)}</td>
                                                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>${formatCurrency(producto.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Total Resumen */}
                                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600', color: '#2c3e50' }}>TOTAL:</span>
                                            <div style={{ display: 'flex', gap: '40px' }}>
                                                <span style={{ color: '#2196f3', fontWeight: '700', fontSize: '16px' }}>{totalUnidades} und</span>
                                                <span style={{ color: '#4caf50', fontWeight: '700', fontSize: '18px' }}>${formatCurrency(totalValor)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ========== PESTAÑA PEDIDOS CLIENTES ========== */}
                            {activeTab === 'clientes' && (
                                pedidosClientes.length === 0 ? (
                                    <div style={{
                                        margin: '20px',
                                        padding: '16px',
                                        backgroundColor: '#e3f2fd',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                                        <span style={{ color: '#1976d2', fontSize: '14px' }}>
                                            No hay pedidos de clientes para esta fecha.
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ padding: '16px 24px' }}>
                                        {pedidosClientes.map((pedido, index) => (
                                            <div key={pedido.id} style={{ marginBottom: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                                {/* Header del pedido cliente */}
                                                <div
                                                    style={{
                                                        padding: '12px 16px',
                                                        backgroundColor: '#f8f9fa',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ fontSize: '20px' }}>👤</span>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '15px' }}>
                                                                {pedido.cliente}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                                                {pedido.numeroPedido} • {pedido.detalles.length} productos
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '17px' }}>
                                                            ${formatCurrency(pedido.total)}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {/* Botón Ver Detalle - Azul */}
                                                            <button
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: '8px',
                                                                    color: '#3b82f6',
                                                                    fontSize: '18px',
                                                                    borderRadius: '50%',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                title="Ver detalle"
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <i className={`bi ${pedidoExpandido === pedido.id ? 'bi-chevron-up' : 'bi-eye'}`}></i>
                                                            </button>
                                                            {/* Botón Editar - Amarillo */}
                                                            <button
                                                                onClick={(e) => handleGestionarPedido(e, pedido)}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: '8px',
                                                                    color: '#eab308',
                                                                    fontSize: '18px',
                                                                    borderRadius: '50%',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                title="Editar pedido"
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefce8'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            {/* Botón Anular - Rojo */}
                                                            <button
                                                                onClick={(e) => handleAnularClick(e, pedido)}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: '8px',
                                                                    color: '#ef4444',
                                                                    fontSize: '18px',
                                                                    borderRadius: '50%',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                title="Anular pedido"
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                            {/* 🆕 Selector de Método de Pago */}
                                                            <select
                                                                value={pedido.metodo_pago || 'EFECTIVO'}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCambiarMetodoPago(pedido.id, e.target.value);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    marginLeft: '8px',
                                                                    padding: '4px 8px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #e0e0e0',
                                                                    backgroundColor:
                                                                        pedido.metodo_pago === 'EFECTIVO' ? '#dcfce7' :
                                                                            pedido.metodo_pago === 'NEQUI' ? '#fce7f3' :
                                                                                pedido.metodo_pago === 'DAVIPLATA' ? '#fee2e2' :
                                                                                    '#f3f4f6',
                                                                    color:
                                                                        pedido.metodo_pago === 'EFECTIVO' ? '#166534' :
                                                                            pedido.metodo_pago === 'NEQUI' ? '#9d174d' :
                                                                                pedido.metodo_pago === 'DAVIPLATA' ? '#dc2626' :
                                                                                    '#6b7280',
                                                                    cursor: 'pointer',
                                                                    minWidth: '100px'
                                                                }}
                                                            >
                                                                <option value="EFECTIVO">Efectivo</option>
                                                                <option value="NEQUI">Nequi</option>
                                                                <option value="DAVIPLATA">Daviplata</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detalle expandido del pedido */}
                                                {pedidoExpandido === pedido.id && (
                                                    <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                                    <th style={{ padding: '6px', textAlign: 'left', fontSize: '11px', color: '#7f8c8d' }}>Producto</th>
                                                                    <th style={{ padding: '6px', textAlign: 'center', fontSize: '11px', color: '#7f8c8d', width: '80px' }}>Cant.</th>
                                                                    <th style={{ padding: '6px', textAlign: 'right', fontSize: '11px', color: '#7f8c8d', width: '80px' }}>Precio</th>
                                                                    <th style={{ padding: '6px', textAlign: 'right', fontSize: '11px', color: '#7f8c8d', width: '90px' }}>Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {pedido.detalles.map((detalle, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                                        <td style={{ padding: '8px 6px', fontSize: '13px', color: '#2c3e50' }}>{detalle.producto_nombre}</td>
                                                                        <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '13px' }}>{detalle.cantidad}</td>
                                                                        <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '13px', color: '#7f8c8d' }}>${formatCurrency(detalle.precio_unitario)}</td>
                                                                        <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>${formatCurrency(detalle.cantidad * detalle.precio_unitario)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Total Clientes - Franja verde estilo Tailwind */}
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '16px',
                                            backgroundColor: '#f0fdf4',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid #dcfce7'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    backgroundColor: '#16a34a',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                }}>
                                                    <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                                                </div>
                                                <span style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>
                                                    {pedidosClientes.length} pedido(s) de clientes
                                                </span>
                                            </div>
                                            <span style={{ color: '#166534', fontWeight: '700', fontSize: '22px', letterSpacing: '-0.5px' }}>
                                                ${formatCurrency(pedidosClientes.reduce((sum, p) => sum + p.total, 0))}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer style={{
                    borderTop: '1px solid #e0e0e0',
                    padding: '8px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <Button
                        variant="light"
                        onClick={() => setShowModal(false)}
                        style={{
                            padding: '6px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: '#e9ecef',
                            border: 'none',
                            color: '#495057',
                            borderRadius: '6px'
                        }}
                    >
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de confirmación de anulación */}
            <Modal
                show={showAnularModal}
                onHide={() => {
                    setShowAnularModal(false);
                    setPedidoAAnular(null);
                }}
                centered
                size="sm"
            >
                <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white', padding: '12px 16px' }}>
                    <Modal.Title style={{ fontSize: '16px' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Anular Pedido
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '16px' }}>
                    <p style={{ marginBottom: '8px' }}>
                        <strong>¿Anular pedido {pedidoAAnular?.numeroPedido}?</strong>
                    </p>
                    <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>
                        Cliente: {pedidoAAnular?.cliente}<br />
                        Total: ${formatCurrency(pedidoAAnular?.total || 0)}
                    </p>
                    <div style={{ fontSize: '12px', color: '#dc3545', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '6px' }}>
                        ⚠️ Esta acción revertirá planeación y totales
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ padding: '12px 16px' }}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAnularModal(false)}
                        disabled={anulando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={confirmarAnulacion}
                        disabled={anulando}
                    >
                        {anulando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1"></span>
                                Anulando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-x-circle me-1"></i>
                                Anular
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BotonVerPedidos;

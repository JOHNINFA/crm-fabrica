import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Modal, Button } from 'react-bootstrap';
import { pedidoService } from '../services/api';
import { ModalProvider } from '../context/ModalContext';
import { CajeroPedidosProvider } from '../context/CajeroPedidosContext';
import Sidebar from '../components/Pedidos/Sidebar';
import Topbar from '../components/Pedidos/Topbar';
import TicketPreviewModal from '../components/Print/TicketPreviewModal';
import usePageTitle from '../hooks/usePageTitle';

function InformePedidosContent() {
    usePageTitle('Informe de Pedidos');
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(210);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState(null); // Datos para imprimir

    // Estados para el modal de detalle
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPedido, setSelectedPedido] = useState(null); // Pedido seleccionado para ver detalle

    // Estados para el modal de anulación
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState('Anulado desde gestión de pedidos');
    const [anulando, setAnulando] = useState(false);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            const data = await pedidoService.getAll();
            console.log('📋 Pedidos cargados:', data);
            setPedidos(data || []);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (fecha) => {
        if (!fecha) return '-';
        if (typeof fecha === 'string' && fecha.includes('-')) {
            const [year, month, day] = fecha.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
        }
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    };

    const formatCurrency = (amount) => {
        return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleRowClick = (pedido) => {
        setSelectedPedido(pedido);
        setShowDetailModal(true);
    };

    const handlePrint = (pedido) => {
        // Preparar datos para el ticket
        const data = {
            tipo: 'pedido',
            numero: pedido.numero_pedido,
            fecha: pedido.fecha,
            cliente: pedido.destinatario,
            vendedor: pedido.vendedor,
            items: pedido.detalles || [],
            subtotal: pedido.subtotal || pedido.total,
            impuestos: pedido.impuestos || 0,
            descuentos: pedido.descuentos || 0,
            total: pedido.total,
            direccionEntrega: pedido.direccion_entrega,
            telefonoContacto: pedido.telefono_contacto,
            fechaEntrega: pedido.fecha_entrega,
            tipoPedido: pedido.tipo_remision || pedido.tipo_pedido,
            transportadora: pedido.transportadora,
            nota: pedido.nota
        };

        setTicketData(data);
        setShowTicketModal(true);
    };

    const handleAnular = (pedido) => {
        // Abrir modal de confirmación
        setShowAnularModal(true);
    };

    const confirmarAnulacion = async () => {
        if (!motivoAnulacion || motivoAnulacion.trim() === '') {
            alert('Debe ingresar un motivo para anular el pedido');
            return;
        }

        setAnulando(true);

        try {
            console.log('🔴 Anulando pedido:', selectedPedido.id);
            const result = await pedidoService.anularPedido(selectedPedido.id, motivoAnulacion);

            if (result.success) {
                alert(`✅ ${result.message}`);

                // Actualizar el pedido en la lista local
                setPedidos(prevPedidos =>
                    prevPedidos.map(p =>
                        p.id === selectedPedido.id ? { ...p, estado: 'ANULADA' } : p
                    )
                );

                // Actualizar el pedido seleccionado
                setSelectedPedido({ ...selectedPedido, estado: 'ANULADA' });

                // Cerrar modal de anulación
                setShowAnularModal(false);
                setMotivoAnulacion('Anulado desde gestión de pedidos');

                // Recargar pedidos desde el servidor
                await cargarPedidos();
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

    return (
        <div className="d-flex">
            <style>
                {`
                    .table-row-hover:hover {
                        background-color: #f8f9fa !important;
                        transition: background-color 0.2s ease;
                    }
                `}
            </style>
            <Sidebar onWidthChange={setSidebarWidth} />
            <div
                className="flex-grow-1"
                style={{
                    marginLeft: sidebarWidth,
                    minHeight: '100vh',
                    background: '#f7f7fa',
                    transition: 'margin-left 0.3s ease'
                }}
            >
                <Topbar />
                <Container fluid className="p-3">
                    <Row className="mb-3">
                        <Col className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0" style={{ fontSize: '16px', fontWeight: 'normal' }}>
                                Informe de Pedidos General
                            </h6>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => window.location.href = '/remisiones'}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Regresar a Pedidos
                            </button>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Card className="border shadow-sm rounded-2">
                                <Card.Body className="p-0">
                                    {loading ? (
                                        <div className="text-center p-4">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                            <p className="mt-2">Cargando pedidos...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-3 border-bottom">
                                                <h6 className="mb-0">Pedidos Registrados</h6>
                                            </div>
                                            <div style={{ overflowX: 'auto' }}>
                                                <Table hover className="mb-0" style={{ fontSize: '12px' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>N° Pedido</th>
                                                            <th>Fecha</th>
                                                            <th>Destinatario</th>
                                                            <th>Vendedor</th>
                                                            <th>Dirección</th>
                                                            <th>Teléfono</th>
                                                            <th className="text-center">Fecha Entrega</th>
                                                            <th>Estado</th>
                                                            <th>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pedidos.length > 0 ? (
                                                            pedidos.map((pedido) => (
                                                                <tr
                                                                    key={pedido.id}
                                                                    className="table-row-hover"
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => handleRowClick(pedido)}
                                                                >
                                                                    <td><strong>{pedido.numero_pedido}</strong></td>
                                                                    <td>{formatFecha(pedido.fecha)}</td>
                                                                    <td>{pedido.destinatario}</td>
                                                                    <td>{pedido.vendedor}</td>
                                                                    <td>{pedido.direccion_entrega || '-'}</td>
                                                                    <td>{pedido.telefono_contacto || '-'}</td>
                                                                    <td className="text-center">{formatFecha(pedido.fecha_entrega)}</td>
                                                                    <td>
                                                                        <Badge bg={
                                                                            pedido.estado === 'PENDIENTE' ? 'warning' :
                                                                                pedido.estado === 'ENTREGADA' ? 'success' :
                                                                                    pedido.estado === 'EN_TRANSITO' ? 'info' :
                                                                                        pedido.estado === 'ANULADA' ? 'danger' :
                                                                                            'secondary'
                                                                        }>
                                                                            {pedido.estado}
                                                                        </Badge>
                                                                    </td>
                                                                    <td><strong>{formatCurrency(pedido.total)}</strong></td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="9" className="text-center p-4">
                                                                    No hay pedidos registrados
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                            <div className="p-3 border-top bg-light">
                                                <Row>
                                                    <Col md={6}>
                                                        <small className="text-muted">
                                                            <strong>Cantidad de Pedidos:</strong> {pedidos.length}
                                                        </small>
                                                    </Col>
                                                    <Col md={6} className="text-end">
                                                        <small className="text-muted">
                                                            <strong>Total:</strong> {formatCurrency(pedidos.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0))}
                                                        </small>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modal de Detalle de Pedido */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-receipt me-2"></i>
                        Detalle de Pedido - {selectedPedido?.numero_pedido || 'N/A'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem' }}>
                    {selectedPedido && (
                        <>
                            {/* Alerta si el pedido está anulado */}
                            {selectedPedido.estado === 'ANULADA' && (
                                <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                                    <div>
                                        <strong>Pedido Anulado</strong>
                                        <p className="mb-0 small">Este pedido ha sido anulado y no se puede modificar.</p>
                                    </div>
                                </div>
                            )}

                            {/* Información General */}
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Header style={{ backgroundColor: '#0c2c53', color: 'white' }}>
                                            <strong><i className="bi bi-info-circle me-2"></i>Información General</strong>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong># Pedido:</strong> {selectedPedido.numero_pedido}</p>
                                            <p><strong>Cliente:</strong> {selectedPedido.destinatario}</p>
                                            <p><strong>Vendedor:</strong> {selectedPedido.vendedor}</p>
                                            <p><strong>Fecha:</strong> {formatFecha(selectedPedido.fecha)}</p>
                                            <p><strong>Entrega:</strong> {formatFecha(selectedPedido.fecha_entrega)}</p>
                                            <p><strong>Estado:</strong>
                                                <Badge bg={
                                                    selectedPedido.estado === 'ANULADA' ? 'danger' :
                                                        selectedPedido.estado === 'ENTREGADA' ? 'success' :
                                                            selectedPedido.estado === 'EN_TRANSITO' ? 'info' : 'warning'
                                                } className="ms-2">
                                                    {selectedPedido.estado}
                                                </Badge>
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Header className="bg-success text-white">
                                            <strong><i className="bi bi-calculator me-2"></i>Totales</strong>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Subtotal:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(selectedPedido.subtotal || selectedPedido.total || 0))}</span>
                                            </p>
                                            <p><strong>Impuestos:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(selectedPedido.impuestos || 0))}</span>
                                            </p>
                                            <hr />
                                            <p className="fw-bold"><strong>Total:</strong>
                                                <span className="float-end text-success">{formatCurrency(parseFloat(selectedPedido.total || 0))}</span>
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Información de Entrega */}
                            <Card className="mb-3 border-0">
                                <Card.Header className="bg-secondary text-white">
                                    <strong><i className="bi bi-truck me-2"></i>Datos de Entrega</strong>
                                </Card.Header>
                                <Card.Body className="bg-light">
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Dirección:</strong> {selectedPedido.direccion_entrega || 'N/A'}</p>
                                            <p><strong>Teléfono:</strong> {selectedPedido.telefono_contacto || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Transportadora:</strong> {selectedPedido.transportadora || 'N/A'}</p>
                                            <p><strong>Tipo:</strong> {selectedPedido.tipo_remision || selectedPedido.tipo_pedido || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Productos */}
                            <Card className="border-0">
                                <Card.Header style={{ backgroundColor: 'transparent', border: 'none', padding: '0.5rem 0' }}>
                                    <strong style={{ color: '#000000', fontSize: '16px' }}>Productos del Pedido</strong>
                                </Card.Header>
                                <Card.Body>
                                    {selectedPedido.detalles && selectedPedido.detalles.length > 0 ? (
                                        <Table bordered hover size="sm" responsive style={{ marginBottom: 0 }}>
                                            <thead style={{ backgroundColor: '#e9ecef' }}>
                                                <tr>
                                                    <th style={{ minWidth: '200px' }}>PRODUCTO</th>
                                                    <th className="text-center">CANT</th>
                                                    <th className="text-end">PRECIO</th>
                                                    <th className="text-end">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPedido.detalles.map((detalle, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{detalle.producto_nombre || detalle.name}</strong></td>
                                                        <td className="text-center">{detalle.cantidad || detalle.qty}</td>
                                                        <td className="text-end">{formatCurrency(parseFloat(detalle.precio_unitario || detalle.price || 0))}</td>
                                                        <td className="text-end fw-bold text-success">
                                                            {formatCurrency(parseFloat(detalle.subtotal || (detalle.qty * detalle.price) || 0))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center text-muted p-4">
                                            <p>No hay detalles de productos disponibles</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Nota */}
                            {selectedPedido.nota && (
                                <Card className="mt-3 border-0">
                                    <Card.Header className="bg-warning">
                                        <strong><i className="bi bi-sticky me-2"></i>Nota</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{selectedPedido.nota}</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between w-100 align-items-center">
                        <div>
                            <Button
                                variant="primary"
                                onClick={() => handlePrint(selectedPedido)}
                                style={{ backgroundColor: '#0c2c53', borderColor: '#0c2c53' }}
                            >
                                <i className="bi bi-printer me-2"></i>
                                Imprimir
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            {selectedPedido?.estado !== 'ANULADA' ? (
                                <Button
                                    variant="danger"
                                    onClick={() => handleAnular(selectedPedido)}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Anular Pedido
                                </Button>
                            ) : (
                                <Button
                                    variant="outline-secondary"
                                    disabled
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Pedido Anulado
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Modal de impresión (invisible pero funcional) */}
            {ticketData && (
                <TicketPreviewModal
                    show={showTicketModal}
                    onClose={() => setShowTicketModal(false)}
                    ticketData={ticketData}
                    autoPrint={true}
                />
            )}

            {/* Modal de Confirmación de Anulación */}
            <Modal
                show={showAnularModal}
                onHide={() => {
                    setShowAnularModal(false);
                    setMotivoAnulacion('Anulado desde gestión de pedidos');
                }}
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
                    <Modal.Title>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Confirmar Anulación de Pedido
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex align-items-start p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <i className="bi bi-info-circle-fill me-2 mt-1" style={{ fontSize: '1.2rem', color: '#6c757d' }}></i>
                        <div>
                            <strong style={{ color: '#212529' }}>¿Está seguro que desea anular el pedido {selectedPedido?.numero_pedido}?</strong>
                            <p className="mb-0 mt-2 small" style={{ color: '#495057' }}>Esta acción:</p>
                            <ul className="small mb-0" style={{ color: '#495057' }}>
                                <li>Cambiará el estado del pedido a ANULADA</li>
                                <li>Revertirá las cantidades en Planeación</li>
                                <li>Revertirá los totales en Cargue</li>
                            </ul>
                            <p className="mb-0 mt-2 small" style={{ color: '#dc3545' }}><strong>Esta acción NO se puede deshacer.</strong></p>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="motivoAnulacion" className="form-label">
                            <strong>Motivo de la anulación:</strong> <span className="text-danger">*</span>
                        </label>
                        <textarea
                            id="motivoAnulacion"
                            className="form-control"
                            rows="3"
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            placeholder="Ingrese el motivo de la anulación..."
                            disabled={anulando}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowAnularModal(false);
                            setMotivoAnulacion('Anulado desde gestión de pedidos');
                        }}
                        disabled={anulando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmarAnulacion}
                        disabled={anulando || !motivoAnulacion.trim()}
                    >
                        {anulando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Anulando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-x-circle me-2"></i>
                                Confirmar Anulación
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default function InformePedidosScreen() {
    return (
        <CajeroPedidosProvider>
            <ModalProvider>
                <InformePedidosContent />
            </ModalProvider>
        </CajeroPedidosProvider>
    );
}

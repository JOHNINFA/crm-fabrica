import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { pedidoService } from '../services/api';
import { ModalProvider } from '../context/ModalContext';
import { ProductProvider } from '../context/ProductContext';
import { CajeroPedidosProvider } from '../context/CajeroPedidosContext';
import Sidebar from '../components/Pedidos/Sidebar';
import Topbar from '../components/Pedidos/Topbar';

function InformePedidosContent() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(210);

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
        // Si la fecha viene en formato YYYY-MM-DD, parsearla directamente sin conversión de zona horaria
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
                        <Col>
                            <h6 className="mb-2" style={{ fontSize: '16px', fontWeight: 'normal' }}>
                                Informe de Pedidos General
                            </h6>
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
                                                            <th>Fecha Entrega</th>
                                                            <th>Tipo</th>
                                                            <th>Estado</th>
                                                            <th>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pedidos.length > 0 ? (
                                                            pedidos.map((pedido) => (
                                                                <tr key={pedido.id} className="table-row-hover" style={{ cursor: 'pointer' }}>
                                                                    <td><strong>{pedido.numero_pedido}</strong></td>
                                                                    <td>{formatFecha(pedido.fecha)}</td>
                                                                    <td>{pedido.destinatario}</td>
                                                                    <td>{pedido.vendedor}</td>
                                                                    <td>{pedido.direccion_entrega || '-'}</td>
                                                                    <td>{pedido.telefono_contacto || '-'}</td>
                                                                    <td>{formatFecha(pedido.fecha_entrega)}</td>
                                                                    <td>
                                                                        <Badge bg="info">
                                                                            {pedido.tipo_pedido}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        <Badge bg={
                                                                            pedido.estado === 'PENDIENTE' ? 'warning' :
                                                                                pedido.estado === 'ENTREGADO' ? 'success' :
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
                                                                <td colSpan="10" className="text-center p-4">
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
        </div>
    );
}

export default function InformePedidosScreen() {
    return (
        <CajeroPedidosProvider>
            <ProductProvider>
                <ModalProvider>
                    <InformePedidosContent />
                </ModalProvider>
            </ProductProvider>
        </CajeroPedidosProvider>
    );
}

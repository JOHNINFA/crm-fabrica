import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { remisionService } from '../services/api';
import { ModalProvider } from '../context/ModalContext';
import { ProductProvider } from '../context/ProductContext';
import { CajeroRemisionesProvider } from '../context/CajeroRemisionesContext';
import Sidebar from '../components/Remisiones/Sidebar';
import Topbar from '../components/Remisiones/Topbar';

function InformeRemisionesContent() {
    const [remisiones, setRemisiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(210);

    useEffect(() => {
        cargarRemisiones();
    }, []);

    const cargarRemisiones = async () => {
        try {
            const data = await remisionService.getAll();
            console.log('📋 Remisiones cargadas:', data);
            setRemisiones(data || []);
        } catch (error) {
            console.error('Error cargando remisiones:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (fecha) => {
        if (!fecha) return '-';
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
                                                        {remisiones.length > 0 ? (
                                                            remisiones.map((remision) => (
                                                                <tr key={remision.id} className="table-row-hover" style={{ cursor: 'pointer' }}>
                                                                    <td><strong>{remision.numero_remision}</strong></td>
                                                                    <td>{formatFecha(remision.fecha)}</td>
                                                                    <td>{remision.destinatario}</td>
                                                                    <td>{remision.vendedor}</td>
                                                                    <td>{remision.direccion_entrega || '-'}</td>
                                                                    <td>{remision.telefono_contacto || '-'}</td>
                                                                    <td>{formatFecha(remision.fecha_entrega)}</td>
                                                                    <td>
                                                                        <Badge bg="info">
                                                                            {remision.tipo_remision}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        <Badge bg={
                                                                            remision.estado === 'PENDIENTE' ? 'warning' :
                                                                            remision.estado === 'ENTREGADO' ? 'success' :
                                                                            'secondary'
                                                                        }>
                                                                            {remision.estado}
                                                                        </Badge>
                                                                    </td>
                                                                    <td><strong>{formatCurrency(remision.total)}</strong></td>
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
                                                            <strong>Cantidad de Pedidos:</strong> {remisiones.length}
                                                        </small>
                                                    </Col>
                                                    <Col md={6} className="text-end">
                                                        <small className="text-muted">
                                                            <strong>Total:</strong> {formatCurrency(remisiones.reduce((sum, r) => sum + (r.total || 0), 0))}
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

export default function InformeRemisionesScreen() {
    return (
        <CajeroRemisionesProvider>
            <ProductProvider>
                <ModalProvider>
                    <InformeRemisionesContent />
                </ModalProvider>
            </ProductProvider>
        </CajeroRemisionesProvider>
    );
}

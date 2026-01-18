import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import '../ReportesAvanzadosScreen.css';

const ReportePedidosRuta = ({ onVolver }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [vendedorId, setVendedorId] = useState('');
    const [estado, setEstado] = useState('todos');
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    const handleConsultar = async () => {
        if (!fechaInicio || !fechaFin) {
            setError('Por favor selecciona el rango de fechas');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            let url = `${API_URL}/reportes/pedidos-ruta/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
            if (vendedorId) url += `&vendedor=${vendedorId}`;
            if (estado !== 'todos') url += `&estado=${estado}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            setPedidos(data.pedidos || []);
        } catch (err) {
            console.error('Error consultando pedidos:', err);
            setError('Error al consultar los datos.');
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'pendiente': 'warning',
            'en_proceso': 'info',
            'entregado': 'success',
            'cancelado': 'danger'
        };
        return badges[estado] || 'secondary';
    };

    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="reportes-screen">
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-signpost-2 me-2" style={{ fontSize: '1.5rem' }}></i>
                            Pedidos por Ruta
                        </h5>
                    </div>
                </Container>
            </div>

            <Container className="py-4">
                <div className="mb-4">
                    <a href="#" onClick={(e) => { e.preventDefault(); onVolver(); }} className="link-volver">
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver al Menú
                    </a>
                </div>

                {/* Filtros */}
                <div className="card-wrapper mb-4">
                    <Row className="g-2 align-items-end p-3">
                        <Col md={3}>
                            <Form.Label className="mb-1">Fecha Inicio</Form.Label>
                            <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} size="sm" />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="mb-1">Fecha Fin</Form.Label>
                            <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} size="sm" />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="mb-1">Vendedor (ID)</Form.Label>
                            <Form.Control type="text" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} placeholder="Ej: ID1" size="sm" />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="mb-1">Estado</Form.Label>
                            <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)} size="sm">
                                <option value="todos">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="primary" size="sm" className="w-100" onClick={handleConsultar} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" style={{ width: '14px', height: '14px' }} />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-search me-2"></i>
                                        Consultar
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>
                </div>

                {error && (
                    <Alert variant="warning" className="mb-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* Resultados */}
                {searched && !loading && pedidos.length > 0 && (
                    <div className="card-wrapper">
                        <div className="mb-3 px-3 pt-3">
                            <h6 className="mb-0"><strong>Pedidos Encontrados</strong></h6>
                            <span className="text-muted">{pedidos.length} pedidos</span>
                        </div>

                        <div className="table-responsive">
                            <Table hover className="table-modern">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Vendedor/Ruta</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th className="text-end">Total</th>
                                        <th className="text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map((pedido) => (
                                        <tr key={pedido.id}>
                                            <td><strong>#{pedido.id}</strong></td>
                                            <td>
                                                <div>
                                                    <strong>{pedido.vendedor_nombre}</strong>
                                                    <br />
                                                    <small className="text-muted">{pedido.ruta || 'Sin ruta'}</small>
                                                </div>
                                            </td>
                                            <td>{pedido.cliente_nombre}</td>
                                            <td>{new Date(pedido.fecha).toLocaleDateString('es-CO')}</td>
                                            <td className="text-end"><strong>{formatMoney(pedido.total)}</strong></td>
                                            <td className="text-center">
                                                <Badge bg={getEstadoBadge(pedido.estado)}>
                                                    {pedido.estado}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {!loading && pedidos.length === 0 && searched && (
                    <div className="empty-state">
                        <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">No se encontraron pedidos</p>
                    </div>
                )}

                {!searched && (
                    <div className="empty-state">
                        <i className="bi bi-calendar-range text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">Selecciona un rango de fechas para consultar</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReportePedidosRuta;

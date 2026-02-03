import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../ReportesAvanzadosScreen.css';

const ReporteVentasPOS = ({ onVolver }) => {
    const [periodo, setPeriodo] = useState('dia');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [usuarioActual, setUsuarioActual] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || '/api';

    useEffect(() => {
        // Obtener usuario logueado con múltiples fallbacks
        let nombre = 'Usuario';

        try {
            // 1. Intentar cajero POS
            const cajero = localStorage.getItem('cajero_logueado');
            if (cajero) {
                const c = JSON.parse(cajero);
                if (c.nombre) nombre = c.nombre;
            } else {
                // 2. Intentar usuario CRM
                const usuario = localStorage.getItem('crm_usuario');
                if (usuario) {
                    const u = JSON.parse(usuario);
                    if (u.nombre) nombre = u.nombre;
                } else {
                    // 3. Fallback legacy
                    const legacy = localStorage.getItem('usuario');
                    if (legacy) nombre = legacy;
                }
            }
        } catch (e) {
            console.error('Error leyendo usuario:', e);
        }

        setUsuarioActual(nombre);
    }, []);

    const handleConsultar = async () => {
        if (!fechaInicio || !fechaFin) {
            setError('Selecciona fechas');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let queryParams = `periodo=${periodo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

            // Si NO es admin, filtrar por el usuario actual. Si es admin, mostrar todo.
            const esAdmin = usuarioActual && (
                usuarioActual.toUpperCase().includes('ADMIN') ||
                usuarioActual.toUpperCase().includes('GERENTE') ||
                usuarioActual.toUpperCase().includes('SUPER')
            );

            if (!esAdmin && usuarioActual) {
                queryParams += `&cajero=${usuarioActual}`;
            }

            const response = await fetch(
                `${API_URL}/reportes/ventas-pos/?${queryParams}`
            );

            if (!response.ok) throw new Error('Error al consultar');

            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar datos');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="reportes-screen">
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-pc-display me-2" style={{ fontSize: '1.5rem' }}></i>
                            Reporte de Ventas POS - {usuarioActual}
                        </h5>
                    </div>
                </Container>
            </div>

            <Container className="py-4">
                <div className="mb-3">
                    <a href="#" onClick={(e) => { e.preventDefault(); onVolver(); }} className="link-volver">
                        <i className="bi bi-arrow-left me-1"></i> Volver
                    </a>
                </div>

                {/* Filtros */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="g-2 align-items-end">
                            <Col md={2}>
                                <Form.Label className="mb-1"><strong>Periodo</strong></Form.Label>
                                <Form.Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} size="sm">
                                    <option value="dia">Día</option>
                                    <option value="semana">Semana</option>
                                    <option value="mes">Mes</option>
                                    <option value="año">Año</option>
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Label className="mb-1"><strong>Desde</strong></Form.Label>
                                <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} size="sm" />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="mb-1"><strong>Hasta</strong></Form.Label>
                                <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} size="sm" />
                            </Col>
                            <Col md={4}>
                                <Button variant="primary" className="w-100" onClick={handleConsultar} disabled={loading}>
                                    {loading ? <><Spinner animation="border" size="sm" className="me-2" /> Cargando...</> : <><i className="bi bi-search me-2"></i> Consultar</>}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {error && <Alert variant="danger"><i className="bi bi-exclamation-triangle me-2"></i>{error}</Alert>}

                {data && !loading && (
                    <>
                        {/* Métricas */}
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Card className="text-center border-primary shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-cart-check text-primary" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Total Ventas</h6>
                                        <h3 className="mb-0 text-primary">{data.total_ventas || 0}</h3>
                                        <small className="text-muted">Transacciones</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-success shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-currency-dollar text-success" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Monto Total</h6>
                                        <h3 className="mb-0 text-success">{formatMoney(data.monto_total || 0)}</h3>
                                        <small className="text-muted">Ingresos</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-info shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-box text-info" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Productos Vendidos</h6>
                                        <h3 className="mb-0 text-info">{data.total_productos || 0}</h3>
                                        <small className="text-muted">Unidades</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>



                        {/* Tabla de ventas */}
                        {data.ventas && data.ventas.length > 0 && (
                            <Card className="shadow-sm">
                                <Card.Header className="bg-dark text-white">
                                    <strong><i className="bi bi-list-ul me-2"></i>Detalle de Ventas</strong>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <Table hover className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Fecha</th>
                                                    <th>Cliente</th>
                                                    <th className="text-center">Productos</th>
                                                    <th className="text-end">Total</th>
                                                    <th className="text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.ventas.map((venta, idx) => (
                                                    <tr key={venta.id}>
                                                        <td><strong>{idx + 1}</strong></td>
                                                        <td>{new Date(venta.fecha).toLocaleDateString('es-CO')}</td>
                                                        <td>{venta.cliente || 'Cliente General'}</td>
                                                        <td className="text-center"><Badge bg="info">{venta.productos}</Badge></td>
                                                        <td className="text-end text-success"><strong>{formatMoney(venta.total)}</strong></td>
                                                        <td className="text-center">
                                                            <Badge bg={venta.estado === 'completada' ? 'success' : 'warning'}>
                                                                {venta.estado}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </>
                )}

                {!data && !loading && (
                    <div className="text-center py-5">
                        <i className="bi bi-calendar-range text-muted" style={{ fontSize: '4rem' }}></i>
                        <h5 className="text-muted mt-3">Selecciona un periodo para ver tus ventas en POS</h5>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReporteVentasPOS;

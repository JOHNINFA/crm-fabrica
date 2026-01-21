import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../ReportesAvanzadosScreen.css';
import './DashboardEjecutivo.css';

const DashboardEjecutivo = ({ onVolver }) => {
    const [periodo, setPeriodo] = useState('dia');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#a4de6c'];

    const handleConsultar = async () => {
        if (!fechaInicio || !fechaFin) {
            setError('Selecciona fechas');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${API_URL}/dashboard-ejecutivo/?periodo=${periodo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
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
                            <i className="bi bi-graph-up-arrow me-2" style={{ fontSize: '1.5rem' }}></i>
                            Dashboard Ejecutivo - Ventas desde App Móvil
                        </h5>
                    </div>
                </Container>
            </div>

            <Container fluid className="py-4">
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
                        {/* MÉTRICAS GENERALES */}
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="text-center border-primary shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-cart-check text-primary" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Ventas Totales</h6>
                                        <h3 className="mb-0 text-primary">{data.totales.ventas_total}</h3>
                                        <small className="text-success">{formatMoney(data.totales.ventas_monto_total)}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-warning shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-arrow-return-left text-warning" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Devoluciones</h6>
                                        <h3 className="mb-0 text-warning">{data.totales.devueltas_total}</h3>
                                        <small className="text-danger">{formatMoney(data.totales.devueltas_monto_total)}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-danger shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Vencidas</h6>
                                        <h3 className="mb-0 text-danger">{data.totales.vencidas_total}</h3>
                                        <small className="text-danger">{formatMoney(data.totales.vencidas_monto_total)}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-success shadow-sm">
                                    <Card.Body>
                                        <i className="bi bi-trophy text-success" style={{ fontSize: '2rem' }}></i>
                                        <h6 className="text-muted mt-2 mb-1">Efectividad Promedio</h6>
                                        <h3 className="mb-0 text-success">
                                            {data.vendedores.length > 0 ?
                                                (data.vendedores.reduce((sum, v) => sum + v.efectividad, 0) / data.vendedores.length).toFixed(1)
                                                : 0}%
                                        </h3>
                                        <small className="text-muted">General</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* GRÁFICOS ELIMINADOS A PETICIÓN */}

                        {/* TABLA DETALLADA POR VENDEDOR */}
                        <Card className="shadow-sm">
                            <Card.Header className="bg-dark text-white">
                                <strong><i className="bi bi-people me-2"></i>Detalle por Vendedor</strong>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Vendedor</th>
                                                <th className="text-center">Vendió</th>
                                                <th className="text-end">Monto Venta</th>
                                                <th className="text-center">Devueltas</th>
                                                <th className="text-end">Monto Dev.</th>
                                                <th className="text-center">Vencidas</th>
                                                <th className="text-end">Monto Venc.</th>
                                                <th className="text-center">% Dev.</th>
                                                <th className="text-center">Efectividad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.vendedores.map((v, idx) => (
                                                <tr key={v.id}>
                                                    <td><strong>{idx + 1}</strong></td>
                                                    <td>
                                                        <strong>{v.nombre}</strong>
                                                        <br />
                                                        <small className="text-muted">{v.id}</small>
                                                    </td>
                                                    <td className="text-center"><Badge bg="primary">{v.ventas_count}</Badge></td>
                                                    <td className="text-end text-success"><strong>{formatMoney(v.ventas_monto)}</strong></td>
                                                    <td className="text-center"><Badge bg="warning">{v.devueltas_count}</Badge></td>
                                                    <td className="text-end text-warning">{formatMoney(v.devueltas_monto)}</td>
                                                    <td className="text-center"><Badge bg="danger">{v.vencidas_count}</Badge></td>
                                                    <td className="text-end text-danger">{formatMoney(v.vencidas_monto)}</td>
                                                    <td className="text-center">{v.porcentaje_devolucion}%</td>
                                                    <td className="text-center">
                                                        <Badge bg={v.efectividad >= 95 ? 'success' : v.efectividad >= 85 ? 'warning' : 'danger'}>
                                                            {v.efectividad}%
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </>
                )}

                {!data && !loading && (
                    <div className="text-center py-5">
                        <i className="bi bi-calendar-range text-muted" style={{ fontSize: '4rem' }}></i>
                        <h5 className="text-muted mt-3">Selecciona un periodo para ver el dashboard</h5>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default DashboardEjecutivo;

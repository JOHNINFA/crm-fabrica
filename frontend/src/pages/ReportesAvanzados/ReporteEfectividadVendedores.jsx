import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Alert, Spinner, Card } from 'react-bootstrap';
import './ReporteEfectividadVendedores.css';

const ReporteEfectividadVendedores = ({ onVolver }) => {
    const [periodo, setPeriodo] = useState('mes'); // dia, semana, mes, año
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [vendedores, setVendedores] = useState([]);
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
            const response = await fetch(
                `${API_URL}/reportes/efectividad-vendedores/?periodo=${periodo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setVendedores(data.vendedores || []);
        } catch (err) {
            console.error('Error consultando efectividad:', err);
            setError('Error al consultar los datos. Verifica que el endpoint esté disponible.');
            setVendedores([]);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotales = () => {
        if (vendedores.length === 0) return null;

        return {
            vendio: vendedores.reduce((sum, v) => sum + (v.vendio || 0), 0),
            devolvio: vendedores.reduce((sum, v) => sum + (v.devolvio || 0), 0),
            vencidas: vendedores.reduce((sum, v) => sum + (v.vencidas || 0), 0),
            ventas_reales: vendedores.reduce((sum, v) => sum + (v.ventas_reales || 0), 0),
        };
    };

    const totales = calcularTotales();

    const getEfectividadColor = (efectividad) => {
        if (efectividad >= 95) return 'success';
        if (efectividad >= 90) return 'warning';
        return 'danger';
    };

    const getCumplimientoColor = (cumplimiento) => {
        if (cumplimiento >= 100) return 'success';
        if (cumplimiento >= 80) return 'warning';
        return 'danger';
    };

    return (
        <div className="reportes-screen">
            {/* Header */}
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-graph-up-arrow me-2" style={{ fontSize: '1.5rem' }}></i>
                            Efectividad de Vendedores
                        </h5>
                    </div>
                </Container>
            </div>

            {/* Contenido */}
            <Container className="py-4">
                {/* Botón volver */}
                <div className="mb-4">
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onVolver();
                        }}
                        className="link-volver"
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver al Menú
                    </a>
                </div>

                {/* Filtros */}
                <div className="card-wrapper mb-4">
                    <Row className="g-2 align-items-end">
                        <Col md={2}>
                            <Form.Label className="mb-1">Periodo</Form.Label>
                            <Form.Select
                                value={periodo}
                                onChange={(e) => setPeriodo(e.target.value)}
                                size="sm"
                            >
                                <option value="dia">Día</option>
                                <option value="semana">Semana</option>
                                <option value="mes">Mes</option>
                                <option value="año">Año</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="mb-1">Fecha Inicio</Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="mb-1">Fecha Fin</Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={4}>
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-100"
                                onClick={handleConsultar}
                                disabled={loading}
                            >
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

                {/* Error */}
                {error && (
                    <Alert variant="warning" className="mb-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* Resultados */}
                {searched && !loading && vendedores.length > 0 && (
                    <>
                        {/* Métricas Generales */}
                        {totales && (
                            <Row className="g-3 mb-4">
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h6 className="text-muted mb-2">Total Vendido</h6>
                                            <h3 className="mb-0 text-primary">{totales.vendio}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h6 className="text-muted mb-2">Total Devuelto</h6>
                                            <h3 className="mb-0 text-warning">{totales.devolvio}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h6 className="text-muted mb-2">Total Vencidas</h6>
                                            <h3 className="mb-0 text-danger">{totales.vencidas}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h6 className="text-muted mb-2">Ventas Reales</h6>
                                            <h3 className="mb-0 text-success">{totales.ventas_reales}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        {/* Tabla de Efectividad */}
                        <div className="card-wrapper">
                            <div className="mb-3 px-3 pt-3">
                                <h6 className="mb-0"><strong>Tabla de Efectividad</strong></h6>
                                <span className="text-muted">{vendedores.length} vendedores</span>
                            </div>

                            <div className="table-responsive">
                                <Table hover className="table-modern">
                                    <thead>
                                        <tr>
                                            <th className="text-center" style={{ width: '60px' }}>#</th>
                                            <th>Vendedor</th>
                                            <th className="text-center">Vendió</th>
                                            <th className="text-center">Devolvió</th>
                                            <th className="text-center">Vencidas</th>
                                            <th className="text-center">Ventas Reales</th>
                                            <th className="text-center">Cumplimiento</th>
                                            <th className="text-center">Efectividad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendedores.map((vendedor, index) => (
                                            <tr key={vendedor.id}>
                                                <td className="text-center">
                                                    <strong>{index + 1}</strong>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{vendedor.nombre}</strong>
                                                        <br />
                                                        <small className="text-muted">{vendedor.id}</small>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-primary">
                                                        {vendedor.vendio || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-warning">
                                                        {vendedor.devolvio || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-danger">
                                                        {vendedor.vencidas || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-success">
                                                        {vendedor.ventas_reales || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge bg-${getCumplimientoColor(vendedor.cumplimiento || 0)}`}>
                                                        {(vendedor.cumplimiento || 0).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge bg-${getEfectividadColor(vendedor.efectividad || 0)}`}>
                                                        {(vendedor.efectividad || 0).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </>
                )}

                {/* Mensaje vacío */}
                {!loading && vendedores.length === 0 && searched && (
                    <div className="empty-state">
                        <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">
                            No se encontraron datos para el periodo seleccionado
                        </p>
                    </div>
                )}

                {/* Mensaje inicial */}
                {!searched && (
                    <div className="empty-state">
                        <i className="bi bi-calendar-range text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">
                            Selecciona un periodo y rango de fechas para consultar la efectividad
                        </p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReporteEfectividadVendedores;

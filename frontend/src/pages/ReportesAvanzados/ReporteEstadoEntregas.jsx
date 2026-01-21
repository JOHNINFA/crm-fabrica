import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import '../ReportesAvanzadosScreen.css';

const ReporteEstadoEntregas = ({ onVolver }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [metricas, setMetricas] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || '/api';

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
                `${API_URL}/reportes/estado-entregas/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
            );

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();
            setMetricas(data);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al consultar los datos.');
            setMetricas(null);
        } finally {
            setLoading(false);
        }
    };

    const calcularPorcentaje = (valor, total) => {
        return total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
    };

    return (
        <div className="reportes-screen">
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-box-seam me-2" style={{ fontSize: '1.5rem' }}></i>
                            Estado de Entregas
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
                        <Col md={4}>
                            <Form.Label className="mb-1">Fecha Inicio</Form.Label>
                            <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} size="sm" />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="mb-1">Fecha Fin</Form.Label>
                            <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} size="sm" />
                        </Col>
                        <Col md={4}>
                            <Button variant="primary" size="sm" className="w-100" onClick={handleConsultar} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" style={{ width: '14px', height: '14px' }} />
                                        Consultando...
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

                {/* Dashboard de Métricas */}
                {searched && !loading && metricas && (
                    <>
                        {/* Métricas principales */}
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="text-center border-success">
                                    <Card.Body>
                                        <div className="mb-2">
                                            <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }}></i>
                                        </div>
                                        <h6 className="text-muted mb-2">Entregados</h6>
                                        <h2 className="mb-0 text-success">{metricas.entregados}</h2>
                                        <small className="text-muted">
                                            {calcularPorcentaje(metricas.entregados, metricas.total)}%
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={3}>
                                <Card className="text-center border-warning">
                                    <Card.Body>
                                        <div className="mb-2">
                                            <i className="bi bi-clock text-warning" style={{ fontSize: '2.5rem' }}></i>
                                        </div>
                                        <h6 className="text-muted mb-2">Pendientes</h6>
                                        <h2 className="mb-0 text-warning">{metricas.pendientes}</h2>
                                        <small className="text-muted">
                                            {calcularPorcentaje(metricas.pendientes, metricas.total)}%
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={3}>
                                <Card className="text-center border-danger">
                                    <Card.Body>
                                        <div className="mb-2">
                                            <i className="bi bi-x-circle text-danger" style={{ fontSize: '2.5rem' }}></i>
                                        </div>
                                        <h6 className="text-muted mb-2">No Entregados</h6>
                                        <h2 className="mb-0 text-danger">{metricas.no_entregados}</h2>
                                        <small className="text-muted">
                                            {calcularPorcentaje(metricas.no_entregados, metricas.total)}%
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={3}>
                                <Card className="text-center border-info">
                                    <Card.Body>
                                        <div className="mb-2">
                                            <i className="bi bi-arrow-return-left text-info" style={{ fontSize: '2.5rem' }}></i>
                                        </div>
                                        <h6 className="text-muted mb-2">Devoluciones</h6>
                                        <h2 className="mb-0 text-info">{metricas.devoluciones}</h2>
                                        <small className="text-muted">
                                            {calcularPorcentaje(metricas.devoluciones, metricas.total)}%
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Barra de progreso general */}
                        <Card className="mb-4">
                            <Card.Body>
                                <h6 className="mb-3">Progreso General</h6>
                                <ProgressBar>
                                    <ProgressBar
                                        variant="success"
                                        now={calcularPorcentaje(metricas.entregados, metricas.total)}
                                        label={`${calcularPorcentaje(metricas.entregados, metricas.total)}%`}
                                        key={1}
                                    />
                                    <ProgressBar
                                        variant="warning"
                                        now={calcularPorcentaje(metricas.pendientes, metricas.total)}
                                        key={2}
                                    />
                                    <ProgressBar
                                        variant="danger"
                                        now={calcularPorcentaje(metricas.no_entregados, metricas.total)}
                                        key={3}
                                    />
                                    <ProgressBar
                                        variant="info"
                                        now={calcularPorcentaje(metricas.devoluciones, metricas.total)}
                                        key={4}
                                    />
                                </ProgressBar>
                                <div className="mt-3">
                                    <small><strong>Total de pedidos:</strong> {metricas.total}</small>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Alerta de pedidos atrasados */}
                        {metricas.atrasados > 0 && (
                            <Alert variant="danger">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '2rem' }}></i>
                                    <div>
                                        <strong>¡Atención!</strong> Hay <strong>{metricas.atrasados} pedidos</strong> atrasados
                                        (más de 3 días sin entregar)
                                    </div>
                                </div>
                            </Alert>
                        )}
                    </>
                )}

                {!loading && !metricas && searched && (
                    <div className="empty-state">
                        <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">No hay datos disponibles</p>
                    </div>
                )}

                {!searched && (
                    <div className="empty-state">
                        <i className="bi bi-calendar-range text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">Selecciona un rango de fechas para ver el estado de entregas</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReporteEstadoEntregas;

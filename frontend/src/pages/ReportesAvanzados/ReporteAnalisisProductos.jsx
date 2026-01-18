import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Alert, Spinner, Card, Nav } from 'react-bootstrap';
import './ReporteAnalisisProductos.css';

const ReporteAnalisisProductos = ({ onVolver }) => {
    const [tabActivo, setTabActivo] = useState('vendidos'); // vendidos, devueltos, vencidos
    const [periodo, setPeriodo] = useState('mes');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [orden, setOrden] = useState('desc'); // desc, asc
    const [limite, setLimite] = useState(10); // 10, 20, 50
    const [productos, setProductos] = useState([]);
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
                `${API_URL}/reportes/analisis-productos/?tipo=${tabActivo}&periodo=${periodo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&orden=${orden}&limite=${limite}`
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setProductos(data.productos || []);
        } catch (err) {
            console.error('Error consultando productos:', err);
            setError('Error al consultar los datos. Verifica que el endpoint esté disponible.');
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

    const getTitulo = () => {
        switch (tabActivo) {
            case 'vendidos': return 'Productos Más Vendidos';
            case 'devueltos': return 'Productos Más Devueltos';
            case 'vencidos': return 'Productos Más Vencidos';
            default: return 'Análisis de Productos';
        }
    };

    const getIcon = () => {
        switch (tabActivo) {
            case 'vendidos': return 'bi-bar-chart-fill';
            case 'devueltos': return 'bi-arrow-counterclockwise';
            case 'vencidos': return 'bi-exclamation-triangle';
            default: return 'bi-box';
        }
    };

    const getColorBadge = () => {
        switch (tabActivo) {
            case 'vendidos': return 'primary';
            case 'devueltos': return 'warning';
            case 'vencidos': return 'danger';
            default: return 'secondary';
        }
    };

    // Reiniciar búsqueda al cambiar tab
    const handleTabChange = (nuevoTab) => {
        setTabActivo(nuevoTab);
        setSearched(false);
        setProductos([]);
    };

    return (
        <div className="reportes-screen">
            {/* Header */}
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className={`${getIcon()} me-2`} style={{ fontSize: '1.5rem' }}></i>
                            Análisis de Productos
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

                {/* Tabs */}
                <div className="card-wrapper mb-4">
                    <Nav variant="tabs" className="custom-tabs">
                        <Nav.Item>
                            <Nav.Link
                                active={tabActivo === 'vendidos'}
                                onClick={() => handleTabChange('vendidos')}
                            >
                                <i className="bi bi-bar-chart-fill me-2"></i>
                                Más Vendidos
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={tabActivo === 'devueltos'}
                                onClick={() => handleTabChange('devueltos')}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                Más Devueltos
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={tabActivo === 'vencidos'}
                                onClick={() => handleTabChange('vencidos')}
                            >
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Más Vencidos
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                {/* Filtros */}
                <div className="card-wrapper mb-4">
                    <Row className="g-2 align-items-end p-3">
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
                        <Col md={2}>
                            <Form.Label className="mb-1">Fecha Inicio</Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="mb-1">Fecha Fin</Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="mb-1">Top</Form.Label>
                            <Form.Select
                                value={limite}
                                onChange={(e) => setLimite(parseInt(e.target.value))}
                                size="sm"
                            >
                                <option value="10">Top 10</option>
                                <option value="20">Top 20</option>
                                <option value="50">Top 50</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="mb-1">Orden</Form.Label>
                            <Form.Select
                                value={orden}
                                onChange={(e) => setOrden(e.target.value)}
                                size="sm"
                            >
                                <option value="desc">Mayor a Menor</option>
                                <option value="asc">Menor a Mayor</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
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
                {searched && !loading && productos.length > 0 && (
                    <div className="card-wrapper">
                        <div className="mb-3 px-3 pt-3">
                            <h6 className="mb-0"><strong>{getTitulo()}</strong></h6>
                            <span className="text-muted">{productos.length} productos</span>
                        </div>

                        <div className="table-responsive">
                            <Table hover className="table-modern">
                                <thead>
                                    <tr>
                                        <th className="text-center" style={{ width: '60px' }}>#</th>
                                        <th>Producto</th>
                                        <th className="text-center">Total Unidades</th>
                                        {tabActivo !== 'vendidos' && (
                                            <th className="text-center">Vendedores Afectados</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.map((producto, index) => (
                                        <tr key={producto.nombre}>
                                            <td className="text-center">
                                                <strong>{index + 1}</strong>
                                            </td>
                                            <td>
                                                <strong>{producto.nombre}</strong>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge-pill bg-${getColorBadge()}`}>
                                                    {producto.total}
                                                </span>
                                            </td>
                                            {tabActivo !== 'vendidos' && (
                                                <td className="text-center">
                                                    <span className="text-muted">
                                                        {producto.vendedores || 0} vendedor(es)
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Mensaje vacío */}
                {!loading && productos.length === 0 && searched && (
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
                            Selecciona un tab, periodo y rango de fechas para consultar
                        </p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReporteAnalisisProductos;

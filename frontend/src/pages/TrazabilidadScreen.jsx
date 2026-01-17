import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Nav, Table, Spinner } from 'react-bootstrap';
import { FaSearch, FaBoxOpen, FaTruck, FaExclamationTriangle, FaCheckCircle, FaCalendar, FaFileExcel, FaArrowLeft } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import usePageTitle from '../hooks/usePageTitle';
import '../styles/TrazabilidadScreen.css';

import { API_URL } from '../services/api';
// const API_URL = 'http://localhost:8000/api';

const TrazabilidadScreen = () => {
    const navigate = useNavigate();
    usePageTitle('Trazabilidad');
    const [activeTab, setActiveTab] = useState('lote'); // 'lote' | 'fecha' | 'mes'

    // Estados para búsqueda por lote
    const [loteConsulta, setLoteConsulta] = useState('');
    const [trazabilidad, setTrazabilidad] = useState(null);

    // Estados para búsqueda por fecha
    const [fechaConsulta, setFechaConsulta] = useState('');
    const [lotesDelDia, setLotesDelDia] = useState(null);

    // Estados para búsqueda por mes
    const [mesConsulta, setMesConsulta] = useState('');
    const [lotesDelMes, setLotesDelMes] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🆕 Buscar lote en la API
    const buscarLote = async () => {
        if (!loteConsulta.trim()) {
            setError('Debe ingresar un número de lote');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/trazabilidad/buscar/?lote=${encodeURIComponent(loteConsulta)}`);
            const data = await response.json();

            if (response.ok) {
                // Verificar si hay datos
                if (data.produccion || data.despachos?.length > 0 || data.vencidas?.length > 0) {
                    setTrazabilidad(data);
                } else {
                    setError(`No se encontró información para el lote: ${loteConsulta}`);
                    setTrazabilidad(null);
                }
            } else {
                setError(data.error || 'Error al buscar el lote');
                setTrazabilidad(null);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Buscar lotes por fecha en la API
    const buscarLotesPorFecha = async () => {
        if (!fechaConsulta) {
            setError('Debe seleccionar una fecha');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/trazabilidad/fecha/?fecha=${fechaConsulta}`);
            const data = await response.json();

            if (response.ok) {
                if (data.lotes && data.lotes.length > 0) {
                    setLotesDelDia(data);
                } else {
                    setError(`No se encontraron lotes para la fecha: ${new Date(fechaConsulta).toLocaleDateString('es-ES')}`);
                    setLotesDelDia(null);
                }
            } else {
                setError(data.error || 'Error al buscar lotes');
                setLotesDelDia(null);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Buscar lotes por mes en la API
    const buscarLotesPorMes = async () => {
        if (!mesConsulta) {
            setError('Debe seleccionar un mes');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/trazabilidad/mes/?mes=${mesConsulta}`);
            const data = await response.json();

            if (response.ok) {
                if (data.datos && data.datos.length > 0) {
                    setLotesDelMes(data);
                } else {
                    const fecha = new Date(mesConsulta + '-01');
                    setError(`No se encontraron lotes para ${fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);
                    setLotesDelMes(null);
                }
            } else {
                setError(data.error || 'Error al buscar lotes');
                setLotesDelMes(null);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportarTrazabilidadMesExcel = () => {
        if (!lotesDelMes || !lotesDelMes.datos || lotesDelMes.datos.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        // Preparar datos para Excel
        const datosExcel = [];

        lotesDelMes.datos.forEach(dia => {
            dia.lotes.forEach(lote => {
                datosExcel.push({
                    'Lote': lote.lote,
                    'Fecha': dia.fecha,
                    'Vendedor ID': lote.vendedor_id || 'N/A',
                    'Responsable': lote.responsable || 'N/A',
                    'Producto': lote.producto || 'N/A',
                    'Cantidad': lote.cantidad || 0,
                    'Usuario': lote.usuario || 'N/A',
                    'Fecha Vencimiento': lote.fecha_vencimiento || 'N/A',
                    'Origen': lote.origen || 'N/A'
                });
            });
        });

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 15 }, // Lote
            { wch: 12 }, // Fecha
            { wch: 12 }, // Vendedor ID
            { wch: 20 }, // Responsable
            { wch: 30 }, // Producto
            { wch: 10 }, // Cantidad
            { wch: 15 }, // Usuario
            { wch: 15 }, // Fecha Vencimiento
            { wch: 12 }, // Origen
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Trazabilidad');

        // Generar nombre de archivo
        const fecha = new Date(lotesDelMes.mes + '-01');
        const nombreArchivo = `Trazabilidad_${fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}.xlsx`;

        // Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
    };

    return (
        <Container fluid className="trazabilidad-screen">
            {/* Botón Regresar */}
            <Row className="mb-3">
                <Col>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/otros')}
                        className="d-flex align-items-center"
                    >
                        <FaArrowLeft className="me-2" />
                        Regresar a Otros
                    </Button>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col>
                    <h2 className="text-center mb-4">
                        <FaBoxOpen className="me-2" />
                        Trazabilidad de Lotes
                    </h2>
                </Col>
            </Row>

            {/* Tabs */}
            <Row className="mb-3">
                <Col md={{ span: 10, offset: 1 }}>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => {
                        setActiveTab(k);
                        setError(null);
                        setTrazabilidad(null);
                        setLotesDelDia(null);
                        setLotesDelMes(null);
                    }}>
                        <Nav.Item>
                            <Nav.Link eventKey="lote">
                                <FaBoxOpen className="me-2" />
                                Buscar por Lote
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="fecha">
                                <FaCalendar className="me-2" />
                                Historial por Fecha
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="mes">
                                <FaCalendar className="me-2" />
                                Historial por Mes
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
            </Row>

            {/* Búsqueda por Lote */}
            {activeTab === 'lote' && (
                <Row className="mb-4">
                    <Col md={{ span: 6, offset: 3 }}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Form onSubmit={(e) => { e.preventDefault(); buscarLote(); }}>
                                    <Row>
                                        <Col xs={8}>
                                            <Form.Group>
                                                <Form.Label>Número de Lote</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Ej: L20251206"
                                                    value={loteConsulta}
                                                    onChange={(e) => setLoteConsulta(e.target.value.toUpperCase())}
                                                    autoFocus
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={4} className="d-flex align-items-end">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                                className="w-100"
                                            >
                                                {loading ? <Spinner size="sm" animation="border" /> : <FaSearch className="me-2" />}
                                                {loading ? 'Buscando...' : 'Buscar'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Búsqueda por Fecha */}
            {activeTab === 'fecha' && (
                <Row className="mb-4">
                    <Col md={{ span: 6, offset: 3 }}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Form onSubmit={(e) => { e.preventDefault(); buscarLotesPorFecha(); }}>
                                    <Row>
                                        <Col xs={8}>
                                            <Form.Group>
                                                <Form.Label>Seleccione Fecha</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={fechaConsulta}
                                                    onChange={(e) => setFechaConsulta(e.target.value)}
                                                    autoFocus
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={4} className="d-flex align-items-end">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                                className="w-100"
                                            >
                                                {loading ? <Spinner size="sm" animation="border" /> : <FaSearch className="me-2" />}
                                                {loading ? 'Buscando...' : 'Buscar'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Búsqueda por Mes */}
            {activeTab === 'mes' && (
                <Row className="mb-4">
                    <Col md={{ span: 6, offset: 3 }}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Form onSubmit={(e) => { e.preventDefault(); buscarLotesPorMes(); }}>
                                    <Row>
                                        <Col xs={8}>
                                            <Form.Group>
                                                <Form.Label>Seleccione Mes y Año</Form.Label>
                                                <Form.Control
                                                    type="month"
                                                    value={mesConsulta}
                                                    onChange={(e) => setMesConsulta(e.target.value)}
                                                    autoFocus
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={4} className="d-flex align-items-end">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                                className="w-100"
                                            >
                                                {loading ? <Spinner size="sm" animation="border" /> : <FaSearch className="me-2" />}
                                                {loading ? 'Buscando...' : 'Buscar'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Error */}
            {error && (
                <Row>
                    <Col md={{ span: 6, offset: 3 }}>
                        <Alert variant="warning" onClose={() => setError(null)} dismissible>
                            {error}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Resultados por Lote */}
            {trazabilidad && (
                <Row>
                    <Col md={{ span: 10, offset: 1 }}>
                        <Card className="shadow">
                            <Card.Header className="bg-primary text-white">
                                <h4 className="mb-0">
                                    📦 Lote: {trazabilidad.lote}
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                {/* Timeline */}
                                <div className="timeline">
                                    {/* Producción */}
                                    {trazabilidad.produccion && (
                                        <div className="timeline-item creacion">
                                            <div className="timeline-marker">
                                                <FaCheckCircle />
                                            </div>
                                            <div className="timeline-content">
                                                <Badge bg="success" className="mb-2">CREACIÓN</Badge>
                                                <h5>{trazabilidad.produccion.fecha}</h5>
                                                <p className="mb-1"><strong>Usuario:</strong> {trazabilidad.produccion.usuario}</p>
                                                {trazabilidad.produccion.fecha_vencimiento && (
                                                    <p className="mb-1"><strong>Vence:</strong> {trazabilidad.produccion.fecha_vencimiento}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Despachos */}
                                    {trazabilidad.despachos?.map((despacho, idx) => (
                                        <div key={idx} className="timeline-item despacho">
                                            <div className="timeline-marker">
                                                <FaTruck />
                                            </div>
                                            <div className="timeline-content">
                                                <Badge bg="info" className="mb-2">DESPACHO</Badge>
                                                <h5>{despacho.fecha} - {despacho.dia}</h5>
                                                <p className="mb-1"><strong>Vendedor:</strong> {despacho.vendedor_id} - {despacho.responsable}</p>
                                                <p className="mb-1"><strong>Producto:</strong> {despacho.producto}</p>
                                                <p className="mb-1"><strong>Cantidad:</strong> {despacho.cantidad} unidades</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Vencidas */}
                                    {trazabilidad.vencidas?.map((vencida, idx) => (
                                        <div key={idx} className="timeline-item vencida">
                                            <div className="timeline-marker">
                                                <FaExclamationTriangle />
                                            </div>
                                            <div className="timeline-content">
                                                <Badge bg="danger" className="mb-2">RETORNO (VENCIDA)</Badge>
                                                <h5>{vencida.fecha} - {vencida.dia}</h5>
                                                <p className="mb-1"><strong>Vendedor:</strong> {vencida.vendedor_id} - {vencida.responsable}</p>
                                                <p className="mb-1"><strong>Producto:</strong> {vencida.producto}</p>
                                                <p className="mb-1"><strong>Cantidad:</strong> <Badge bg="secondary">{vencida.cantidad} unidades</Badge></p>
                                                <p className="mb-1"><strong>Motivo:</strong> <Badge bg="warning" text="dark">{vencida.motivo}</Badge></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Resumen */}
                                <Card className="mt-4 bg-light">
                                    <Card.Body>
                                        <h5>📊 Resumen del Lote</h5>
                                        <Row className="mt-3">
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-info">
                                                        {trazabilidad.despachos?.length || 0}
                                                    </div>
                                                    <div className="stat-label">Despachos</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-danger">
                                                        {trazabilidad.vencidas?.length || 0}
                                                    </div>
                                                    <div className="stat-label">Retornos</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-warning">
                                                        {trazabilidad.vencidas?.reduce((sum, v) => sum + (v.cantidad || 0), 0) || 0}
                                                    </div>
                                                    <div className="stat-label">Unidades Vencidas</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Resultados por Fecha */}
            {lotesDelDia && (
                <Row>
                    <Col md={{ span: 10, offset: 1 }}>
                        <Card className="shadow">
                            <Card.Header className="bg-success text-white">
                                <h4 className="mb-0">
                                    📅 Lotes del día: {new Date(lotesDelDia.fecha).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                <Table striped bordered hover responsive>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>#</th>
                                            <th>Lote</th>
                                            <th>Vendedor</th>
                                            <th>Responsable</th>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Origen</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lotesDelDia.lotes.map((lote, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <Badge bg="primary" className="fs-6">
                                                        {lote.lote}
                                                    </Badge>
                                                </td>
                                                <td>{lote.vendedor_id || 'N/A'}</td>
                                                <td>{lote.responsable || lote.usuario || 'N/A'}</td>
                                                <td>{lote.producto || 'N/A'}</td>
                                                <td className="text-center">
                                                    <Badge bg="success">
                                                        {lote.cantidad || 0}
                                                    </Badge>
                                                </td>
                                                <td>{lote.origen}</td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveTab('lote');
                                                            setLoteConsulta(lote.lote);
                                                            setLotesDelDia(null);
                                                            setTimeout(() => buscarLote(), 100);
                                                        }}
                                                    >
                                                        Ver Trazabilidad
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {/* Resumen */}
                                <Card className="mt-4 bg-light">
                                    <Card.Body>
                                        <h5>📊 Resumen del Día</h5>
                                        <Row className="mt-3">
                                            <Col md={6}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-primary">
                                                        {lotesDelDia.total_lotes || lotesDelDia.lotes.length}
                                                    </div>
                                                    <div className="stat-label">Total Lotes</div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-success">
                                                        {lotesDelDia.lotes.reduce((sum, l) => sum + (l.cantidad || 0), 0)}
                                                    </div>
                                                    <div className="stat-label">Total Unidades</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Resultados por Mes */}
            {lotesDelMes && (
                <Row>
                    <Col md={{ span: 10, offset: 1 }}>
                        <Card className="shadow">
                            <Card.Header className="bg-info text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0">
                                        📅 Lotes del mes: {new Date(lotesDelMes.mes + '-01').toLocaleDateString('es-ES', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </h4>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={exportarTrazabilidadMesExcel}
                                    >
                                        <FaFileExcel className="me-2" />
                                        Exportar a Excel
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {lotesDelMes.datos.map((dia, diaIdx) => (
                                    <div key={diaIdx} className="mb-4">
                                        <h5 className="border-bottom pb-2">
                                            📆 {new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </h5>
                                        <Table striped bordered hover responsive size="sm">
                                            <thead className="table-secondary">
                                                <tr>
                                                    <th>Lote</th>
                                                    <th>Vendedor</th>
                                                    <th>Responsable</th>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>Origen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dia.lotes.map((lote, loteIdx) => (
                                                    <tr key={loteIdx}>
                                                        <td>
                                                            <Badge bg="primary">{lote.lote}</Badge>
                                                        </td>
                                                        <td>{lote.vendedor_id || 'N/A'}</td>
                                                        <td>{lote.responsable || lote.usuario || 'N/A'}</td>
                                                        <td>{lote.producto || 'N/A'}</td>
                                                        <td className="text-center">
                                                            <Badge bg="success">{lote.cantidad || 0}</Badge>
                                                        </td>
                                                        <td><small>{lote.origen}</small></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ))}

                                {/* Resumen del Mes */}
                                <Card className="mt-4 bg-light">
                                    <Card.Body>
                                        <h5>📊 Resumen del Mes</h5>
                                        <Row className="mt-3">
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-primary">
                                                        {lotesDelMes.total_fechas}
                                                    </div>
                                                    <div className="stat-label">Días con Lotes</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-info">
                                                        {lotesDelMes.datos.reduce((sum, d) => sum + d.lotes.length, 0)}
                                                    </div>
                                                    <div className="stat-label">Total Registros</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-success">
                                                        {lotesDelMes.datos.reduce((sum, d) =>
                                                            sum + d.lotes.reduce((s, l) => s + (l.cantidad || 0), 0), 0
                                                        )}
                                                    </div>
                                                    <div className="stat-label">Total Unidades</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default TrazabilidadScreen;

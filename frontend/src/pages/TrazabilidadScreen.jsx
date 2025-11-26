import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Nav, Table } from 'react-bootstrap';
import { FaSearch, FaBoxOpen, FaTruck, FaExclamationTriangle, FaCheckCircle, FaCalendar, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import '../styles/TrazabilidadScreen.css';

const TrazabilidadScreen = () => {
    const [activeTab, setActiveTab] = useState('lote'); // 'lote' | 'fecha'

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

    const buscarLote = async () => {
        if (!loteConsulta.trim()) {
            setError('Debe ingresar un número de lote');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Buscar en localStorage por ahora (luego conectar a API)
            const datos = buscarLoteEnLocalStorage(loteConsulta);

            if (datos) {
                setTrazabilidad(datos);
            } else {
                setError(`No se encontró información para el lote: ${loteConsulta}`);
                setTrazabilidad(null);
            }
        } catch (err) {
            setError('Error al buscar el lote');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const buscarLoteEnLocalStorage = (lote) => {
        // 1. Buscar en lotes de producción
        const lotesProduccion = obtenerLotesProduccion();
        const produccion = lotesProduccion.find(l => l.numero === lote);

        // 2. Buscar en cargues (lotes despachados)
        const cargues = obtenerCargues();
        const despachos = cargues.filter(c => {
            return c.productos?.some(p =>
                p.lotesVencidos?.some(lv => lv.lote === lote)
            );
        });

        // 3. Buscar en vencidas
        const vencidas = obtenerVencidas(lote);

        if (!produccion && despachos.length === 0 && vencidas.length === 0) {
            return null;
        }

        return {
            lote,
            produccion,
            despachos,
            vencidas
        };
    };

    const obtenerLotesProduccion = () => {
        // Buscar en todos los registros de confirmación de producción
        const lotes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('confirmacion_produccion_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.lote) {
                        lotes.push({
                            numero: data.lote,
                            fecha: data.fechaSeleccionada,
                            usuario: data.usuario,
                            productos: data.productos,
                            fechaVencimiento: data.fechaVencimiento
                        });
                    }
                } catch (e) {
                    console.error('Error parseando:', key);
                }
            }
        }
        return lotes;
    };

    const obtenerCargues = () => {
        const cargues = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('cargue_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    cargues.push({
                        ...data,
                        fecha: key.replace('cargue_', '')
                    });
                } catch (e) {
                    console.error('Error parseando:', key);
                }
            }
        }
        return cargues;
    };

    const obtenerVencidas = (lote) => {
        const vencidas = [];
        const cargues = obtenerCargues();

        cargues.forEach(cargue => {
            cargue.productos?.forEach(producto => {
                producto.lotesVencidos?.forEach(loteVencido => {
                    if (loteVencido.lote === lote) {
                        vencidas.push({
                            fecha: cargue.fecha,
                            vendedor: cargue.vendedor || 'N/A',
                            producto: producto.nombre,
                            cantidad: producto.cantidad || 'N/A', // Cantidad del producto en ese cargue
                            lote: loteVencido.lote,
                            motivo: loteVencido.motivo
                        });
                    }
                });
            });
        });

        return vencidas;
    };

    const buscarLotesPorFecha = () => {
        if (!fechaConsulta) {
            setError('Debe seleccionar una fecha');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Convertir fecha seleccionada a formato comparable
            const fechaBuscar = new Date(fechaConsulta);
            const lotes = [];

            // Buscar en confirmaciones de producción
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('confirmacion_produccion_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const fechaProduccion = new Date(data.fechaSeleccionada);

                        if (fechaProduccion.toDateString() === fechaBuscar.toDateString()) {
                            lotes.push({
                                lote: data.lote,
                                fecha: data.fechaSeleccionada,
                                usuario: data.usuario,
                                productos: data.productos,
                                fechaVencimiento: data.fechaVencimiento,
                                totalProducido: data.productos?.reduce((sum, p) => sum + (p.cantidad || 0), 0) || 0
                            });
                        }
                    } catch (e) {
                        console.error('Error parseando:', key);
                    }
                }
            }

            if (lotes.length > 0) {
                setLotesDelDia({
                    fecha: fechaConsulta,
                    lotes: lotes
                });
            } else {
                setError(`No se encontraron lotes para la fecha: ${new Date(fechaConsulta).toLocaleDateString('es-ES')}`);
                setLotesDelDia(null);
            }
        } catch (err) {
            setError('Error al buscar lotes por fecha');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const buscarLotesPorMes = () => {
        if (!mesConsulta) {
            setError('Debe seleccionar un mes');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Extraer año y mes de la fecha seleccionada
            const [year, month] = mesConsulta.split('-');
            const lotes = [];

            // Buscar en confirmaciones de producción
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('confirmacion_produccion_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const fechaProduccion = new Date(data.fechaSeleccionada);

                        // Comparar año y mes
                        if (fechaProduccion.getFullYear() === parseInt(year) &&
                            fechaProduccion.getMonth() === parseInt(month) - 1) {
                            lotes.push({
                                lote: data.lote,
                                fecha: data.fechaSeleccionada,
                                usuario: data.usuario,
                                productos: data.productos,
                                fechaVencimiento: data.fechaVencimiento,
                                totalProducido: data.productos?.reduce((sum, p) => sum + (p.cantidad || 0), 0) || 0
                            });
                        }
                    } catch (e) {
                        console.error('Error parseando:', key);
                    }
                }
            }

            // Ordenar por fecha
            lotes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (lotes.length > 0) {
                setLotesDelMes({
                    mes: mesConsulta,
                    lotes: lotes
                });
            } else {
                const fecha = new Date(mesConsulta + '-01');
                setError(`No se encontraron lotes para ${fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);
                setLotesDelMes(null);
            }
        } catch (err) {
            setError('Error al buscar lotes por mes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportarTrazabilidadMesExcel = () => {
        if (!lotesDelMes || !lotesDelMes.lotes || lotesDelMes.lotes.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        // Preparar datos para Excel
        const datosExcel = [];

        lotesDelMes.lotes.forEach(lote => {
            // Buscar despachos de este lote
            const cargues = obtenerCargues();
            const despachosLote = cargues.filter(c =>
                c.productos?.some(p => p.lotesVencidos?.some(lv => lv.lote === lote.lote))
            );

            // Buscar vencidas de este lote
            const vencidasLote = obtenerVencidas(lote.lote);

            // Por cada producto del lote
            lote.productos?.forEach(producto => {
                const totalVencido = vencidasLote
                    .filter(v => v.producto === producto.nombre)
                    .reduce((sum, v) => sum + (typeof v.cantidad === 'number' ? v.cantidad : 0), 0);

                const cantProducida = producto.cantidad || 0;
                let estado = 'EN BODEGA';

                if (despachosLote.length > 0) {
                    if (totalVencido === 0) {
                        estado = 'EN CIRCULACIÓN';
                    } else if (totalVencido < cantProducida) {
                        estado = 'VENCIDA PARCIAL';
                    } else {
                        estado = 'VENCIDA TOTAL';
                    }
                }

                datosExcel.push({
                    'Lote': lote.lote,
                    'Fecha Producción': new Date(lote.fecha).toLocaleDateString('es-ES'),
                    'Usuario': lote.usuario,
                    'Producto': producto.nombre,
                    'Cant. Producida': cantProducida,
                    'Vence': lote.fechaVencimiento || 'N/A',
                    'Despachado': despachosLote.length > 0 ? 'SÍ' : 'NO',
                    'Fecha Despacho': despachosLote[0]?.fecha || '-',
                    'Vendedor': despachosLote[0]?.vendedor || '-',
                    'Retornó Vencida': totalVencido > 0 ? 'SÍ' : 'NO',
                    'Cant. Vencida': totalVencido,
                    'Motivo': vencidasLote.find(v => v.producto === producto.nombre)?.motivo || '-',
                    'Estado': estado
                });
            });
        });

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 12 }, // Lote
            { wch: 15 }, // Fecha Producción
            { wch: 20 }, // Usuario
            { wch: 25 }, // Producto
            { wch: 12 }, // Cant. Producida
            { wch: 12 }, // Vence
            { wch: 12 }, // Despachado
            { wch: 15 }, // Fecha Despacho
            { wch: 12 }, // Vendedor
            { wch: 15 }, // Retornó Vencida
            { wch: 12 }, // Cant. Vencida
            { wch: 12 }, // Motivo
            { wch: 18 }, // Estado
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
                                                <FaSearch className="me-2" />
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
                                                <FaSearch className="me-2" />
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
                                                <FaSearch className="me-2" />
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

            {/* Resultados */}
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
                                                {trazabilidad.produccion.fechaVencimiento && (
                                                    <p className="mb-1"><strong>Vence:</strong> {trazabilidad.produccion.fechaVencimiento}</p>
                                                )}
                                                <div className="mt-2">
                                                    <strong>Productos:</strong>
                                                    <ul>
                                                        {trazabilidad.produccion.productos?.map((p, idx) => (
                                                            <li key={idx}>{p.nombre}: {p.cantidad} unidades</li>
                                                        ))}
                                                    </ul>
                                                </div>
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
                                                <h5>{despacho.fecha}</h5>
                                                <p className="mb-1"><strong>Vendedor:</strong> {despacho.vendedor}</p>
                                                <div className="mt-2">
                                                    <strong>Productos despachados:</strong>
                                                    <ul>
                                                        {despacho.productos?.map((p, pidx) => (
                                                            <li key={pidx}>{p.nombre}: {p.cantidad} unidades</li>
                                                        ))}
                                                    </ul>
                                                </div>
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
                                                <h5>{vencida.fecha}</h5>
                                                <p className="mb-1"><strong>Vendedor:</strong> {vencida.vendedor}</p>
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
                                                    <div className="stat-value text-success">
                                                        {trazabilidad.produccion?.productos?.reduce((sum, p) => sum + (p.cantidad || 0), 0) || 0}
                                                    </div>
                                                    <div className="stat-label">Producido</div>
                                                </div>
                                            </Col>
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
                                                        {trazabilidad.vencidas?.reduce((sum, v) => {
                                                            const cantidad = typeof v.cantidad === 'number' ? v.cantidad : 0;
                                                            return sum + cantidad;
                                                        }, 0) || 0}
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
                                            <th>Usuario</th>
                                            <th>Productos</th>
                                            <th>Total Producido</th>
                                            <th>Fecha Vencimiento</th>
                                            <th>Acción</th>
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
                                                <td>{lote.usuario}</td>
                                                <td>
                                                    <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
                                                        {lote.productos?.map((p, pidx) => (
                                                            <li key={pidx}>{p.nombre} ({p.cantidad})</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="success" className="fs-6">
                                                        {lote.totalProducido}
                                                    </Badge>
                                                </td>
                                                <td>{lote.fechaVencimiento || 'N/A'}</td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveTab('lote');
                                                            setLoteConsulta(lote.lote);
                                                            buscarLoteEnLocalStorage(lote.lote);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                                        {lotesDelDia.lotes.length}
                                                    </div>
                                                    <div className="stat-label">Lotes Producidos</div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-success">
                                                        {lotesDelDia.lotes.reduce((sum, l) => sum + l.totalProducido, 0)}
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
                                <Table striped bordered hover responsive className="table-sm">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>#</th>
                                            <th>Lote</th>
                                            <th>Fecha Prod.</th>
                                            <th>Usuario</th>
                                            <th>Producto</th>
                                            <th>Producida</th>
                                            <th>Vence</th>
                                            <th>Despachado</th>
                                            <th>Vendedor</th>
                                            <th>Vencidas</th>
                                            <th>Motivo</th>
                                            <th>Estado</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lotesDelMes.lotes.map((lote, idx) => {
                                            // Obtener información de despachos y vencidas
                                            const cargues = obtenerCargues();
                                            const despachosLote = cargues.filter(c =>
                                                c.productos?.some(p => p.lotesVencidos?.some(lv => lv.lote === lote.lote))
                                            );
                                            const vencidasLote = obtenerVencidas(lote.lote);

                                            return lote.productos?.map((producto, pidx) => {
                                                const totalVencido = vencidasLote
                                                    .filter(v => v.producto === producto.nombre)
                                                    .reduce((sum, v) => sum + (typeof v.cantidad === 'number' ? v.cantidad : 0), 0);

                                                const cantProducida = producto.cantidad || 0;
                                                let estado = 'EN BODEGA';
                                                let estadoBadge = 'secondary';

                                                if (despachosLote.length > 0) {
                                                    if (totalVencido === 0) {
                                                        estado = 'EN CIRCULACIÓN';
                                                        estadoBadge = 'info';
                                                    } else if (totalVencido < cantProducida) {
                                                        estado = 'VENCIDA PARCIAL';
                                                        estadoBadge = 'warning';
                                                    } else {
                                                        estado = 'VENCIDA TOTAL';
                                                        estadoBadge = 'danger';
                                                    }
                                                } else {
                                                    estadoBadge = 'secondary';
                                                }

                                                const motivoVencida = vencidasLote.find(v => v.producto === producto.nombre)?.motivo || '-';

                                                return (
                                                    <tr key={`${idx}-${pidx}`}>
                                                        <td>{idx + 1}.{pidx + 1}</td>
                                                        <td>
                                                            <Badge bg="primary" style={{ fontSize: '0.75rem' }}>
                                                                {lote.lote}
                                                            </Badge>
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem' }}>
                                                            {new Date(lote.fecha).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: 'short'
                                                            })}
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem' }}>{lote.usuario}</td>
                                                        <td style={{ fontSize: '0.8rem' }}>
                                                            <strong>{producto.nombre}</strong>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="success" style={{ fontSize: '0.75rem' }}>
                                                                {cantProducida}
                                                            </Badge>
                                                        </td>
                                                        <td style={{ fontSize: '0.75rem' }}>
                                                            {lote.fechaVencimiento || 'N/A'}
                                                        </td>
                                                        <td className="text-center">
                                                            {despachosLote.length > 0 ?
                                                                <Badge bg="info" style={{ fontSize: '0.7rem' }}>SÍ</Badge> :
                                                                <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>NO</Badge>
                                                            }
                                                        </td>
                                                        <td style={{ fontSize: '0.75rem' }}>
                                                            {despachosLote[0]?.vendedor || '-'}
                                                        </td>
                                                        <td className="text-center">
                                                            {totalVencido > 0 ?
                                                                <Badge bg="danger" style={{ fontSize: '0.75rem' }}>{totalVencido}</Badge> :
                                                                <span style={{ fontSize: '0.75rem' }}>-</span>
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            {motivoVencida !== '-' ?
                                                                <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem' }}>{motivoVencida}</Badge> :
                                                                <span style={{ fontSize: '0.75rem' }}>-</span>
                                                            }
                                                        </td>
                                                        <td>
                                                            <Badge bg={estadoBadge} style={{ fontSize: '0.7rem' }}>
                                                                {estado}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                                                onClick={() => {
                                                                    setActiveTab('lote');
                                                                    setLoteConsulta(lote.lote);
                                                                    buscarLoteEnLocalStorage(lote.lote);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                Ver
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </tbody>
                                </Table>

                                {/* Resumen del Mes */}
                                <Card className="mt-4 bg-light">
                                    <Card.Body>
                                        <h5>📊 Resumen del Mes</h5>
                                        <Row className="mt-3">
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-primary">
                                                        {lotesDelMes.lotes.length}
                                                    </div>
                                                    <div className="stat-label">Lotes Producidos</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-success">
                                                        {lotesDelMes.lotes.reduce((sum, l) => sum + l.totalProducido, 0)}
                                                    </div>
                                                    <div className="stat-label">Total Unidades</div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="stat-box">
                                                    <div className="stat-value text-info">
                                                        {new Set(lotesDelMes.lotes.map(l => new Date(l.fecha).toDateString())).size}
                                                    </div>
                                                    <div className="stat-label">Días Productivos</div>
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

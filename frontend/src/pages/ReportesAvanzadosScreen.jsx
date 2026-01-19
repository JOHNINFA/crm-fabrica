import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Table, Alert, Spinner } from 'react-bootstrap';
import usePageTitle from '../hooks/usePageTitle';
import './ReportesAvanzadosScreen.css';
import ReporteVendedores from './ReportesAvanzados/ReporteVendedores';
import ReporteEfectividadVendedores from './ReportesAvanzados/ReporteEfectividadVendedores';
import ReporteAnalisisProductos from './ReportesAvanzados/ReporteAnalisisProductos';
import ReportePedidosRuta from './ReportesAvanzados/ReportePedidosRuta';
import DashboardEjecutivo from './ReportesAvanzados/DashboardEjecutivo';

// Orden de productos según Cargue
const ordenProductos = [
    "AREPA TIPO OBLEAS",
    "AREPA MEDIANA",
    "AREPA TIPO PINCHO",
    "AREPA QUESO CORRIENTE",
    "AREPA QUESO ESPECIAL GRANDE",
    "AREPA CON QUESO ESPECIAL PEQUEÑA",
    "AREPA QUESO MINI X10",
    "AREPA CON QUESO CUADRADA",
    "AREPA DE CHOCLO CORRIENTE",
    "AREPA DE CHOCLO CON QUESO GRANDE",
    "AREPA DE CHOCLO CON QUESO PEQUEÑA",
    "AREPA BOYACENSE X5",
    "AREPA BOYACENSE X10",
    "AREPA SANTANDEREANA",
    "ALMOJABANA X 5",
    "ALMOJABANAS X10",
    "AREPA CON SEMILLA DE QUINUA",
    "AREPA CON SEMILLA DE CHIA",
    "AREPA CON SEMILLA DE AJONJOLI",
    "AREPA CON SEMILLA DE LINAZA",
    "AREPA CON SEMILLA DE GIRASOL",
    "AREPA CHORICERA",
    "AREPA LONCHERIA",
    "AREPA CON MARGARINA Y SAL",
    "YUCAREPA",
    "AREPA TIPO ASADERO X 10",
    "AREPA PARA RELLENAR # 1",
    "AREPA PARA RELLENAR #2",
    "AREPA PARA RELLENAR #3",
    "PORCION DE AREPAS X 2 UND",
    "PORCION DE AREPAS X 3 UND",
    "PORCION DE AREPAS X 4 UND",
    "PORCION DE AREPAS X 5 UND",
    "AREPA SUPER OBLEA",
    "BLOQUE DE MASA",
    "LIBRAS DE MASA",
    "MUTE BOYACENSE",
    "LIBRA DE MAIZ PETO",
    "ENVUELTO DE MAIZ X 5 UND"
];

const ReportesAvanzadosScreen = () => {
    usePageTitle('Reportes');
    const navigate = useNavigate();
    const [vistaActual, setVistaActual] = useState('menu'); // 'menu' o 'planeacion'
    const [selectedDate, setSelectedDate] = useState('');
    const [planeacionData, setPlaneacionData] = useState([]);
    const [prediccionesIA, setPrediccionesIA] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingIA, setLoadingIA] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    const fetchPrediccionesIA = async (fecha) => {
        setLoadingIA(true);
        try {
            const response = await fetch(`${API_URL}/prediccion-ia/?fecha=${fecha}`);
            if (response.ok) {
                const data = await response.json();
                // Convertir array a objeto para búsqueda rápida por nombre de producto
                const mapPredicciones = {};
                if (data.predicciones) {
                    data.predicciones.forEach(p => {
                        mapPredicciones[p.producto] = p;
                    });
                }
                setPrediccionesIA(mapPredicciones);
                return mapPredicciones;
            }
        } catch (err) {
            console.error('Error consultando IA:', err);
        } finally {
            setLoadingIA(false);
        }
        return {};
    };

    const handleConsultar = async () => {
        if (!selectedDate) {
            setError('Por favor selecciona una fecha');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            // 1. Consultar Reporte Histórico de Planeación (Nuevo Endpoint)
            const response = await fetch(`${API_URL}/reportes-planeacion/?fecha=${selectedDate}`);

            if (!response.ok) {
                throw new Error(`Error en la consulta: ${response.status}`);
            }

            const reportes = await response.json();

            // Verificar si existe snapshot para esta fecha
            if (reportes.length === 0) {
                setError(`No hay reporte guardado para ${selectedDate}. Debes guardar el reporte desde la pantalla de Inventario Planeación.`);
                setPlaneacionData([]);
                setLoading(false);
                return;
            }

            // Tomar el reporte más reciente
            const reporteReciente = reportes[0];
            let data = reporteReciente.datos_json || [];

            console.log(`✅ Reporte cargado: ${reporteReciente.fecha_creacion}`);

            // 2. Normalizar datos para la tabla
            data = data.map(p => ({
                id: p.id,
                producto_nombre: p.nombre || p.producto_nombre, // Adaptar nombres
                existencias: p.existencias || 0,
                solicitadas: p.solicitado || p.solicitadas || 0,
                pedidos: p.pedidos || 0,
                total: ((p.solicitado || p.solicitadas || 0) + (p.pedidos || 0)),
                orden: p.orden || 0,
                ia: p.ia || 0
            }));

            // 3. Ordenar productos según el orden de Cargue
            data = sortProductos(data);

            setPlaneacionData(data);

        } catch (err) {
            console.error('Error consultando planeación:', err);
            setError('Error al consultar el reporte. Por favor intenta nuevamente.');
            setPlaneacionData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAplicarIA = () => {
        const newData = planeacionData.map(item => ({
            ...item,
            orden: item.ia || item.orden // Copiar IA a Orden si existe
        }));
        setPlaneacionData(newData);
        alert('🤖 Sugerencias de IA aplicadas a la columna Orden');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const sortProductos = (productos) => {
        // Función para normalizar nombres y encontrar coincidencias
        const encontrarIndice = (nombreProducto) => {
            const nombreNormalizado = nombreProducto.toUpperCase()
                .replace(/X\s*\d+/g, '') // Quitar "X 5", "X10", etc.
                .replace(/\d+\s*GR/gi, '') // Quitar "450Gr", "300Gr", etc.
                .trim();

            // Buscar coincidencia exacta primero
            let index = ordenProductos.findIndex(p => {
                const pNormalizado = p.toUpperCase();
                return nombreNormalizado === pNormalizado ||
                    nombreNormalizado.includes(pNormalizado) ||
                    pNormalizado.includes(nombreNormalizado);
            });

            // Si no encuentra, buscar por palabras clave principales
            if (index === -1) {
                if (nombreProducto.includes('BOYACENSE')) index = ordenProductos.findIndex(p => p.includes('BOYACENSE'));
                else if (nombreProducto.includes('ALMOJABANA')) index = ordenProductos.findIndex(p => p.includes('ALMOJABANA'));
                else if (nombreProducto.includes('SANTANDEREANA')) index = ordenProductos.findIndex(p => p.includes('SANTANDEREANA'));
                else if (nombreProducto.includes('MEDIANA')) index = ordenProductos.findIndex(p => p.includes('MEDIANA'));
                else if (nombreProducto.includes('OBLEAS')) index = ordenProductos.findIndex(p => p.includes('OBLEAS'));
                else if (nombreProducto.includes('PINCHO')) index = ordenProductos.findIndex(p => p.includes('PINCHO'));
                else if (nombreProducto.includes('CHOCLO')) {
                    if (nombreProducto.includes('CORRIENTE')) index = ordenProductos.findIndex(p => p.includes('CHOCLO') && p.includes('CORRIENTE'));
                    else if (nombreProducto.includes('GRANDE')) index = ordenProductos.findIndex(p => p.includes('CHOCLO') && p.includes('GRANDE'));
                    else if (nombreProducto.includes('PEQUEÑA')) index = ordenProductos.findIndex(p => p.includes('CHOCLO') && p.includes('PEQUEÑA'));
                }
                else if (nombreProducto.includes('QUESO')) {
                    if (nombreProducto.includes('CORRIENTE')) index = ordenProductos.findIndex(p => p.includes('QUESO') && p.includes('CORRIENTE'));
                    else if (nombreProducto.includes('ESPECIAL') && nombreProducto.includes('GRANDE')) index = ordenProductos.findIndex(p => p.includes('ESPECIAL GRANDE'));
                    else if (nombreProducto.includes('ESPECIAL') && nombreProducto.includes('PEQUEÑA')) index = ordenProductos.findIndex(p => p.includes('ESPECIAL PEQUEÑA'));
                    else if (nombreProducto.includes('MINI')) index = ordenProductos.findIndex(p => p.includes('MINI'));
                    else if (nombreProducto.includes('CUADRADA')) index = ordenProductos.findIndex(p => p.includes('CUADRADA'));
                }
            }

            return index === -1 ? 9999 : index;
        };

        return productos.sort((a, b) => {
            const indexA = encontrarIndice(a.producto_nombre);
            const indexB = encontrarIndice(b.producto_nombre);
            return indexA - indexB;
        });
    };



    const calculateTotals = () => {
        if (planeacionData.length === 0) return null;

        return {
            existencias: planeacionData.reduce((sum, item) => sum + (item.existencias || 0), 0),
            solicitadas: planeacionData.reduce((sum, item) => sum + (item.solicitadas || 0), 0),
            pedidos: planeacionData.reduce((sum, item) => sum + (item.pedidos || 0), 0),
            total: planeacionData.reduce((sum, item) => sum + (item.total || 0), 0),
            ia: planeacionData.reduce((sum, item) => sum + (item.ia || 0), 0)
        };
    };

    const totals = calculateTotals();

    // Vista de Menú Principal
    if (vistaActual === 'menu') {
        return (
            <div className="reportes-screen">
                {/* Header */}
                <div className="header-dark">
                    <Container>
                        <div className="d-flex align-items-center justify-content-center py-4">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-bar-chart-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                                Reportes Avanzados
                            </h5>
                        </div>
                    </Container>
                </div>

                {/* Contenido - Menú */}
                <Container className="py-4">
                    {/* Link volver */}
                    <div className="mb-4">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/otros');
                            }}
                            className="link-volver"
                        >
                            <i className="bi bi-arrow-left me-1"></i>
                            Volver
                        </a>
                    </div>

                    {/* Título */}
                    <div className="mb-4">
                        <h4 className="fw-bold">Selecciona el tipo de reporte</h4>
                        <p className="text-muted">Elige una de las opciones disponibles</p>
                    </div>

                    {/* Grid de botones de reportes */}
                    <Row className="g-3">
                        {/* ⭐ DASHBOARD EJECUTIVO - DESTACADO */}
                        <Col xs={12}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('dashboard-ejecutivo')}
                                style={{
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                <Row className="align-items-center">
                                    <Col md={2} className="text-center">
                                        <i className="bi bi-graph-up-arrow" style={{ fontSize: '4rem' }}></i>
                                    </Col>
                                    <Col md={10}>
                                        <h4 className="mb-2">📊 Dashboard Ejecutivo - Ventas desde App Móvil</h4>
                                        <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                                            Vista completa: Ventas por vendedor, devoluciones, vencidas, efectividad, gráficos comparativos y rankings de productos.
                                            <strong className="ms-2">⚡ Ideal para piloto</strong>
                                        </p>
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        {/* SECCIÓN 1: PLANEACIÓN */}
                        <Col xs={12}><h6 className="text-muted mt-3 mb-2">📊 Planeación y Producción</h6></Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('planeacion')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-calendar-check" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Planeación de Producción</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Consulta planeación diaria con existencias y pedidos
                                </p>
                            </div>
                        </Col>

                        {/* SECCIÓN 2: PEDIDOS Y ENTREGAS */}
                        <Col xs={12}><h6 className="text-muted mt-4 mb-2">📦 Pedidos y Entregas</h6></Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('pedidos-ruta')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-signpost-2" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Pedidos por Ruta</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Reportes de pedidos agrupados por ruta y vendedor
                                </p>
                            </div>
                        </Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('estado-entregas')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-box-seam" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Estado de Entregas</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Dashboard con entregados, pendientes y devoluciones
                                </p>
                            </div>
                        </Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('devoluciones')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-arrow-return-left" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Devoluciones</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Análisis por motivo, producto y cliente
                                </p>
                            </div>
                        </Col>

                        {/* SECCIÓN 3: PRODUCTOS */}
                        <Col xs={12}><h6 className="text-muted mt-4 mb-2">📈 Análisis de Productos</h6></Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('analisis-productos')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-bar-chart-fill" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Análisis de Productos</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Vendidos, Devueltos y Vencidos con tabs
                                </p>
                            </div>
                        </Col>

                        {/* SECCIÓN 4: VENDEDORES */}
                        <Col xs={12}><h6 className="text-muted mt-4 mb-2">👥 Análisis de Vendedores</h6></Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('reportes-vendedores')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-people" style={{ fontSize: '2.5rem', color: '#0c2c53' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Desempeño de Vendedores</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Ranking por ventas, efectividad y monto
                                </p>
                            </div>
                        </Col>

                        <Col md={6} lg={4}>
                            <div
                                className="reporte-card"
                                onClick={() => setVistaActual('efectividad-vendedores')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="reporte-card-icon">
                                    <i className="bi bi-graph-up-arrow" style={{ fontSize: '2.5rem', color: '#198754' }}></i>
                                </div>
                                <h5 className="mt-3 mb-2">Efectividad de Vendedores</h5>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    Ventas, devoluciones, vencidas y cumplimiento
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    // ⭐ Vista: Dashboard Ejecutivo
    if (vistaActual === 'dashboard-ejecutivo') {
        return <DashboardEjecutivo onVolver={() => setVistaActual('menu')} />;
    }

    // 🆕 Vista: Reportes de Vendedores
    if (vistaActual === 'reportes-vendedores') {
        return <ReporteVendedores onVolver={() => setVistaActual('menu')} />;
    }

    // 🆕 Vista: Efectividad de Vendedores
    if (vistaActual === 'efectividad-vendedores') {
        return <ReporteEfectividadVendedores onVolver={() => setVistaActual('menu')} />;
    }

    // 🆕 Vista: Análisis de Productos (Consolidado con tabs)
    if (vistaActual === 'analisis-productos') {
        return <ReporteAnalisisProductos onVolver={() => setVistaActual('menu')} />;
    }

    // 🆕 Vista: Pedidos por Ruta
    if (vistaActual === 'pedidos-ruta') {
        return <ReportePedidosRuta onVolver={() => setVistaActual('menu')} />;
    }

    // 🆕 Vista: Próximamente (Pedidos por Transportadora)
    if (vistaActual === 'pedidos-transportadora') {
        return (
            <div className="reportes-screen">
                <div className="header-dark">
                    <Container>
                        <div className="d-flex align-items-center justify-content-center py-4">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-truck me-2" style={{ fontSize: '1.5rem' }}></i>
                                Pedidos por Transportadora
                            </h5>
                        </div>
                    </Container>
                </div>
                <Container className="py-4">
                    <div className="mb-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); setVistaActual('menu'); }} className="link-volver">
                            <i className="bi bi-arrow-left me-1"></i> Volver al Menú
                        </a>
                    </div>
                    <div className="empty-state">
                        <i className="bi bi-truck text-muted" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mt-3">Reporte en desarrollo</h5>
                        <p className="text-muted">Este reporte estará disponible próximamente</p>
                    </div>
                </Container>
            </div>
        );
    }

    // 🆕 Vista: Próximamente (Estado de Entregas)
    if (vistaActual === 'estado-entregas') {
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
                        <a href="#" onClick={(e) => { e.preventDefault(); setVistaActual('menu'); }} className="link-volver">
                            <i className="bi bi-arrow-left me-1"></i> Volver al Menú
                        </a>
                    </div>
                    <div className="empty-state">
                        <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mt-3">Reporte en desarrollo</h5>
                        <p className="text-muted">Este reporte estará disponible próximamente</p>
                    </div>
                </Container>
            </div>
        );
    }

    // 🆕 Vista: Próximamente (Devoluciones)
    if (vistaActual === 'devoluciones') {
        return (
            <div className="reportes-screen">
                <div className="header-dark">
                    <Container>
                        <div className="d-flex align-items-center justify-content-center py-4">
                            <h5 className="mb-0 d-flex align-items-center">
                                <i className="bi bi-arrow-return-left me-2" style={{ fontSize: '1.5rem' }}></i>
                                Devoluciones de Pedidos
                            </h5>
                        </div>
                    </Container>
                </div>
                <Container className="py-4">
                    <div className="mb-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); setVistaActual('menu'); }} className="link-volver">
                            <i className="bi bi-arrow-left me-1"></i> Volver al Menú
                        </a>
                    </div>
                    <div className="empty-state">
                        <i className="bi bi-arrow-return-left text-muted" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mt-3">Reporte en desarrollo</h5>
                        <p className="text-muted">Este reporte estará disponible próximamente</p>
                    </div>
                </Container>
            </div>
        );
    }

    // Vista de Reporte de Planeación
    return (
        <div className="reportes-screen">
            {/* Header */}
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-bar-chart-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                            Reportes de Planeación
                        </h5>
                    </div>
                </Container>
            </div>

            {/* Contenido */}
            <Container className="py-4">
                {/* Link volver */}
                <div className="mb-4">
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setVistaActual('menu');
                            setSearched(false);
                            setPlaneacionData([]);
                            setError('');
                        }}
                        className="link-volver"
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver al Menú
                    </a>
                </div>

                {/* Card de búsqueda */}
                <div className="card-wrapper mb-4">
                    <Row className="g-2">
                        <Col md={8}>
                            <Form.Control
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={4}>
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-100 btn-consultar"
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
                {searched && !loading && planeacionData.length > 0 && (
                    <div className="card-wrapper">
                        {/* Info de fecha */}
                        <div className="fecha-info">
                            <h6 className="mb-0">
                                <strong>{formatDate(selectedDate)}</strong>
                            </h6>
                            <span className="text-muted">{planeacionData.length} productos</span>
                        </div>

                        {/* Botón Aplicar IA */}
                        <div className="d-flex justify-content-end mb-3 px-3">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleAplicarIA}
                                disabled={loadingIA}
                                className="d-flex align-items-center"
                                style={{ borderColor: '#6f42c1', color: '#6f42c1' }}
                            >
                                <i className="bi bi-robot me-2"></i>
                                Aplicar Sugerencias IA
                            </Button>
                        </div>

                        {/* Tabla */}
                        <div className="table-wrapper">
                            <div className="table-responsive">
                                <Table hover className="table-modern">
                                    <thead>
                                        <tr>
                                            <th className="text-center" style={{ width: '60px' }}>#</th>
                                            <th>Producto</th>
                                            <th className="text-center">Exist.</th>
                                            <th className="text-center">Solic.</th>
                                            <th className="text-center">Ped.</th>
                                            <th className="text-center">Total</th>
                                            <th className="text-center">Ord.</th>
                                            <th className="text-center">IA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planeacionData.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="text-center">{index + 1}</td>
                                                <td>{item.producto_nombre}</td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-info">{item.existencias || 0}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-warning">{item.solicitadas || 0}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-success">{item.pedidos || 0}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge-pill bg-primary">{item.total || 0}</span>
                                                </td>
                                                <td className="text-center">{item.orden || 0}</td>
                                                <td className="text-center">
                                                    {item.ia > 0 ? (
                                                        <span
                                                            className="badge-pill"
                                                            style={{ backgroundColor: '#6f42c1', color: 'white', cursor: 'help' }}
                                                            title={`Confianza: ${item.ia_confianza || 'N/A'}`}
                                                        >
                                                            {item.ia}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mensaje inicial */}
                {!searched && (
                    <div className="empty-state">
                        <i className="bi bi-calendar-week text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">Selecciona una fecha para consultar la planeación</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default ReportesAvanzadosScreen;

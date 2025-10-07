import React, { useState, useEffect } from 'react';
import { Modal, Button, Tab, Tabs, Card, Row, Col, Table, Form } from 'react-bootstrap';
import { cajaService } from '../../services/cajaService';
import './CajaReportes.css';

const CajaReportes = ({ show, onClose, fechaConsulta, cajero }) => {
    const [activeTab, setActiveTab] = useState('resumen');
    const [loading, setLoading] = useState(false);
    const [reporteData, setReporteData] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(fechaConsulta);
    const [fechaFin, setFechaFin] = useState(fechaConsulta);

    // Cargar datos del reporte
    const cargarReporte = async () => {
        setLoading(true);
        try {
            const [resumenVentas, ventasPorVendedor, movimientosBancarios] = await Promise.all([
                cajaService.getResumenVentasDelDia(fechaConsulta),
                cajaService.getVentasPorVendedor(fechaConsulta),
                cajaService.getMovimientosBancarios(fechaConsulta)
            ]);

            setReporteData({
                resumenVentas,
                ventasPorVendedor,
                movimientosBancarios,
                fechaGeneracion: new Date().toLocaleString('es-ES')
            });
        } catch (error) {
            console.error('Error cargando reporte:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            cargarReporte();
        }
    }, [show, fechaConsulta]);

    // Formatear moneda
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Generar gráfico simple con CSS
    const renderBarChart = (data, maxValue) => {
        return Object.entries(data).map(([key, value]) => (
            <div key={key} className="chart-bar-container mb-2">
                <div className="chart-bar-label">{key}</div>
                <div className="chart-bar-wrapper">
                    <div
                        className="chart-bar"
                        style={{
                            width: `${(value / maxValue) * 100}%`,
                            backgroundColor: getColorForMethod(key)
                        }}
                    ></div>
                    <span className="chart-bar-value">{formatCurrency(value)}</span>
                </div>
            </div>
        ));
    };

    // Colores para métodos de pago
    const getColorForMethod = (method) => {
        const colors = {
            efectivo: '#28a745',
            tarjetas: '#007bff',
            transferencia: '#17a2b8',
            qr: '#6f42c1',
            rappipay: '#fd7e14',
            bonos: '#20c997',
            otros: '#6c757d'
        };
        return colors[method] || '#6c757d';
    };

    // Imprimir reporte
    const handleImprimir = () => {
        const printContent = document.getElementById('reporte-content');
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Caja - ${fechaConsulta}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .total-row { background-color: #e9ecef; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.print();
    };

    if (!reporteData) {
        return (
            <Modal show={show} onHide={onClose} size="lg">
                <Modal.Body className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Generando reporte...</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onClose} size="xl" className="caja-reportes-modal">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-graph-up me-2"></i>
                    Reportes de Caja
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div id="reporte-content">
                    {/* Header del reporte */}
                    <div className="header mb-4">
                        <h2>Reporte de Caja</h2>
                        <p>Fecha: {fechaConsulta} | Cajero: {cajero} | Generado: {reporteData.fechaGeneracion}</p>
                    </div>

                    <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                        {/* Tab Resumen */}
                        <Tab eventKey="resumen" title="📊 Resumen General">
                            <Row>
                                <Col md={8}>
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h5><i className="bi bi-bar-chart me-2"></i>Ventas por Método de Pago</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {reporteData.resumenVentas && (
                                                <div className="chart-container">
                                                    {renderBarChart(
                                                        reporteData.resumenVentas.resumenPorMetodo,
                                                        Math.max(...Object.values(reporteData.resumenVentas.resumenPorMetodo))
                                                    )}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h5><i className="bi bi-calculator me-2"></i>Totales del Día</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {reporteData.resumenVentas && (
                                                <div className="stats-container">
                                                    <div className="stat-item">
                                                        <div className="stat-value text-primary">
                                                            {reporteData.resumenVentas.totalVentas}
                                                        </div>
                                                        <div className="stat-label">Total Ventas</div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-value text-success">
                                                            {formatCurrency(reporteData.resumenVentas.totalGeneral)}
                                                        </div>
                                                        <div className="stat-label">Monto Total</div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-value text-info">
                                                            {formatCurrency(reporteData.resumenVentas.totalGeneral / reporteData.resumenVentas.totalVentas || 0)}
                                                        </div>
                                                        <div className="stat-label">Promedio por Venta</div>
                                                    </div>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Tabla detallada */}
                            <Card>
                                <Card.Header>
                                    <h5><i className="bi bi-table me-2"></i>Detalle por Método de Pago</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Método de Pago</th>
                                                <th className="text-center">Cantidad Transacciones</th>
                                                <th className="text-end">Monto Total</th>
                                                <th className="text-center">% del Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reporteData.resumenVentas && Object.entries(reporteData.resumenVentas.resumenPorMetodo).map(([metodo, monto]) => {
                                                const porcentaje = (monto / reporteData.resumenVentas.totalGeneral * 100).toFixed(1);
                                                return (
                                                    <tr key={metodo}>
                                                        <td className="text-capitalize">{metodo}</td>
                                                        <td className="text-center">-</td>
                                                        <td className="text-end">{formatCurrency(monto)}</td>
                                                        <td className="text-center">{porcentaje}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td><strong>TOTAL</strong></td>
                                                <td className="text-center"><strong>{reporteData.resumenVentas.totalVentas}</strong></td>
                                                <td className="text-end"><strong>{formatCurrency(reporteData.resumenVentas.totalGeneral)}</strong></td>
                                                <td className="text-center"><strong>100%</strong></td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab>

                        {/* Tab Vendedores */}
                        <Tab eventKey="vendedores" title="👥 Por Vendedor">
                            <Card>
                                <Card.Header>
                                    <h5><i className="bi bi-people me-2"></i>Ventas por Vendedor</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Vendedor</th>
                                                <th className="text-center">Cantidad Ventas</th>
                                                <th className="text-end">Total Vendido</th>
                                                <th className="text-end">Promedio por Venta</th>
                                                <th className="text-center">Métodos Usados</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reporteData.ventasPorVendedor && Object.entries(reporteData.ventasPorVendedor).map(([vendedor, datos]) => (
                                                <tr key={vendedor}>
                                                    <td><strong>{vendedor}</strong></td>
                                                    <td className="text-center">{datos.cantidadVentas}</td>
                                                    <td className="text-end">{formatCurrency(datos.totalVentas)}</td>
                                                    <td className="text-end">{formatCurrency(datos.totalVentas / datos.cantidadVentas)}</td>
                                                    <td className="text-center">
                                                        <small>{Object.keys(datos.metodosUsados).join(', ')}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab>

                        {/* Tab Movimientos */}
                        <Tab eventKey="movimientos" title="🏦 Movimientos Bancarios">
                            <Card>
                                <Card.Header>
                                    <h5><i className="bi bi-bank me-2"></i>Movimientos Bancarios del Día</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Hora</th>
                                                <th>Tipo</th>
                                                <th>Concepto</th>
                                                <th className="text-end">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reporteData.movimientosBancarios && reporteData.movimientosBancarios.movimientos.map((mov) => (
                                                <tr key={mov.id}>
                                                    <td>{mov.hora}</td>
                                                    <td>
                                                        <span className={`badge ${mov.tipo === 'Ingreso' ? 'bg-success' : 'bg-danger'}`}>
                                                            {mov.tipo}
                                                        </span>
                                                    </td>
                                                    <td>{mov.concepto}</td>
                                                    <td className={`text-end ${mov.monto > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(mov.monto)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onClose}>
                    <i className="bi bi-x-lg me-1"></i>
                    Cerrar
                </Button>
                <Button variant="primary" onClick={handleImprimir}>
                    <i className="bi bi-printer me-1"></i>
                    Imprimir Reporte
                </Button>
                <Button variant="success">
                    <i className="bi bi-file-earmark-excel me-1"></i>
                    Exportar Excel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CajaReportes;
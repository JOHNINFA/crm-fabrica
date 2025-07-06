import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ventaService } from '../services/api';

const InformeVentasGeneral = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    totalSinImpuestos: 0.00,
    totalImpuestos: 0.00,
    totalFacturado: 0.00,
    totalNeto: 0.00,
    totalCartera: 0.00,
    totalPagado: 0.00,
    totalGanancia: 0.00,
    porcentajeGanancia: 0.00
  });

  // Cargar ventas desde la BD
  const cargarVentas = async () => {
    try {
      setLoading(true);
      const ventasData = await ventaService.getAll();
      
      if (ventasData && !ventasData.error) {
        setVentas(ventasData);
        calcularMetricas(ventasData);
      } else {
        console.error('Error al cargar ventas:', ventasData);
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas basadas en las ventas
  const calcularMetricas = (ventasData) => {
    const totales = ventasData.reduce((acc, venta) => {
      acc.totalFacturado += parseFloat(venta.total || 0);
      acc.totalSinImpuestos += parseFloat(venta.subtotal || 0);
      acc.totalImpuestos += parseFloat(venta.impuestos || 0);
      acc.totalPagado += parseFloat(venta.dinero_entregado || 0);
      return acc;
    }, {
      totalSinImpuestos: 0,
      totalImpuestos: 0,
      totalFacturado: 0,
      totalPagado: 0
    });

    setMetricas({
      ...totales,
      totalNeto: totales.totalFacturado,
      totalCartera: 0,
      totalGanancia: totales.totalFacturado,
      porcentajeGanancia: 100.00
    });
  };

  // Cargar ventas al montar el componente
  useEffect(() => {
    cargarVentas();
  }, []);

  // Transformar ventas para la tabla
  const transacciones = ventas.map((venta) => ({
    id: venta.id,
    tipo: 'Ventas',
    medio: venta.metodo_pago || 'Efectivo',
    facturas: venta.numero_factura || venta.id, // Mostrar número de factura real
    trans: 1,
    fecha: new Date(venta.fecha).toLocaleString('es-CO'),
    estado: venta.estado || 'Pagado',
    pendientes: 0,
    vendedor: venta.vendedor || 'Sistema',
    cliente: venta.cliente || 'CONSUMIDOR FINAL',
    facturado: parseFloat(venta.total || 0),
    costo: 0.00,
    utilidad: parseFloat(venta.total || 0),
    utilidadPct: 100.00,
    pagar: parseFloat(venta.total || 0),
    abonado: parseFloat(venta.dinero_entregado || 0),
    pendiente: Math.max(0, parseFloat(venta.total || 0) - parseFloat(venta.dinero_entregado || 0))
  }));

  const formatCurrency = (amount) => {
    return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const metricIconWrapperStyle = {
    width: '45px',
    height: '45px',
    backgroundColor: '#e8f4fd',
    borderRadius: '6px'
  };
  const metricIconStyle = { fontSize: '24px', color: '#337ab7' };

  return (
    <div className="bg-light min-vh-100" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header de navegación */}
      <div className="bg-primary text-white py-2" style={{ fontSize: '14px' }}>
        <Container fluid>
          <Row>
            <Col>
              <div className="d-flex align-items-center">
                <Button variant="outline-light" size="sm" className="me-2 rounded-1 px-2 py-0">
                  +
                </Button>
                <Dropdown className="me-3">
                  <Dropdown.Toggle variant="link" id="dropdown-venta" className="text-white text-decoration-none p-0" style={{ fontSize: '14px' }}>
                    📦 Venta
                  </Dropdown.Toggle>
                </Dropdown>
                <Dropdown className="me-3">
                  <Dropdown.Toggle variant="link" id="dropdown-informes-ventas" className="text-white text-decoration-none p-0" style={{ fontSize: '14px' }}>
                    Informes de Ventas
                  </Dropdown.Toggle>
                </Dropdown>
                <span style={{ fontSize: '14px' }}>Informes de CxC</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="p-3">
        {/* Título y enlaces */}
        <Row className="mb-3">
          <Col>
            <h6 className="mb-2" style={{ fontSize: '16px', fontWeight: 'normal' }}>
              Historial de Ventas / Ingresos
            </h6>
            <div className="d-flex align-items-center" style={{ fontSize: '12px' }}>
              <Button variant="link" className="text-primary me-3 text-decoration-none p-0" style={{ fontSize: '12px' }}>
                📁 Importar Facturas y Cuentas x Cobrar
              </Button>
              <Button variant="link" className="text-primary me-3 text-decoration-none p-0" style={{ fontSize: '12px' }}>
                📄 Importar Facturas
              </Button>
              <Button variant="link" className="text-primary text-decoration-none p-0" style={{ fontSize: '12px' }}>
                💰 Recalcular Costos en Transacciones
              </Button>
            </div>
          </Col>
        </Row>

        {/* Controles de filtro */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center flex-wrap" style={{ fontSize: '13px' }}>
              <span className="me-2">Sucursal:</span>
              <Form.Select size="sm" className="me-3 mb-2 mb-md-0" style={{ width: '120px' }}>
                <option>Principal</option>
              </Form.Select>
              <span className="me-2">Fecha inicial:</span>
              <div className="position-relative me-3 mb-2 mb-md-0">
                <Form.Control
                  type="text"
                  size="sm"
                  defaultValue="01/06/2025, 12:00 a.m."
                  style={{ width: '160px', paddingRight: '28px' }}
                />
                <span className="position-absolute end-0 top-50 translate-middle-y me-2 user-select-none">📅</span>
              </div>
              <span className="me-2">Fecha Final:</span>
              <div className="position-relative me-3 mb-2 mb-md-0">
                <Form.Control
                  type="text"
                  size="sm"
                  defaultValue="30/06/2025, 11:59:58.059 p.m."
                  style={{ width: '180px', paddingRight: '28px' }}
                />
                <span className="position-absolute end-0 top-50 translate-middle-y me-2 user-select-none">📅</span>
              </div>
              <Button variant="primary" size="sm" style={{ fontSize: '12px' }}>
                🔍 Consultar Transacciones
              </Button>
            </div>
          </Col>
        </Row>

        {/* Cards de métricas - Fila 1 */}
        <Row className="mb-3">
          {[
            { icon: '💳', label: 'TOTAL SIN IMPUESTOS', value: metricas.totalSinImpuestos },
            { icon: '🧮', label: 'TOTAL IMPUESTOS', value: metricas.totalImpuestos },
            { icon: '💳', label: 'TOTAL FACTURADO', value: metricas.totalFacturado },
            { icon: '💰', label: 'TOTAL NETO', value: metricas.totalNeto },
          ].map((metric, idx) => (
            <Col md={3} className="mb-3" key={idx}>
              <Card className="border shadow-sm rounded-2">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3 d-flex align-items-center justify-content-center rounded-2" style={metricIconWrapperStyle}>
                      <span style={metricIconStyle}>{metric.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#337ab7', fontWeight: '500' }}>
                        {metric.label}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                        {formatCurrency(metric.value)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Cards de métricas - Fila 2 */}
        <Row className="mb-3">
          {[
            { icon: '❤️', label: 'TOTAL CARTERA', value: metricas.totalCartera },
            { icon: '💵', label: 'TOTAL PAGADO', value: metricas.totalPagado },
          ].map((metric, idx) => (
            <Col md={3} className="mb-3" key={idx}>
              <Card className="border shadow-sm rounded-2">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3 d-flex align-items-center justify-content-center rounded-2" style={metricIconWrapperStyle}>
                      <span style={metricIconStyle}>{metric.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#337ab7', fontWeight: '500' }}>
                        {metric.label}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                        {formatCurrency(metric.value)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          <Col md={6} className="mb-3">
            <Card className="text-white shadow-sm rounded-2" style={{
              background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
              border: 'none',
            }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: '45px',
                      height: '45px',
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <span style={{ fontSize: '24px', color: 'white' }}>📈</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                      TOTAL GANANCIA
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                      {formatCurrency(metricas.totalGanancia)}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabla de transacciones */}
        <Row>
          <Col>
            <Card className="border shadow-sm rounded-2">
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando ventas...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 border-bottom">
                      <h6 className="mb-0">Transacciones de Ventas</h6>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <Table hover className="mb-0" style={{ fontSize: '12px' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Tipo</th>
                            <th>Medio</th>
                            <th># Fact</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Vendedor</th>
                            <th>Cliente</th>
                            <th>T.Facturado</th>
                            <th>T.A Pagar</th>
                            <th>T.Abonado</th>
                            <th>T.Pend Pago</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transacciones.length > 0 ? (
                            transacciones.map((transaccion) => (
                              <tr key={transaccion.id}>
                                <td>{transaccion.tipo}</td>
                                <td>{transaccion.medio}</td>
                                <td>{transaccion.facturas}</td>
                                <td>{transaccion.fecha}</td>
                                <td>
                                  <Badge bg={transaccion.estado === 'PAGADO' ? 'success' : 'warning'}>
                                    {transaccion.estado}
                                  </Badge>
                                </td>
                                <td>{transaccion.vendedor}</td>
                                <td>{transaccion.cliente}</td>
                                <td>{formatCurrency(transaccion.facturado)}</td>
                                <td>{formatCurrency(transaccion.pagar)}</td>
                                <td>{formatCurrency(transaccion.abonado)}</td>
                                <td>{formatCurrency(transaccion.pendiente)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="11" className="text-center p-4">
                                No hay ventas registradas
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                    <div className="p-3 border-top bg-light">
                      <Row>
                        <Col md={6}>
                          <small className="text-muted">
                            <strong>Cantidad de Documentos:</strong> {transacciones.length}<br/>
                            <strong>Ticket Promedio:</strong> {formatCurrency(transacciones.length > 0 ? metricas.totalFacturado / transacciones.length : 0)}
                          </small>
                        </Col>
                        <Col md={6} className="text-end">
                          <small className="text-muted">
                            <strong>T.Facturado:</strong> {formatCurrency(metricas.totalFacturado)}<br/>
                            <strong>T.Pagado:</strong> {formatCurrency(metricas.totalPagado)}
                          </small>
                        </Col>
                      </Row>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InformeVentasGeneral;
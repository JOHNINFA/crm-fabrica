import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const InformeVentasGeneral = () => {
  const navigate = useNavigate();
  
  // Datos de ejemplo basados en la imagen
  const metricas = {
    totalSinImpuestos: 7500.00,
    totalImpuestos: 0.00,
    totalFacturado: 7500.00,
    totalNeto: 7500.00,
    totalCartera: 0.00,
    totalPagado: 7500.00,
    totalGanancia: 7500.00,
    porcentajeGanancia: 100.00
  };

  const transacciones = [
    { id: 1, tipo: 'Ventas', medio: 'Efectivo', facturas: 3, trans: 3, fecha: '2025-06-24 12:22:17', estado: 'Pagado', pendientes: 0, vendedor: 'Ramon', cliente: 'CONSUMIDOR FINAL', facturado: 2500.00, costo: 0.00, utilidad: 2500.00, utilidadPct: 100.00, pagar: 2500.00, abonado: 2500.00, pendiente: 0.00 },
    { id: 2, tipo: 'Ventas', medio: 'Efectivo', facturas: 2, trans: 2, fecha: '2025-06-23 21:10:33', estado: 'Pagado', pendientes: 0, vendedor: 'Ramon', cliente: 'CONSUMIDOR FINAL', facturado: 2500.00, costo: 0.00, utilidad: 2500.00, utilidadPct: 100.00, pagar: 2500.00, abonado: 2500.00, pendiente: 0.00 },
    { id: 3, tipo: 'Ventas', medio: 'Efectivo', facturas: 1, trans: 1, fecha: '2025-06-23 21:09:27', estado: 'Pagado', pendientes: 0, vendedor: 'Ramon', cliente: 'CONSUMIDOR FINAL', facturado: 2500.00, costo: 0.00, utilidad: 2500.00, utilidadPct: 100.00, pagar: 2500.00, abonado: 2500.00, pendiente: 0.00 }
  ];

  const formatCurrency = (amount) => {
    return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Estilo común para los iconos en las cards de métricas
  const metricIconWrapperStyle = {
    width: '45px',
    height: '45px',
    backgroundColor: '#e8f4fd',
    borderRadius: '6px'
  };
  const metricIconStyle = { fontSize: '24px', color: '#fff' };

  return (
    <div className="bg-light min-vh-100" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header de navegación */}
      <div className="py-2" style={{ fontSize: '14px', backgroundColor: '#f5f5f5' }}>
        <Container fluid>
          <Row>
            <Col>
              <div className="d-flex align-items-center">
                <Button variant="outline-primary" size="sm" className="me-2 rounded-1 px-2 py-0">
                  +
                </Button>
                <Dropdown className="me-3">
                  <Dropdown.Toggle variant="link" id="dropdown-venta" className="text-decoration-none p-0" style={{ fontSize: '14px', color: '#0073b7' }}>
                    📦 Venta
                  </Dropdown.Toggle>
                </Dropdown>
                <Dropdown className="me-3">
                  <Dropdown.Toggle variant="link" id="dropdown-informes-ventas" className="text-decoration-none p-0" style={{ fontSize: '14px', color: '#0073b7' }}>
                    Informes de Ventas
                  </Dropdown.Toggle>
                </Dropdown>
                <span style={{ fontSize: '14px', color: '#0073b7' }}>Informes de CxC</span>
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
          <Col md={4} className="mb-3">
            <Card className="text-white shadow-sm rounded-2" style={{
              background: '#0073b7',
              border: 'none',
            }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: '45px',
                      height: '45px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <span style={{ fontSize: '24px', color: 'white' }}>📈</span>
                  </div>
                  <div className="flex-grow-1">
                    <div style={{ fontSize: '11px', fontWeight: '500', opacity: 0.9 }}>
                      TOTAL GANANCIA
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(metricas.totalGanancia)}
                    </div>
                    <div
                      className="mt-1"
                      style={{
                        fontSize: '11px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        display: 'inline-block',
                        fontWeight: '500'
                      }}
                    >
                      {metricas.porcentajeGanancia.toFixed(2)}% de Ganancia
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Botones de acción y filtros */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center flex-wrap mb-2" style={{ fontSize: '13px' }}>
              <Button variant="outline-primary" size="sm" className="me-2 mb-2 mb-md-0" style={{ fontSize: '12px' }}>
                ➕ Detalles
              </Button>
              <Button variant="outline-secondary" size="sm" className="me-2 mb-2 mb-md-0" style={{ fontSize: '12px' }}>
                📄 Informe
              </Button>
              <Button variant="outline-secondary" size="sm" className="me-2 mb-2 mb-md-0" style={{ fontSize: '12px' }}>
                📊 Transacciones
              </Button>
              <Button variant="outline-danger" size="sm" className="me-2 mb-2 mb-md-0" style={{ fontSize: '12px' }}>
                📧 Enviar Email
              </Button>
              <Button variant="outline-primary" size="sm" className="me-4 mb-2 mb-md-0" style={{ fontSize: '12px' }}>
                🔧 Herramientas
              </Button>

              <span className="me-2">Filtro Estado:</span>
              <Form.Select size="sm" className="me-3 mb-2 mb-md-0" style={{ width: '100px' }}>
                <option>Todos</option>
              </Form.Select>
              <span className="me-2">Tipo Cliente:</span>
              <Form.Select size="sm" className="me-3 mb-2 mb-md-0" style={{ width: '100px' }}>
                <option>Todos</option>
              </Form.Select>
              <span className="me-2">Canales:</span>
              <Form.Select size="sm" className="mb-2 mb-md-0" style={{ width: '100px' }}>
                <option>Todos</option>
              </Form.Select>
            </div>
          </Col>
        </Row>

        {/* Tabla de transacciones */}
        <Row>
          <Col>
            <Card className="border shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ fontSize: '12px' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="py-2 px-2 border-bottom" style={{ width: '30px' }}>
                          <Form.Check type="checkbox" aria-label="Seleccionar todo"/>
                        </th>
                        {['Acciones', 'Tipo', 'Medio', '# Fact', '#Trans', 'Fecha', 'Estado', 'Días Pendientes', 'Vendedor', 'Cliente', 'T.Facturado', 'T. Costo', 'Utilidad', 'Utilidad%', 'T.A Pagar', 'T.Abonado', 'T.Pend Pago']
                         .map(header => <th className="py-2 px-2 border-bottom" key={header}>{header}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="table-light">
                        <td className="py-2 px-2 border-bottom">
                          <Form.Check type="checkbox" aria-label="Fila de búsqueda"/>
                        </td>
                        <td className="py-2 px-2 border-bottom text-muted" colSpan={17}>
                          Búsqueda General
                        </td>
                      </tr>
                      {transacciones.map((trans) => (
                        <tr key={trans.id}>
                          <td className="py-2 px-2 border-bottom">
                            <Form.Check type="checkbox" aria-label={`Seleccionar transacción ${trans.id}`}/>
                          </td>
                          <td className="py-2 px-2 border-bottom">
                            <div className="d-flex">
                              <Button
                                size="sm"
                                className="me-1 p-1"
                                style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                title="Acción S"
                              >S</Button>
                              <Button
                                variant="dark"
                                size="sm"
                                className="me-1 p-1"
                                style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                title="Ver"
                              >👁</Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="p-1"
                                style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                title="Documento"
                              >📄</Button>
                            </div>
                          </td>
                          <td className="py-2 px-2 border-bottom">{trans.tipo}</td>
                          <td className="py-2 px-2 border-bottom">{trans.medio}</td>
                          <td className="py-2 px-2 border-bottom">{trans.facturas}</td>
                          <td className="py-2 px-2 border-bottom">{trans.trans}</td>
                          <td className="py-2 px-2 border-bottom" style={{ fontSize: '11px' }}>{trans.fecha}</td>
                          <td className="py-2 px-2 border-bottom">
                            <Badge bg="success" style={{ fontSize: '10px' }}>{trans.estado}</Badge>
                          </td>
                          <td className="py-2 px-2 border-bottom">
                            <Badge bg="success" style={{ fontSize: '10px' }}>{trans.pendientes}</Badge>
                          </td>
                          <td className="py-2 px-2 border-bottom">{trans.vendedor}</td>
                          <td className="py-2 px-2 border-bottom">{trans.cliente}</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.facturado)}</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.costo)}</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.utilidad)}</td>
                          <td className="py-2 px-2 border-bottom text-end">{trans.utilidadPct.toFixed(2)}%</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.pagar)}</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.abonado)}</td>
                          <td className="py-2 px-2 border-bottom text-end">{formatCurrency(trans.pendiente)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Footer de la tabla con estadísticas */}
                <div
                  className="p-2 d-flex flex-wrap align-items-center justify-content-between bg-light border-top text-muted"
                  style={{ fontSize: '11px' }}
                >
                  {[
                    `Cantidad de Documentos: ${transacciones.length}`,
                    `Ticket Promedio: ${formatCurrency(metricas.totalFacturado / transacciones.length || 0)}`,
                    `T.Pend Pago: ${formatCurrency(0.00)}`,
                    `T.Pagado: ${formatCurrency(metricas.totalPagado)}`,
                    `T.Impuestos: ${formatCurrency(metricas.totalImpuestos)}`,
                    `T.Sin Impuestos: ${formatCurrency(metricas.totalSinImpuestos)}`,
                    `T.Propina: ${formatCurrency(0.00)}`,
                    `T.Neto: ${formatCurrency(metricas.totalNeto)}`,
                    `T.Costo: ${formatCurrency(0.00)}`,
                    `T.Utilidad: ${formatCurrency(metricas.totalGanancia)}`,
                    `T.Utilidad-%${metricas.porcentajeGanancia.toFixed(2)}`
                  ].map((stat, idx) => (
                    <span className="me-3 mb-1 mb-md-0" key={idx}>{stat}</span>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Footer */}
        <Row className="mt-4">
          <Col>
            <div
              className="d-flex align-items-center justify-content-between text-muted"
              style={{ fontSize: '11px' }}
            >
              <span>© 2017-2025 v.4.12.04 Dev Cuenti Team</span>
              <div className="d-flex align-items-center">
                <span className="me-2">📧</span>
                <span>WhatsApp</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InformeVentasGeneral;
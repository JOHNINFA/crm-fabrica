import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Dropdown, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ventaService } from '../services/api';
import { cajaService } from '../services/cajaService';
import usePageTitle from '../hooks/usePageTitle';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const InformeVentasGeneral = () => {
  usePageTitle('Informe de Ventas');
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [confirmacionAnular, setConfirmacionAnular] = useState('');

  // Estados para los calendarios
  const [fechaInicial, setFechaInicial] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [fechaFinal, setFechaFinal] = useState(new Date());
  const [showCalendarInicial, setShowCalendarInicial] = useState(false);
  const [showCalendarFinal, setShowCalendarFinal] = useState(false);
  const calendarInicialRef = useRef(null);
  const calendarFinalRef = useRef(null);

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
    // Filtrar solo ventas NO anuladas para las métricas
    const ventasValidas = ventasData.filter(venta => venta.estado !== 'ANULADA');

    console.log('📊 Total ventas:', ventasData.length);
    console.log('✅ Ventas válidas (no anuladas):', ventasValidas.length);
    console.log('🚫 Ventas anuladas excluidas:', ventasData.length - ventasValidas.length);

    const totales = ventasValidas.reduce((acc, venta) => {
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

  // Cerrar calendarios al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarInicialRef.current && !calendarInicialRef.current.contains(event.target)) {
        setShowCalendarInicial(false);
      }
      if (calendarFinalRef.current && !calendarFinalRef.current.contains(event.target)) {
        setShowCalendarFinal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    return fecha.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filtrar ventas por rango de fechas usando useMemo
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      const inicioDelDia = new Date(fechaInicial);
      inicioDelDia.setHours(0, 0, 0, 0);
      const finDelDia = new Date(fechaFinal);
      finDelDia.setHours(23, 59, 59, 999);

      return fechaVenta >= inicioDelDia && fechaVenta <= finDelDia;
    });
  }, [ventas, fechaInicial, fechaFinal]);

  // Recalcular métricas cuando cambien las ventas filtradas
  useEffect(() => {
    if (ventasFiltradas.length >= 0) {
      calcularMetricas(ventasFiltradas);
    }
  }, [ventasFiltradas]);

  // Función para mostrar detalle de venta
  const mostrarDetalleVenta = async (ventaId) => {
    try {
      const ventaCompleta = await ventaService.getById(ventaId);
      if (ventaCompleta && !ventaCompleta.error) {
        setVentaSeleccionada(ventaCompleta);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error al cargar detalle de venta:', error);
    }
  };

  // Función para abrir modal de anulación
  const abrirModalAnular = () => {
    setConfirmacionAnular('');
    setShowAnularModal(true);
  };

  // Función para anular venta
  const handleAnularVenta = async () => {
    if (confirmacionAnular.toUpperCase() !== 'SI') {
      alert('Debe escribir "SI" para confirmar la anulación');
      return;
    }

    try {
      // 🔒 VALIDAR: No permitir anular si ya existe arqueo del día
      const fechaVenta = ventaSeleccionada.fecha.split('T')[0];
      console.log('🔍 Verificando arqueo para fecha:', fechaVenta);

      try {
        // Verificar si existe arqueo para cualquier cajero en esa fecha
        const arqueoExistente = await cajaService.getArqueosPorRango(fechaVenta, fechaVenta);

        if (arqueoExistente && arqueoExistente.length > 0) {
          const cajeros = arqueoExistente.map(a => a.cajero).join(', ');

          alert('❌ NO SE PUEDE ANULAR ESTA VENTA\n\n' +
            '🔒 Ya existe un arqueo de caja guardado para este día.\n\n' +
            '📋 Fecha del arqueo: ' + fechaVenta + '\n' +
            '👤 Cajero(s): ' + cajeros + '\n\n' +
            '⚠️ Anular esta venta descuadraría el arqueo ya realizado.\n\n' +
            '💡 Si necesita anular esta venta:\n' +
            '   1. Contacte al supervisor/administrador\n' +
            '   2. Vaya a Arqueo de Caja → Historial\n' +
            '   3. Elimine el arqueo del día ' + fechaVenta + '\n' +
            '   4. Anule la venta\n' +
            '   5. Realice un nuevo arqueo con los valores correctos');

          setShowAnularModal(false);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Error verificando arqueo:', error);
        // Si hay error verificando, permitir continuar (para no bloquear en caso de error de red)
      }

      console.log('🚫 Iniciando anulación de venta:', ventaSeleccionada.id);
      console.log('📦 Venta seleccionada:', ventaSeleccionada);

      // 1. Devolver productos al inventario
      if (ventaSeleccionada.detalles && Array.isArray(ventaSeleccionada.detalles)) {
        console.log('📦 Devolviendo productos al inventario:', ventaSeleccionada.detalles.length, 'productos');

        for (const detalle of ventaSeleccionada.detalles) {
          const productoId = detalle.producto_id || detalle.producto;
          const cantidad = parseInt(detalle.cantidad) || 0;

          console.log('🔍 Procesando detalle:', detalle);
          console.log('🔍 Producto ID:', productoId, 'Cantidad:', cantidad);

          if (productoId && cantidad > 0) {
            console.log(`🔄 Devolviendo ${cantidad} unidades del producto ${detalle.producto_nombre} (ID: ${productoId})`);

            try {
              // Importar productoService si no está importado
              const { productoService } = await import('../services/api');

              // Devolver las unidades al inventario
              const resultadoStock = await productoService.updateStock(
                productoId,
                cantidad, // Cantidad positiva para sumar al inventario
                'Sistema POS',
                `Devolución por anulación de venta ${ventaSeleccionada.numero_factura || ventaSeleccionada.id}`
              );

              console.log('📊 Resultado actualización stock:', resultadoStock);

              if (resultadoStock && !resultadoStock.error) {
                console.log(`✅ Devueltas ${cantidad} unidades de ${detalle.producto_nombre} al inventario`);
              } else {
                console.warn(`⚠️ Error devolviendo ${detalle.producto_nombre} al inventario:`, resultadoStock?.message);
              }
            } catch (stockError) {
              console.error(`❌ Error actualizando stock de ${detalle.producto_nombre}:`, stockError);
            }
          } else {
            console.warn('⚠️ Detalle sin producto ID válido o cantidad:', {
              productoId,
              cantidad,
              detalle
            });
          }
        }
      } else {
        console.warn('⚠️ No se encontraron detalles de productos para devolver al inventario');
      }

      // 2. Marcar la venta como anulada
      console.log('🔄 Marcando venta como ANULADA...');
      const resultado = await ventaService.anularVenta(ventaSeleccionada.id);

      if (resultado && (resultado.success || !resultado.error)) {
        const mensaje = resultado.message || 'Venta anulada exitosamente';

        if (mensaje.includes('base de datos')) {
          alert('✅ Venta anulada exitosamente.\n\n' +
            '💾 Estado guardado en base de datos.\n' +
            '📦 Los productos han sido devueltos al inventario.\n' +
            '📊 Cambios visibles en todos los módulos.');
        } else {
          alert('✅ Venta anulada exitosamente.\n\n' +
            '📦 Los productos han sido devueltos al inventario.\n' +
            '⚠️ Estado guardado localmente (se sincronizará cuando la API esté disponible).');
        }

        setShowAnularModal(false);
        setShowModal(false);
        setConfirmacionAnular('');
        // Recargar ventas
        cargarVentas();
      } else {
        alert('❌ Error al anular la venta');
      }
    } catch (error) {
      console.error('❌ Error anulando venta:', error);
      alert('❌ Error al anular la venta: ' + error.message);
    }
  };

  // Transformar ventas para la tabla (con filtro de fechas)
  const transacciones = ventasFiltradas.map((venta) => ({
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
  const metricIconStyle = { fontSize: '24px', color: '#0c2c53' };

  // Función para imprimir el ticket
  const imprimirTicket = (ticketData) => {
    // Por defecto usamos formato tirilla para POS
    const anchoPapel = '80mm';

    // Crear el HTML del ticket
    const ticketHTML = generarHTMLTicket(ticketData, anchoPapel);

    // Crear un iframe oculto para imprimir
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(ticketHTML);
    frameDoc.close();

    // Esperar a que cargue y luego imprimir
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();

      // Eliminar el iframe después de imprimir
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 500);
    }, 500);
  };

  // Función para generar el HTML del ticket
  const generarHTMLTicket = (data, anchoPapel) => {
    const formatCurrency = (amount) => `$${parseFloat(amount || 0).toLocaleString('es-CO')}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket - ${data.numero}</title>
        <style>
          @page {
            size: ${anchoPapel} auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: white;
            color: black;
          }
          
          .ticket-container {
            width: ${anchoPapel};
            max-width: ${anchoPapel};
            margin: 0 auto;
            padding: 5mm;
            background: white;
            color: black;
          }
          
          .ticket-header {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .ticket-business-name {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
            text-transform: uppercase;
          }
          
          .ticket-divider {
            text-align: center;
            margin: 8px 0;
            font-size: 10px;
          }
          
          .ticket-info p {
            margin: 3px 0;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .ticket-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin: 10px 0;
          }
          
          .ticket-table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            padding: 3px 2px;
            font-weight: bold;
          }
          
          .ticket-table td {
            padding: 3px 2px;
            vertical-align: top;
          }
          
          .ticket-table th:first-child,
          .ticket-table td:first-child {
            width: 30px;
            text-align: center;
          }
          
          .ticket-table th:last-child,
          .ticket-table td:last-child {
            width: 60px;
            text-align: right;
          }
          
          .ticket-totals {
            margin: 10px 0;
            font-size: 11px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          
          .total-final {
            font-size: 13px;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dashed #000;
            font-weight: bold;
          }
          
          .ticket-payment {
            margin: 10px 0;
            font-size: 11px;
          }
          
          .ticket-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 11px;
          }
          
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <div class="ticket-business-name">MI NEGOCIO</div>
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-info">
            <p><strong>FACTURA:</strong> ${data.numero}</p>
            <p><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleString('es-CO')}</p>
            <p><strong>Cliente:</strong> ${data.cliente}</p>
            <p><strong>Vendedor:</strong> ${data.vendedor}</p>
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <table class="ticket-table">
            <thead>
              <tr>
                <th>Cant</th>
                <th>Producto</th>
                <th>P.Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.qty}</td>
                  <td>${item.name}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.qty * item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.impuestos > 0 ? `
              <div class="total-row">
                <span>Impuestos:</span>
                <span>${formatCurrency(data.impuestos)}</span>
              </div>
            ` : ''}
            ${data.descuentos > 0 ? `
              <div class="total-row">
                <span>Descuentos:</span>
                <span>${formatCurrency(data.descuentos)}</span>
              </div>
            ` : ''}
            <div class="total-row total-final">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${formatCurrency(data.total)}</strong></span>
            </div>
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-payment">
            <p><strong>Método de Pago:</strong> ${data.metodoPago}</p>
            ${data.dineroEntregado > 0 ? `
              <p><strong>Efectivo Recibido:</strong> ${formatCurrency(data.dineroEntregado)}</p>
              <p><strong>Cambio:</strong> ${formatCurrency(data.devuelta)}</p>
            ` : ''}
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-footer">
            <p><strong>¡Gracias por su compra!</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="bg-light min-vh-100" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>
        {`
          .table-row-hover:hover {
            background-color: #f8f9fa !important;
            transition: background-color 0.2s ease;
          }
          
          /* Estilos personalizados para el calendario */
          .react-calendar {
            border: none;
            font-family: Arial, sans-serif;
            background: white;
          }
          
          .react-calendar__tile--active {
            background: #0c2c53 !important;
            color: white !important;
          }
          
          .react-calendar__tile--now {
            background: #e8f4fd;
          }
          
          .react-calendar__tile:enabled:hover {
            background: #e8f4fd;
          }
          
          .react-calendar__navigation button {
            color: #0c2c53;
            font-weight: bold;
          }
          
          .react-calendar__navigation button:enabled:hover {
            background-color: #e8f4fd;
          }
        `}
      </style>
      {/* Header de navegación */}
      <div className="text-white py-2" style={{ fontSize: '14px', backgroundColor: '#0c2c53' }}>
        <Container fluid>
          <Row>
            <Col>
              <div className="d-flex align-items-center">
                <Button
                  variant="outline-light"
                  size="sm"
                  className="me-3 rounded-1 px-3 py-1"
                  onClick={() => navigate('/pos')}
                  title="Volver al POS"
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Volver al POS
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
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate('/informes/general')}>
                      Informe de Ventas General
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
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
              <Button variant="link" className="me-3 text-decoration-none p-0" style={{ fontSize: '12px', color: '#0c2c53' }}>
                📁 Importar Facturas y Cuentas x Cobrar
              </Button>
              <Button variant="link" className="me-3 text-decoration-none p-0" style={{ fontSize: '12px', color: '#0c2c53' }}>
                📄 Importar Facturas
              </Button>
              <Button variant="link" className="text-decoration-none p-0" style={{ fontSize: '12px', color: '#0c2c53' }}>
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
              <div className="position-relative me-3 mb-2 mb-md-0" ref={calendarInicialRef}>
                <Form.Control
                  type="text"
                  size="sm"
                  value={formatearFecha(fechaInicial)}
                  onClick={() => setShowCalendarInicial(!showCalendarInicial)}
                  readOnly
                  style={{ width: '200px', paddingRight: '28px', cursor: 'pointer' }}
                />
                <span
                  className="position-absolute end-0 top-50 translate-middle-y me-2 user-select-none"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowCalendarInicial(!showCalendarInicial)}
                >
                  📅
                </span>
                {showCalendarInicial && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                    marginTop: '5px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <Calendar
                      onChange={(date) => {
                        setFechaInicial(date);
                        setShowCalendarInicial(false);
                      }}
                      value={fechaInicial}
                      locale="es-ES"
                    />
                  </div>
                )}
              </div>

              <span className="me-2">Fecha Final:</span>
              <div className="position-relative me-3 mb-2 mb-md-0" ref={calendarFinalRef}>
                <Form.Control
                  type="text"
                  size="sm"
                  value={formatearFecha(fechaFinal)}
                  onClick={() => setShowCalendarFinal(!showCalendarFinal)}
                  readOnly
                  style={{ width: '200px', paddingRight: '28px', cursor: 'pointer' }}
                />
                <span
                  className="position-absolute end-0 top-50 translate-middle-y me-2 user-select-none"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowCalendarFinal(!showCalendarFinal)}
                >
                  📅
                </span>
                {showCalendarFinal && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                    marginTop: '5px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <Calendar
                      onChange={(date) => {
                        setFechaFinal(date);
                        setShowCalendarFinal(false);
                      }}
                      value={fechaFinal}
                      locale="es-ES"
                      minDate={fechaInicial}
                    />
                  </div>
                )}
              </div>

              <Button
                size="sm"
                style={{ fontSize: '12px', backgroundColor: '#0c2c53', color: 'white', border: 'none' }}
                onClick={() => {
                  // Las métricas se recalculan automáticamente con useMemo
                  console.log('Consultando transacciones del', formatearFecha(fechaInicial), 'al', formatearFecha(fechaFinal));
                  console.log('Total ventas filtradas:', ventasFiltradas.length);
                }}
              >
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
                      <div style={{ fontSize: '11px', color: '#0c2c53', fontWeight: '500' }}>
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
                      <div style={{ fontSize: '11px', color: '#0c2c53', fontWeight: '500' }}>
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
              background: 'linear-gradient(135deg, #0c2c53 0%, #0a2340 100%)',
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
                              <tr
                                key={transaccion.id}
                                onClick={() => mostrarDetalleVenta(transaccion.id)}
                                style={{ cursor: 'pointer' }}
                                className="table-row-hover"
                              >
                                <td>{transaccion.tipo}</td>
                                <td>{transaccion.medio}</td>
                                <td>{transaccion.facturas}</td>
                                <td>{transaccion.fecha}</td>
                                <td>
                                  <Badge bg={
                                    transaccion.estado === 'ANULADA' ? 'danger' :
                                      transaccion.estado === 'PAGADO' ? 'success' : 'warning'
                                  }>
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
                            <strong>Cantidad de Documentos:</strong> {transacciones.length}<br />
                            <strong>Ticket Promedio:</strong> {formatCurrency(transacciones.length > 0 ? metricas.totalFacturado / transacciones.length : 0)}
                          </small>
                        </Col>
                        <Col md={6} className="text-end">
                          <small className="text-muted">
                            <strong>T.Facturado:</strong> {formatCurrency(metricas.totalFacturado)}<br />
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

      {/* Modal de detalle de venta */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>
            Detalle de Venta - {ventaSeleccionada?.numero_factura || 'N/A'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem' }}>
          {ventaSeleccionada && (
            <>
              {/* Información de la venta */}
              <Row className="mb-3">
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Header style={{ backgroundColor: '#0c2c53', color: 'white' }}>
                      <strong><i className="bi bi-info-circle me-2"></i>Información General</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong># Factura:</strong> {ventaSeleccionada.numero_factura || ventaSeleccionada.id}</p>
                      <p><strong>Cliente:</strong> {ventaSeleccionada.cliente || 'CONSUMIDOR FINAL'}</p>
                      <p><strong>Vendedor:</strong> {ventaSeleccionada.vendedor || 'Sistema'}</p>
                      <p><strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleString('es-CO')}</p>
                      <p><strong>Método de Pago:</strong>
                        <Badge bg="primary" className="ms-2 text-capitalize" style={{ backgroundColor: '#0c2c53' }}>
                          {ventaSeleccionada.metodo_pago}
                        </Badge>
                      </p>
                      <p><strong>Estado:</strong>
                        <Badge bg={
                          ventaSeleccionada.estado === 'ANULADA' ? 'danger' :
                            ventaSeleccionada.estado === 'PAGADO' ? 'success' : 'warning'
                        } className="ms-2">
                          {ventaSeleccionada.estado || 'PAGADO'}
                        </Badge>
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Header className="bg-success text-white">
                      <strong><i className="bi bi-calculator me-2"></i>Totales</strong>
                    </Card.Header>
                    <Card.Body>
                      <p><strong>Subtotal:</strong>
                        <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.subtotal || 0))}</span>
                      </p>
                      <p><strong>Impuestos:</strong>
                        <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.impuestos || 0))}</span>
                      </p>
                      <p><strong>Descuentos:</strong>
                        <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.descuentos || 0))}</span>
                      </p>
                      <hr />
                      <p className="fw-bold"><strong>Total:</strong>
                        <span className="float-end text-success">{formatCurrency(parseFloat(ventaSeleccionada.total || 0))}</span>
                      </p>
                      <p><strong>Dinero Entregado:</strong>
                        <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.dinero_entregado || 0))}</span>
                      </p>
                      <p><strong>Devuelta:</strong>
                        <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.devuelta || 0))}</span>
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Productos vendidos */}
              <Card className="border-0">
                <Card.Header style={{ backgroundColor: 'transparent', border: 'none', padding: '0.5rem 0' }}>
                  <strong style={{ color: '#000000', fontSize: '16px' }}>Productos Vendidos</strong>
                </Card.Header>
                <Card.Body>
                  {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                    <Table bordered hover size="sm" responsive style={{ marginBottom: 0 }}>
                      <thead style={{ backgroundColor: '#e9ecef' }}>
                        <tr>
                          <th style={{ minWidth: '200px', color: '#212529', fontWeight: '600' }}>PRODUCTO</th>
                          <th className="text-center" style={{ width: '100px', color: '#212529', fontWeight: '600' }}>CANTIDAD</th>
                          <th className="text-end" style={{ width: '120px', color: '#212529', fontWeight: '600' }}>PRECIO UNIT.</th>
                          <th className="text-end" style={{ width: '120px', color: '#212529', fontWeight: '600' }}>SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventaSeleccionada.detalles.map((detalle, index) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                            <td><strong>{detalle.producto_nombre}</strong></td>
                            <td className="text-center" style={{ color: '#000000', fontWeight: '600' }}>
                              {detalle.cantidad}
                            </td>
                            <td className="text-end">{formatCurrency(parseFloat(detalle.precio_unitario || 0))}</td>
                            <td className="text-end fw-bold text-success">
                              {formatCurrency(parseFloat(detalle.subtotal || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#fff3cd' }}>
                          <td colSpan="3" className="text-end fw-bold">TOTAL:</td>
                          <td className="text-end fw-bold fs-5 text-success">
                            {formatCurrency(parseFloat(ventaSeleccionada.total || 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  ) : (
                    <div className="text-center text-muted p-4">
                      <i className="bi bi-basket-x fs-1 d-block mb-2"></i>
                      <p>No hay detalles de productos disponibles</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Nota si existe */}
              {ventaSeleccionada.nota && (
                <Card className="mt-3 border-0">
                  <Card.Header className="bg-warning">
                    <strong><i className="bi bi-sticky me-2"></i>Nota</strong>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{ventaSeleccionada.nota}</p>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100 align-items-center">
            <div>
              <Button
                variant="primary"
                onClick={() => {
                  if (ventaSeleccionada) {
                    const ticketData = {
                      numero: ventaSeleccionada.numero_factura || ventaSeleccionada.id,
                      fecha: ventaSeleccionada.fecha,
                      cliente: ventaSeleccionada.cliente || 'CONSUMIDOR FINAL',
                      vendedor: ventaSeleccionada.vendedor || 'Sistema',
                      items: ventaSeleccionada.detalles ? ventaSeleccionada.detalles.map(d => ({
                        qty: d.cantidad,
                        name: d.producto_nombre,
                        price: d.precio_unitario
                      })) : [],
                      subtotal: ventaSeleccionada.subtotal,
                      impuestos: ventaSeleccionada.impuestos,
                      descuentos: ventaSeleccionada.descuentos,
                      total: ventaSeleccionada.total,
                      metodoPago: ventaSeleccionada.metodo_pago,
                      dineroEntregado: ventaSeleccionada.dinero_entregado,
                      devuelta: ventaSeleccionada.devuelta
                    };
                    imprimirTicket(ticketData);
                  }
                }}
                style={{ backgroundColor: '#0c2c53', borderColor: '#0c2c53' }}
              >
                <i className="bi bi-printer me-2"></i>
                Imprimir
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-danger"
                onClick={abrirModalAnular}
                disabled={ventaSeleccionada?.estado === 'ANULADA'}
                className="d-flex align-items-center"
              >
                <i className="bi bi-x-circle me-2"></i>
                {ventaSeleccionada?.estado === 'ANULADA' ? 'Ya Anulada' : 'Anular Venta'}
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Mini Modal de confirmación para anular */}
      <Modal show={showAnularModal} onHide={() => setShowAnularModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Anulación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            ⚠️ <strong>¿Está seguro de anular esta venta?</strong>
          </p>
          <p className="text-muted small mb-3">
            Esta acción marcará la venta como ANULADA y devolverá los productos al inventario.
          </p>
          <Form.Group>
            <Form.Label>
              Para confirmar, escriba <strong>SI</strong> en mayúsculas:
            </Form.Label>
            <Form.Control
              type="text"
              value={confirmacionAnular}
              onChange={(e) => setConfirmacionAnular(e.target.value)}
              placeholder="Escriba SI para confirmar"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnularModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleAnularVenta}
            disabled={confirmacionAnular.toUpperCase() !== 'SI'}
          >
            Confirmar Anulación
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InformeVentasGeneral;
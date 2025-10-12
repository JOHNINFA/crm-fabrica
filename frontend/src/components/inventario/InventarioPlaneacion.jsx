import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Table } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
// import { useProductos } from '../../context/ProductosContext'; // No necesario
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';
import '../../styles/BorderlessInputs.css';
import '../../styles/ActionButtons.css';

const InventarioPlaneacion = () => {
  // const { productos: productosContext } = useProductos(); // No necesario
  const [productos, setProductos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [planeacion, setPlaneacion] = useState([]);
  const [solicitadasCargadas, setSolicitadasCargadas] = useState(false);

  // 🚀 Cargar pedidos desde BD y sumar por producto
  const cargarPedidosDesdeBD = async (fechaSeleccionada) => {
    try {
      let fechaFormateada;
      if (fechaSeleccionada instanceof Date) {
        const year = fechaSeleccionada.getFullYear();
        const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
        fechaFormateada = `${year}-${month}-${day}`;
      } else {
        fechaFormateada = fechaSeleccionada;
      }
      console.log('📦 Cargando pedidos para fecha:', fechaFormateada);

      const response = await fetch(`http://localhost:8000/api/pedidos/`);
      if (!response.ok) {
        console.log('⚠️ No se pudieron cargar pedidos');
        return {};
      }

      const pedidos = await response.json();
      console.log('✅ Pedidos cargados:', pedidos.length);

      // Filtrar pedidos por fecha de entrega
      const pedidosFecha = pedidos.filter(p => p.fecha_entrega === fechaFormateada);
      console.log('📅 Pedidos para fecha seleccionada:', pedidosFecha.length);

      // Sumar cantidades por producto
      const pedidosMap = {};
      for (const pedido of pedidosFecha) {
        if (pedido.detalles && pedido.detalles.length > 0) {
          for (const detalle of pedido.detalles) {
            const nombreProducto = detalle.producto_nombre;
            if (!pedidosMap[nombreProducto]) {
              pedidosMap[nombreProducto] = 0;
            }
            pedidosMap[nombreProducto] += detalle.cantidad;
          }
        }
      }

      console.log('📊 Pedidos por producto:', pedidosMap);
      return pedidosMap;
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      return {};
    }
  };

  // 🚀 NUEVA FUNCIÓN: Cargar solicitadas desde BD
  const cargarSolicitadasDesdeBD = async (fechaSeleccionada) => {
    try {
      // ✅ CORREGIDO: Asegurar formato correcto de fecha
      let fechaFormateada;
      if (fechaSeleccionada instanceof Date) {
        const year = fechaSeleccionada.getFullYear();
        const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
        fechaFormateada = `${year}-${month}-${day}`;
      } else {
        fechaFormateada = fechaSeleccionada;
      }
      console.log('📊 Cargando solicitadas para fecha:', fechaFormateada);

      const response = await fetch(`http://localhost:8000/api/produccion-solicitadas/?fecha=${fechaFormateada}`);
      if (!response.ok) {
        console.log('⚠️ No hay solicitadas para esta fecha - Status:', response.status);
        console.log('🔄 Devolviendo objeto vacío - esto puede causar que se pongan en 0');
        return {};
      }

      const solicitadas = await response.json();
      console.log('✅ Solicitadas cargadas:', solicitadas.length);
      console.log('📋 Datos de solicitadas:', solicitadas);

      // Convertir array a objeto para búsqueda rápida
      const solicitadasMap = {};
      solicitadas.forEach(item => {
        solicitadasMap[item.producto_nombre] = item.cantidad_solicitada;
      });

      return solicitadasMap;
    } catch (error) {
      console.error('❌ Error cargando solicitadas:', error);
      return {};
    }
  };

  // Cargar existencias desde BD
  const cargarExistenciasReales = async () => {
    try {
      console.log('🔄 EJECUTANDO cargarExistenciasReales...', new Date().toLocaleTimeString());
      console.log('📊 Productos actuales antes de cargar:', productos.length);

      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // 🚀 CARGAR PLANEACIÓN GUARDADA DESDE BD
      const planeacionResponse = await fetch(`http://localhost:8000/api/planeacion/?fecha=${fechaFormateada}`);
      let planeacionMap = {};
      
      if (planeacionResponse.ok) {
        const planeacionData = await planeacionResponse.json();
        console.log('✅ Planeación cargada desde BD:', planeacionData.length, 'productos');
        planeacionData.forEach(item => {
          planeacionMap[item.producto_nombre] = {
            existencias: item.existencias,
            solicitadas: item.solicitadas,
            pedidos: item.pedidos,
            orden: item.orden,
            ia: item.ia
          };
        });
      }

      // Obtener productos directamente de la API
      const response = await fetch('http://localhost:8000/api/productos/');
      if (!response.ok) throw new Error('Error al obtener productos');

      const productosFromBD = await response.json();
      console.log('📊 Productos obtenidos de BD:', productosFromBD.length);

      // 🚀 CARGAR SOLICITADAS Y PEDIDOS DESDE BD (si no hay planeación guardada)
      const solicitadasMap = Object.keys(planeacionMap).length === 0 
        ? await cargarSolicitadasDesdeBD(fechaSeleccionada)
        : {};
      
      const pedidosMap = await cargarPedidosDesdeBD(fechaSeleccionada);

      // Preparar productos con planeación
      const productosConPlaneacion = productosFromBD.map(p => {
        const productoExistente = productos.find(prod => prod.id === p.id);
        const planeacionGuardada = planeacionMap[p.nombre];

        // Prioridad: 1) Planeación guardada, 2) Solicitadas, 3) Existentes
        if (planeacionGuardada) {
          console.log(`💾 Cargando planeación guardada para ${p.nombre}`);
          return {
            id: p.id,
            nombre: p.nombre,
            existencias: p.stock_total || 0,
            solicitado: planeacionGuardada.solicitadas,
            pedidos: planeacionGuardada.pedidos,
            orden: planeacionGuardada.orden,
            ia: planeacionGuardada.ia
          };
        }

        // Si no hay planeación, usar solicitadas
        let solicitadoFinal = 0;
        if (solicitadasMap[p.nombre] !== undefined) {
          solicitadoFinal = solicitadasMap[p.nombre];
        } else if (productoExistente && productoExistente.solicitado > 0) {
          solicitadoFinal = productoExistente.solicitado;
        }

        return {
          id: p.id,
          nombre: p.nombre,
          existencias: p.stock_total || 0,
          solicitado: solicitadoFinal,
          pedidos: pedidosMap[p.nombre] || 0,
          orden: productoExistente ? (productoExistente.orden || 0) : 0,
          ia: productoExistente ? (productoExistente.ia || 0) : 0
        };
      });

      setSolicitadasCargadas(true);

      // Definir el orden específico de los productos (igual que en Kardex)
      const ordenProductos = {
        'AREPA TIPO OBLEA 500GR': 1,
        'AREPA MEDIANA 330GR': 2,
        'AREPA TIPO PINCHO 330GR': 3,
        'AREPA QUESO CORRIENTE 450GR': 4,
        'AREPA QUESO ESPECIAL GRANDE 600GR': 5,
        'AREPA CON QUESO ESPECIAL PEQUEÑA 600GR': 6
      };

      // Ordenar productos según el orden específico
      productosConPlaneacion.sort((a, b) => {
        const ordenA = ordenProductos[a.nombre?.toUpperCase()] || 999;
        const ordenB = ordenProductos[b.nombre?.toUpperCase()] || 999;
        return ordenA - ordenB;
      });

      // Log detallado antes de setear productos
      console.log('🎯 PRODUCTOS A SETEAR:');
      productosConPlaneacion.forEach(p => {
        if (p.solicitado > 0) {
          console.log(`   - ${p.nombre}: ${p.solicitado} solicitadas`);
        }
      });

      setProductos(productosConPlaneacion);

      // Mostrar mensaje si se cargaron solicitadas
      const totalSolicitadas = Object.values(solicitadasMap).reduce((sum, val) => sum + val, 0);
      if (totalSolicitadas > 0) {
        console.log(`✅ Datos actualizados + ${Object.keys(solicitadasMap).length} solicitadas cargadas`);
        mostrarMensaje(`Solicitadas cargadas desde Producción: ${Object.keys(solicitadasMap).length} productos`, 'info');
      } else {
        console.log('⚠️ NO SE ENCONTRARON SOLICITADAS - Esto puede causar que se pongan en 0');
      }
    } catch (error) {
      console.error('❌ Error al cargar existencias:', error);
      // No hacer nada si hay error - mantener productos existentes
    }
  };
  // Utilidades
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const getExistenciasClass = (existencias) => {
    return existencias > 0 ? 'bg-light-green' : 'bg-light-red';
  };

  const updateProducto = (id, field, value) => {
    const nuevosProductos = productos.map(producto =>
      producto.id === id ? { ...producto, [field]: parseInt(value) || 0 } : producto
    );
    setProductos(nuevosProductos);
  };

  // Effects - Solo un useEffect para evitar doble carga
  useEffect(() => {
    if (fechaSeleccionada) {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;
      console.log('📅 Cargando datos para fecha:', fechaFormateada);
      cargarExistenciasReales();
    }
  }, [fechaSeleccionada]);

  // const handleSolicitadoChange = (id, cantidad) => updateProducto(id, 'solicitado', cantidad); // No editable
  const handleOrdenChange = (id, cantidad) => updateProducto(id, 'orden', cantidad);

  const handleGuardarPlaneacion = async () => {
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // Guardar cada producto en la BD
      for (const producto of productos) {
        const datosPlaneacion = {
          fecha: fechaFormateada,
          producto_nombre: producto.nombre,
          existencias: producto.existencias || 0,
          solicitadas: producto.solicitado || 0,
          pedidos: producto.pedidos || 0,
          total: (producto.solicitado || 0) + (producto.pedidos || 0),
          orden: producto.orden || 0,
          ia: producto.ia || 0,
          usuario: 'Sistema'
        };

        const response = await fetch('http://localhost:8000/api/planeacion/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPlaneacion)
        });

        if (!response.ok) {
          console.error(`Error guardando ${producto.nombre}`);
        }
      }

      mostrarMensaje('Planeación guardada correctamente en BD', 'success');
      
    } catch (error) {
      console.error('Error guardando planeación:', error);
      mostrarMensaje('Error al guardar planeación', 'danger');
    }
  };

  const handleDateSelect = (date) => setFechaSeleccionada(date);

  return (
    <Container fluid className="py-4">
      {/* Encabezado y controles */}
      <Row className="mb-4">
        <Col>
          <p className="text-muted fw-medium" style={{ fontSize: '0.95rem' }}>Planifique la cantidad de productos a fabricar para una fecha específica.</p>
        </Col>
      </Row>

      {/* Selector de fecha y botón de sincronización */}
      <Row className="mb-4">
        <Col xs={12} md={6}>
          <DateSelector onDateSelect={handleDateSelect} />
        </Col>
        <Col xs={12} md={6} className="d-flex justify-content-end align-items-center">
          <Button
            variant="outline-info"
            className="mb-2 mb-md-0"
            onClick={() => {
              cargarExistenciasReales();
              mostrarMensaje('Datos actualizados correctamente', 'info');
            }}
          >
            <i className="bi bi-arrow-repeat me-1"></i> Actualizar Datos
          </Button>
        </Col>
      </Row>

      {/* Mensajes de alerta */}
      {mensaje.texto && (
        <Row className="mb-4">
          <Col>
            <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ texto: '', tipo: '' })}>
              {mensaje.texto}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Tabla de planeación */}
      <Row className="mb-4">
        <Col>
          <div className="table-container">
            <Table className="align-middle mb-0 table-kardex planeacion-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '30%' }}>Producto</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>Existencias</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>Solicitadas</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>Pedidos</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>Total</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>Orden</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>IA</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => {
                  const total = (producto.solicitado || 0) + (producto.pedidos || 0);
                  return (
                  <tr key={producto.id} className="product-row">
                    <td className="fw-medium" style={{ color: '#1e293b' }}>{producto.nombre}</td>
                    <td className="text-center">
                      <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
                        {producto.existencias} und
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <span className={`solicitadas-display ${producto.solicitado > 0 ? 'has-data' : ''}`}>
                          {producto.solicitado || 0}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <span className={`solicitadas-display ${(producto.pedidos || 0) > 0 ? 'has-data' : ''}`}>
                          {producto.pedidos || 0}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <span className={`solicitadas-display ${total > 0 ? 'has-data' : ''}`} style={{ fontWeight: '600' }}>
                          {total}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <input
                          type="number"
                          min="0"
                          value={producto.orden || 0}
                          onChange={(e) => handleOrdenChange(producto.id, e.target.value)}
                          className="solicitadas-display"
                          style={{ cursor: 'text', maxWidth: '60px' }}
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <span className={`solicitadas-display ${(producto.ia || 0) > 0 ? 'has-data' : ''}`}>
                          {producto.ia || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <p className="text-muted">No hay productos disponibles</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Botón guardar planeación */}
      <Row className="mb-4">
        <Col className="text-end">
          <Button
            variant="success"
            className="action-button"
            onClick={handleGuardarPlaneacion}
          >
            <i className="bi bi-save me-2"></i> Guardar Planeación
          </Button>
        </Col>
      </Row>

      {/* Historial de planeación */}
      {planeacion.length > 0 && (
        <Row className="mt-5">
          <Col>
            <h5 className="mb-3 fw-bold" style={{ color: '#1e293b' }}>Historial de Planeación</h5>
            <div className="table-container">
              <Table className="align-middle mb-0 table-kardex planeacion-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Productos</th>
                    <th scope="col" className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planeacion.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <span className="rounded-pill-sm" style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                          {plan.fecha}
                        </span>
                      </td>
                      <td>
                        {plan.productos.map(p => (
                          <div key={p.id} className="mb-1">
                            <span className="fw-medium" style={{ color: '#1e293b' }}>{p.nombre}:</span>
                            <span className="rounded-pill-sm bg-light-green ms-2">
                              <i className="bi bi-box-seam me-1"></i> {p.solicitado}
                            </span>
                            <span className="rounded-pill-sm ms-2" style={{ backgroundColor: '#3498DB', color: '#fff' }}>
                              <i className="bi bi-clipboard-check me-1"></i> {p.orden}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill-sm"
                          style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default InventarioPlaneacion;
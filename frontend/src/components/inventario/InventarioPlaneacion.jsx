import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Table } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
// import { useProductos } from '../../context/ProductosContext'; // No necesario
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';
import '../../styles/BorderlessInputs.css';
import '../../styles/ActionButtons.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const InventarioPlaneacion = () => {
  // const { productos: productosContext } = useProductos(); // No necesario
  const [productos, setProductos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [planeacion, setPlaneacion] = useState([]);
  const [solicitadasCargadas, setSolicitadasCargadas] = useState(false);

  // 🚀 Cache para optimización
  const [cache, setCache] = useState({
    datos: null,
    timestamp: null,
    fecha: null
  });
  const CACHE_DURATION = 15000; // 15 segundos
  const [cargando, setCargando] = useState(false); // Para evitar salto visual

  // 🚀 Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const cargarDesdeLocalStorage = () => {
      try {
        const year = fechaSeleccionada.getFullYear();
        const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
        const fechaFormateada = `${year}-${month}-${day}`;

        const key = `planeacion_${fechaFormateada}`;
        const datosGuardados = localStorage.getItem(key);

        if (datosGuardados) {
          const { productos: productosGuardados, timestamp } = JSON.parse(datosGuardados);
          console.log('⚡ Cargando desde localStorage (instantáneo):', productosGuardados.length, 'productos');
          setProductos(productosGuardados);

          // Actualizar cache en memoria también
          setCache({
            datos: productosGuardados,
            timestamp: timestamp,
            fecha: fechaFormateada
          });
        }
      } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
      }
    };

    // 🗑️ Limpiar localStorage viejo (más de 7 días)
    const limpiarLocalStorageViejo = () => {
      try {
        const ahora = Date.now();
        const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('planeacion_')) {
            try {
              const datos = JSON.parse(localStorage.getItem(key));
              if (datos.timestamp && (ahora - datos.timestamp) > SIETE_DIAS) {
                localStorage.removeItem(key);
                console.log('🗑️ Limpiado localStorage viejo:', key);
              }
            } catch (e) {
              localStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
      }
    };

    cargarDesdeLocalStorage();
    limpiarLocalStorageViejo();
  }, [fechaSeleccionada]);



  // 🚀 Verificar si el cache es válido
  const cacheValido = (fecha) => {
    if (!cache.datos || !cache.timestamp || cache.fecha !== fecha) {
      return false;
    }
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - cache.timestamp;
    return tiempoTranscurrido < CACHE_DURATION;
  };

  // Cargar existencias desde BD con optimización
  const cargarExistenciasReales = async (forzarRecarga = false) => {
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // 🚀 Verificar cache
      if (!forzarRecarga && cacheValido(fechaFormateada)) {
        console.log('⚡ Usando datos en cache (rápido)');
        setProductos(cache.datos);
        setCargando(false);
        return;
      }

      console.log('🔄 Cargando datos desde servidor...', new Date().toLocaleTimeString());

      // 🎯 Marcar como cargando solo si no hay productos
      if (productos.length === 0) {
        setCargando(true);
      }

      // 🎯 NO limpiar productos mientras carga - mantener datos anteriores
      // Esto evita el salto visual de "No hay productos disponibles"

      // 🚀 CARGA PARALELA - Todas las llamadas al mismo tiempo
      const [planeacionResponse, productosResponse, solicitadasResponse, pedidosResponse] = await Promise.all([
        fetch(`${API_URL}/planeacion/?fecha=${fechaFormateada}`),
        fetch(`${API_URL}/productos/`),
        fetch(`${API_URL}/produccion-solicitadas/?fecha=${fechaFormateada}`),
        fetch(`${API_URL}/pedidos/`)
      ]);

      // Procesar planeación
      let planeacionMap = {};
      if (planeacionResponse.ok) {
        const planeacionData = await planeacionResponse.json();
        console.log('✅ Planeación:', planeacionData.length, 'productos');
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

      // Procesar productos
      if (!productosResponse.ok) throw new Error('Error al obtener productos');
      const productosFromBD = await productosResponse.json();
      console.log('✅ Productos:', productosFromBD.length);

      // Procesar solicitadas
      let solicitadasMap = {};
      if (solicitadasResponse.ok && Object.keys(planeacionMap).length === 0) {
        const solicitadas = await solicitadasResponse.json();
        console.log('✅ Solicitadas:', solicitadas.length);
        solicitadas.forEach(item => {
          solicitadasMap[item.producto_nombre] = item.cantidad_solicitada;
        });
      }

      // Procesar pedidos
      const pedidosMap = {};
      if (pedidosResponse.ok) {
        const pedidos = await pedidosResponse.json();
        const pedidosFecha = pedidos.filter(p =>
          p.fecha_entrega === fechaFormateada && p.estado !== 'ANULADA'
        );
        console.log('✅ Pedidos activos:', pedidosFecha.length);

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
      }

      // Filtrar solo productos de PRODUCCION
      const productosProduccion = productosFromBD.filter(p =>
        !p.ubicacion_inventario || p.ubicacion_inventario === 'PRODUCCION'
      );

      // Preparar productos con planeación
      const productosConPlaneacion = productosProduccion.map(p => {
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

        const pedidosProducto = pedidosMap[p.nombre] || 0;
        if (pedidosProducto > 0) {
          console.log(`✅ Producto ${p.nombre} tiene ${pedidosProducto} pedidos`);
        }
        return {
          id: p.id,
          nombre: p.nombre,
          existencias: p.stock_total || 0,
          solicitado: solicitadoFinal,
          pedidos: pedidosProducto,
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

      // 🎯 Actualizar productos solo cuando los datos están listos
      setProductos(productosConPlaneacion);
      setCargando(false);

      const timestamp = Date.now();

      // 🚀 Guardar en cache en memoria
      setCache({
        datos: productosConPlaneacion,
        timestamp: timestamp,
        fecha: fechaFormateada
      });

      // 🚀 Guardar en localStorage para carga instantánea futura
      try {
        const key = `planeacion_${fechaFormateada}`;
        const datosParaGuardar = {
          productos: productosConPlaneacion,
          timestamp: timestamp,
          fecha: fechaFormateada
        };
        localStorage.setItem(key, JSON.stringify(datosParaGuardar));
        console.log('✅ Datos guardados en cache y localStorage');
      } catch (error) {
        console.error('Error al guardar en localStorage:', error);
      }

      // Mostrar mensaje si se cargaron solicitadas
      const totalSolicitadas = Object.values(solicitadasMap).reduce((sum, val) => sum + val, 0);
      if (totalSolicitadas > 0) {
        console.log(`✅ ${Object.keys(solicitadasMap).length} solicitadas cargadas`);
      }
    } catch (error) {
      console.error('❌ Error al cargar existencias:', error);
      setCargando(false);
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

  // Effects - Carga inicial y actualización automática
  useEffect(() => {
    if (fechaSeleccionada) {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;
      console.log('📅 Cargando datos para fecha:', fechaFormateada);
      cargarExistenciasReales();
    }

    // 🚀 Actualización automática cada 15 segundos (silenciosa)
    const intervalo = setInterval(() => {
      console.log('🔄 Actualización automática en segundo plano...');
      cargarExistenciasReales(true); // Forzar recarga
    }, 15000);

    // 🚀 Escuchar eventos de otros módulos
    const handlePedidoGuardado = () => {
      console.log('📦 Pedido guardado - Actualizando Planeación...');
      cargarExistenciasReales(true);
    };

    const handleInventarioActualizado = () => {
      console.log('📊 Inventario actualizado - Actualizando Planeación...');
      cargarExistenciasReales(true);
    };

    const handleProductosUpdated = () => {
      console.log('🔄 Productos actualizados - Actualizando Planeación...');
      cargarExistenciasReales(true);
    };

    window.addEventListener('pedidoGuardado', handlePedidoGuardado);
    window.addEventListener('inventarioActualizado', handleInventarioActualizado);
    window.addEventListener('productosUpdated', handleProductosUpdated);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('pedidoGuardado', handlePedidoGuardado);
      window.removeEventListener('inventarioActualizado', handleInventarioActualizado);
      window.removeEventListener('productosUpdated', handleProductosUpdated);
    };
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

        const response = await fetch(`${API_URL}/planeacion/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPlaneacion)
        });

        if (!response.ok) {
          console.error(`Error guardando ${producto.nombre}`);
        }
      }

      mostrarMensaje('Planeación guardada correctamente en BD', 'success');

      // 🚀 Limpiar cache para forzar recarga
      setCache({ datos: null, timestamp: null, fecha: null });

      // 🚀 Limpiar localStorage para forzar recarga desde servidor
      try {
        const year = fechaSeleccionada.getFullYear();
        const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
        const fechaFormateada = `${year}-${month}-${day}`;
        const key = `planeacion_${fechaFormateada}`;
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
      }

      // 🚀 Notificar a otros módulos
      window.dispatchEvent(new Event('planeacionGuardada'));

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
              cargarExistenciasReales(true); // Forzar recarga
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
                {productos.length === 0 && !cargando && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <p className="text-muted">No hay productos disponibles</p>
                    </td>
                  </tr>
                )}
                {productos.length === 0 && cargando && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0">Cargando productos...</p>
                      </div>
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
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

  // 🚀 NUEVA FUNCIÓN: Cargar solicitadas desde BD
  const cargarSolicitadasDesdeBD = async (fechaSeleccionada) => {
    try {
      const fechaFormateada = fechaSeleccionada.toISOString().split('T')[0];
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

      // Obtener productos directamente de la API
      const response = await fetch('http://localhost:8000/api/productos/');
      if (!response.ok) throw new Error('Error al obtener productos');

      const productosFromBD = await response.json();
      console.log('📊 Productos obtenidos de BD:', productosFromBD.length);

      // 🚀 CARGAR SOLICITADAS DESDE BD
      const solicitadasMap = await cargarSolicitadasDesdeBD(fechaSeleccionada);

      // Preparar productos con planeación
      const productosConPlaneacion = productosFromBD.map(p => {
        const productoExistente = productos.find(prod => prod.id === p.id);

        // Si hay solicitadas en BD, usar esas. Si no, mantener las existentes
        let solicitadoFinal = 0;
        if (solicitadasMap[p.nombre] !== undefined) {
          solicitadoFinal = solicitadasMap[p.nombre];
        } else if (productoExistente && productoExistente.solicitado > 0) {
          solicitadoFinal = productoExistente.solicitado; // Preservar existentes
          console.log(`🔄 Preservando solicitadas para ${p.nombre}: ${solicitadoFinal}`);
        }

        return {
          id: p.id,
          nombre: p.nombre,
          existencias: p.stock_total || 0,
          solicitado: solicitadoFinal,
          orden: productoExistente ? (productoExistente.orden || 0) : 0
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

  // Effects
  useEffect(() => {
    // Solo cargar al montar el componente
    cargarExistenciasReales();
  }, []); // Sin dependencias para evitar recargas

  // Actualizar datos SOLO cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      console.log('📅 Fecha cambió, recargando datos...');
      cargarExistenciasReales();
    }
  }, [fechaSeleccionada]);

  // const handleSolicitadoChange = (id, cantidad) => updateProducto(id, 'solicitado', cantidad); // No editable
  const handleOrdenChange = (id, cantidad) => updateProducto(id, 'orden', cantidad);

  const handleGuardarPlaneacion = () => {
    const productosConPlaneacion = productos.filter(p => p.solicitado > 0 || p.orden > 0);

    if (productosConPlaneacion.length === 0) {
      mostrarMensaje('No hay cantidades planeadas para registrar', 'warning');
      return;
    }

    const nuevaPlaneacion = {
      id: Date.now(),
      fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
      productos: productosConPlaneacion.map(p => ({
        id: p.id,
        nombre: p.nombre,
        solicitado: p.solicitado,
        orden: p.orden
      }))
    };

    setPlaneacion([nuevaPlaneacion, ...planeacion]);

    // Resetear cantidades
    const productosReseteados = productos.map(producto => ({
      ...producto,
      solicitado: 0,
      orden: 0
    }));
    setProductos(productosReseteados);

    mostrarMensaje('Planeación guardada correctamente', 'success');
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
                  <th scope="col" style={{ width: '40%' }}>Producto</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Existencias</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Solicitadas</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Orden</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
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
                        <Form.Control
                          type="number"
                          min="0"
                          value={producto.orden || 0}
                          onChange={(e) => handleOrdenChange(producto.id, e.target.value)}
                          className="quantity-input"
                          aria-label={`Orden de ${producto.nombre}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
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